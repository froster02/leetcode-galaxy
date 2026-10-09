import { describe, it, expect } from 'vitest';
import {
    monthlyTotals, busiestMonth, weekdayTotals, busiestWeekday,
    currentStreak, personality, buildWrapped,
} from '../src/utils/wrapped';

const DAY = 86400;
const ts = (iso) => String(Date.parse(iso + 'T00:00:00Z') / 1000);
const NOW = new Date('2026-03-15T12:00:00Z');

describe('monthlyTotals', () => {
    it('returns 12 months ending with the current month, oldest first', () => {
        const months = monthlyTotals({}, NOW);
        expect(months).toHaveLength(12);
        expect(months[0]).toMatchObject({ year: 2025, month: 3, label: 'Apr' });
        expect(months[11]).toMatchObject({ year: 2026, month: 2, label: 'Mar' });
    });

    it('buckets counts by UTC month and ignores out-of-window days', () => {
        const map = { [ts('2026-01-05')]: 3, [ts('2026-01-20')]: 2, [ts('2025-12-31')]: 4, [ts('2024-01-01')]: 99 };
        const months = monthlyTotals(map, NOW);
        expect(months.find(m => m.label === 'Jan').count).toBe(5);
        expect(months.find(m => m.label === 'Dec').count).toBe(4);
        expect(months.reduce((s, m) => s + m.count, 0)).toBe(9);
    });
});

describe('busiestMonth', () => {
    it('picks the month with most submissions', () => {
        const map = { [ts('2026-01-05')]: 3, [ts('2026-02-05')]: 7 };
        expect(busiestMonth(map, NOW)).toMatchObject({ name: 'February', count: 7 });
    });

    it('is null with no activity', () => {
        expect(busiestMonth({}, NOW)).toBeNull();
    });
});

describe('weekday stats', () => {
    it('counts by UTC weekday, Sunday first', () => {
        // 2026-03-15 is a Sunday, 2026-03-16 a Monday
        const map = { [ts('2026-03-15')]: 2, [ts('2026-03-16')]: 5, [ts('2026-03-23')]: 1 };
        expect(weekdayTotals(map)).toEqual([2, 6, 0, 0, 0, 0, 0]);
        expect(busiestWeekday(map)).toEqual({ index: 1, name: 'Monday', count: 6 });
    });

    it('busiestWeekday is null with no activity', () => {
        expect(busiestWeekday({})).toBeNull();
    });
});

describe('currentStreak', () => {
    it('counts consecutive days ending today', () => {
        const map = { [ts('2026-03-13')]: 1, [ts('2026-03-14')]: 1, [ts('2026-03-15')]: 1 };
        expect(currentStreak(map, NOW)).toBe(3);
    });

    it('still counts when today has no submission yet', () => {
        const map = { [ts('2026-03-13')]: 1, [ts('2026-03-14')]: 1 };
        expect(currentStreak(map, NOW)).toBe(2);
    });

    it('is 0 once a full day is missed', () => {
        expect(currentStreak({ [ts('2026-03-12')]: 1 }, NOW)).toBe(0);
    });

    it('ignores zero-count days', () => {
        expect(currentStreak({ [ts('2026-03-15')]: 0 }, NOW)).toBe(0);
    });
});

describe('personality', () => {
    it('Hard-hunting daily weekend algorithm solver is HDWA', () => {
        const p = personality({
            easy: 100, med: 200, hard: 100, maxStreak: 40, activeDays: 50,
            weekdays: [50, 10, 10, 10, 10, 10, 50], topTopic: 'Dynamic Programming',
        });
        expect(p.code).toBe('HDWA');
        expect(p.title).toBe('The Relentless Climber');
    });

    it('comfort-zone burst weekday fundamentals solver is CBNF', () => {
        const p = personality({
            easy: 200, med: 50, hard: 5, maxStreak: 3, activeDays: 20,
            weekdays: [0, 10, 10, 10, 10, 10, 0], topTopic: 'Array',
        });
        expect(p.code).toBe('CBNF');
        expect(p.title).toBe('The Sprinter');
    });

    it('handles empty input', () => {
        expect(personality().code).toBe('CBNF');
    });

    it('120+ active days counts as daily even without a long streak', () => {
        expect(personality({ activeDays: 120 }).code[1]).toBe('D');
    });
});

describe('buildWrapped', () => {
    const data = {
        username: 'alice',
        stats: [
            { difficulty: 'Easy', count: 100 }, { difficulty: 'Medium', count: 150 },
            { difficulty: 'Hard', count: 50 }, { difficulty: 'All', count: 300 },
        ],
        districts: [{ name: 'Graph', problemsSolved: 80 }, { name: 'Array', problemsSolved: 60 }],
        recent: [{ statusDisplay: 'Accepted' }, { statusDisplay: 'Wrong Answer' }],
        contestInfo: { rating: 1834.6, topRating: 1900.2, attended: 12, topPercentage: 8.5 },
        badgesInfo: { total: 2 },
        totalQuestions: { all: 3500 },
        calendar: { submissionCalendar: JSON.stringify({ [ts('2026-03-14')]: 4, [ts('2026-03-15')]: 2 }) },
        profile: { ranking: 12345 },
    };

    it('derives the slide model', () => {
        const w = buildWrapped(data, NOW);
        expect(w).toMatchObject({
            username: 'alice', total: 300, easy: 100, med: 150, hard: 50,
            topTopic: 'Graph', currentStreak: 2, maxStreak: 2, totalSubmissions: 6,
            power: 100 + 450 + 500, ranking: 12345,
        });
        expect(w.contest).toEqual({ rating: 1835, topRating: 1900, attended: 12, topPercentage: 8.5 });
        expect(w.personality.code).toMatch(/^[HC][DB][WN][AF]$/);
        expect(typeof w.roast).toBe('string');
    });

    it('drops contest when the user never competed', () => {
        expect(buildWrapped({ ...data, contestInfo: { attended: 0 } }, NOW).contest).toBeNull();
    });

    it('returns null without data', () => {
        expect(buildWrapped(null)).toBeNull();
    });

    it('falls back to summed difficulties when All is missing', () => {
        const w = buildWrapped({ ...data, stats: data.stats.slice(0, 3) }, NOW);
        expect(w.total).toBe(300);
    });
});
