import { parseCalendar, calendarStats } from './calendar';
import { calcPower, getPowerTier } from './gameData';
import { generateRoast } from './roast';

/* Pure stat derivations for the Wrapped story. LeetCode calendar keys are
   unix seconds at UTC midnight, so every bucket here is computed in UTC. */

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

const ALGO_TOPICS = new Set([
    'Dynamic Programming', 'Graph', 'Greedy', 'Backtracking', 'Tree', 'Binary Tree',
    'Depth-First Search', 'Breadth-First Search', 'Binary Search', 'Heap (Priority Queue)',
    'Union Find', 'Trie', 'Topological Sort', 'Segment Tree', 'Shortest Path', 'Bit Manipulation',
    'Divide and Conquer', 'Monotonic Stack', 'Recursion', 'Memoization',
]);

const ARCHETYPES = {
    HD: { title: 'The Relentless Climber', blurb: 'Hard problems, every single day. You don’t take rest days — rest days take you.' },
    HB: { title: 'The Boss Hunter', blurb: 'You vanish, then return to slay a Hard. Quality over quantity.' },
    CD: { title: 'The Steady Builder', blurb: 'Small wins, stacked daily. Compound interest, but for algorithms.' },
    CB: { title: 'The Sprinter', blurb: 'Bursts of genius, then silence. You code in seasons.' },
};

/**
 * Deterministic 4-letter coder archetype.
 * H/C  — Hard-hunter (≥12% Hard) vs Comfort zone
 * D/B  — Daily streaker (21+ day streak or 120+ active days) vs Burst solver
 * W/N  — Weekend warrior (>36% of submissions on Sat/Sun) vs Nine-to-five weekdays
 * A/F  — top topic is an Algorithms topic vs Fundamentals
 */
export function personality({ easy = 0, med = 0, hard = 0, weekdays = [0, 0, 0, 0, 0, 0, 0], maxStreak = 0, activeDays = 0, topTopic = null } = {}) {
    const total = easy + med + hard;
    const c = total > 0 && hard / total >= 0.12 ? 'H' : 'C';
    const r = maxStreak >= 21 || activeDays >= 120 ? 'D' : 'B';
    const subs = weekdays.reduce((s, n) => s + n, 0);
    const w = subs > 0 && (weekdays[0] + weekdays[6]) / subs > 0.36 ? 'W' : 'N';
    const f = topTopic && ALGO_TOPICS.has(topTopic) ? 'A' : 'F';
    const base = ARCHETYPES[c + r];
    const when = w === 'W' ? 'Weekends are your arena' : 'Weekdays are your arena';
    const focus = topTopic ? `, and ${topTopic} is home turf.` : '.';
    return { code: c + r + w + f, title: base.title, blurb: base.blurb, detail: when + focus };
}

/** Everything the story slides render, derived once from a mapProfile() result. */
export function buildWrapped(data, now = new Date()) {
    if (!data) return null;
    const count = d => data.stats?.find(s => s.difficulty === d)?.count || 0;
    const easy = count('Easy'), med = count('Medium'), hard = count('Hard');
    const total = count('All') || easy + med + hard;

    const map = parseCalendar(data.calendar);
    const { activeDays, maxStreak, totalSubmissions } = calendarStats(map);
    const weekdays = weekdayTotals(map);
    const topics = (data.districts || []).map(d => ({ name: d.name, solved: d.problemsSolved }));
    const topTopic = topics[0]?.name || null;

    const recent = data.recent || [];
    const accepted = recent.filter(r => r.statusDisplay === 'Accepted').length;
    // No recent submissions means "unknown", not "0% accepted" — stay neutral for the roast
    const winRate = recent.length ? Math.round((accepted / recent.length) * 100) : 100;
    const streak = currentStreak(map, now);
    const power = calcPower(easy, med, hard);

    const contest = data.contestInfo || {};
    const hasContest = Boolean(contest.rating) && contest.attended > 0;

    return {
        username: data.username,
        total, easy, med, hard,
        totalAvailable: data.totalQuestions?.all || 0,
        topics, topTopic,
        months: monthlyTotals(map, now),
        busiestMonth: busiestMonth(map, now),
        busiestWeekday: busiestWeekday(map),
        weekdays,
        currentStreak: streak,
        maxStreak, activeDays, totalSubmissions,
        contest: hasContest ? {
            rating: Math.round(contest.rating),
            topRating: contest.topRating ? Math.round(contest.topRating) : null,
            attended: contest.attended,
            topPercentage: contest.topPercentage,
        } : null,
        power,
        tier: getPowerTier(power),
        ranking: data.profile?.ranking || null,
        personality: personality({ easy, med, hard, weekdays, maxStreak, activeDays, topTopic }),
        roast: generateRoast({
            easy, med, hard, total, winRate, streak,
            badgesCount: data.badgesInfo?.total || 0,
            attended: contest.attended || 0,
        }),
    };
}
