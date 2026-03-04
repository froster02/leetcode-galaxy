const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

const LEETCODE_API = 'https://leetcode.com/graphql';

const QUERY_PROFILE = `
  query getProfile($username: String!) {
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
    }
  }
`;

const QUERY_TAGS = `
  query getTags($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced { tagName tagSlug problemsSolved }
        intermediate { tagName tagSlug problemsSolved }
        fundamental { tagName tagSlug problemsSolved }
      }
    }
  }
`;

const QUERY_RECENT = `
  query getRecent($username: String!) {
    recentSubmissionList(username: $username, limit: 10) {
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
                const variables = { username };
                const [profile, tags, recent] = await Promise.all([
                    fetchLeetcode(QUERY_PROFILE, variables),
                    fetchLeetcode(QUERY_TAGS, variables),
                    fetchLeetcode(QUERY_RECENT, variables)
                ]);

                if (profile.errors || !profile.data?.matchedUser) {
                    return new Response(JSON.stringify({ error: 'User not found or API error' }), {
                        status: 404,
                        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
                    });
                }

                const responseData = {
                    profile: profile.data,
                    tags: tags.data,
                    recent: recent.data
                };

                response = new Response(JSON.stringify(responseData), {
                    headers: {
                        ...CORS_HEADERS,
                        'Content-Type': 'application/json',
                        'Cache-Control': 'public, max-age=3600'
                    }
                });

                // Store in cache
                ctx.waitUntil(cache.put(cacheKey, response.clone()));
            } catch (error) {
                return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
                    status: 500,
                    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
                });
            }
        }

        return response;
    }
};
