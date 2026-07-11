import { describe, it, expect } from 'vitest';
import { getSeasonPalette } from '../src/utils/season';

function paletteFor(month) {
    return getSeasonPalette(new Date(2026, month, 15));
}

describe('getSeasonPalette', () => {
    it.each([
        [11, 'winter'], [0, 'winter'], [1, 'winter'],
        [2, 'spring'], [3, 'spring'], [4, 'spring'],
        [5, 'summer'], [6, 'summer'], [7, 'summer'],
        [8, 'autumn'], [9, 'autumn'], [10, 'autumn'],
    ])('month=%i → %s', (month, name) => {
        expect(paletteFor(month).name).toBe(name);
    });

    it('returns bg, ambient, and 3 aurora colors', () => {
        const p = paletteFor(6);
        expect(typeof p.bg).toBe('string');
        expect(typeof p.ambient).toBe('string');
        expect(p.aurora).toHaveLength(3);
    });

    it('defaults to current date when none given', () => {
        expect(() => getSeasonPalette()).not.toThrow();
    });
});
