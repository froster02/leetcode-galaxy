import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ─── Rank System ─── */
function getRankBadge(solved) {
    if (solved >= 2000) return { label: 'Cosmic', color: '#f59e0b', glow: 'rgba(245,158,11,0.25)' };
    if (solved >= 1000) return { label: 'Expert', color: '#a78bfa', glow: 'rgba(167,139,250,0.2)' };
    if (solved >= 500) return { label: 'Advanced', color: '#38bdf8', glow: 'rgba(56,189,248,0.2)' };
    if (solved >= 200) return { label: 'Rising', color: '#34d399', glow: 'rgba(52,211,153,0.2)' };
    if (solved >= 50) return { label: 'Learning', color: '#71717a', glow: 'rgba(113,113,122,0.15)' };
    return { label: 'Starter', color: '#52525b', glow: 'rgba(82,82,91,0.15)' };
}

/* ─── SVG Donut Ring ─── */
function DonutRing({ easy, medium, hard }) {
    const [animate, setAnimate] = useState(false);
    useEffect(() => { const t = setTimeout(() => setAnimate(true), 100); return () => clearTimeout(t); }, []);

    const S = 180, sw = 14, r = (S - sw) / 2, c = 2 * Math.PI * r;
    const total = easy + medium + hard || 1;

    const segments = [
        { val: easy, color: '#22c55e', label: 'Easy' },
        { val: medium, color: '#f59e0b', label: 'Medium' },
        { val: hard, color: '#ef4444', label: 'Hard' },
    ];

    let offset = 0;
    const arcs = segments.map(seg => {
        // Use validated total - percentages are capped at 100% by fixPercentages
        const pct = seg.val / total;
        const len = pct * c;
        const gap = c * 0.012;
        const arc = { ...seg, dashoffset: -(offset), dasharray: `${Math.max(0, len - gap)} ${c - Math.max(0, len - gap)}` };
        offset += len;
        return arc;
    });

    return (
        <div style={{ position: 'relative', width: S, height: S, flexShrink: 0 }}>
            <svg width={S} height={S} style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle cx={S / 2} cy={S / 2} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={sw} />
                {/* Segments */}
                {arcs.map((a, i) => (
                    <circle key={i} cx={S / 2} cy={S / 2} r={r} fill="none"
                        stroke={a.color} strokeWidth={sw} strokeLinecap="butt"
                        strokeDasharray={animate ? a.dasharray : `0 ${c}`}
                        strokeDashoffset={a.dashoffset}
                        className="ring-ease"
                        style={{ filter: `drop-shadow(0 0 4px ${a.color}80)` }}
                    />
                ))}
            </svg>
            {/* Center text */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 700, color: '#f5f5f5', lineHeight: 1 }}>{easy + medium + hard}</div>
                <div style={{ fontSize: 11, color: '#52525b', letterSpacing: '0.1em', marginTop: 4, textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>Solved</div>
            </div>
        </div>
    );
}

/* ─── Stat Bar ─── */
function StatBar({ label, value, max, color }) {
    const [width, setWidth] = useState(0);
    useEffect(() => { const t = setTimeout(() => setWidth(Math.min((value / max) * 100, 100)), 150); return () => clearTimeout(t); }, [value, max]);
    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#d4d4d8' }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 18, fontWeight: 700, color: '#f5f5f5' }}>{value}</span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#3f3f46' }}>/{max}</span>
                </div>
            </div>
            <div className="stat-bar">
                <div className="stat-bar-fill" style={{ width: `${width}%`, background: color }} />
            </div>
        </div>
    );
}

