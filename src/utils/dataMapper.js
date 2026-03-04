export function mapLeetCodeDataToSolarSystem(data) {
    if (!data || !data.profile?.matchedUser) return null;

    const user = data.profile.matchedUser;
    // Account for missing tags payload cleanly
    const tags = data.tags?.matchedUser?.tagProblemCounts || { advanced: [], intermediate: [], fundamental: [] };
    const recent = data.recent?.recentSubmissionList || [];

    // Calculate overall difficulty ratios
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

    // Take top 8 tags to be planets so it's not too crowded
    const topTags = allTags.slice(0, 8);

    const planets = topTags.map((tag, index) => {
        // Planet distance from sun based on index
        const radius = 15 + index * 12;
        const speed = 0.5 / (index + 1); // Inner planets move faster

        // Moon generation: 1 moon per solved problem (capped at 60 to not overload rendering per planet)
        const moonCount = Math.min(tag.problemsSolved, 60);
        const moons = [];

        for (let i = 0; i < moonCount; i++) {
            // Assign simulated difficulty based on user's overall ratio
            const rand = Math.random();
            let difficulty = 'Hard';
            if (rand < easyRatio) difficulty = 'Easy';
            else if (rand < easyRatio + medRatio) difficulty = 'Medium';

            moons.push({
                id: `${tag.tagName}-moon-${i}`,
                difficulty,
                isSolved: true,
                orbitRadius: 2.5 + Math.random() * 4,
                orbitSpeed: Math.random() * 2 + 0.5,
                orbitAngle: Math.random() * Math.PI * 2
            });
        }

        // Add a few dummy "unsolved" moons
        for (let i = 0; i < 5; i++) {
            moons.push({
                id: `${tag.tagName}-unsolved-${i}`,
                difficulty: 'Medium', // Default config for unsolved
                isSolved: false,
                orbitRadius: 2.5 + Math.random() * 4,
                orbitSpeed: Math.random() * 1 + 0.2,
                orbitAngle: Math.random() * Math.PI * 2
            });
        }

        return {
            name: tag.tagName,
            problemsSolved: tag.problemsSolved,
            radius,
            speed,
            size: Math.max(1, Math.min(4, Math.sqrt(tag.problemsSolved) / 2)),
            moons,
            angle: Math.random() * Math.PI * 2
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
