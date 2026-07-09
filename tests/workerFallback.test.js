import { describe, it, expect } from 'vitest';
import { mapWorkerResponse } from '../src/hooks/useLeetCode';

function workerPayload(overrides = {}) {
    return {
        username: 'tester',
        profile: { ranking: 4321, reputation: 7, starRating: 3 },
        acSubmissionNum: [
            { difficulty: 'Easy', count: 10 },
            { difficulty: 'Medium', count: 20 },
            { difficulty: 'Hard', count: 5 },
            { difficulty: 'All', count: 35 },
        ],
        tagProblemCounts: { advanced: [], intermediate: [], fundamental: [] },
        recentSubmissions: [{ title: 'Two Sum', statusDisplay: 'Accepted' }],
        totalQuestions: { all: 3200, easy: 800, medium: 1700, hard: 700 },
        calendar: { submissionCalendar: '{"100":2}', streak: 4, totalActiveDays: 12 },
        contest: { contestRating: 1600, contestAttend: 5, contestParticipation: [{ rating: 1500 }, { rating: 1600 }] },
        badges: { badgesCount: 1, badges: [{ displayName: 'Annual' }] },
        ...overrides,
    };
}

describe('mapWorkerResponse', () => {
    it('builds the canonical payload shape (same as the Alfa path)', () => {
        const json = mapWorkerResponse('tester', workerPayload());

        expect(json.profile.matchedUser.username).toBe('tester');
        expect(json.profile.matchedUser.submitStats.acSubmissionNum).toEqual([
            { difficulty: 'Easy', count: 10 },
            { difficulty: 'Medium', count: 20 },
            { difficulty: 'Hard', count: 5 },
            { difficulty: 'All', count: 35 },
        ]);
        expect(json.profile.matchedUser.profile.ranking).toBe(4321);
        expect(json.totalQuestions).toEqual({ all: 3200, easy: 800, medium: 1700, hard: 700 });
        expect(json.tags.matchedUser.tagProblemCounts).toBeDefined();
        expect(json.recent.recentSubmissionList).toHaveLength(1);
        expect(json.contest.contestRating).toBe(1600);
        expect(json.badges.badgesCount).toBe(1);
        expect(json.calendar.submissionCalendar).toBe('{"100":2}');
        expect(json.calendar.streak).toBe(4);
        expect(json._normalized.totalSolved).toBe(35);
    });

    it('throws No user found when question totals are empty', () => {
        expect(() => mapWorkerResponse('tester', workerPayload({ totalQuestions: {} })))
            .toThrow('No user found');
        expect(() => mapWorkerResponse('tester', null)).toThrow('No user found');
    });

    it('clamps solved counts against totals like the Alfa path', () => {
        const json = mapWorkerResponse('tester', workerPayload({
            acSubmissionNum: [{ difficulty: 'Easy', count: 99999 }],
        }));
        expect(json.profile.matchedUser.submitStats.acSubmissionNum[0].count).toBe(800);
    });

    it('computes hardRatio', () => {
        const json = mapWorkerResponse('tester', workerPayload());
        expect(json._normalized.hardRatio).toBe(((5 / 3200) * 100).toFixed(1));
    });

    it('defaults missing secondary sections to safe empties', () => {
        const json = mapWorkerResponse('tester', workerPayload({
            contest: undefined, badges: undefined, calendar: undefined, recentSubmissions: undefined,
        }));
        expect(json.contest).toEqual({});
        expect(json.badges).toEqual({});
        expect(json.recent.recentSubmissionList).toEqual([]);
        expect(json.calendar.submissionCalendar).toEqual({});
    });
});
