/* Shared submission-calendar helpers. */

/** Returns the raw { unixTs: count } map from a calendar payload; {} if absent/malformed. */
export function parseCalendar(cal) {
    if (!cal?.submissionCalendar) return {};
    let raw = cal.submissionCalendar;
    if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return {}; } }
    return raw;
}

/** Active days, longest consecutive-day streak, and total submissions from a raw calendar map. */
export function calendarStats(rawMap) {
    const activeDays = Object.keys(rawMap).length;
    const timestamps = Object.keys(rawMap).map(Number).sort();
    let maxStreak = 0, cur = 0, prev = null;
    for (const ts of timestamps) {
        const day = Math.floor(ts / 86400);
        if (day === prev) continue;
        cur = (prev !== null && day - prev === 1) ? cur + 1 : 1;
        maxStreak = Math.max(maxStreak, cur);
        prev = day;
    }
    const totalSubmissions = Object.values(rawMap).reduce((s, v) => s + Number(v), 0);
    return { activeDays, maxStreak, totalSubmissions };
}

const DAY = 86400;

/**
 * GitHub-style year grid: `weeks` columns × 7 rows (Sunday first), ending with
 * the week that contains `now`. Days are UTC, like the LeetCode calendar keys.
 * level: -1 = after today, 0 = no submissions, 1–4 = share of the busiest day.
 */
export function buildYearGrid(rawMap, now = new Date(), weeks = 53) {
    const counts = {};
    for (const [ts, n] of Object.entries(rawMap || {})) {
        const t = Number(ts), c = Number(n);
        if (!Number.isFinite(t) || !Number.isFinite(c) || c <= 0) continue;
        const day = Math.floor(t / DAY);
        counts[day] = (counts[day] || 0) + c;
    }
    const today = Math.floor(now.getTime() / 1000 / DAY);
    const todayDow = new Date(today * DAY * 1000).getUTCDay();
    const start = today - todayDow - (weeks - 1) * 7;

    let max = 0;
    for (let d = start; d <= today; d++) max = Math.max(max, counts[d] || 0);

    const cells = Array.from({ length: weeks * 7 }, (_, i) => {
        const day = start + i;
        const date = new Date(day * DAY * 1000).toISOString().slice(0, 10);
        if (day > today) return { date, count: 0, level: -1 };
        const count = counts[day] || 0;
        const t = max ? count / max : 0;
        const level = count === 0 ? 0 : t < 0.25 ? 1 : t < 0.5 ? 2 : t < 0.75 ? 3 : 4;
        return { date, count, level };
    });
    return { cells, max };
}
