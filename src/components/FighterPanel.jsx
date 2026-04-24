import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calcPower, getFighterClass, CODERS } from '../utils/gameData';

const Fd = 'Orbitron, sans-serif';
const Fm = '"Share Tech Mono", monospace';

const C_EASY = '#23d18b';
const C_MED  = '#f5a623';
const C_HARD = '#ff3860';

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

    /* profileData is already normalized by dataMapper — read counts directly */
    const stats = useMemo(() => {
        if (profileData) {
            const easy = profileData.stats?.find(s => s.difficulty === 'Easy')?.count || 0;
            const med  = profileData.stats?.find(s => s.difficulty === 'Medium')?.count || 0;
            const hard = profileData.stats?.find(s => s.difficulty === 'Hard')?.count || 0;
            return {
                easy, med, hard,
                rank: profileData.profile?.ranking,
                districts: profileData.districts || [],
                recent: profileData.recent || [],
            };
        }
        return { easy: coderEasy, med: coderMed, hard: coderHard, rank: coder.rank, districts: [], recent: [] };
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
                    {stats.districts.slice(0, 6).map((t) => {
                        const maxT = stats.districts[0]?.problemsSolved || 1;
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
            <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, background: '#0d0d0f', padding: 24, position: 'relative', overflow: 'hidden' }}>
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
