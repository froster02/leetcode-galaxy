// LeetCode handles are short and plain; anything else never reaches LeetCode
const USERNAME_RE = /^[A-Za-z0-9_.-]{1,64}$/;

/* CORS headers for this request. ALLOWED_ORIGINS (comma-separated, optional —
   see wrangler.toml) restricts which sites may read responses; unset = any. */
function corsHeaders(request, env) {
    const headers = {
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };
    const allowed = String(env?.ALLOWED_ORIGINS || '').split(',').map(o => o.trim().replace(/\/+$/, '')).filter(Boolean);
    if (allowed.length === 0) {
        headers['Access-Control-Allow-Origin'] = '*';
        return headers;
    }
    headers['Vary'] = 'Origin';
    const origin = request.headers.get('Origin');
    if (origin && allowed.includes(origin)) headers['Access-Control-Allow-Origin'] = origin;
    return headers;
}

function json(body, status, cors, extra = {}) {
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), {
        status,
        headers: { ...cors, 'Content-Type': 'application/json', ...extra },
    });
}

const LEETCODE_API = 'https://leetcode.com/graphql';

// Single combined query — everything the frontend's canonical payload needs.
const QUERY_FULL = `
  query getFull($username: String!) {
    allQuestionsCount {
      difficulty
      count
    }
    matchedUser(username: $username) {
      username
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      profile {
        ranking
        reputation
      }
      userCalendar {
        streak
        totalActiveDays
        submissionCalendar
      }
      badges {
        id
        displayName
        icon
      }
      tagProblemCounts {
        advanced { tagName tagSlug problemsSolved }
        intermediate { tagName tagSlug problemsSolved }
        fundamental { tagName tagSlug problemsSolved }
      }
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      topPercentage
    }
    userContestRankingHistory(username: $username) {
      attended
      rating
    }
    recentSubmissionList(username: $username, limit: 20) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

async function fetchLeetcode(query, variables) {
    const response = await fetch(LEETCODE_API, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Referer': 'https://leetcode.com/',
            'User-Agent': 'Mozilla/5.0'
        },
        body: JSON.stringify({ query, variables })
    });
    return response.json();
}

/* Reshape raw GraphQL data into the flat payload the frontend fallback expects
   (mirrors the Alfa API field names where they exist). `hadErrors`: LeetCode
   returned the user but reported errors for some section. */
function buildPayload(data, hadErrors = false) {
    const user = data.matchedUser;
    const questionCounts = {};
    for (const q of data.allQuestionsCount || []) {
        questionCounts[String(q.difficulty).toLowerCase()] = q.count;
    }

    const ranking = data.userContestRanking;
    const history = (data.userContestRankingHistory || []).filter(h => h && h.attended);
    const topRating = history.length
        ? Math.max(...history.map(h => Number(h.rating) || 0))
        : (ranking?.rating ?? null);

    // Contest data is legitimately absent for users who never competed, so it
    // doesn't count; a null calendar, tag list or badge list means LeetCode
    // dropped that section and the payload shouldn't be cached.
    const complete = !hadErrors && user.userCalendar != null && user.tagProblemCounts != null && user.badges != null;

    return {
        complete,
        username: user.username,
        profile: user.profile || {},
        acSubmissionNum: user.submitStats?.acSubmissionNum || [],
        tagProblemCounts: user.tagProblemCounts || {},
        recentSubmissions: data.recentSubmissionList || [],
        totalQuestions: {
            all: questionCounts.all ?? 0,
            easy: questionCounts.easy ?? 0,
            medium: questionCounts.medium ?? 0,
            hard: questionCounts.hard ?? 0,
        },
        calendar: {
            submissionCalendar: user.userCalendar?.submissionCalendar || '{}',
            streak: user.userCalendar?.streak ?? 0,
            totalActiveDays: user.userCalendar?.totalActiveDays ?? 0,
        },
        contest: ranking ? {
            contestRating: ranking.rating ?? null,
            contestTopRating: topRating,
            contestGlobalRanking: ranking.globalRanking ?? null,
            contestAttend: ranking.attendedContestsCount ?? 0,
            contestTopPercentage: ranking.topPercentage ?? null,
            contestParticipation: history.map(h => ({ rating: h.rating })),
        } : {},
        badges: {
            badgesCount: (user.badges || []).length,
            badges: user.badges || [],
        },
    };
}

export default {
    async fetch(request, env, ctx) {
        const cors = corsHeaders(request, env);

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: cors });
        }

        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405, headers: cors });
        }

        const targetUrl = new URL(request.url);
        const username = (targetUrl.searchParams.get('username') || '').trim();

        if (!username) return json({ error: 'Username is required' }, 400, cors);
        if (!USERNAME_RE.test(username)) return json({ error: 'Invalid username' }, 400, cors);

        // Key on the lowercased username alone: extra query params or a case
        // change must not bypass the edge cache and hit LeetCode again. The
        // cached entry carries no CORS headers — those are per-request.
        const cacheKey = new Request(`${targetUrl.origin}/?username=${encodeURIComponent(username.toLowerCase())}`);
        const cache = caches.default;

        const cached = await cache.match(cacheKey);
        if (cached) {
            return json(await cached.text(), 200, cors, { 'Cache-Control': 'public, max-age=1800' });
        }

        let result;
        try {
            result = await fetchLeetcode(QUERY_FULL, { username });
        } catch {
            return json({ error: 'Failed to fetch' }, 502, cors);
        }

        // LeetCode answers an unknown handle with matchedUser: null (plus an
        // error entry). No data at all is an upstream failure, not a 404 —
        // the client must not read it as "No user found".
        if (!result?.data) return json({ error: 'Upstream error' }, 502, cors);
        if (!result.data.matchedUser) return json({ error: 'User not found' }, 404, cors);

        const payload = buildPayload(result.data, Array.isArray(result.errors) && result.errors.length > 0);
        const body = JSON.stringify(payload);

        if (payload.complete) {
            // max-age matches the client's CACHE_TTL (useLeetCode.js) so the edge
            // cache can't outlive the client cache and serve stale data.
            ctx.waitUntil(cache.put(cacheKey, new Response(body, {
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=1800' },
            })));
        }

        return json(body, 200, cors, { 'Cache-Control': payload.complete ? 'public, max-age=1800' : 'no-store' });
    }
};
