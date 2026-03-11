import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Legend Data (pre-populated public stats from well-known coders) ─── */
const LEGENDS = [
    { u: 'tourist', easy: 800, med: 1700, hard: 800, rank: 1 },
    { u: 'neal_wu', easy: 720, med: 1400, hard: 620, rank: 12 },
    { u: 'lee215', easy: 680, med: 1350, hard: 580, rank: 28 },
    { u: 'votrubac', easy: 660, med: 1200, hard: 540, rank: 44 },
    { u: 'stefanpochmann', easy: 640, med: 1150, hard: 500, rank: 61 },
    { u: 'awice', easy: 600, med: 1100, hard: 480, rank: 80 },
    { u: 'StefanPochmann', easy: 580, med: 1050, hard: 460, rank: 99 },
    { u: 'jianchao.li', easy: 560, med: 980, hard: 380, rank: 120 },
    { u: 'niits', easy: 540, med: 920, hard: 340, rank: 155 },
    { u: 'shawngao', easy: 520, med: 900, hard: 320, rank: 180 },
    { u: 'grandyang', easy: 500, med: 870, hard: 300, rank: 200 },
    { u: 'hayleyiscoding', easy: 480, med: 820, hard: 260, rank: 240 },
    { u: 'neetcode', easy: 460, med: 780, hard: 220, rank: 300 },
    { u: 'maths_geek', easy: 440, med: 750, hard: 200, rank: 350 },
    { u: 'dp_wizard', easy: 420, med: 700, hard: 180, rank: 400 },
    { u: 'tree_climber', easy: 400, med: 650, hard: 160, rank: 450 },
    { u: 'hash_queen', easy: 380, med: 600, hard: 140, rank: 500 },
    { u: 'binary_sage', easy: 360, med: 550, hard: 120, rank: 580 },
    { u: 'graph_traveler', easy: 340, med: 500, hard: 100, rank: 650 },
    { u: 'sort_master', easy: 320, med: 450, hard: 80, rank: 750 },
    { u: 'codepath_fan', easy: 300, med: 380, hard: 60, rank: 900 },
    { u: 'recursion_god', easy: 260, med: 340, hard: 50, rank: 1100 },
    { u: 'brute_force', easy: 220, med: 280, hard: 30, rank: 1400 },
    { u: 'greedy_gal', easy: 180, med: 220, hard: 20, rank: 1800 },
    { u: 'weekender', easy: 140, med: 160, hard: 10, rank: 2500 },
    { u: 'newbie_coder', easy: 90, med: 80, hard: 3, rank: 5000 },
    { u: 'just_started', easy: 40, med: 20, hard: 0, rank: 10000 },
    { u: 'curious_dev', easy: 20, med: 10, hard: 0, rank: 15000 },
];

function powerLevel(e, m, h) { return e * 1 + m * 3 + h * 10; }

function fighterClass(hard) {
    if (hard >= 500) return { label: 'LEGEND', color: '#ef4444', glow: 'rgba(239,68,68,0.4)', shadow: '0 0 20px rgba(239,68,68,0.6)' };
    if (hard >= 300) return { label: 'CHAMPION', color: '#f59e0b', glow: 'rgba(245,158,11,0.35)', shadow: '0 0 16px rgba(245,158,11,0.5)' };
    if (hard >= 150) return { label: 'ELITE', color: '#8b5cf6', glow: 'rgba(139,92,246,0.3)', shadow: '0 0 14px rgba(139,92,246,0.45)' };
    if (hard >= 50) return { label: 'WARRIOR', color: '#3b82f6', glow: 'rgba(59,130,246,0.25)', shadow: '0 0 10px rgba(59,130,246,0.4)' };
    if (hard >= 10) return { label: 'RECRUIT', color: '#22c55e', glow: 'rgba(34,197,94,0.2)', shadow: '0 0 8px rgba(34,197,94,0.3)' };
    return { label: 'NOVICE', color: '#71717a', glow: 'rgba(113,113,122,0.15)', shadow: 'none' };
}

