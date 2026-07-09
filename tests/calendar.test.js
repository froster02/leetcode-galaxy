import { describe, it, expect } from 'vitest';
import { parseCalendar, calendarStats } from '../src/utils/calendar';

const DAY = 86400;

describe('parseCalendar', () => {
    it('returns object payloads as-is', () => {
        const map = { '1700000000': 3 };
        expect(parseCalendar({ submissionCalendar: map })).toBe(map);
    });

    it('parses JSON-string payloads', () => {
        expect(parseCalendar({ submissionCalendar: '{"100":2}' })).toEqual({ 100: 2 });
    });

    it('returns {} for missing or malformed input', () => {
        expect(parseCalendar(null)).toEqual({});
        expect(parseCalendar({})).toEqual({});
        expect(parseCalendar({ submissionCalendar: 'not json' })).toEqual({});
    });
});

describe('calendarStats', () => {
    it('empty map → all zeroes', () => {
        expect(calendarStats({})).toEqual({ activeDays: 0, maxStreak: 0, totalSubmissions: 0 });
    });

    it('single day → streak of 1', () => {
        const stats = calendarStats({ [String(100 * DAY)]: 5 });
        expect(stats).toEqual({ activeDays: 1, maxStreak: 1, totalSubmissions: 5 });
    });

    it('consecutive days count as one streak', () => {
        const map = {
            [String(100 * DAY)]: 1,
            [String(101 * DAY)]: 2,
            [String(102 * DAY)]: 3,
        };
        expect(calendarStats(map).maxStreak).toBe(3);
    });

    it('a gap breaks the streak', () => {
        const map = {
            [String(100 * DAY)]: 1,
            [String(101 * DAY)]: 1,
            [String(105 * DAY)]: 1, // gap
            [String(106 * DAY)]: 1,
            [String(107 * DAY)]: 1,
            [String(108 * DAY)]: 1,
        };
        const stats = calendarStats(map);
        expect(stats.maxStreak).toBe(4);
        expect(stats.activeDays).toBe(6);
        expect(stats.totalSubmissions).toBe(6);
    });

    it('multiple timestamps on the same day count once for streaks', () => {
        const map = {
            [String(100 * DAY)]: 1,
            [String(100 * DAY + 3600)]: 2, // same day, later hour
            [String(101 * DAY)]: 1,
        };
        const stats = calendarStats(map);
        expect(stats.maxStreak).toBe(2);
        expect(stats.totalSubmissions).toBe(4);
    });
});
