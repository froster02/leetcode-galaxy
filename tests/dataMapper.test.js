import { describe, it, expect } from 'vitest';
import { mapProfile } from '../src/utils/dataMapper';

function makePayload(overrides = {}) {
    return {
        profile: {
            matchedUser: {
                username: 'tester',
                submitStats: {
                    acSubmissionNum: [
                        { difficulty: 'Easy', count: 10 },
                        { difficulty: 'Medium', count: 20 },
                        { difficulty: 'Hard', count: 5 },
                        { difficulty: 'All', count: 35 },
                    ],
                },
                profile: { ranking: 1234, reputation: 10, starRating: 0 },
            },
        },
        totalQuestions: { all: 3200, easy: 800, medium: 1700, hard: 700 },
        tags: {
            matchedUser: {
                tagProblemCounts: {
                    advanced: [{ tagName: 'DP', tagSlug: 'dp', problemsSolved: 30 }],
                    intermediate: [{ tagName: 'Trees', tagSlug: 'trees', problemsSolved: 20 }],
                    fundamental: [{ tagName: 'Arrays', tagSlug: 'arrays', problemsSolved: 40 }],
                },
            },
        },
        recent: { recentSubmissionList: [{ title: 'Two Sum', statusDisplay: 'Accepted' }] },
        contest: {},
        badges: {},
        calendar: {},
        ...overrides,
    };
}

describe('mapProfile', () => {
    it('returns null for missing user', () => {
        expect(mapProfile(null)).toBeNull();
        expect(mapProfile({ profile: {} })).toBeNull();
    });

    it('maps stats in Easy/Medium/Hard/All order', () => {
        const city = mapProfile(makePayload());
        expect(city.stats.map(s => s.difficulty)).toEqual(['Easy', 'Medium', 'Hard', 'All']);
        expect(city.stats[3].count).toBe(35);
    });

    it('sorts districts by problems solved, top tag first', () => {
        const city = mapProfile(makePayload());
        expect(city.districts[0].name).toBe('Arrays');
        expect(city.districts[0].normalizedScore).toBe(1);
        expect(city.districts.length).toBe(3);
    });

    it('defaults contestInfo when contest data absent', () => {
        const city = mapProfile(makePayload());
        expect(city.contestInfo).toEqual({
            rating: null, topRating: null, ranking: null,
            attended: 0, topPercentage: null, history: [],
            totalParticipants: null, rows: [],
        });
    });

    it('extracts contest rating history for the sparkline', () => {
        const city = mapProfile(makePayload({
            contest: {
                contestRating: 1650.7,
                contestAttend: 3,
                contestParticipation: [
                    { rating: 1500.1 },
                    { rating: 1580.5 },
                    { rating: 'bad' },   // dropped
                    { rating: 1650.7 },
                    null,                 // dropped
                ],
            },
        }));
        expect(city.contestInfo.history).toEqual([1500.1, 1580.5, 1650.7]);
    });

    it('history is [] when contestParticipation is not an array', () => {
        const city = mapProfile(makePayload({ contest: { contestParticipation: 'nope' } }));
        expect(city.contestInfo.history).toEqual([]);
    });
});

