import { describe, it, expect } from 'vitest';
import { generateRoast } from '../src/utils/roast';

describe('generateRoast', () => {
    it('handles zero problems solved', () => {
        expect(generateRoast({ total: 0 })).toMatch(/Zero problems/);
    });

    it('roasts high volume with zero hard problems', () => {
        expect(generateRoast({ total: 250, hard: 0 })).toMatch(/zero hard/);
    });

    it('roasts zero streak with high volume', () => {
        expect(generateRoast({ total: 150, hard: 5, streak: 0 })).toMatch(/streak: a rumor/);
    });

    it('roasts easy-only solvers', () => {
        expect(generateRoast({ easy: 10, med: 0, hard: 0, total: 10, streak: 1 })).toMatch(/Easy-only/);
    });

    it('praises elite hard-solve counts', () => {
        expect(generateRoast({ hard: 400, total: 1200, streak: 5, winRate: 80, attended: 10, badgesCount: 3 })).toMatch(/Hard problems solved/);
    });

    it('falls back to a neutral line for solid-but-unremarkable stats', () => {
        expect(generateRoast({ easy: 50, med: 50, hard: 20, total: 120, streak: 3, winRate: 70, attended: 5, badgesCount: 2 })).toBe('Solid numbers. Nothing to roast here — annoyingly.');
    });

    it('is a pure function — same input, same output', () => {
        const input = { easy: 10, med: 20, hard: 5, total: 35, winRate: 60, streak: 2 };
        expect(generateRoast(input)).toBe(generateRoast({ ...input }));
    });

    it('handles missing/undefined input without throwing', () => {
        expect(() => generateRoast()).not.toThrow();
        expect(() => generateRoast({})).not.toThrow();
    });
});
