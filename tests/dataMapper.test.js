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
