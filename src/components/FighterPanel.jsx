import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calcPower, getFighterClass, CODERS } from '../utils/gameData';

/* ─── Animated power counter ─── */
function PowerCounter({ target, color }) {
    const [v, setV] = useState(0);
    useEffect(() => {
        let cur = 0;
        const step = target / 55;
        const id = setInterval(() => {
            cur += step;
            if (cur >= target) { setV(target); clearInterval(id); }
            else setV(Math.floor(cur));
        }, 16);
        return () => clearInterval(id);
    }, [target]);
    return (
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 52, fontWeight: 900, color, textShadow: `0 0 30px ${color}70`, lineHeight: 1 }}>
            {v.toLocaleString()}
        </div>
    );
}

/* ─── Stat bar ─── */
function StatBar({ value, max, color }) {
    const [w, setW] = useState(0);
    useEffect(() => { const t = setTimeout(() => setW(Math.min((value / max) * 100, 100)), 150); return () => clearTimeout(t); }, [value, max]);
    return (
        <div className="stat-row">
            <div className="stat-fill" style={{ width: `${w}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
        </div>
    );
}

/* ─── Fighter Panel (slide-in from right) ─── */
export function FighterPanel({ coder, profileData, onClose }) {
    if (!coder) return null;

    const { easy, med, hard } = coder;
    const power = calcPower(easy, med, hard);
    const cls = getFighterClass(hard);

    // Use real data if available, otherwise use the pre-set legend stats
    const stats = profileData ? {
        easy: profileData.stats?.find(s => s.difficulty === 'Easy')?.count ?? easy,
        med: profileData.stats?.find(s => s.difficulty === 'Medium')?.count ?? med,
        hard: profileData.stats?.find(s => s.difficulty === 'Hard')?.count ?? hard,
        rank: profileData.profile?.ranking,
        planets: profileData.planets || [],
        recent: profileData.recent || [],
    } : { easy, med, hard, rank: coder.rank, planets: [], recent: [] };

    const realPower = calcPower(stats.easy, stats.med, stats.hard);
    const realCls = getFighterClass(stats.hard);

    // Compare against tourist
    const tourist = CODERS[0];
    const touristPow = calcPower(tourist.easy, tourist.med, tourist.hard);

    return (
        <motion.div
            className="fighter-panel"
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        >
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={onClose} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.15em', color: '#444', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                    ✕ CLOSE
                </button>
            </div>

            {/* Fighter name + class */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${realCls.color}18`, border: `1.5px solid ${realCls.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontFamily: 'Orbitron, sans-serif', fontSize: 24, fontWeight: 900, color: realCls.color }}>
                    {coder.u.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#f0f0f0', marginBottom: 8 }}>{coder.u}</div>
                <span className="class-badge" style={{ color: realCls.color, borderColor: `${realCls.color}60`, background: `${realCls.color}0f` }}>
                    {realCls.emoji} {realCls.label}
                </span>
                {stats.rank && (
                    <div style={{ marginTop: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444' }}>
                        #{stats.rank.toLocaleString()} Global Rank
                    </div>
                )}
            </div>

            {/* Power Level */}
            <div style={{ textAlign: 'center', marginBottom: 24, padding: '20px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: '#444', marginBottom: 10 }}>POWER LEVEL</div>
                <PowerCounter target={realPower} color={realCls.color} />
            </div>

            {/* Battle Stats */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: '#333', marginBottom: 14 }}>BATTLE STATS</div>
                {[
                    { label: 'EASY', val: stats.easy, max: 800, color: '#22c55e' },
                    { label: 'MEDIUM', val: stats.med, max: 1700, color: '#f59e0b' },
                    { label: 'HARD', val: stats.hard, max: 800, color: '#ef4444' },
                ].map(s => (
                    <div key={s.label} style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#444', letterSpacing: '0.1em' }}>{s.label}</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: s.color }}>{s.val}</span>
                        </div>
                        <StatBar value={s.val} max={s.max} color={s.color} />
                    </div>
                ))}
            </div>

            {/* Skills */}
            {stats.planets.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: '#333', marginBottom: 10 }}>SPECIALTIES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {stats.planets.slice(0, 6).map(p => (
                            <span key={p.name} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#888', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '3px 8px' }}>
                                {p.name} <span style={{ color: realCls.color }}>{p.problemsSolved}</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent */}
            {stats.recent.length > 0 && (
                <div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: '#333', marginBottom: 10 }}>RECENT BATTLES</div>
                    {stats.recent.slice(0, 5).map((r, i) => {
                        const ok = r.statusDisplay === 'Accepted';
                        return (
                            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '7px 10px', borderRadius: 6, marginBottom: 3, background: 'rgba(255,255,255,0.025)' }}>
                                <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: ok ? '#22c55e' : '#ef4444', boxShadow: `0 0 5px ${ok ? '#22c55e' : '#ef4444'}` }} />
                                <span style={{ flex: 1, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#aaa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 8, color: ok ? '#22c55e' : '#ef4444', letterSpacing: '0.08em' }}>{ok ? 'AC' : 'WA'}</span>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* VS Tourist */}
            <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.15em', color: '#555', marginBottom: 8 }}>VS tourist (LEGEND)</div>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 900, color: realPower >= touristPow ? '#22c55e' : '#ef4444' }}>
                    {realPower >= touristPow ? '🏆 YOU WIN' : `${((realPower / touristPow) * 100).toFixed(1)}% of tourist's power`}
                </div>
            </div>
        </motion.div>
    );
}
