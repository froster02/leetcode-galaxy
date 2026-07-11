const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

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
        starRating
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
   (mirrors the Alfa API field names where they exist). */
function buildPayload(data) {
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

    return {
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
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS_HEADERS });
        }

        if (request.method !== 'GET') {
            return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS });
        }

        const targetUrl = new URL(request.url);
        const username = targetUrl.searchParams.get('username');

        if (!username) {
            return new Response(JSON.stringify({ error: 'Username is required' }), {
                status: 400,
                headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
            });
        }

        // Cache check
        const cacheUrl = new URL(request.url);
        const cacheKey = new Request(cacheUrl.toString(), request);
        const cache = caches.default;

        let response = await cache.match(cacheKey);

        if (!response) {
            try {
                const result = await fetchLeetcode(QUERY_FULL, { username });

                if (result.errors || !result.data?.matchedUser) {
                    return new Response(JSON.stringify({ error: 'User not found or API error' }), {
                        status: 404,
                        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
                    });
                }

                response = new Response(JSON.stringify(buildPayload(result.data)), {
                    headers: {
                        ...CORS_HEADERS,
                        'Content-Type': 'application/json',
                        // Matches the client's CACHE_TTL (useLeetCode.js) so the edge
                        // cache can't outlive the client cache and serve stale data.
                        'Cache-Control': 'public, max-age=1800'
                    }
                });

                // Store in cache
                ctx.waitUntil(cache.put(cacheKey, response.clone()));
            } catch {
                return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
                    status: 500,
                    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
                });
            }
        }

        return response;
    }
};
