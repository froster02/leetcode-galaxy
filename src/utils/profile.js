import { parseCalendar, calendarStats } from './calendar';
import { currentStreak, busiestMonth, busiestWeekday } from './activity';

/* Pure helpers for the single page profile (ProfilePage + share dialog). */

export const fmt = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-US') : '–');

/** 14.2 → "14.2", 3 → "3": one decimal at most, no trailing zero. */
export const pct = (n) => String(Math.round(Number(n) * 10) / 10);

const LANGS = {
    java: 'Java', python: 'Python', python3: 'Python', cpp: 'C++', c: 'C', csharp: 'C#',
    javascript: 'JavaScript', typescript: 'TypeScript', golang: 'Go', go: 'Go', kotlin: 'Kotlin',
    swift: 'Swift', rust: 'Rust', ruby: 'Ruby', scala: 'Scala', php: 'PHP', dart: 'Dart',
    mysql: 'MySQL', mssql: 'MS SQL', oraclesql: 'Oracle SQL', postgresql: 'PostgreSQL', bash: 'Bash',
    pythondata: 'Pandas', elixir: 'Elixir', erlang: 'Erlang', racket: 'Racket',
};
export const langLabel = (lang) => (lang ? LANGS[String(lang).toLowerCase()] || lang : null);

/** Unix seconds → "just now", "5m ago", "3h ago", "2d ago", or "Mar 4" after 30 days. */
export function timeAgo(ts, now = Date.now()) {
    const t = Number(ts);
    if (!Number.isFinite(t) || t <= 0) return null;
    const s = Math.max(0, Math.floor(now / 1000 - t));
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 30 * 86400) return `${Math.floor(s / 86400)}d ago`;
    return new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** LeetCode badge icons are sometimes site-relative paths. */
export function badgeIcon(icon) {
    if (typeof icon !== 'string' || !icon) return null;
    if (icon.startsWith('https://')) return icon;
    if (icon.startsWith('/')) return `https://leetcode.com${icon}`;
    return null;
}

/** Everything the page derives once from a mapProfile() result. */
export function buildSummary(p, now = new Date()) {
    const count = (d) => p?.stats?.find(s => s.difficulty === d)?.count || 0;
    const easy = count('Easy'), medium = count('Medium'), hard = count('Hard');
    const total = count('All') || easy + medium + hard;

    const map = parseCalendar(p?.calendar);
    const { activeDays, maxStreak, totalSubmissions } = calendarStats(map);

    const c = p?.contestInfo || {};
    const hasContest = Number(c.rating) > 0 && c.attended > 0;
    // The current rating counts too: history can lag one contest behind it
    const peak = Math.max(Number(c.topRating) || 0, ...(c.history || []), Number(c.rating) || 0) || null;

    return {
        username: p?.username,
        easy, medium, hard, total,
        totals: p?.totalQuestions || { all: 0, easy: 0, medium: 0, hard: 0 },
        calendarMap: map,
        activeDays, maxStreak, totalSubmissions,
        currentStreak: currentStreak(map, now),
        busiestMonth: busiestMonth(map, now),
        busiestWeekday: busiestWeekday(map),
        ranking: p?.profile?.ranking || null,
        contest: hasContest ? {
            rating: Math.round(c.rating),
            peak: peak ? Math.round(peak) : null,
            attended: c.attended,
            topPercentage: c.topPercentage ?? null,
            ranking: c.ranking ?? null,
            totalParticipants: c.totalParticipants ?? null,
        } : null,
    };
}

/** Default LinkedIn caption: plain, first person, only numbers we actually have. */
export function buildShareCaption(s, url) {
    const lines = [];
    const split = [
        s.easy ? `${fmt(s.easy)} easy` : null,
        s.medium ? `${fmt(s.medium)} medium` : null,
        s.hard ? `${fmt(s.hard)} hard` : null,
    ].filter(Boolean);
    const splitText = split.length > 1
        ? `${split.slice(0, -1).join(', ')} and ${split[split.length - 1]}`
        : split[0];
    lines.push(`${fmt(s.total)} problems solved on LeetCode so far${splitText ? `: ${splitText}` : ''}.`);

    if (s.contest) {
        const top = s.contest.topPercentage != null ? `, top ${pct(s.contest.topPercentage)}%` : '';
        const n = s.contest.attended;
        lines.push(`Contest rating ${fmt(s.contest.rating)}${top} after ${fmt(n)} contest${n === 1 ? '' : 's'}.`);
    } else if (s.maxStreak >= 7) {
        lines.push(`Longest streak so far: ${fmt(s.maxStreak)} days in a row.`);
    }

    const out = [lines.join(' ')];
    if (url) out.push(`Full profile: ${url}`);
    out.push('#leetcode #dsa #problemsolving');
    return out.join('\n\n');
}

/** LinkedIn composer with the caption prefilled. */
export function linkedInShareUrl(caption) {
    return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(caption)}`;
}
