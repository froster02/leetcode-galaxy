/* ── Fonts ───────────────────────────────────────────────── */
export const Fd = 'var(--font)';
export const Fm = 'var(--font)';
export const C_TEAL = '#0a84ff';

/* ── Elastic-out easing (rubber-band settle) ─────────────── */
export function elasticOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const p = 0.38;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

/* ── Difficulty palette ───────────────── */
export const C_EASY = '#23d18b';
export const C_MED  = '#f5a623';
export const C_HARD = '#ff3860';

export function tierProgress(power, tier) {
    return Math.min(((power - tier.min) / (tier.max - tier.min)) * 100, 100);
}

/* ── Time ago ────────────────────────────────────────────── */
export function timeAgo(ts) {
    if (!ts) return null;
    const s = Math.floor(Date.now() / 1000 - Number(ts));
    if (s < 60)    return `${s}s ago`;
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}
