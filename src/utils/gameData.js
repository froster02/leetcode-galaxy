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

/* Power tiers — single source of truth for Wrapped and the stats view. */
export function getPowerTier(power) {
    if (power >= 5000) return { name: 'HAIL MARY HERO',    color: '#fbbf24', min: 5000, max: 8000 };
    if (power >= 3000) return { name: 'ENDURANCE CAPTAIN', color: '#a78bfa', min: 3000, max: 5000 };
    if (power >= 1500) return { name: 'RANGER PILOT',      color: '#00f5d4', min: 1500, max: 3000 };
    if (power >= 800)  return { name: 'LAZARUS CREW',      color: '#60a5fa', min: 800,  max: 1500 };
    if (power >= 300)  return { name: 'SPACE CADET',       color: '#fb923c', min: 300,  max: 800  };
    return               { name: 'EXPLORER',               color: '#94a3b8', min: 0,    max: 300  };
}
