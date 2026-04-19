import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calcPower, getFighterClass } from '../utils/gameData';

/* ─── Stat Bar ─── */
function StatBar({ label, value, max, color, icon }) {
    const [w, setW] = useState(0);
    useEffect(() => { const t = setTimeout(() => setW(Math.min((value / max) * 100, 100)), 200); return () => clearTimeout(t); }, [value, max]);
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13 }}>{icon}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>{label}</span>
                </div>
                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 700, color }}>{value}</span>
            </div>
            <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${w}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 8px ${color}60` }} />
            </div>
        </div>
    );
}

/* ─── Animated Power Counter ─── */
function PowerCounter({ targetPower, color }) {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
        let cur = 0;
        const step = targetPower / 60;
        const id = setInterval(() => {
            cur += step;
            if (cur >= targetPower) { setDisplay(targetPower); clearInterval(id); }
            else setDisplay(Math.floor(cur));
        }, 16);
        return () => clearInterval(id);
    }, [targetPower]);
    return (
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(48px, 10vw, 80px)', fontWeight: 900, color, textShadow: `0 0 40px ${color}80`, lineHeight: 1, letterSpacing: '-0.02em' }}>
            {display.toLocaleString()}
        </div>
    );
}

/* ─── VS Modal ─── */
function VSModal({ myData, opponent, onClose }) {
    const myPow = calcPower(myData.easy, myData.med, myData.hard);
    const oppPow = calcPower(opponent.easy, opponent.med, opponent.hard);
    const iWin = myPow > oppPow;
    const myCls = getFighterClass(myData.hard);
    const oppCls = getFighterClass(opponent.hard);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#0d0d12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32, maxWidth: 640, width: '100%' }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, letterSpacing: '0.3em', color: '#555', marginBottom: 8 }}>BATTLE RESULT</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 28, fontWeight: 900, color: iWin ? '#f59e0b' : '#ef4444' }}>
                        {iWin ? '🏆 VICTORY' : '💀 DEFEAT'}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                    {/* Me */}
                    <div style={{ textAlign: 'center', padding: 20, borderRadius: 14, background: myCls.bg, border: `1px solid ${myCls.color}40` }}>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: myCls.color, letterSpacing: '0.15em', marginBottom: 8 }}>{myCls.emoji} {myCls.label}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>{myData.username}</div>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 28, fontWeight: 900, color: myCls.color }}>{myPow.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>POWER</div>
                    </div>

                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 20, fontWeight: 900, color: '#333' }}>VS</div>

                    {/* Opponent */}
                    <div style={{ textAlign: 'center', padding: 20, borderRadius: 14, background: oppCls.bg, border: `1px solid ${oppCls.color}40` }}>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: oppCls.color, letterSpacing: '0.15em', marginBottom: 8 }}>{oppCls.emoji} {oppCls.label}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 16, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>{opponent.u}</div>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 28, fontWeight: 900, color: oppCls.color }}>{oppPow.toLocaleString()}</div>
                        <div style={{ fontSize: 10, color: '#555', marginTop: 4 }}>POWER</div>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <button onClick={onClose} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, letterSpacing: '0.15em', color: '#555', background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>
                        CLOSE
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ─── Fighter Card ─── */
const LEGENDS_SHORT = [
    { u: 'tourist', easy: 800, med: 1700, hard: 800 },
    { u: 'neal_wu', easy: 720, med: 1400, hard: 620 },
    { u: 'lee215', easy: 680, med: 1350, hard: 580 },
    { u: 'votrubac', easy: 660, med: 1200, hard: 540 },
    { u: 'neetcode', easy: 460, med: 780, hard: 220 },
];

export default function FighterCard({ data, username, onBack }) {
    const [vsOpponent, setVsOpponent] = useState(null);

    if (!data) return null;

    const { profile, stats, recent, districts, contestInfo, badgesInfo } = data;

    const easy = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const med = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hard = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    const total = stats.find(s => s.difficulty === 'All')?.count || 0;

    const power = calcPower(easy, med, hard);
    const cls = getFighterClass(hard);
    const topSkills = districts ? [...districts].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 5) : [];

    // Win rate from recent submissions
    const accepted = recent.filter(r => r.statusDisplay === 'Accepted').length;
    const winRate = recent.length > 0 ? Math.round((accepted / recent.length) * 100) : 0;

    const myFighterData = { username, easy, med, hard, power };

    const [coords, setCoords] = useState({ x: 50, y: 50 });

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setCoords({ x, y });
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 860, margin: '0 auto' }}
            >
                {/* Header Controls */}
                <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                    <button onClick={onBack}
                        style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, letterSpacing: '0.15em', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        ← BACK
                    </button>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, letterSpacing: '0.2em', color: 'var(--text-muted)' }}>FIGHTER PROFILE</div>
                </div>

                {/* Hero: Power Level + Class */}
                <div style={{ textAlign: 'center', marginBottom: 14, padding: '48px 24px', background: `radial-gradient(ellipse at center top, ${cls.color}10 0%, transparent 60%)`, borderRadius: 20, border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(128,128,128,0.01) 0px, rgba(128,128,128,0.01) 1px, transparent 1px, transparent 3px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, letterSpacing: '0.3em', color: 'var(--text-ultra-muted)', marginBottom: 20, textTransform: 'uppercase' }}>
                            FIGHTER · #{profile.ranking?.toLocaleString() || '?'} GLOBAL RANK
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 52, height: 52, borderRadius: 14, background: cls.bg, border: `1.5px solid ${cls.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, sans-serif', fontSize: 22, fontWeight: 900, color: cls.color }}>
                                {username.charAt(0).toUpperCase()}
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{username}</div>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: cls.color, letterSpacing: '0.18em', marginTop: 2 }}>{cls.emoji} {cls.label}</div>
                            </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, letterSpacing: '0.25em', color: 'var(--text-ultra-muted)', marginBottom: 8, textTransform: 'uppercase' }}>Power Level</div>
                            <PowerCounter targetPower={power} color={cls.color} />
                        </div>
                    </div>
                </div>

                {/* Competitive Record */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', marginBottom: 14 }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-ultra-muted)', marginBottom: 20 }}>COMPETITIVE RECORD</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>RATING</span>
                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 18, fontWeight: 700, color: contestInfo?.rating ? cls.color : 'var(--text-muted)' }}>
                            {contestInfo?.rating ? Math.round(contestInfo.rating).toLocaleString() : 'N/A'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>RANK</span>
                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {contestInfo?.ranking ? `#${contestInfo.ranking.toLocaleString()}` : '?'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>TOP</span>
                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 700, color: '#22c55e' }}>
                            {contestInfo?.topPercentage ? `${contestInfo.topPercentage}%` : '?'}
                        </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>ATTENDED</span>
                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 700, color: '#f59e0b' }}>
                            {contestInfo?.attended || 0}
                        </span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.05em' }}>TOTAL BADGES</span>
                        <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 700, color: '#8b5cf6' }}>
                            {badgesInfo?.total || 0}
                        </span>
                    </div>
                </div>

                {/* Stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 14, marginBottom: 14 }}>
                    {/* Difficulty */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-ultra-muted)', marginBottom: 20 }}>BATTLE STATS</div>
                        <StatBar label="EASY" value={easy} max={800} color="#22c55e" icon="🟢" />
                        <StatBar label="MEDIUM" value={med} max={1700} color="#f59e0b" icon="🟡" />
                        <StatBar label="HARD" value={hard} max={800} color="#ef4444" icon="🔴" />
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12, marginTop: 4, display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}>
                            <span style={{ color: 'var(--text-muted)' }}>TOTAL</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Skills + Win Rate */}
                    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-ultra-muted)', marginBottom: 16 }}>SPECIALTIES</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                            {topSkills.map(s => (
                                <span key={s.name} className="skill-tag" style={{ color: 'var(--text-secondary)' }}>
                                    {s.name} <span style={{ color: cls.color, fontWeight: 700 }}>{s.problemsSolved}</span>
                                </span>
                            ))}
                        </div>
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-ultra-muted)', marginBottom: 8 }}>WIN RATE (RECENT)</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 36, fontWeight: 900, color: winRate >= 70 ? '#22c55e' : winRate >= 50 ? '#f59e0b' : '#ef4444' }}>{winRate}%</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--text-muted)' }}>{accepted}/{recent.length} AC</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VS Challenge */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 14 }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-ultra-muted)', marginBottom: 16 }}>⚔️ CHALLENGE A LEGEND</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {LEGENDS_SHORT.map(opp => {
                            const oppPow = calcPower(opp.easy, opp.med, opp.hard);
                            const oppCls = getFighterClass(opp.hard);
                            const iWin = power > oppPow;
                            return (
                                <button key={opp.u} onClick={() => setVsOpponent(opp)}
                                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, background: oppCls.bg, border: `1px solid ${oppCls.color}40`, borderRadius: 10, padding: '10px 14px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = oppCls.color}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = `${oppCls.color}40`}
                                >
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{opp.u}</div>
                                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: oppCls.color, letterSpacing: '0.12em' }}>{oppCls.label}</div>
                                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: iWin ? '#22c55e' : '#ef4444', marginTop: 2 }}>{iWin ? '✓ YOU WIN' : '✗ YOU LOSE'}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Battles */}
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.2em', color: 'var(--text-ultra-muted)', marginBottom: 14 }}>RECENT BATTLES</div>
                    {recent.map((r, i) => {
                        const ok = r.statusDisplay === 'Accepted';
                        return (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 8, marginBottom: 4, background: 'var(--card-header-bg)', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--card-header-bg)'}>
                                <div style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: ok ? '#22c55e' : '#ef4444', boxShadow: `0 0 6px ${ok ? '#22c55e' : '#ef4444'}aa` }} />
                                <span style={{ flex: 1, fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                                <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: ok ? '#22c55e' : '#ef4444', letterSpacing: '0.1em' }}>{ok ? 'AC' : 'WA'}</span>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* VS Modal */}
            <AnimatePresence>
                {vsOpponent && (
                    <VSModal myData={myFighterData} opponent={vsOpponent} onClose={() => setVsOpponent(null)} />
                )}
            </AnimatePresence>
        </>
    );
}