/* ─── Individual Fighter Tower ─── */
function FighterTile({ fighter, onSelect, delay = 0 }) {
    const [hovered, setHovered] = useState(false);
    const pw = powerLevel(fighter.easy, fighter.med, fighter.hard);
    const cls = fighterClass(fighter.hard);
    const maxPw = powerLevel(800, 1700, 800);
    const heightPct = Math.max(0.08, pw / maxPw);
    const towerH = Math.round(heightPct * 120 + 18);
    const tileW = 54;

    return (
        <div
            style={{ position: 'relative', width: tileW, flexShrink: 0, cursor: 'pointer', zIndex: hovered ? 20 : 1 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => onSelect(fighter.u)}
        >
            {/* Tower body */}
            <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    transformOrigin: 'bottom',
                    width: tileW - 4, height: towerH, margin: '0 2px',
                    background: `linear-gradient(180deg, ${cls.color}40 0%, ${cls.color}18 60%, rgba(0,0,0,0) 100%)`,
                    border: `1px solid ${cls.color}50`,
                    borderBottom: `2px solid ${cls.color}80`,
                    borderRadius: '4px 4px 2px 2px',
                    boxShadow: hovered ? cls.shadow : 'none',
                    transition: 'box-shadow 0.2s',
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 4,
                }}
            >
                {/* Initial avatar */}
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: `${cls.color}30`, border: `1px solid ${cls.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: cls.color, fontFamily: 'Orbitron, sans-serif' }}>
                    {fighter.u.charAt(0).toUpperCase()}
                </div>
            </motion.div>

            {/* Base */}
            <div style={{ height: 4, background: `linear-gradient(90deg, transparent, ${cls.color}60, transparent)`, borderRadius: 2 }} />

            {/* Hover tooltip */}
            <AnimatePresence>
                {hovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute', bottom: '110%', left: '50%', transform: 'translateX(-50%)',
                            background: '#13131a', border: `1px solid ${cls.color}40`,
                            borderRadius: 10, padding: '10px 14px', minWidth: 150, zIndex: 100,
                            boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 20px ${cls.color}20`,
                        }}
                    >
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#f0f0f0', marginBottom: 4, fontWeight: 600 }}>{fighter.u}</div>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: cls.color, letterSpacing: '0.15em', marginBottom: 8 }}>{cls.label}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
                            <span style={{ color: '#22c55e' }}>E:{fighter.easy}</span>
                            <span style={{ color: '#f59e0b' }}>M:{fighter.med}</span>
                            <span style={{ color: '#ef4444' }}>H:{fighter.hard}</span>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 10, color: '#555', fontFamily: 'Orbitron, monospace' }}>
                            PWR: <span style={{ color: cls.color, fontWeight: 700 }}>{pw.toLocaleString()}</span>
                        </div>
                        <div style={{ marginTop: 6, fontSize: 10, color: '#ef4444', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}>Click to enter →</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Live Ticker ─── */
function ArenaTicker({ legends }) {
    const items = [...legends, ...legends].map((l, i) => {
        const pw = powerLevel(l.easy, l.med, l.hard);
        return { key: i, text: `${l.u} · PWR ${pw.toLocaleString()} · #${l.rank.toLocaleString()}` };
    });
    return (
        <div style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '8px 0', background: 'rgba(0,0,0,0.3)' }}>
            <div className="ticker-track">
                {items.map(({ key, text }) => (
                    <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 56, whiteSpace: 'nowrap', fontSize: 11, color: '#444', fontFamily: 'JetBrains Mono, monospace' }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ef4444', flexShrink: 0, boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
                        {text}
                    </span>
                ))}
            </div>
        </div>
    );
}

/* ─── MAIN ARENA ─── */
export default function Arena({ onSelectFighter }) {
    const sorted = useMemo(() => [...LEGENDS].sort((a, b) => powerLevel(b.easy, b.med, b.hard) - powerLevel(a.easy, a.med, a.hard)), []);

    return (
        <div>
            {/* Ticker */}
            <ArenaTicker legends={sorted} />

            {/* Section label */}
            <div style={{ padding: '20px 0 12px', textAlign: 'center' }}>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, letterSpacing: '0.25em', color: '#333', textTransform: 'uppercase' }}>
                    The Arena · {LEGENDS.length} fighters · Live standings
                </span>
            </div>

            {/* Fighter grid - perspective tilt for depth */}
            <div style={{ overflowX: 'auto', overflowY: 'visible', paddingBottom: 32, paddingTop: 24 }}>
                <div style={{
                    display: 'flex', alignItems: 'flex-end', gap: 6,
                    minWidth: 'max-content', padding: '0 40px',
                    transform: 'perspective(900px) rotateX(12deg)',
                    transformOrigin: 'bottom center',
                }}>
                    {sorted.map((f, i) => (
                        <FighterTile key={f.u} fighter={f} onSelect={onSelectFighter} delay={i * 0.04} />
                    ))}
                </div>
            </div>

            {/* Floor glow */}
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.3), rgba(245,158,11,0.3), rgba(139,92,246,0.3), transparent)', margin: '0 40px' }} />

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 20, padding: '14px 0 0', flexWrap: 'wrap' }}>
                {[
                    { label: 'LEGEND', color: '#ef4444', min: '500+ hard' },
                    { label: 'CHAMPION', color: '#f59e0b', min: '300+ hard' },
                    { label: 'ELITE', color: '#8b5cf6', min: '150+ hard' },
                    { label: 'WARRIOR', color: '#3b82f6', min: '50+ hard' },
                    { label: 'RECRUIT', color: '#22c55e', min: '10+ hard' },
                    { label: 'NOVICE', color: '#71717a', min: '<10 hard' },
                ].map(c => (
                    <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#444', letterSpacing: '0.1em' }}>{c.label}</span>
                        <span style={{ fontSize: 10, color: '#2a2a2a', fontFamily: 'JetBrains Mono, monospace' }}>{c.min}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
