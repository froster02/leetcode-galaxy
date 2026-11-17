/* Pure activity stats from the submission calendar. LeetCode calendar keys
   are unix seconds at UTC midnight, so every bucket here is computed in UTC. */

const DAY = 86400;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function entries(map) {
    return Object.entries(map || {})
        .map(([ts, n]) => [Number(ts), Number(n)])
        .filter(([ts, n]) => Number.isFinite(ts) && Number.isFinite(n) && n > 0);
}

/** Submission counts for the 12 calendar months ending with `now`'s month, oldest first. */
export function monthlyTotals(map, now = new Date()) {
    const endY = now.getUTCFullYear();
    const endM = now.getUTCMonth();
    const buckets = Array.from({ length: 12 }, (_, i) => {
        const offset = 11 - i;
        const y = endY - (offset > endM ? 1 : 0);
        const m = (endM - offset + 12) % 12;
        return { year: y, month: m, label: MONTHS[m], name: MONTHS_LONG[m], count: 0 };
    });
    for (const [ts, n] of entries(map)) {
        const d = new Date(ts * 1000);
        const b = buckets.find(x => x.year === d.getUTCFullYear() && x.month === d.getUTCMonth());
        if (b) b.count += n;
    }
    return buckets;
}

/** The month with the most submissions in the trailing 12, or null if there were none. */
export function busiestMonth(map, now = new Date()) {
    const months = monthlyTotals(map, now);
    const best = months.reduce((a, b) => (b.count > a.count ? b : a), months[0]);
    return best.count > 0 ? best : null;
}

/** Submission counts per weekday, Sunday first. */
export function weekdayTotals(map) {
    const out = [0, 0, 0, 0, 0, 0, 0];
    for (const [ts, n] of entries(map)) out[new Date(ts * 1000).getUTCDay()] += n;
    return out;
}

export function busiestWeekday(map) {
    const totals = weekdayTotals(map);
    let index = 0;
    for (let i = 1; i < 7; i++) if (totals[i] > totals[index]) index = i;
    return totals[index] > 0 ? { index, name: WEEKDAYS[index], count: totals[index] } : null;
}

/** Consecutive active days ending today or yesterday (today may not be over yet). */
export function currentStreak(map, now = new Date()) {
    const days = new Set(entries(map).map(([ts]) => Math.floor(ts / DAY)));
    let day = Math.floor(now.getTime() / 1000 / DAY);
    if (!days.has(day)) day -= 1;
    let streak = 0;
    while (days.has(day)) { streak++; day--; }
    return streak;
}
