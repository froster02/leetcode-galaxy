import { useState, useCallback } from 'react';
import { normalizeStats, validateTotalQuestions, fixPercentages } from '../utils/normalization';

// For local dev, you might run wrangler dev in the worker directory (http://127.0.0.1:8787)
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CACHE_VERSION = 2;
const FETCH_TIMEOUT = 12000; // 12s per request — free Render tier cold-starts in ~10s
const API = 'https://alfa-leetcode-api.onrender.com';

/* Fire-and-forget ping so Render wakes before user searches */
export function prewarmApi() {
    fetch(`${API}/`, { signal: AbortSignal.timeout(8000) }).catch(() => {});
}

function getCached(username) {
    try {
        const raw = localStorage.getItem(`lc_${username.toLowerCase()}`);
        if (!raw) return null;
        const { data, ts, v } = JSON.parse(raw);
        
        const isExpired = Date.now() - ts > CACHE_TTL;
        const isOutdated = v !== CACHE_VERSION;
        const hasCanonicalShape =
            !!data?.profile?.matchedUser?.submitStats?.acSubmissionNum &&
            !!data?.totalQuestions &&
            !!data?._normalized;

        if (isExpired || isOutdated || !hasCanonicalShape) {
            localStorage.removeItem(`lc_${username.toLowerCase()}`);
            return null;
        }
        
        return data;
    } catch { return null; }
}

function setCache(username, data) {
    try {
        localStorage.setItem(`lc_${username.toLowerCase()}`, JSON.stringify({ data, ts: Date.now(), v: CACHE_VERSION }));
    } catch { /* quota exceeded */ }
}

export function useLeetCode() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchWithRetry = async (url, retries = 1, retryDelay = 300) => {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
            if (!res.ok) {
                if ((res.status === 429 || res.status >= 500) && retries > 0) throw new Error('Server error');
                return res;
            }
            return res;
        } catch (err) {
            if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return fetchWithRetry(url, retries - 1, retryDelay);
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
                safeFetch(`${API}/userProfile/${encodedUser}`),
                safeFetch(`${API}/skillStats/${encodedUser}`),
                safeFetch(`${API}/${encodedUser}/contest`),
                safeFetch(`${API}/${encodedUser}/badges`),
                safeFetch(`${API}/${encodedUser}/calendar`),
            ]);

            if (profileData.errors || Object.keys(profileData).length === 0) {
                throw new Error('No user found');
            }

            const rawTotalQuestions = profileData.totalQuestions;
            const totalQuestionsShape = typeof rawTotalQuestions === 'object' && rawTotalQuestions !== null;
            const validatedTotalQuestions = validateTotalQuestions({
                all: totalQuestionsShape ? rawTotalQuestions.total ?? rawTotalQuestions.all : rawTotalQuestions,
                easy: totalQuestionsShape ? rawTotalQuestions.easy : profileData.totalEasy,
                medium: totalQuestionsShape ? rawTotalQuestions.medium : profileData.totalMedium,
                hard: totalQuestionsShape ? rawTotalQuestions.hard : profileData.totalHard,
            });

            const normalizedStats = normalizeStats(
                profileData.matchedUserStats?.acSubmissionNum || [],
                validatedTotalQuestions
            );

            if (validatedTotalQuestions.all === 0) {
                throw new Error('No user found');
            }

            const percentages = fixPercentages(normalizedStats, validatedTotalQuestions);
            const hardRatio = normalizedStats.hard > 0 && validatedTotalQuestions.all > 0 
                ? ((normalizedStats.hard / validatedTotalQuestions.all) * 100).toFixed(1) 
                : '0.0';

            const json = {
                profile: {
                    matchedUser: {
                        username: username,
                        submitStats: {
                            acSubmissionNum: [
                                { difficulty: 'Easy', count: normalizedStats.easy },
                                { difficulty: 'Medium', count: normalizedStats.medium },
                                { difficulty: 'Hard', count: normalizedStats.hard },
                                { difficulty: 'All', count: normalizedStats.all }
                            ]
                        },
                        profile: {
                            ranking: profileData.ranking || 0,
                            reputation: profileData.reputation || 0,
                            starRating: 0,
                        }
                    }
                },
                totalQuestions: validatedTotalQuestions,
                tags: statsData,
                recent: {
                    recentSubmissionList: profileData.recentSubmissions || []
                },
                contest: contestData,
                badges: badgesData,
                calendar: calendarData,
                // Pre-calculated normalized values for easy access
                _normalized: {
                    hardRatio: hardRatio,
                    totalSolved: normalizedStats.all,
                    percentages,
                }
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
