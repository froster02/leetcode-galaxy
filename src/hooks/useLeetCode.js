import { useState, useCallback } from 'react';

// For local dev, you might run wrangler dev in the worker directory (http://127.0.0.1:8787)
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached(username) {
    try {
        const raw = localStorage.getItem(`lc_${username.toLowerCase()}`);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        
        // Invalidate if TTL expired OR if it's an old cache from before we added competitive records
        if (Date.now() - ts > CACHE_TTL || !data.contest || !data.badges || !data.calendar) {
            localStorage.removeItem(`lc_${username.toLowerCase()}`);
            return null;
        }
        
        return data;
    } catch { return null; }
}

function setCache(username, data) {
    try {
        localStorage.setItem(`lc_${username.toLowerCase()}`, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* quota exceeded */ }
}

export function useLeetCode() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWithRetry = async (url, retries = 2, delay = 500) => {
        try {
            const res = await fetch(url);
            if (!res.ok) {
                if (res.status === 429 && retries > 0) throw new Error('Rate limited');
                if (res.status >= 500 && retries > 0) throw new Error('Server error');
                return res; // let the component handle 404s
            }
            return res;
        } catch (err) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchWithRetry(url, retries - 1, delay * 2);
            }
            throw err;
        }
    };

    const fetchProfile = useCallback(async (username) => {
        setLoading(true);
        setError(null);

        const cached = getCached(username);
        if (cached) {
            setData(cached);
            setLoading(false);
            return cached;
        }

        try {

            // Safe JSON parser block that won't blow up Promise.all if a sub-endpoint timeouts
            const safeFetch = async (url) => {
                try {
                    const res = await fetchWithRetry(url);
                    if (!res.ok) return {};
                    return await res.json().catch(() => ({}));
                } catch {
                    return {};
                }
            };

            const encodedUser = encodeURIComponent(username);
            const [profileData, statsData, contestData, badgesData, calendarData] = await Promise.all([
                safeFetch(`https://alfa-leetcode-api.onrender.com/userProfile/${encodedUser}`),
                safeFetch(`https://alfa-leetcode-api.onrender.com/skillStats/${encodedUser}`),
                safeFetch(`https://alfa-leetcode-api.onrender.com/${encodedUser}/contest`),
                safeFetch(`https://alfa-leetcode-api.onrender.com/${encodedUser}/badges`),
                safeFetch(`https://alfa-leetcode-api.onrender.com/${encodedUser}/calendar`),
            ]);

            if (profileData.errors || Object.keys(profileData).length === 0 || !profileData.totalQuestions) {
                throw new Error('User not found or Proxy API is asleep');
            }

            // Reconstruct the response to exactly match the Cloudflare Worker output shape
            const json = {
                profile: {
                    matchedUser: {
                        username: username,
                        submitStats: {
                            acSubmissionNum: profileData.matchedUserStats?.acSubmissionNum || []
                        },
                        profile: {
                            ranking: profileData.ranking || 0,
                            reputation: profileData.reputation || 0,
                            starRating: 0 // Not provided by proxy but mostly decorative
                        }
                    }
                },
                tags: statsData,
                recent: {
                    recentSubmissionList: profileData.recentSubmissions || []
                },
                contest: contestData,
                badges: badgesData,
                calendar: calendarData
            };

            setData(json);
            setCache(username, json);
            return json;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, fetchProfile };
}