describe('mapProfile: single page profile fields', () => {
    it('maps identity and keeps only http(s) links', () => {
        const p = mapProfile(makePayload({
            identity: {
                name: '  Ada  ', avatar: 'https://assets.leetcode.com/users/ada/avatar.png',
                country: 'India', company: '', school: null, about: 'Hi',
                gitHub: 'https://github.com/ada', linkedIN: 'javascript:alert(1)',
                twitter: null, website: ['https://ada.dev', 'ftp://nope', 'https://ada.dev'],
            },
        }));
        expect(p.identity).toEqual({
            name: 'Ada',
            avatar: 'https://assets.leetcode.com/users/ada/avatar.png',
            country: 'India', company: null, school: null, about: 'Hi',
            links: [
                { label: 'GitHub', url: 'https://github.com/ada' },
                { label: 'Website', url: 'https://ada.dev' },
            ],
        });
    });

    it('drops the default placeholder avatar and handles missing identity', () => {
        const p = mapProfile(makePayload({ identity: { avatar: 'https://x/default_avatar.jpg' } }));
        expect(p.identity.avatar).toBeNull();
        expect(mapProfile(makePayload()).identity).toEqual({
            name: null, avatar: null, country: null, company: null, school: null, about: null, links: [],
        });
    });

    it('keeps all three skill tiers, sorted, without zero counts', () => {
        const p = mapProfile(makePayload({
            tags: { matchedUser: { tagProblemCounts: {
                advanced: [{ tagName: 'DP', tagSlug: 'dp', problemsSolved: 3 }, { tagName: 'Trie', tagSlug: 'trie', problemsSolved: 9 }],
                intermediate: [{ tagName: 'Graph', tagSlug: 'graph', problemsSolved: 0 }],
                fundamental: undefined,
            } } },
        }));
        expect(p.skills.advanced.map(t => t.name)).toEqual(['Trie', 'DP']);
        expect(p.skills.intermediate).toEqual([]);
        expect(p.skills.fundamental).toEqual([]);
    });

    it('reads languages from either response shape', () => {
        const flat = mapProfile(makePayload({ languages: { languageProblemCount: [
            { languageName: 'Python3', problemsSolved: 5 }, { languageName: 'Java', problemsSolved: 40 },
            { languageName: 'C', problemsSolved: 0 },
        ] } }));
        expect(flat.languages).toEqual([{ name: 'Java', solved: 40 }, { name: 'Python3', solved: 5 }]);
        const nested = mapProfile(makePayload({ languages: { matchedUser: { languageProblemCount: [
            { languageName: 'Java', problemsSolved: 1 },
        ] } } }));
        expect(nested.languages).toEqual([{ name: 'Java', solved: 1 }]);
        expect(mapProfile(makePayload()).languages).toEqual([]);
    });

    it('computes acceptance from accepted vs total submissions', () => {
        const p = mapProfile(makePayload({ submitTotals: {
            ac: [{ difficulty: 'All', count: 35, submissions: 614 }],
            total: [{ difficulty: 'All', count: 40, submissions: 1000 }],
        } }));
        expect(p.acceptance).toEqual({ rate: 61.4, submissions: 1000 });
        expect(mapProfile(makePayload()).acceptance).toBeNull();
        expect(mapProfile(makePayload({ submitTotals: { ac: [{ difficulty: 'All', submissions: 1 }], total: [{ difficulty: 'All', submissions: 0 }] } })).acceptance).toBeNull();
    });

    it('maps beats percentages only when present', () => {
        const p = mapProfile(makePayload({ beats: [
            { difficulty: 'Easy', percentage: 81.2 }, { difficulty: 'Medium', percentage: 74 }, { difficulty: 'Hard', percentage: null },
        ] }));
        expect(p.beats).toEqual({ easy: 81.2, medium: 74, hard: null });
        expect(mapProfile(makePayload()).beats).toBeNull();
        expect(mapProfile(makePayload({ beats: [] })).beats).toBeNull();
    });

    it('builds contest rows newest first, skipping unattended ones', () => {
        const p = mapProfile(makePayload({ contest: { contestParticipation: [
            { attended: true, rating: 1500, ranking: 900, problemsSolved: 2, totalProblems: 4, trendDirection: 'UP', contest: { title: 'Weekly 1', startTime: 100 } },
            { attended: false, rating: 1500, contest: { title: 'Weekly 2', startTime: 200 } },
            { attended: true, rating: 1480, ranking: 1200, problemsSolved: 1, totalProblems: 4, trendDirection: 'DOWN', contest: { title: 'Weekly 3', startTime: 300 } },
        ] } }));
        expect(p.contestInfo.rows.map(r => r.title)).toEqual(['Weekly 3', 'Weekly 1']);
        expect(p.contestInfo.rows[0]).toEqual({ title: 'Weekly 3', startTime: 300, rank: 1200, solved: 1, total: 4, rating: 1480, trend: 'down' });
    });

    it('lists recent accepted, borrowing language from the mixed recent list', () => {
        const p = mapProfile(makePayload({
            recent: { recentSubmissionList: [
                { title: 'Two Sum', titleSlug: 'two-sum', statusDisplay: 'Accepted', lang: 'java', timestamp: '50' },
                { title: 'LIS', titleSlug: 'lis', statusDisplay: 'Wrong Answer', lang: 'python3', timestamp: '40' },
            ] },
            acRecent: { submission: [
                { title: 'Two Sum', titleSlug: 'two-sum', timestamp: '50' },
                { title: 'Koko', titleSlug: 'koko', timestamp: '30' },
            ] },
        }));
        expect(p.recentAccepted).toEqual([
            { title: 'Two Sum', titleSlug: 'two-sum', timestamp: 50, lang: 'java' },
            { title: 'Koko', titleSlug: 'koko', timestamp: 30, lang: null },
        ]);
    });

    it('falls back to accepted entries of the recent list when acRecent is empty', () => {
        const p = mapProfile(makePayload());
        expect(p.recentAccepted).toEqual([{ title: 'Two Sum', titleSlug: null, timestamp: null, lang: null }]);
    });
});
