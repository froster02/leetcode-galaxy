import { describe, it, expect } from 'vitest';
import { calcPower, getFighterClass, getPowerTier, CODERS } from '../src/utils/gameData';

describe('calcPower', () => {
    it('weights easy x1, medium x3, hard x10', () => {
        expect(calcPower(1, 1, 1)).toBe(14);
        expect(calcPower(100, 50, 10)).toBe(100 + 150 + 100);
        expect(calcPower(0, 0, 0)).toBe(0);
    });
});

describe('getFighterClass thresholds', () => {
    it.each([
        [500, 'LEGEND'],
        [499, 'CHAMPION'],
        [300, 'CHAMPION'],
        [299, 'ELITE'],
        [150, 'ELITE'],
        [149, 'WARRIOR'],
        [50, 'WARRIOR'],
        [49, 'RECRUIT'],
        [10, 'RECRUIT'],
        [9, 'NOVICE'],
        [0, 'NOVICE'],
    ])('hard=%i → %s', (hard, label) => {
        expect(getFighterClass(hard).label).toBe(label);
    });
});

describe('getPowerTier thresholds', () => {
    it.each([
        [5000, 'HAIL MARY HERO'],
        [4999, 'ENDURANCE CAPTAIN'],
        [3000, 'ENDURANCE CAPTAIN'],
        [2999, 'RANGER PILOT'],
        [1500, 'RANGER PILOT'],
        [1499, 'LAZARUS CREW'],
        [800, 'LAZARUS CREW'],
        [799, 'SPACE CADET'],
        [300, 'SPACE CADET'],
        [299, 'EXPLORER'],
        [0, 'EXPLORER'],
    ])('power=%i → %s', (power, name) => {
        expect(getPowerTier(power).name).toBe(name);
    });

    it('tier min/max brackets contain the power that selected them', () => {
        for (const p of [0, 300, 800, 1500, 3000, 5000, 7999]) {
            const tier = getPowerTier(p);
            expect(p).toBeGreaterThanOrEqual(tier.min);
        }
    });
});

describe('CODERS legend dataset', () => {
    it('every entry is flagged simulated', () => {
        expect(CODERS.length).toBeGreaterThan(0);
        for (const c of CODERS) expect(c.sim).toBe(true);
    });

    it('every entry has non-negative counts and a username', () => {
        for (const c of CODERS) {
            expect(typeof c.u).toBe('string');
            expect(c.easy).toBeGreaterThanOrEqual(0);
            expect(c.med).toBeGreaterThanOrEqual(0);
            expect(c.hard).toBeGreaterThanOrEqual(0);
        }
    });
});
