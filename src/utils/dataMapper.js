export function mapLeetCodeDataToCity(data) {
    if (!data || !data.profile?.matchedUser) return null;

    const user = data.profile.matchedUser;
    const tags = data.tags?.matchedUser?.tagProblemCounts || { advanced: [], intermediate: [], fundamental: [] };
    const recent = data.recent?.recentSubmissionList || [];

    const stats = user.submitStats?.acSubmissionNum || [];

    // Flatten and sort tags by problems solved
    const allTags = [
        ...(tags.advanced || []),
        ...(tags.intermediate || []),
        ...(tags.fundamental || [])
    ].sort((a, b) => b.problemsSolved - a.problemsSolved);

    // Take top 8 tags to represent major City Districts
    const topTags = allTags.slice(0, 8);
    const maxSolved = topTags.length > 0 ? topTags[0].problemsSolved : 1;

    const districts = topTags.map((tag, index) => {
        // Normalize size for building height and cluster density
        const normalizedSize = tag.problemsSolved / maxSolved; // 0..1
        const size = 1.2 + normalizedSize * 1.6; // 1.2 to 2.8

        return {
            name: tag.tagName,
            problemsSolved: tag.problemsSolved,
            size,
            normalizedScore: normalizedSize,
            index
        };
    });

    const contest = data.contest || {};
    const badges = data.badges || {};

    return {
        username: user.username,
        profile: user.profile,
        stats,
        recent,
        districts, // Renamed from planets
        contestInfo: {
            rating: contest.contestRating || null,
            ranking: contest.contestGlobalRanking || null,
            attended: contest.contestAttend || 0,
            topPercentage: contest.contestTopPercentage || null
        },
        badgesInfo: {
            total: badges.badgesCount || 0
        }
    };
}
