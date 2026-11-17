import { describe, it, expect } from 'vitest';
import { buildSummary, buildShareCaption, timeAgo, badgeIcon, langLabel, pct, linkedInShareUrl } from '../src/utils/profile';
import { buildYearGrid } from '../src/utils/calendar';

const DAY = 86400;
const NOW = new Date(Date.UTC(2026, 10, 18, 12)); // Wed 18 Nov 2026
const today = Math.floor(NOW.getTime() / 1000 / DAY) * DAY;

function profile(overrides = {}) {
    return {
        username: 'ada',
        stats: [
            { difficulty: 'Easy', count: 188 }, { difficulty: 'Medium', count: 193 },
            { difficulty: 'Hard', count: 31 }, { difficulty: 'All', count: 412 },
        ],
        totalQuestions: { all: 3612, easy: 902, medium: 1886, hard: 824 },
        profile: { ranking: 86310 },
        calendar: { submissionCalendar: JSON.stringify({ [today]: 2, [today - DAY]: 1, [today - 3 * DAY]: 4 }) },
        contestInfo: { rating: 1741.6, attended: 18, topPercentage: 14.23, history: [1500, 1741.6], topRating: null },
        ...overrides,
    };
}

describe('buildSummary', () => {
    it('derives counts, streaks and contest data', () => {
        const s = buildSummary(profile(), NOW);
        expect([s.easy, s.medium, s.hard, s.total]).toEqual([188, 193, 31, 412]);
        expect(s.currentStreak).toBe(2);
        expect(s.activeDays).toBe(3);
        expect(s.totalSubmissions).toBe(7);
        expect(s.ranking).toBe(86310);
        expect(s.contest).toMatchObject({ rating: 1742, peak: 1742, attended: 18, topPercentage: 14.23 });
    });

    it('never reports a peak below the current rating', () => {
        const s = buildSummary(profile({ contestInfo: { rating: 1742, attended: 2, history: [1500, 1738] } }), NOW);
        expect(s.contest.peak).toBe(1742);
    });

    it('has no contest block when the user never competed', () => {
        expect(buildSummary(profile({ contestInfo: { rating: null, attended: 0 } }), NOW).contest).toBeNull();
    });
});

describe('buildShareCaption', () => {
    it('writes a plain caption with the real numbers and no em dashes', () => {
        const c = buildShareCaption(buildSummary(profile(), NOW), 'https://example.test/u/ada');
        expect(c).toBe(
            '412 problems solved on LeetCode so far: 188 easy, 193 medium and 31 hard. '
            + 'Contest rating 1,742, top 14.2% after 18 contests.\n\n'
            + 'Full profile: https://example.test/u/ada\n\n#leetcode #dsa #problemsolving',
        );
        expect(c).not.toMatch(/[—–]/);
    });

    it('falls back to the streak and skips empty difficulties', () => {
        const s = buildSummary(profile({
            stats: [{ difficulty: 'Easy', count: 10 }, { difficulty: 'All', count: 10 }],
            contestInfo: {},
            calendar: { submissionCalendar: JSON.stringify(Object.fromEntries(Array.from({ length: 8 }, (_, i) => [today - i * DAY, 1]))) },
        }), NOW);
        expect(buildShareCaption(s)).toBe(
            '10 problems solved on LeetCode so far: 10 easy. Longest streak so far: 8 days in a row.\n\n#leetcode #dsa #problemsolving',
        );
    });

    it('builds the LinkedIn composer URL', () => {
        expect(linkedInShareUrl('a b&c')).toBe('https://www.linkedin.com/feed/?shareActive=true&text=a%20b%26c');
    });
});

describe('small formatters', () => {
    it('timeAgo', () => {
        const now = NOW.getTime();
        const t = now / 1000;
        expect(timeAgo(t - 10, now)).toBe('just now');
        expect(timeAgo(t - 300, now)).toBe('5m ago');
        expect(timeAgo(t - 3 * 3600, now)).toBe('3h ago');
        expect(timeAgo(t - 2 * DAY, now)).toBe('2d ago');
        expect(timeAgo(Date.UTC(2026, 2, 4) / 1000, now)).toBe('Mar 4');
        expect(timeAgo(null, now)).toBeNull();
    });

    it('badgeIcon only returns https URLs', () => {
        expect(badgeIcon('/static/b.png')).toBe('https://leetcode.com/static/b.png');
        expect(badgeIcon('https://x/b.png')).toBe('https://x/b.png');
        expect(badgeIcon('javascript:alert(1)')).toBeNull();
        expect(badgeIcon(undefined)).toBeNull();
    });

    it('langLabel and pct', () => {
        expect(langLabel('python3')).toBe('Python');
        expect(langLabel('Zig')).toBe('Zig');
        expect(langLabel(null)).toBeNull();
        expect(pct(14.23)).toBe('14.2');
        expect(pct(3)).toBe('3');
    });
});

describe('buildYearGrid', () => {
    it('ends on the current week, Sunday first, with future days marked', () => {
        const { cells, max } = buildYearGrid({ [today]: 4, [today - DAY]: 1, [today - 400 * DAY]: 9 }, NOW);
        expect(cells).toHaveLength(53 * 7);
        expect(new Date(cells[0].date).getUTCDay()).toBe(0);
        const idx = cells.findIndex(c => c.date === '2026-11-18');
        expect(cells[idx]).toEqual({ date: '2026-11-18', count: 4, level: 4 });
        expect(cells[idx - 1].level).toBe(2); // 1/4 of the busiest day
        expect(cells[idx + 1].level).toBe(-1);
        expect(max).toBe(4); // days before the grid don't count
    });

    it('is all zeros for an empty calendar', () => {
        const { cells, max } = buildYearGrid({}, NOW);
        expect(max).toBe(0);
        expect(cells.filter(c => c.level > 0)).toHaveLength(0);
    });
});
