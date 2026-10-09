import { normalizeStats, validateTotalQuestions, fixPercentages } from './normalization';

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
        },
        badgesInfo: {
            total:  badges.badgesCount || 0,
            badges: Array.isArray(badges.badges) ? badges.badges : [],
        },
        calendar,
    };
}
