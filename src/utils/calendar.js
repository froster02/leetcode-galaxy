/* Shared submission-calendar helpers (used by ShareCard and CityScene). */

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
