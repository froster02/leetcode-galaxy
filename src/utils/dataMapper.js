import { normalizeStats, validateTotalQuestions, fixPercentages } from './normalization';

const num = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};
const text = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
// Profile links come from user-written LeetCode fields: only plain http(s) URLs get through
const safeUrl = (v) => (typeof v === 'string' && /^https?:\/\/\S+$/i.test(v.trim()) ? v.trim() : null);

function mapIdentity(raw) {
    const r = raw || {};
    const links = [];
    const add = (label, url) => {
        const safe = safeUrl(url);
        if (safe && !links.some(l => l.url === safe)) links.push({ label, url: safe });
    };
    add('GitHub', r.gitHub ?? r.githubUrl);
    add('LinkedIn', r.linkedIN ?? r.linkedinUrl);
    add('X', r.twitter ?? r.twitterUrl);
    const sites = Array.isArray(r.website) ? r.website : Array.isArray(r.websites) ? r.websites : [];
    sites.forEach(u => add('Website', u));

    const avatar = safeUrl(r.avatar ?? r.userAvatar);
    return {
        name: text(r.name ?? r.realName),
        // LeetCode's placeholder avatar adds nothing over initials
        avatar: avatar && !/default_avatar/i.test(avatar) ? avatar : null,
        country: text(r.country ?? r.countryName),
        company: text(r.company),
        school: text(r.school),
        about: text(r.about ?? r.aboutMe),
        links,
    };
}

function mapSkills(tags) {
    const tier = (list) => (Array.isArray(list) ? list : [])
        .map(t => ({ name: t.tagName, slug: t.tagSlug, solved: num(t.problemsSolved) || 0 }))
        .filter(t => t.name && t.solved > 0)
        .sort((a, b) => b.solved - a.solved);
    return {
        advanced: tier(tags.advanced),
        intermediate: tier(tags.intermediate),
        fundamental: tier(tags.fundamental),
    };
}

function mapLanguages(raw) {
    const list = raw?.languageProblemCount
        || raw?.matchedUser?.languageProblemCount
        || raw?.data?.matchedUser?.languageProblemCount
        || [];
    return (Array.isArray(list) ? list : [])
        .map(l => ({ name: l.languageName, solved: num(l.problemsSolved) || 0 }))
        .filter(l => l.name && l.solved > 0)
        .sort((a, b) => b.solved - a.solved);
}

function mapAcceptance(totals) {
    const all = (list) => (Array.isArray(list) ? list : []).find(x => x?.difficulty === 'All');
    const ac = num(all(totals?.ac)?.submissions);
    const total = num(all(totals?.total)?.submissions);
    if (ac === null || !total) return null;
    return { rate: Math.round((ac / total) * 1000) / 10, submissions: total };
}

function mapBeats(raw) {
    if (!Array.isArray(raw)) return null;
    const pick = (d) => num(raw.find(x => x?.difficulty === d)?.percentage);
    const beats = { easy: pick('Easy'), medium: pick('Medium'), hard: pick('Hard') };
    return Object.values(beats).some(v => v !== null) ? beats : null;
}

function mapContestRows(participation) {
    return (Array.isArray(participation) ? participation : [])
        .filter(p => p && p.attended !== false && p.contest?.title)
        .map(p => ({
            title: p.contest.title,
            startTime: num(p.contest.startTime),
            rank: num(p.ranking),
            solved: num(p.problemsSolved),
            total: num(p.totalProblems),
            rating: num(p.rating),
            trend: p.trendDirection === 'UP' ? 'up' : p.trendDirection === 'DOWN' ? 'down' : null,
        }))
        .reverse(); // API order is oldest first; the table shows newest first
}

function mapRecentAccepted(acRaw, recent) {
    // Alfa's /acSubmission has no language; borrow it from the mixed recent list
    const langBySlug = {};
    recent.forEach(r => { if (r?.titleSlug && r.lang) langBySlug[r.titleSlug] ??= r.lang; });

    const list = acRaw?.submission || acRaw?.submissions || (Array.isArray(acRaw) ? acRaw : null);
    const source = Array.isArray(list) && list.length
        ? list
        : recent.filter(r => r?.statusDisplay === 'Accepted');
    return source
        .filter(s => s?.title)
        .map(s => ({
            title: s.title,
            titleSlug: s.titleSlug || null,
            timestamp: num(s.timestamp),
            lang: s.lang || langBySlug[s.titleSlug] || null,
        }));
}

export function mapProfile(data) {
    if (!data || !data.profile?.matchedUser) return null;

    const user = data.profile.matchedUser;
    const tags = data.tags?.matchedUser?.tagProblemCounts || { advanced: [], intermediate: [], fundamental: [] };
    const recent = data.recent?.recentSubmissionList || [];

    const totalQuestions = validateTotalQuestions(data.totalQuestions || {});
    const solved = normalizeStats(user.submitStats?.acSubmissionNum || [], totalQuestions);
    const percentages = fixPercentages(solved, totalQuestions);

    const stats = [
        { difficulty: 'Easy', count: solved.easy, percentage: percentages.easyPct },
        { difficulty: 'Medium', count: solved.medium, percentage: percentages.mediumPct },
        { difficulty: 'Hard', count: solved.hard, percentage: percentages.hardPct },
        { difficulty: 'All', count: solved.all, percentage: percentages.totalPct },
    ];

    // Flatten and sort tags by problems solved
    const allTags = [
        ...(tags.advanced || []),
        ...(tags.intermediate || []),
        ...(tags.fundamental || [])
    ].sort((a, b) => b.problemsSolved - a.problemsSolved);

    // Top 8 topics ("districts"), most-solved first
    const topTags = allTags.slice(0, 8);
    const maxSolved = topTags.length > 0 ? topTags[0].problemsSolved : 1;

    const districts = topTags.map((tag, index) => ({
        name: tag.tagName,
        problemsSolved: tag.problemsSolved,
        normalizedScore: tag.problemsSolved / maxSolved, // 0..1 relative to the top topic
        index,
    }));

    const contest = data.contest || {};
    const badges = data.badges || {};
    const calendar = data.calendar || {};

    return {
        username: user.username,
        profile: user.profile,
        stats,
        recent,
        districts,
        totalQuestions,
        contestInfo: {
            rating:        contest.contestRating        || null,
            topRating:     contest.contestTopRating     || null,
            ranking:       contest.contestGlobalRanking || null,
            attended:      contest.contestAttend        || 0,
            topPercentage: contest.contestTopPercentage || null,
            // Rating per attended contest, oldest → newest (for the sparkline)
            history: (Array.isArray(contest.contestParticipation) ? contest.contestParticipation : [])
                .map(p => Number(p?.rating))
                .filter(Number.isFinite),
            totalParticipants: num(contest.totalParticipants),
            // Newest first, for the contest table
            rows: mapContestRows(contest.contestParticipation),
        },
        badgesInfo: {
            total:  badges.badgesCount || 0,
            badges: Array.isArray(badges.badges) ? badges.badges : [],
        },
        calendar,
        identity: mapIdentity(data.identity),
        skills: mapSkills(tags),
        languages: mapLanguages(data.languages),
        acceptance: mapAcceptance(data.submitTotals),
        beats: mapBeats(data.beats),
        recentAccepted: mapRecentAccepted(data.acRecent, recent),
    };
}
