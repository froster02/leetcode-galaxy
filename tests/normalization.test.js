import { describe, it, expect } from 'vitest';
import { validateTotalQuestions, normalizeStats, fixPercentages } from '../src/utils/normalization';

describe('validateTotalQuestions', () => {
    it('sums per-difficulty counts into all', () => {
        expect(validateTotalQuestions({ easy: 800, medium: 1700, hard: 700 }))
            .toEqual({ all: 3200, easy: 800, medium: 1700, hard: 700 });
    });

    it('zeroes missing, negative, and non-numeric fields', () => {
        expect(validateTotalQuestions({})).toEqual({ all: 0, easy: 0, medium: 0, hard: 0 });
        expect(validateTotalQuestions({ easy: -5, medium: 'x', hard: NaN }))
            .toEqual({ all: 0, easy: 0, medium: 0, hard: 0 });
    });

    it('floors fractional counts', () => {
        expect(validateTotalQuestions({ easy: 1.9, medium: 2.1, hard: 0 }).easy).toBe(1);
    });
});

describe('normalizeStats', () => {
    const totals = { all: 100, easy: 40, medium: 40, hard: 20 };

    it('maps difficulty entries to counts', () => {
        const stats = [
            { difficulty: 'Easy', count: 10 },
            { difficulty: 'Medium', count: 20 },
            { difficulty: 'Hard', count: 5 },
        ];
        expect(normalizeStats(stats, totals)).toEqual({ easy: 10, medium: 20, hard: 5, all: 35 });
    });

    it('clamps counts to available totals', () => {
        const stats = [{ difficulty: 'Easy', count: 999 }];
        expect(normalizeStats(stats, totals).easy).toBe(40);
    });

    it('ignores unknown difficulties and prototype keys', () => {
        const stats = [
            { difficulty: 'Extreme', count: 50 },
            { difficulty: 'toString', count: 50 },
            { difficulty: 'Hard', count: 3 },
        ];
        expect(normalizeStats(stats, totals)).toEqual({ easy: 0, medium: 0, hard: 3, all: 3 });
    });

    it('treats negative and missing counts as zero', () => {
        const stats = [{ difficulty: 'Easy', count: -10 }, { difficulty: 'Medium' }];
        expect(normalizeStats(stats, totals)).toEqual({ easy: 0, medium: 0, hard: 0, all: 0 });
    });

    it('handles empty input', () => {
        expect(normalizeStats([], totals)).toEqual({ easy: 0, medium: 0, hard: 0, all: 0 });
        expect(normalizeStats(undefined, totals)).toEqual({ easy: 0, medium: 0, hard: 0, all: 0 });
    });
});

describe('fixPercentages', () => {
    it('computes percentages against available counts', () => {
        const pct = fixPercentages({ easy: 20, medium: 10, hard: 5, all: 35 }, { easy: 40, medium: 40, hard: 20, all: 100 });
        expect(pct.easyPct).toBe(50);
        expect(pct.mediumPct).toBe(25);
        expect(pct.hardPct).toBe(25);
        expect(pct.totalPct).toBe(35);
    });

    it('returns 0 when totals are zero (no divide-by-zero)', () => {
        const pct = fixPercentages({ easy: 5, medium: 5, hard: 5, all: 15 }, { easy: 0, medium: 0, hard: 0, all: 0 });
        expect(pct).toEqual({ easyPct: 0, mediumPct: 0, hardPct: 0, totalPct: 0 });
    });

    it('caps at 100', () => {
        const pct = fixPercentages({ easy: 50, medium: 0, hard: 0, all: 50 }, { easy: 10, medium: 10, hard: 10, all: 30 });
        expect(pct.easyPct).toBe(100);
    });
});