/* ─── Main Dashboard ─── */
export default function Dashboard({ data, username, onBack }) {
    if (!data) return null;

    const { profile, stats, recent, planets, _normalized } = data;
    
    // Use normalized data if available, otherwise fallback
    const totalSolved = _normalized?.totalSolved 
        || stats.find(s => s.difficulty === 'All')?.count 
        || 0;
    
    const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const medSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;

    const rank = getRankBadge(totalSolved);
    const topTopics = [...planets].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 9);

    const card = { border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, background: '#111214', padding: 24, position: 'relative', overflow: 'hidden' };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{ paddingTop: 48, paddingBottom: 80 }}>

            {/* ── Profile Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 13, background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(56,189,248,0.2))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
                        {username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                            <h1 style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: '#f5f5f5', letterSpacing: '-0.02em' }}>{username}</h1>
                            <span className="rank-badge" style={{ color: rank.color, borderColor: rank.color, background: rank.glow }}>{rank.label}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#52525b', fontFamily: 'JetBrains Mono, monospace' }}>
                            <span>Rank #{profile.ranking?.toLocaleString()}</span>
                            <span style={{ color: '#3f3f46' }}>·</span>
                            <span>Rep {profile.reputation}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onBack} style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#71717a', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer' }}
                    onMouseEnter={e => { e.target.style.color = '#f5f5f5'; e.target.style.background = 'rgba(255,255,255,0.08)'; }}
                    onMouseLeave={e => { e.target.style.color = '#71717a'; e.target.style.background = 'rgba(255,255,255,0.04)'; }}>
                    ← New search
                </button>
            </div>

            {/* ── Main Grid ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 14 }}>

                {/* Donut + Difficulty */}
                <div style={{ ...card, gridColumn: 'span 5' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #6366f1, #38bdf8)' }} />
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f3f46', fontFamily: 'JetBrains Mono, monospace', marginBottom: 20 }}>Problem Distribution</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                        <DonutRing easy={easySolved} medium={medSolved} hard={hardSolved} />
                        <div style={{ flex: 1, minWidth: 140 }}>
                            <StatBar label="Easy" value={easySolved} max={800} color="#22c55e" />
                            <StatBar label="Medium" value={medSolved} max={1700} color="#f59e0b" />
                            <StatBar label="Hard" value={hardSolved} max={800} color="#ef4444" />
                        </div>
                    </div>
                </div>

                {/* Topics / Skills */}
                <div style={{ ...card, gridColumn: 'span 7' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f3f46', fontFamily: 'JetBrains Mono, monospace', marginBottom: 20 }}>Skill Proficiency</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {topTopics.map((t, i) => {
                            const maxT = topTopics[0]?.problemsSolved || 1;
                            const pct = (t.problemsSolved / maxT) * 100;
                            return (
                                <div key={t.name} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 14, cursor: 'default', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'}}>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 20, fontWeight: 700, color: '#f5f5f5', lineHeight: 1, marginBottom: 4 }}>{t.problemsSolved}</div>
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
                <div style={{ ...card, gridColumn: 'span 7' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f3f46', fontFamily: 'JetBrains Mono, monospace', marginBottom: 20 }}>Execution Log</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {recent.map((s, i) => {
                            const ok = s.statusDisplay === 'Accepted';
                            const lang = s.lang || 'other';
                            const lc = lang === 'cpp' ? '#6366f1' : lang === 'python3' ? '#f59e0b' : lang === 'javascript' ? '#22c55e' : lang === 'java' ? '#38bdf8' : '#71717a';
                            return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}}>
                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: ok ? '#22c55e' : '#ef4444', flexShrink: 0, boxShadow: `0 0 6px ${ok ? '#22c55e' : '#ef4444'}` }} />
                                    <span style={{ flex: 1, fontSize: 13, color: '#d4d4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: lc, background: `${lc}18`, border: `1px solid ${lc}30`, borderRadius: 5, padding: '2px 7px', flexShrink: 0 }}>{lang}</span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: ok ? '#22c55e' : '#ef4444', flexShrink: 0 }}>{ok ? 'AC' : 'WA'}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Summary Terminal Card */}
                <div style={{ ...card, gridColumn: 'span 5', background: '#0d0d0f' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3f3f46', fontFamily: 'JetBrains Mono, monospace', marginBottom: 20 }}>Profile Config</div>
                    <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: 1.9, userSelect: 'none', margin: 0 }}>
                        <span style={{ color: '#52525b' }}>$ profile.analyze(</span><span style={{ color: '#a78bfa' }}>&quot;{username}&quot;</span><span style={{ color: '#52525b' }})</span>{'
'}
                        <span style={{ color: '#3f3f46' }}>  → </span><span style={{ color: '#71717a' }}>solved</span><span style={{ color: '#3f3f46' }}>: </span><span style={{ color: '#22c55e' }}>{totalSolved}</span>{'
'}
                        <span style={{ color: '#3f3f46' }}>  → </span><span style={{ color: '#71717a' }}>level</span><span style={{ color: '#3f3f46' }}>: </span><span style={{ color: rank.color }}>&quot;{rank.label}&quot;</span>{'
'}
                        <span style={{ color: '#3f3f46' }}>  → </span><span style={{ color: '#71717a' }}>hard_ratio</span><span style={{ color: '#3f3f46' }}>: </span><span style={{ color: '#f59e0b' }}>{_normalized?.hardRatio || hardSolved > 0 ? ((hardSolved / totalSolved) * 100).toFixed(1) : '0.0'}%</span>{'
'}
                    </pre>
                </div>

            </div>
        </motion.div>
    );
}
