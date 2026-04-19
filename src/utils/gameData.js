/* ─────────────────── Game math ─────────────────── */
export function calcPower(easy, med, hard) { return easy * 1 + med * 3 + hard * 10; }

export function getFighterClass(hard) {
    if (hard >= 500) return { label: 'LEGEND',   color: '#ef4444', emissive: '#7f0000', bg: 'rgba(239,68,68,0.1)',    glow: '0 0 24px rgba(239,68,68,0.5)',    emoji: '🔥' };
    if (hard >= 300) return { label: 'CHAMPION',  color: '#f59e0b', emissive: '#7a4f00', bg: 'rgba(245,158,11,0.08)', glow: '0 0 20px rgba(245,158,11,0.45)',  emoji: '⚡' };
    if (hard >= 150) return { label: 'ELITE',     color: '#8b5cf6', emissive: '#3b1f7a', bg: 'rgba(139,92,246,0.08)', glow: '0 0 18px rgba(139,92,246,0.4)',   emoji: '💜' };
    if (hard >= 50)  return { label: 'WARRIOR',   color: '#3b82f6', emissive: '#1a3a7a', bg: 'rgba(59,130,246,0.07)', glow: '0 0 14px rgba(59,130,246,0.35)',  emoji: '⚔️' };
    if (hard >= 10)  return { label: 'RECRUIT',   color: '#22c55e', emissive: '#0f4a27', bg: 'rgba(34,197,94,0.06)',  glow: '0 0 10px rgba(34,197,94,0.3)',    emoji: '🌱' };
    return             { label: 'NOVICE',   color: '#71717a', emissive: '#2a2a2a', bg: 'rgba(113,113,122,0.05)', glow: 'none',                          emoji: '🥚' };
}

/* ─────────────────── Legend Dataset ─────────────────── */
export const CODERS = [
    { u: 'tourist', easy: 800, med: 1700, hard: 800, rank: 1 },
    { u: 'neal_wu', easy: 720, med: 1400, hard: 620, rank: 12 },
    { u: 'lee215', easy: 680, med: 1350, hard: 580, rank: 28 },
    { u: 'votrubac', easy: 660, med: 1200, hard: 540, rank: 44 },
    { u: 'awice', easy: 600, med: 1100, hard: 480, rank: 80 },
    { u: 'stefanpochmann', easy: 580, med: 1050, hard: 460, rank: 99 },
    { u: 'jianchao', easy: 560, med: 980, hard: 380, rank: 120 },
    { u: 'shawngao', easy: 520, med: 900, hard: 320, rank: 180 },
    { u: 'grandyang', easy: 500, med: 870, hard: 300, rank: 200 },
    { u: 'neetcode', easy: 460, med: 780, hard: 220, rank: 300 },
    { u: 'hayleycode', easy: 440, med: 750, hard: 200, rank: 350 },
    { u: 'dp_wizard', easy: 420, med: 700, hard: 180, rank: 400 },
    { u: 'tree_climber', easy: 400, med: 650, hard: 160, rank: 450 },
    { u: 'hash_queen', easy: 380, med: 600, hard: 140, rank: 500 },
    { u: 'binary_sage', easy: 360, med: 550, hard: 120, rank: 580 },
    { u: 'graph_king', easy: 340, med: 500, hard: 100, rank: 650 },
    { u: 'sort_master', easy: 320, med: 450, hard: 80, rank: 750 },
    { u: 'recursion_god', easy: 260, med: 340, hard: 50, rank: 1100 },
    { u: 'greedy_gal', easy: 180, med: 220, hard: 20, rank: 1800 },
    { u: 'weekender', easy: 140, med: 160, hard: 10, rank: 2500 },
    { u: 'daily_grinder', easy: 200, med: 180, hard: 25, rank: 2000 },
    { u: 'cp_nerd', easy: 320, med: 410, hard: 90, rank: 820 },
    { u: 'algo_sensei', easy: 280, med: 370, hard: 75, rank: 950 },
    { u: 'the_optimizer', easy: 250, med: 310, hard: 60, rank: 1050 },
    { u: 'newbie_dev', easy: 90, med: 80, hard: 3, rank: 5000 },
    { u: 'zero_to_hero', easy: 40, med: 20, hard: 0, rank: 10000 },
    { u: 'curious_dev', easy: 20, med: 10, hard: 0, rank: 15000 },
    { u: 'just_started', easy: 10, med: 5, hard: 0, rank: 20000 },
];
