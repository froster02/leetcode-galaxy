import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const API = 'https://alfa-leetcode-api.onrender.com';
const WORKER = 'https://worker.test';

function memoryStorage() {
    const m = new Map();
    return {
        get length() { return m.size; },
        key: (i) => [...m.keys()][i] ?? null,
        getItem: (k) => (m.has(k) ? m.get(k) : null),
        setItem: (k, v) => { m.set(k, String(v)); },
        removeItem: (k) => { m.delete(k); },
    };
}

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status) => ({ ok: false, status, json: async () => ({}) });

const alfaProfile = {
    totalQuestions: 3200, totalEasy: 800, totalMedium: 1700, totalHard: 700,
    matchedUserStats: { acSubmissionNum: [
        { difficulty: 'All', count: 35 }, { difficulty: 'Easy', count: 10 },
        { difficulty: 'Medium', count: 20 }, { difficulty: 'Hard', count: 5 },
    ] },
    ranking: 42, reputation: 1, recentSubmissions: [], submissionCalendar: { 100: 2 },
};
const workerPayload = {
    complete: true, username: 'tester', profile: { ranking: 42 },
    acSubmissionNum: alfaProfile.matchedUserStats.acSubmissionNum,
    totalQuestions: { all: 3200, easy: 800, medium: 1700, hard: 700 },
    tagProblemCounts: {}, recentSubmissions: [], calendar: { submissionCalendar: '{}' }, contest: {}, badges: {},
};

/* routes: { '<url substring>': response | () => response }; first match wins */
function stubFetch(routes) {
    const mock = vi.fn(async (url) => {
        for (const [part, res] of Object.entries(routes)) {
            if (String(url).includes(part)) return typeof res === 'function' ? res() : res;
        }
        throw new Error(`unrouted ${url}`);
    });
    vi.stubGlobal('fetch', mock);
    return mock;
}
const alfaOk = { '/userProfile/': ok(alfaProfile), '/contest': ok({}), '/badges': ok({}), '/calendar': ok({}), '/skillStats/': ok({}) };
const calls = (mock, part) => mock.mock.calls.filter(([u]) => String(u).includes(part)).length;

async function load({ workerUrl = '' } = {}) {
    vi.resetModules();
    vi.stubEnv('VITE_WORKER_URL', workerUrl);
    return import('../src/hooks/useLeetCode');
}

beforeEach(() => vi.stubGlobal('localStorage', memoryStorage()));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('fetchProfile — Alfa path and cache', () => {
    it('returns the canonical shape and serves the second call from cache', async () => {
        const { fetchProfile } = await load();
        const mock = stubFetch(alfaOk);

        const first = await fetchProfile('Tester');
        expect(first.profile.matchedUser.username).toBe('Tester');
        expect(first._normalized.totalSolved).toBe(35);
        expect(localStorage.getItem('lc_tester')).not.toBeNull();

        const n = mock.mock.calls.length;
        expect(await fetchProfile('tester')).toEqual(first);
        expect(mock.mock.calls.length).toBe(n);
    });

    it('does not cache when a secondary endpoint failed', async () => {
        const { fetchProfile } = await load();
        stubFetch({ ...alfaOk, '/badges': fail(404) });

        const json = await fetchProfile('tester');
        expect(json.badges).toEqual({});
        expect(localStorage.getItem('lc_tester')).toBeNull();
    });

    it('404 → No user found; 429 → Rate limited; 5xx → Network error', async () => {
        const { fetchProfile } = await load();
        stubFetch({ ...alfaOk, '/userProfile/': fail(404) });
        await expect(fetchProfile('a')).rejects.toThrow('No user found');
        stubFetch({ ...alfaOk, '/userProfile/': fail(429) });
        await expect(fetchProfile('b')).rejects.toThrow('Rate limited');
        stubFetch({ ...alfaOk, '/userProfile/': fail(503) });
        await expect(fetchProfile('c')).rejects.toThrow('Network error');
    });

    it('sweeps expired and old-version entries when writing', async () => {
        const { fetchProfile } = await load();
        stubFetch(alfaOk);
        localStorage.setItem('lc_old', JSON.stringify({ data: {}, ts: Date.now() - 31 * 60 * 1000, v: 2 }));
        localStorage.setItem('lc_v1', JSON.stringify({ data: {}, ts: Date.now(), v: 1 }));
        localStorage.setItem('lc_corrupt', '{nope');
        localStorage.setItem('lc_fresh', JSON.stringify({ data: {}, ts: Date.now(), v: 2 }));
        localStorage.setItem('recentExplorers', '["x"]');

        await fetchProfile('tester');
        expect(localStorage.getItem('lc_old')).toBeNull();
        expect(localStorage.getItem('lc_v1')).toBeNull();
        expect(localStorage.getItem('lc_corrupt')).toBeNull();
        expect(localStorage.getItem('lc_fresh')).not.toBeNull();
        expect(localStorage.getItem('recentExplorers')).toBe('["x"]');
    });
});

describe('fetchProfile — worker fallback', () => {
    it('is not used when VITE_WORKER_URL is unset', async () => {
        const { fetchProfile } = await load();
        const mock = stubFetch({ ...alfaOk, '/userProfile/': fail(429), [WORKER]: ok(workerPayload) });
        await expect(fetchProfile('tester')).rejects.toThrow('Rate limited');
        expect(calls(mock, WORKER)).toBe(0);
    });

    it('takes over on Rate limited and caches a complete payload', async () => {
        const { fetchProfile } = await load({ workerUrl: `${WORKER}/` });
        const mock = stubFetch({ [WORKER]: ok(workerPayload), ...alfaOk, '/userProfile/': fail(429) });
        const json = await fetchProfile('tester');
        expect(json._normalized.totalSolved).toBe(35);
        expect(calls(mock, `${WORKER}/?username=tester`)).toBe(1);
        expect(localStorage.getItem('lc_tester')).not.toBeNull();
    });

    it('takes over on Network error but does not cache an incomplete payload', async () => {
        const { fetchProfile } = await load({ workerUrl: WORKER });
        stubFetch({ [WORKER]: ok({ ...workerPayload, complete: false }), ...alfaOk, '/userProfile/': fail(503) });
        await fetchProfile('tester');
        expect(localStorage.getItem('lc_tester')).toBeNull();
    });

    it('is never tried on No user found', async () => {
        const { fetchProfile } = await load({ workerUrl: WORKER });
        const mock = stubFetch({ [WORKER]: ok(workerPayload), ...alfaOk, '/userProfile/': fail(404) });
        await expect(fetchProfile('tester')).rejects.toThrow('No user found');
        expect(calls(mock, WORKER)).toBe(0);
    });

    it('reports the original Alfa error when the worker fails too', async () => {
        const { fetchProfile } = await load({ workerUrl: WORKER });
        stubFetch({ [WORKER]: fail(404), ...alfaOk, '/userProfile/': fail(429) });
        await expect(fetchProfile('tester')).rejects.toThrow('Rate limited');
    });
});
