import { useState, useCallback } from 'react';
import { normalizeStats, validateTotalQuestions, fixPercentages } from '../utils/normalization';

// For local dev, you might run wrangler dev in the worker directory (http://127.0.0.1:8787)
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const CACHE_VERSION = 2;
const FETCH_TIMEOUT = 12000; // 12s per request — free Render tier cold-starts in ~10s
export const API = 'https://alfa-leetcode-api.onrender.com';
// Optional Cloudflare Worker fallback (worker/index.js) — used when Alfa
// rate-limits or is unreachable. Unset = no fallback (previous behavior).
export const WORKER_URL = (import.meta.env.VITE_WORKER_URL || '').replace(/\/+$/, '');

/* AbortSignal.timeout is missing on Safari < 16 — fall back to a manual controller */
export function timeoutSignal(ms) {
    if (typeof AbortSignal !== 'undefined' && AbortSignal.timeout) return AbortSignal.timeout(ms);
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
}

/* Fire-and-forget ping so Render wakes before user searches */
export function prewarmApi() {
    try {
        fetch(`${API}/`, { signal: timeoutSignal(8000) }).catch(() => {});
    } catch { /* ignore */ }
}

/* Maps the worker's flat payload (see worker/index.js buildPayload) into the
   same canonical shape fetchProfile builds from the Alfa API. Pure — exported
   for unit tests. */
export function mapWorkerResponse(username, w) {
    const validatedTotalQuestions = validateTotalQuestions(w?.totalQuestions || {});
    const normalizedStats = normalizeStats(w?.acSubmissionNum || [], validatedTotalQuestions);

    if (validatedTotalQuestions.all === 0) {
        throw new Error('No user found');
    }

    const percentages = fixPercentages(normalizedStats, validatedTotalQuestions);
    const hardRatio = normalizedStats.hard > 0 && validatedTotalQuestions.all > 0
        ? ((normalizedStats.hard / validatedTotalQuestions.all) * 100).toFixed(1)
        : '0.0';

    return {
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
                    ranking: w?.profile?.ranking || 0,
                    reputation: w?.profile?.reputation || 0,
                    starRating: 0,
                }
            }
        },
        totalQuestions: validatedTotalQuestions,
        tags: { matchedUser: { tagProblemCounts: w?.tagProblemCounts || {} } },
        recent: { recentSubmissionList: w?.recentSubmissions || [] },
        contest: w?.contest ?? {},
        badges: w?.badges ?? {},
        calendar: {
            ...(w?.calendar ?? {}),
            submissionCalendar: w?.calendar?.submissionCalendar || {},
        },
        _normalized: {
            hardRatio: hardRatio,
            totalSolved: normalizedStats.all,
            percentages,
        }
    };
}

async function fetchFromWorker(username) {
    const res = await fetch(`${WORKER_URL}/?username=${encodeURIComponent(username)}`, {
        signal: timeoutSignal(FETCH_TIMEOUT),
    });
    if (!res.ok) {
        if (res.status === 404 || res.status === 400) throw new Error('No user found');
        throw new Error('Network error');
    }
    const json = await res.json().catch(() => null);
    if (!json) throw new Error('Network error');
    // Mirrors the Alfa path's completeness check: only cache-worthy if the
    // secondary fields actually came back, not silently defaulted to {}/[].
    const complete = [json.contest, json.badges, json.tagProblemCounts, json.calendar?.submissionCalendar]
        .every(part => part !== undefined && part !== null);
    return { mapped: mapWorkerResponse(username, json), complete };
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
            const res = await fetch(url, { signal: timeoutSignal(FETCH_TIMEOUT) });
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

            // Secondary endpoints: null on failure so callers can tell
            // "endpoint failed" apart from "endpoint returned empty data"
            const safeFetch = async (url) => {
                try {
                    const res = await fetchWithRetry(url);
                    if (!res.ok) return null;
                    return await res.json().catch(() => null);
                } catch {
                    return null;
                }
            };

            // Core profile is strict: a timeout / network drop / 5xx must NOT
            // be reported as "No user found"
            const fetchProfileStrict = async (url) => {
                let res;
                try {
                    res = await fetchWithRetry(url);
                } catch {
                    throw new Error('Network error');
                }
                if (!res.ok) {
                    if (res.status === 404 || res.status === 400) throw new Error('No user found');
                    if (res.status === 429) throw new Error('Rate limited');
                    throw new Error('Network error');
                }
                const json = await res.json().catch(() => null);
                if (!json || json.errors || Object.keys(json).length === 0) {
                    throw new Error('No user found');
                }
                return json;
            };

            const encodedUser = encodeURIComponent(username);

            // Fetch core profile first; skill stats in parallel but non-blocking
            const [profileData, contestData, badgesData, calendarData] = await Promise.all([
                fetchProfileStrict(`${API}/userProfile/${encodedUser}`),
                safeFetch(`${API}/${encodedUser}/contest`),
                safeFetch(`${API}/${encodedUser}/badges`),
                safeFetch(`${API}/${encodedUser}/calendar`),
            ]);

            // skillStats fetched separately so a slow cold-start doesn't blank topic strength
            const statsData = await safeFetch(`${API}/skillStats/${encodedUser}`);

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
                tags: statsData ?? {},
                recent: {
                    recentSubmissionList: profileData.recentSubmissions || []
                },
                contest: contestData ?? {},
                badges: badgesData ?? {},
                // Merge: /calendar gives streak metadata; userProfile has the actual heatmap dict
                calendar: {
                    ...(calendarData ?? {}),
                    submissionCalendar: profileData.submissionCalendar || calendarData?.submissionCalendar || {},
                },
                // Pre-calculated normalized values for easy access
                _normalized: {
                    hardRatio: hardRatio,
                    totalSolved: normalizedStats.all,
                    percentages,
                }
            };

            setData(json);
            // Cache only complete payloads — a timed-out secondary endpoint
            // would otherwise pin empty contest/badges/heatmap data for 30 min
            const complete = [contestData, badgesData, calendarData, statsData]
                .every(part => part !== null);
            if (complete) setCache(username, json);
            return json;
        } catch (err) {
            // Alfa rate-limited or unreachable → try the worker fallback if configured.
            // A definitive 'No user found' is never retried against the worker.
            const msg = err?.message;
            if (WORKER_URL && (msg === 'Rate limited' || msg === 'Network error')) {
                try {
                    const { mapped: json, complete } = await fetchFromWorker(username);
                    setData(json);
                    if (complete) setCache(username, json);
                    return json;
                } catch { /* fall through to the original error */ }
            }
            setError(msg);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fetchWithRetry is defined inside the hook, stable

    return { data, loading, error, fetchProfile };
}
