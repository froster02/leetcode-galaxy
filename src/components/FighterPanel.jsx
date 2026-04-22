import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calcPower, getFighterClass, CODERS } from '../utils/gameData';

/* ─── Canvas star field — drawn once, zero ongoing CPU cost ─── */
function StarCanvas() {
    const canvasRef = React.useRef(null);

    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const W = canvas.width = window.innerWidth;
        const H = canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        const cols = ['#ccd6f6','#e8eeff','#c8d8ff','#ffffff','#b8ccff','#a8c4ff'];
        for (let i = 0; i < 470; i++) {
            const big = i > 420;
            const mid = i > 300;
            const x = ((i * 137.508) % 100) / 100 * W;
            const y = ((i * 93.172) % 100) / 100 * H;
            const r = big ? 1.1 + (i % 3) * 0.25 : mid ? 0.45 + (i % 4 === 0 ? 0.2 : 0) : 0.3;
            const op = big ? 0.6 + (i % 3) * 0.1 : mid ? 0.15 + (i % 5) * 0.05 : 0.04 + (i % 6) * 0.015;
            const col = cols[i % cols.length];
            if (big) {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
                g.addColorStop(0, col);
                g.addColorStop(1, 'transparent');
                ctx.globalAlpha = op * 0.4;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(x, y, r * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = op;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }, []);

    React.useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [draw]);

    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

/* ── Fonts ───────────────────────────────────────────────── */
const Fd = 'Orbitron, sans-serif';          // display — headings, numbers, power
const Fm = '"Share Tech Mono", monospace';  // mono — labels, tags, secondary text
const C_TEAL = '#00f5d4';

/* ── Elastic-out easing (rubber-band settle) ─────────────── */
function elasticOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const p = 0.38;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

/* ── Difficulty palette (matches City page) ───────────────── */
const C_EASY = '#23d18b';
const C_MED  = '#f5a623';
const C_HARD = '#ff3860';

/* ── Tier system ──────────────────────────────────────────── */
function getTier(power) {
    if (power >= 5000) return { name: 'HAIL MARY HERO',    color: '#fbbf24', min: 5000, max: 8000 };
    if (power >= 3000) return { name: 'ENDURANCE CAPTAIN', color: '#a78bfa', min: 3000, max: 5000 };
    if (power >= 1500) return { name: 'RANGER PILOT',      color: '#00f5d4', min: 1500, max: 3000 };
    if (power >= 800)  return { name: 'LAZARUS CREW',      color: '#60a5fa', min: 800,  max: 1500 };
    if (power >= 300)  return { name: 'SPACE CADET',       color: '#fb923c', min: 300,  max: 800  };
    return               { name: 'EXPLORER',               color: '#94a3b8', min: 0,    max: 300  };
}

function tierProgress(power, tier) {
    return Math.min(((power - tier.min) / (tier.max - tier.min)) * 100, 100);
}

/* ── Time ago ────────────────────────────────────────────── */
function timeAgo(ts) {
    if (!ts) return null;
    const s = Math.floor(Date.now() / 1000 - Number(ts));
    if (s < 60)    return `${s}s ago`;
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

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
        <div style={{ fontFamily: Fd, fontSize: 52, fontWeight: 900, color, textShadow: `0 0 30px ${color}70`, lineHeight: 1 }}>
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
export const FighterPanel = React.memo(function FighterPanel({ coder, profileData, onClose }) {
    if (!coder) return null;

    const { easy: coderEasy, med: coderMed, hard: coderHard } = coder;
    const power = calcPower(coderEasy, coderMed, coderHard);
    const cls = getFighterClass(coderHard);

    // Use real data if available, otherwise use the pre-set legend stats
    const stats = useMemo(() => {
        if (profileData) {
            // Apply normalization to profile data counts
            const validatedTotalQuestions = profileData.totalQuestions 
                ? validateTotalQuestions(profileData.totalQuestions)
                : { all: 0, easy: 0, medium: 0, hard: 0 };
            
            const normalizedStats = normalizeStats(
                profileData.stats?.find(s => s.difficulty === 'Easy')?.count || 0,
                profileData.stats?.find(s => s.difficulty === 'Medium')?.count || 0,
                profileData.stats?.find(s => s.difficulty === 'Hard')?.count || 0,
                validatedTotalQuestions
            );

            return {
                easy: normalizedStats.easy,
                med: normalizedStats.medium,
                hard: normalizedStats.hard,
                rank: profileData.profile?.ranking,
                planets: profileData.planets || [],
                recent: profileData.recent || [],
                _normalized: {
                    hardRatio: normalizedStats.hard > 0 && validatedTotalQuestions.all > 0 
                        ? ((normalizedStats.hard / validatedTotalQuestions.all) * 100).toFixed(1)
                        : '0.0'
                }
            };
        } else {
            // Use pre-set legend stats as fallback
            return { easy: coderEasy, med: coderMed, hard: coderHard, rank: coder.rank, planets: [], recent: [] };
        }
    }, [profileData, coderEasy, coderMed, coderHard]);

    // Use normalized stats from data if available
    const realEasy = stats.easy;
    const realMed = stats.med;
    const realHard = stats.hard;
    
    const realPower = calcPower(realEasy, realMed, realHard);
    const realCls = getFighterClass(realHard);

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
                <button onClick={onClose} style={{ fontFamily: Fd, fontSize: 9, letterSpacing: '0.15em', color: '#444', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer' }}>
                    ✕ CLOSE
                </button>
            </div>

            {/* Fighter name + class */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${realCls.color}18`, border: `1.5px solid ${realCls.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontFamily: Fd, fontSize: 24, fontWeight: 900, color: realCls.color }}>
                    {coder.u.charAt(0).toUpperCase()}
                </div>
                <div style={{ fontFamily: Fd, fontSize: 20, fontWeight: 900, color: '#f5f5f5', letterSpacing: '-0.02em', marginBottom: 4 }}>{coder.u}</div>
                <div style={{ fontFamily: Fm, fontSize: 11, color: '#52525b', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{coder.bio || 'Pathfinder'}</div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#52525b', fontFamily: Fm }}>
                    <span>Rank #{stats.rank?.toLocaleString()}</span>
                    <span style={{ color: '#3f3f46' }}>·</span>
                    <span>Rep {coder.reputation || 0}</span>
                </div>
            </div>

            {/* Stats */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontFamily: Fm, fontSize: 13, fontWeight: 500, color: '#d4d4d8' }}>EASY</span>
                    <span style={{ fontFamily: Fd, fontSize: 18, fontWeight: 700, color: C_EASY }}>{realEasy}</span>
                </div>
                <StatBar value={realEasy} max={800} color={C_EASY} />
                
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, marginTop: 16 }}>
                    <span style={{ fontFamily: Fm, fontSize: 13, fontWeight: 500, color: '#d4d4d8' }}>MEDIUM</span>
                    <span style={{ fontFamily: Fd, fontSize: 18, fontWeight: 700, color: C_MED }}>{realMed}</span>
                </div>
                <StatBar value={realMed} max={1700} color={C_MED} />
                
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, marginTop: 16 }}>
                    <span style={{ fontFamily: Fm, fontSize: 13, fontWeight: 500, color: '#d4d4d8' }}>HARD</span>
                    <span style={{ fontFamily: Fd, fontSize: 18, fontWeight: 700, color: C_HARD }}>{realHard}</span>
                </div>
                <StatBar value={realHard} max={800} color={C_HARD} />
            </div>

            {/* Power vs Tourist */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#818cf8' }} />
                    <span style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#555' }}>VS tourist (LEGEND)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <PowerCounter target={realPower} color={realCls.color} />
                    <div style={{ fontFamily: Fm, fontSize: 16, color: '#71717a' }}>power</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
                    <div style={{ fontFamily: Fd, fontSize: 16, fontWeight: 900, color: realPower >= touristPow ? '#22c55e' : '#ef4444', textShadow: `0 0 20px ${realPower >= touristPow ? '#22c55e' : '#ef4444'}60` }}>
                        {realPower >= touristPow ? '🏆 YOU WIN' : `${((realPower / touristPow) * 100).toFixed(1)}% of tourist's power`}
                    </div>
                </div>
            </div>

            {/* Skill tags */}
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f3f46', fontFamily: Fm, marginBottom: 12 }}>Skill Proficiency</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {stats.planets.slice(0, 6).map((t, i) => {
                        const maxT = stats.planets[0]?.problemsSolved || 1;
                        const pct = (t.problemsSolved / maxT) * 100;
                        return (
                            <div key={t.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, cursor: 'default', transition: 'border-color 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}}>
                                <div style={{ fontFamily: Fm, fontSize: 20, fontWeight: 700, color: '#f5f5f5', lineHeight: 1, marginBottom: 4 }}>{t.problemsSolved}</div>
                                <div style={{ fontSize: 11, color: '#52525b', marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                                <div style={{ background: 'rgba(255,255,255,0.05)', height: 3, borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: '#6366f1', borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Submissions */}
            <div style={{ ...card, background: '#0d0d0f' }}>
                <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f3f46', fontFamily: Fm, marginBottom: 20 }}>Execution Log</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {stats.recent.slice(0, 5).map((s, i) => {
                        const ok = s.statusDisplay === 'Accepted';
                        const lang = s.lang || 'other';
                        const lc = lang === 'cpp' ? '#6366f1' : lang === 'python3' ? '#f59e0b' : lang === 'javascript' ? '#22c55e' : lang === 'java' ? '#38bdf8' : '#71717a';
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', background: ok ? '#22c55e' : '#ef4444', flexShrink: 0, boxShadow: `0 0 6px ${ok ? '#22c55e' : '#ef4444'}` }} />
                                <span style={{ flex: 1, fontSize: 13, color: '#d4d4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                                <span style={{ fontFamily: Fm, fontSize: 10, color: lc, background: `${lc}18`, border: `1px solid ${lc}30`, borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>{lang}</span>
                                <span style={{ fontFamily: Fm, fontSize: 11, color: ok ? '#22c55e' : '#ef4444', flexShrink: 0 }}>{ok ? 'AC' : 'WA'}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
});
