import { describe, it, expect } from 'vitest';
import { parseHandle } from '../src/utils/handle';

describe('parseHandle', () => {
    it('returns a plain handle trimmed', () => {
        expect(parseHandle('  cpcs ')).toBe('cpcs');
    });

    it('strips a leading @', () => {
        expect(parseHandle('@votrubac')).toBe('votrubac');
    });

    it('extracts the handle from profile URLs', () => {
        expect(parseHandle('https://leetcode.com/u/lee215/')).toBe('lee215');
        expect(parseHandle('leetcode.com/neal_wu')).toBe('neal_wu');
        expect(parseHandle('https://leetcode.cn/u/abc?tab=x')).toBe('abc');
    });

    it('handles empty and nullish input', () => {
        expect(parseHandle('')).toBe('');
        expect(parseHandle(null)).toBe('');
    });
});
