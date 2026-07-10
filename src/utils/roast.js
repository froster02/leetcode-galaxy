/* Pure roast-line generator for the share card's roast-mode toggle.
   Rules ordered most-savage-and-specific first; falls through to a generic brag/nudge. */
export function generateRoast({ easy = 0, med = 0, hard = 0, total = 0, winRate = 0, streak = 0, badgesCount = 0, attended = 0 } = {}) {
    if (total === 0) return "Zero problems solved. The 'Explore' tab is right there.";
    if (hard === 0 && total >= 200) return `${total.toLocaleString()} solved, zero hard ones. Bold strategy.`;
    if (hard === 0 && total >= 50)  return "Comfortably avoiding every Hard problem since day one.";
    if (streak === 0 && total >= 100) return `${total.toLocaleString()} problems, current streak: a rumor.`;
    if (easy > 0 && med === 0 && hard === 0) return "Easy-only diet. The Medium tab is not radioactive.";
    if (winRate < 40 && total >= 20) return `${winRate}% recent AC rate. Read the constraints, maybe.`;
    if (attended === 0 && total >= 300) return `${total.toLocaleString()} solved, zero contests entered. Stage fright?`;
    if (badgesCount === 0 && total >= 500) return `${total.toLocaleString()} problems, not one badge to show for it.`;
    if (hard >= 300) return `${hard} Hard problems solved. Most people quit at 3.`;
    if (streak >= 30) return `${streak}-day streak. Certified problem.`;
    if (total >= 1000) return `${total.toLocaleString()} solved. At this point it's a personality trait.`;
    return "Solid numbers. Nothing to roast here — annoyingly.";
}
