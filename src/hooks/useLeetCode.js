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

/* The one canonical payload shape mapProfile() consumes, built the same way
   for the Alfa path and the worker fallback. Pure. Throws 'No user found'
   when the question totals are missing (neither API returns them for an
   unknown handle). */
export function buildCanonical(username, { totalQuestions, acSubmissionNum, ranking, reputation, tags, recent, contest, badges, calendar }) {
    const validatedTotalQuestions = validateTotalQuestions(totalQuestions || {});
    const normalizedStats = normalizeStats(acSubmissionNum || [], validatedTotalQuestions);

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
                    ranking: ranking || 0,
                    reputation: reputation || 0,
                    starRating: 0,
                }
            }
        },
        totalQuestions: validatedTotalQuestions,
        tags: tags ?? {},
        recent: { recentSubmissionList: recent || [] },
        contest: contest ?? {},
        badges: badges ?? {},
        calendar,
        // Pre-calculated normalized values for easy access
        _normalized: {
            hardRatio: hardRatio,
            totalSolved: normalizedStats.all,
            percentages,
        }
    };
}

/* Maps the worker's flat payload (see worker/index.js buildPayload) into the
   canonical shape. Pure — exported for unit tests. */
export function mapWorkerResponse(username, w) {
    return buildCanonical(username, {
        totalQuestions: w?.totalQuestions,
        acSubmissionNum: w?.acSubmissionNum,
        ranking: w?.profile?.ranking,
        reputation: w?.profile?.reputation,
        tags: { matchedUser: { tagProblemCounts: w?.tagProblemCounts || {} } },
        recent: w?.recentSubmissions,
        contest: w?.contest,
        badges: w?.badges,
        calendar: {
            ...(w?.calendar ?? {}),
            submissionCalendar: w?.calendar?.submissionCalendar || {},
        },
    });
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
    // The worker fills missing sections with empty defaults, so it reports
    // completeness itself; older deployments without the flag are never cached.
    const complete = json.complete === true;
    return { mapped: mapWorkerResponse(username, json), complete };
}

const CACHE_PREFIX = 'lc_';
const cacheKey = (username) => `${CACHE_PREFIX}${username.toLowerCase()}`;

function isStale(entry) {
    return !entry || Date.now() - entry.ts > CACHE_TTL || entry.v !== CACHE_VERSION;
}

function getCached(username) {
    try {
        const raw = localStorage.getItem(cacheKey(username));
        if (!raw) return null;
        const entry = JSON.parse(raw);
        const data = entry?.data;
        const hasCanonicalShape =
            !!data?.profile?.matchedUser?.submitStats?.acSubmissionNum &&
            !!data?.totalQuestions &&
            !!data?._normalized;

        if (isStale(entry) || !hasCanonicalShape) {
            localStorage.removeItem(cacheKey(username));
            return null;
        }

        return data;
    } catch { return null; }
}

/* Entries are otherwise only dropped when the same user is read again, so
   every profile ever viewed would sit in localStorage until the quota. */
function sweepCache() {
    const stale = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(CACHE_PREFIX)) continue;
        let entry = null;
        try { entry = JSON.parse(localStorage.getItem(key)); } catch { /* corrupt → stale */ }
        if (isStale(entry)) stale.push(key);
    }
    stale.forEach(key => localStorage.removeItem(key));
}

function setCache(username, data) {
    try {
        sweepCache();
        localStorage.setItem(cacheKey(username), JSON.stringify({ data, ts: Date.now(), v: CACHE_VERSION }));
    } catch { /* quota exceeded / storage unavailable */ }
}

async function fetchWithRetry(url, retries = 1, retryDelay = 300) {
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
}

// Secondary endpoints: null on failure so callers can tell
// "endpoint failed" apart from "endpoint returned empty data"
async function safeFetch(url) {
    try {
        const res = await fetchWithRetry(url);
        if (!res.ok) return null;
        return await res.json().catch(() => null);
    } catch {
        return null;
    }
}

// Core profile is strict: a timeout / network drop / 5xx must NOT
// be reported as "No user found"
async function fetchProfileStrict(url) {
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
}

async function fetchFromAlfa(username) {
    const encodedUser = encodeURIComponent(username);

    const [profileData, contestData, badgesData, calendarData] = await Promise.all([
        fetchProfileStrict(`${API}/userProfile/${encodedUser}`),
        safeFetch(`${API}/${encodedUser}/contest`),
        safeFetch(`${API}/${encodedUser}/badges`),
        safeFetch(`${API}/${encodedUser}/calendar`),
    ]);

    // skillStats goes after the batch above: one request fewer in flight
    // against a rate-limited API that may still be cold-starting
    const statsData = await safeFetch(`${API}/skillStats/${encodedUser}`);

    const rawTotalQuestions = profileData.totalQuestions;
    const totalQuestionsShape = typeof rawTotalQuestions === 'object' && rawTotalQuestions !== null;

    const mapped = buildCanonical(username, {
        totalQuestions: {
            all: totalQuestionsShape ? rawTotalQuestions.total ?? rawTotalQuestions.all : rawTotalQuestions,
            easy: totalQuestionsShape ? rawTotalQuestions.easy : profileData.totalEasy,
            medium: totalQuestionsShape ? rawTotalQuestions.medium : profileData.totalMedium,
            hard: totalQuestionsShape ? rawTotalQuestions.hard : profileData.totalHard,
        },
        acSubmissionNum: profileData.matchedUserStats?.acSubmissionNum,
        ranking: profileData.ranking,
        reputation: profileData.reputation,
        tags: statsData,
        recent: profileData.recentSubmissions,
        contest: contestData,
        badges: badgesData,
        // Merge: /calendar gives streak metadata; userProfile has the actual heatmap dict
        calendar: {
            ...(calendarData ?? {}),
            submissionCalendar: profileData.submissionCalendar || calendarData?.submissionCalendar || {},
        },
    });

    // A timed-out secondary endpoint would otherwise pin empty
    // contest/badges/heatmap data for 30 min
    const complete = [contestData, badgesData, calendarData, statsData]
        .every(part => part !== null);
    return { mapped, complete };
}

/**
 * Loads a profile in the canonical shape: localStorage cache → Alfa API →
 * worker fallback (only when configured, and only for 'Rate limited' /
 * 'Network error' — a definitive 'No user found' is never retried there).
 * Only complete payloads are cached. Rejects with an Error whose message is
 * 'No user found' | 'Rate limited' | 'Network error'.
 */
export async function fetchProfile(username) {
    const cached = getCached(username);
    if (cached) return cached;

    let result;
    try {
        result = await fetchFromAlfa(username);
    } catch (err) {
        const msg = err?.message;
        if (!WORKER_URL || (msg !== 'Rate limited' && msg !== 'Network error')) throw err;
        try {
            result = await fetchFromWorker(username);
        } catch {
            throw err; // report the original Alfa failure
        }
    }

    if (result.complete) setCache(username, result.mapped);
    return result.mapped;
}

/* Kept as a hook so callers don't change; fetchProfile is a stable module function. */
export function useLeetCode() {
    return { fetchProfile };
}
