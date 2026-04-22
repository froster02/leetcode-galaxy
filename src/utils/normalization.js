/* Central data normalization helpers used before any UI render. */

function toNonNegativeInt(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.floor(n);
}

function clampCount(value, max) {
    return Math.min(toNonNegativeInt(value), toNonNegativeInt(max));
}

/**
 * Normalizes available-question totals so every field is valid and internally consistent.
 * Source of truth is per-difficulty availability from the same dataset.
 */
export function validateTotalQuestions(totalQuestions = {}) {
    const easy = toNonNegativeInt(totalQuestions.easy);
    const medium = toNonNegativeInt(totalQuestions.medium);
    const hard = toNonNegativeInt(totalQuestions.hard);
    const all = easy + medium + hard;

    return { all, easy, medium, hard };
}

/**
 * Normalizes solved stats and enforces:
 * easy + medium + hard = all and all <= totalQuestions.all.
 */
export function normalizeStats(stats = [], totalQuestions = { all: 0, easy: 0, medium: 0, hard: 0 }) {
    const counts = { Easy: 0, Medium: 0, Hard: 0 };

    for (const stat of stats) {
        const difficulty = stat?.difficulty;
        if (!counts.hasOwnProperty(difficulty)) continue;
        counts[difficulty] += toNonNegativeInt(stat?.count);
    }

    const easy = clampCount(counts.Easy, totalQuestions.easy);
    const medium = clampCount(counts.Medium, totalQuestions.medium);
    const hard = clampCount(counts.Hard, totalQuestions.hard);
    const all = Math.min(easy + medium + hard, toNonNegativeInt(totalQuestions.all));

    return { easy, medium, hard, all };
}

/**
 * Returns solved percentages by difficulty against available counts.
 */
export function fixPercentages(solved, totalQuestions) {
    const safePct = (count, total) => {
        const c = toNonNegativeInt(count);
        const t = toNonNegativeInt(total);
        if (t === 0) return 0;
        return Math.min((c / t) * 100, 100);
    };

    return {
        easyPct: safePct(solved.easy, totalQuestions.easy),
        mediumPct: safePct(solved.medium, totalQuestions.medium),
        hardPct: safePct(solved.hard, totalQuestions.hard),
        totalPct: safePct(solved.all, totalQuestions.all),
    };
}
