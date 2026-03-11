export function mapLeetCodeDataToSolarSystem(data) {
    if (!data || !data.profile?.matchedUser) return null;

    const user = data.profile.matchedUser;
    const tags = data.tags?.matchedUser?.tagProblemCounts || { advanced: [], intermediate: [], fundamental: [] };
    const recent = data.recent?.recentSubmissionList || [];

    const stats = user.submitStats?.acSubmissionNum || [];
    const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 1;
    const easyRatio = (stats.find(s => s.difficulty === 'Easy')?.count || 0) / totalSolved;
    const medRatio = (stats.find(s => s.difficulty === 'Medium')?.count || 0) / totalSolved;

    // Flatten and sort tags by problems solved
    const allTags = [
        ...(tags.advanced || []),
        ...(tags.intermediate || []),
        ...(tags.fundamental || [])
    ].sort((a, b) => b.problemsSolved - a.problemsSolved);

    // Take top 8 tags as planets
    const topTags = allTags.slice(0, 8);
    const maxSolved = topTags.length > 0 ? topTags[0].problemsSolved : 1;

    const planets = topTags.map((tag, index) => {
        // Orbit radius: spread evenly, 18 to ~70
        const radius = 18 + index * 7;
        const speed = 0.4 / (index + 1);

        // Planet size: normalize relative to max tag, clamp to 1.2 – 2.8
        const normalizedSize = tag.problemsSolved / maxSolved; // 0..1
        const size = 1.2 + normalizedSize * 1.6; // 1.2 to 2.8

        // Moon count: cap at 10 to avoid clutter
        const moonCount = Math.min(Math.ceil(tag.problemsSolved / 5), 10);
        const moons = [];

        for (let i = 0; i < moonCount; i++) {
            const rand = Math.random();
            let difficulty = 'Hard';
            if (rand < easyRatio) difficulty = 'Easy';
            else if (rand < easyRatio + medRatio) difficulty = 'Medium';

            moons.push({
                id: `${tag.tagName}-moon-${i}`,
                difficulty,
                isSolved: true,
                orbitRadius: size + 1.5 + Math.random() * 3,
                orbitSpeed: Math.random() * 1.5 + 0.5,
                orbitAngle: Math.random() * Math.PI * 2
            });
        }

        // A few unsolved moons
        for (let i = 0; i < 3; i++) {
            moons.push({
                id: `${tag.tagName}-unsolved-${i}`,
                difficulty: 'Medium',
                isSolved: false,
                orbitRadius: size + 1.5 + Math.random() * 3,
                orbitSpeed: Math.random() * 1 + 0.2,
                orbitAngle: Math.random() * Math.PI * 2
            });
        }

        return {
            name: tag.tagName,
            problemsSolved: tag.problemsSolved,
            radius,
            speed,
            size,
            moons,
            angle: (index / topTags.length) * Math.PI * 2 // spread initial positions evenly
        };
    });

    return {
        username: user.username,
        profile: user.profile,
        stats,
        recent,
        planets
    };
}
