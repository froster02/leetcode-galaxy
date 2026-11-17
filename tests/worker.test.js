import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import worker from '../worker/index.js';

function leetcodeData(overrides = {}) {
    return {
        allQuestionsCount: [
            { difficulty: 'All', count: 3200 }, { difficulty: 'Easy', count: 800 },
            { difficulty: 'Medium', count: 1700 }, { difficulty: 'Hard', count: 700 },
        ],
        matchedUser: {
            username: 'Tester',
            submitStats: { acSubmissionNum: [{ difficulty: 'All', count: 35 }] },
            profile: { ranking: 1, reputation: 2 },
            userCalendar: { streak: 1, totalActiveDays: 2, submissionCalendar: '{}' },
            badges: [],
            tagProblemCounts: { advanced: [], intermediate: [], fundamental: [] },
        },
        userContestRanking: null,
        userContestRankingHistory: [],
        recentSubmissionList: [],
        ...overrides,
    };
}

let store, waits, ctx;
const upstream = (body) => vi.fn(async () => ({ json: async () => body }));
const call = (url, { env = {}, headers = {}, method = 'GET' } = {}) =>
    worker.fetch(new Request(url, { method, headers }), env, ctx);

beforeEach(() => {
    store = new Map();
    waits = [];
    ctx = { waitUntil: (p) => waits.push(p) };
    vi.stubGlobal('caches', {
        default: {
            match: async (req) => store.get(req.url)?.clone(),
            put: async (req, res) => { store.set(req.url, res); },
        },
    });
});
afterEach(() => vi.unstubAllGlobals());

describe('worker input validation', () => {
    it('400 without a username, and never calls LeetCode', async () => {
        const fetchMock = upstream({});
        vi.stubGlobal('fetch', fetchMock);
        expect((await call('https://w.test/')).status).toBe(400);
        expect((await call('https://w.test/?username=a%20b')).status).toBe(400);
        expect((await call(`https://w.test/?username=${'x'.repeat(65)}`)).status).toBe(400);
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('405 for non-GET', async () => {
        expect((await call('https://w.test/?username=a', { method: 'POST' })).status).toBe(405);
    });
});

describe('worker upstream status mapping', () => {
    it('404 when LeetCode reports no such user', async () => {
        vi.stubGlobal('fetch', upstream({ errors: [{ message: 'That user does not exist.' }], data: { matchedUser: null } }));
        expect((await call('https://w.test/?username=nobody')).status).toBe(404);
    });

    it('502 (not 404) when LeetCode returns no data', async () => {
        vi.stubGlobal('fetch', upstream({ errors: [{ message: 'boom' }] }));
        expect((await call('https://w.test/?username=tester')).status).toBe(502);
    });

    it('502 when the upstream call throws', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
        expect((await call('https://w.test/?username=tester')).status).toBe(502);
    });
});

describe('worker edge cache', () => {
    it('serves case variants and junk params from one cache entry', async () => {
        const fetchMock = upstream({ data: leetcodeData() });
        vi.stubGlobal('fetch', fetchMock);

        const first = await call('https://w.test/?username=Tester');
        expect(first.status).toBe(200);
        expect((await first.json()).complete).toBe(true);
        await Promise.all(waits);

        const second = await call('https://w.test/?username=tester&junk=1');
        expect(second.status).toBe(200);
        expect((await second.json()).username).toBe('Tester');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not cache incomplete payloads', async () => {
        const data = leetcodeData();
        data.matchedUser.userCalendar = null;
        const fetchMock = upstream({ data });
        vi.stubGlobal('fetch', fetchMock);

        const res = await call('https://w.test/?username=tester');
        expect(res.headers.get('Cache-Control')).toBe('no-store');
        expect((await res.json()).complete).toBe(false);
        await call('https://w.test/?username=tester');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('marks a payload incomplete when LeetCode reported section errors', async () => {
        vi.stubGlobal('fetch', upstream({ errors: [{ message: 'partial' }], data: leetcodeData() }));
        const res = await call('https://w.test/?username=tester');
        expect(res.status).toBe(200);
        expect((await res.json()).complete).toBe(false);
    });
});

describe('worker CORS', () => {
    beforeEach(() => vi.stubGlobal('fetch', upstream({ data: leetcodeData() })));

    it('allows any origin when ALLOWED_ORIGINS is unset', async () => {
        const res = await call('https://w.test/?username=tester', { headers: { Origin: 'https://evil.test' } });
        expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('echoes only listed origins when ALLOWED_ORIGINS is set — also on cache hits', async () => {
        const env = { ALLOWED_ORIGINS: 'https://app.test, http://localhost:5173' };
        const ok = await call('https://w.test/?username=tester', { env, headers: { Origin: 'https://app.test' } });
        expect(ok.headers.get('Access-Control-Allow-Origin')).toBe('https://app.test');
        await Promise.all(waits);

        const denied = await call('https://w.test/?username=tester', { env, headers: { Origin: 'https://evil.test' } });
        expect(denied.headers.get('Access-Control-Allow-Origin')).toBeNull();
        expect(denied.headers.get('Vary')).toBe('Origin');
    });
});
