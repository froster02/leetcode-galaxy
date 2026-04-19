import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share2, Search, X, Target, Zap, Star, Trophy, TrendingUp, Code2, Flame, Shield, Swords, Crown, Sparkles, Building2, Moon, Sun } from 'lucide-react';

const PLANET_COLORS = ['#00f5d4', '#8b5cf6', '#f5a623', '#3b82f6', '#ef4444', '#ec4899', '#10b981', '#f59e0b'];
const FONT_ORBIT = 'Orbitron, sans-serif';
const FONT_MONO = '"Share Tech Mono", monospace';

/* ── Power Level Calculator ──────────────────────────── */
function calculatePowerLevel(stats, districts) {
    const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;
    const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const medSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    const topicDiversity = districts?.length || 0;

    return Math.floor(
        easySolved * 1 +
        medSolved * 3 +
        hardSolved * 8 +
        topicDiversity * 10 +
        totalSolved * 0.5
    );
}

function getPowerTier(level) {
    if (level >= 5000) return { name: 'HAIL MARY HERO', color: '#fbbf24', icon: Crown };
    if (level >= 3000) return { name: 'ENDURANCE CAPTAIN', color: '#a78bfa', icon: Sparkles };
    if (level >= 1500) return { name: 'RANGER PILOT', color: '#00f5d4', icon: Swords };
    if (level >= 800) return { name: 'LAZARUS CREW', color: '#3b82f6', icon: Shield };
    if (level >= 300) return { name: 'SPACE CADET', color: '#f5a623', icon: Star };
    return { name: 'EXPLORER', color: '#8a94a3', icon: Target };
}

/* ── Animated Power Level Display ────────────────────── */
function PowerLevelDisplay({ level }) {
    const tier = getPowerTier(level);
    const TierIcon = tier.icon;
    const [displayed, setDisplayed] = useState(0);

    React.useEffect(() => {
        const start = performance.now();
        const duration = 1500;
        const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4);
            setDisplayed(Math.floor(eased * level));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [level]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 16px', borderRadius: 12, marginBottom: 16,
                background: `linear-gradient(135deg, ${tier.color}08, ${tier.color}04)`,
                border: `1px solid ${tier.color}20`,
            }}
        >
            <div style={{
                width: 40, height: 40, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${tier.color}15`, border: `1px solid ${tier.color}25`,
            }}>
                <TierIcon size={18} style={{ color: tier.color }} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontFamily: FONT_ORBIT, fontSize: 18, fontWeight: 900, color: tier.color,
                    textShadow: `0 0 20px ${tier.color}30`,
                }}>
                    {displayed.toLocaleString()}
                </div>
                <div style={{
                    fontFamily: FONT_MONO, fontSize: 8, color: 'var(--text-muted)',
                    letterSpacing: '0.15em',
                }}>{tier.name}</div>
            </div>
            <div style={{
                fontFamily: FONT_MONO, fontSize: 9, color: 'var(--text-ultra-muted)',
                letterSpacing: '0.1em', textAlign: 'right',
            }}>
                POWER<br />LEVEL
            </div>
        </motion.div>
    );
}

/* ── Circular Progress Ring ──────────────────────────── */
function ProgressRing({ value, max, size = 100, color = '#00f5d4', label }) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = max > 0 ? value / max : 0;
    const offset = circumference * (1 - pct);

    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={strokeWidth} />
                <motion.circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeLinecap="round" strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
                    style={{ filter: `drop-shadow(0 0 8px ${color}60)` }}
                />
            </svg>
            <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
            }}>
                <span style={{ fontFamily: FONT_ORBIT, fontSize: 22, fontWeight: 900, color }}>{value}</span>
                {label && <span style={{ fontFamily: FONT_MONO, fontSize: 8, color: 'var(--text-muted)', letterSpacing: '0.15em', marginTop: 2 }}>{label}</span>}
            </div>
        </div>
    );
}

/* ── SVG Radar Chart ─────────────────────────────────── */
function RadarChart({ districts, size = 200 }) {
    if (!districts || districts.length === 0) return null;
    const top = districts.slice(0, 6);
    const center = size / 2;
    const maxVal = Math.max(...top.map(p => p.problemsSolved), 1);
    const n = top.length;
    const step = (Math.PI * 2) / n;
    const r = (size / 2) * 0.72;

    const axisPoints = top.map((_, i) => {
        const a = i * step - Math.PI / 2;
        return {
            x: center + Math.cos(a) * r, y: center + Math.sin(a) * r,
            lx: center + Math.cos(a) * (r + 20), ly: center + Math.sin(a) * (r + 20),
        };
    });
    const dataPoints = top.map((p, i) => {
        const a = i * step - Math.PI / 2;
        const v = (p.problemsSolved / maxVal) * r;
        return { x: center + Math.cos(a) * v, y: center + Math.sin(a) * v };
    });
    const toPath = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', margin: '0 auto' }}>
            {[0.25, 0.5, 0.75, 1].map((ratio, ci) => {
                const pts = top.map((_, i) => {
                    const a = i * step - Math.PI / 2;
                    return `${center + Math.cos(a) * r * ratio},${center + Math.sin(a) * r * ratio}`;
                }).join(' ');
                return <polygon key={ci} points={pts} fill="none" stroke="rgba(0,245,212,0.08)" strokeWidth={0.5} />;
            })}
            {axisPoints.map((pt, i) => <line key={i} x1={center} y1={center} x2={pt.x} y2={pt.y} stroke="rgba(0,245,212,0.08)" strokeWidth={0.8} />)}
            <motion.path
                d={toPath(dataPoints)}
                fill="rgba(0,245,212,0.1)"
                stroke="#00f5d4"
                strokeWidth={1.5}
                strokeLinejoin="round"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 1, pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
                style={{ filter: 'drop-shadow(0 0 4px rgba(0,245,212,0.3))' }}
            />
            {dataPoints.map((pt, i) => (
                <motion.circle
                    key={i} cx={pt.x} cy={pt.y} r={3} fill="#00f5d4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
                    style={{ filter: 'drop-shadow(0 0 4px #00f5d4)' }}
                />
            ))}
            {axisPoints.map((pt, i) => (
                <text key={i} x={pt.lx} y={pt.ly} textAnchor="middle" dominantBaseline="middle"
                    fill="rgba(255,255,255,0.45)" fontSize={8} fontFamily={FONT_ORBIT} letterSpacing="0.05em">
                    {top[i].name.length > 9 ? top[i].name.slice(0, 8) + '…' : top[i].name}
                </text>
            ))}
        </svg>
    );
}

/* ── Difficulty bar ──────────────────────────────────── */
function DiffBar({ label, count, total, color, index }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            style={{ marginBottom: 10 }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4, fontFamily: FONT_ORBIT, fontWeight: 700 }}>
                <span style={{ color, letterSpacing: '0.08em' }}>{label}</span>
                <span style={{ color: 'var(--text-secondary)', fontFamily: FONT_MONO }}>{count}</span>
            </div>
            <div className="power-bar" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1.2, delay: 0.5 + index * 0.1, ease: 'easeOut' }}
                    style={{
                        height: '100%', borderRadius: 3,
                        background: `linear-gradient(90deg, ${color}60, ${color})`,
                        boxShadow: `0 0 12px ${color}40`,
                    }}
                />
            </div>
        </motion.div>
    );
}

/* ── Achievement Badge ───────────────────────────────── */
function AchievementBadge({ icon: Icon, label, color, unlocked, delay }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: 'spring' }}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '8px 6px', borderRadius: 10,
                background: unlocked ? `${color}08` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${unlocked ? color + '20' : 'rgba(255,255,255,0.04)'}`,
                opacity: unlocked ? 1 : 0.35,
                minWidth: 60,
            }}
        >
            <div style={{
                width: 28, height: 28, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: unlocked ? `${color}15` : 'rgba(255,255,255,0.02)',
            }}>
                <Icon size={14} style={{ color: unlocked ? color : 'var(--text-ultra-muted)' }} />
            </div>
            <span style={{
                fontFamily: FONT_MONO, fontSize: 7, color: unlocked ? color : 'var(--text-ultra-muted)',
                letterSpacing: '0.08em', textAlign: 'center',
            }}>{label}</span>
        </motion.div>
    );
}

/* ── Main component ──────────────────────────────────── */
export default function UserPanel({ data, onBack, viewMode, onViewModeChange, isNight, onToggleNight }) {
    const [quickSearch, setQuickSearch] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [activeTab, setActiveTab] = useState('stats');
    const [isMobile, setIsMobile] = useState(false);
    const [panelExpanded, setPanelExpanded] = useState(false);
    React.useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    if (!data) return null;
    const { profile, stats, recent, districts, username } = data;
    const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;
    const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
    const medSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
    const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;
    const estimatedTotal = 3200;
    const ranking = profile?.ranking || 0;

    const powerLevel = useMemo(() => calculatePowerLevel(stats, districts), [stats, districts]);
    const powerTier = getPowerTier(powerLevel);

    const achievements = useMemo(() => [
        { icon: Zap, label: 'FIRST SOLVE', color: '#23d18b', unlocked: totalSolved >= 1 },
        { icon: Star, label: '100 CLUB', color: '#f5a623', unlocked: totalSolved >= 100 },
        { icon: Flame, label: 'HARD 10', color: '#ff3860', unlocked: hardSolved >= 10 },
        { icon: Code2, label: 'POLYGLOT', color: '#8b5cf6', unlocked: (districts?.length || 0) >= 5 },
        { icon: Trophy, label: 'TOP 10K', color: '#fbbf24', unlocked: ranking > 0 && ranking <= 10000 },
        { icon: Crown, label: 'LEGEND', color: '#00f5d4', unlocked: ranking > 0 && ranking <= 1000 },
    ], [totalSolved, hardSolved, districts, ranking]);

    const handleShare = () => {
        try {
            const glCanvas = document.querySelector('canvas');
            if (!glCanvas) return;
            const link = document.createElement('a');
            link.href = glCanvas.toDataURL('image/png');
            link.download = `${username}-${viewMode === 'city' ? 'city' : 'card'}.png`;
            link.click();
        } catch (err) { console.error('Share failed', err); }
    };

    const handleQuickSearch = (e) => {
        e.preventDefault();
        if (quickSearch.trim()) {
            onBack();
            setTimeout(() => window.dispatchEvent(new CustomEvent('quickSearch', { detail: quickSearch.trim() })), 100);
        }
    };

    const btnStyle = {
        display: 'flex', alignItems: 'center', gap: 6,
        padding: isMobile ? '6px 10px' : '8px 14px', borderRadius: 10, fontFamily: FONT_MONO,
        fontSize: isMobile ? 10 : 11, fontWeight: 700,
        background: 'var(--btn-bg)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--accent-border)', color: 'var(--accent)', cursor: 'pointer',
        transition: 'all 0.3s ease',
    };

    const tabStyle = (active) => ({
        flex: 1, padding: '10px 0', fontFamily: FONT_MONO,
        fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
        color: active ? 'var(--accent)' : 'var(--text-muted)', background: active ? 'var(--topic-row-bg)' : 'transparent',
        border: 'none', borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
    });

    const sectionTitle = (text) => (
        <h4 style={{
            fontFamily: FONT_ORBIT, fontSize: 10, color: 'var(--accent)',
            marginBottom: 12, letterSpacing: '0.15em', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: 8,
        }}>
            <span style={{ width: 12, height: 1, background: 'var(--accent)', opacity: 0.3 }} />
            {text}
        </h4>
    );

    return (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', padding: isMobile ? 8 : 16, zIndex: 10, color: '#fff' }}>
            {/* ── Top left buttons ── */}
            <div style={{
                position: 'absolute', top: isMobile ? 8 : 16, left: isMobile ? 8 : 16,
                display: 'flex', gap: isMobile ? 6 : 10, pointerEvents: 'auto', flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                <button onClick={onBack} className="cyber-btn" style={btnStyle}>
                    <ArrowLeft size={14} /> GALAXY
                </button>

                {/* Search icon button — compact, no text */}
                <button
                    onClick={() => setShowSearch(s => !s)}
                    className="cyber-btn"
                    title="Search username"
                    style={{
                        ...btnStyle,
                        padding: isMobile ? '6px' : '8px',
                        borderColor: showSearch ? 'rgba(139,92,246,0.5)' : 'rgba(139,92,246,0.25)',
                        color: showSearch ? '#c4b5fd' : '#a78bfa',
                        minWidth: 36,
                        justifyContent: 'center',
                    }}
                >
                    {showSearch ? <X size={14} /> : <Search size={14} />}
                </button>

                {/* View mode toggles */}
                <div style={{ display: 'flex', gap: 3, background: 'var(--btn-bg)', borderRadius: 10, padding: 2, border: '1px solid var(--section-border)' }}>
                    {[
                        { mode: 'city', icon: Building2, label: 'CITY' },
                        { mode: 'card', icon: Swords, label: 'CARD' },
                    ].map(({ mode, icon: Icon, label }) => (
                        <button key={mode} onClick={() => onViewModeChange?.(mode)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: isMobile ? '5px 8px' : '6px 12px', borderRadius: 8, fontFamily: FONT_MONO,
                                fontSize: isMobile ? 9 : 10, fontWeight: 700,
                                background: viewMode === mode ? 'rgba(0,245,212,0.12)' : 'transparent',
                                border: viewMode === mode ? '1px solid rgba(0,245,212,0.3)' : '1px solid transparent',
                                color: viewMode === mode ? '#00f5d4' : '#555', cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}>
                            <Icon size={12} /> {!isMobile && label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick search dropdown — clears the button row */}
            <AnimatePresence>
                {showSearch && (
                    <motion.form onSubmit={handleQuickSearch}
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{ position: 'absolute', top: isMobile ? 56 : 64, left: isMobile ? 8 : 16, display: 'flex', gap: 6, pointerEvents: 'auto', zIndex: 20 }}>
                        <input autoFocus value={quickSearch} onChange={e => setQuickSearch(e.target.value)} placeholder="username..."
                            style={{
                                padding: '8px 12px', borderRadius: 10, fontFamily: FONT_MONO, fontSize: 11,
                                background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(139,92,246,0.4)', color: '#fff', width: 180, outline: 'none',
                                backdropFilter: 'blur(16px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            }} />
                        <button type="submit" style={{
                            padding: '8px 14px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                            background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', color: '#fff', border: 'none', cursor: 'pointer',
                            fontFamily: FONT_MONO,
                        }}>GO</button>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Top right — night toggle + share */}
            <div style={{ position: 'absolute', top: isMobile ? 8 : 16, right: isMobile ? 8 : 16, pointerEvents: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                {viewMode === 'city' && (
                    <button onClick={onToggleNight} className="cyber-btn" style={{ ...btnStyle, borderColor: 'rgba(245,166,35,0.25)', color: isNight ? '#f5a623' : '#8b5cf6' }}>
                        {isNight ? <Sun size={14} /> : <Moon size={14} />}
                    </button>
                )}
                <button onClick={handleShare} className="cyber-btn" style={btnStyle}>
                    <Share2 size={14} /> {!isMobile && (viewMode === 'city' ? 'SHARE CITY' : 'SHARE')}
                </button>
            </div>

            {/* ── Side panel ── */}
            <motion.div
                initial={isMobile ? { y: 300, opacity: 0 } : { x: -420, opacity: 0 }}
                animate={isMobile ? { y: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                style={{
                    ...(isMobile ? {
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        width: '100%',
                        maxHeight: panelExpanded ? '85vh' : '45vh',
                        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                        borderRadius: '20px 20px 0 0',
                        marginTop: 0,
                    } : {
                        marginTop: 56,
                        width: 360,
                        borderRadius: 20,
                        maxHeight: 'calc(100vh - 80px)',
                    }),
                    pointerEvents: 'auto',
                    display: 'flex', flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'var(--panel-bg)',
                    border: '1px solid var(--accent-border)',
                    backdropFilter: 'blur(30px)',
                    boxShadow: '0 8px 60px rgba(0,0,0,0.3), 0 0 40px rgba(0,245,212,0.03), inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
            >

                {/* Mobile drag handle */}
                {isMobile && (
                    <div
                        onClick={() => setPanelExpanded(e => !e)}
                        style={{
                            display: 'flex', justifyContent: 'center', padding: '8px 0 4px',
                            cursor: 'pointer', flexShrink: 0,
                        }}
                    >
                        <div style={{
                            width: 36, height: 4, borderRadius: 2,
                            background: 'rgba(255,255,255,0.2)',
                        }} />
                    </div>
                )}
                {/* ── Profile Header ── */}
                <div style={{
                    padding: isMobile ? '14px 16px 12px' : '20px 20px 16px', borderBottom: '1px solid var(--section-border)',
                    background: 'linear-gradient(180deg, rgba(0,245,212,0.03) 0%, transparent 100%)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, marginBottom: 12 }}>
                        {/* Avatar */}
                        <motion.div
                            initial={{ rotate: -180, scale: 0 }}
                            animate={{ rotate: 0, scale: 1 }}
                            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
                            style={{
                                width: isMobile ? 44 : 56, height: isMobile ? 44 : 56, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontFamily: FONT_ORBIT, fontWeight: 900, fontSize: isMobile ? 18 : 22, color: '#030508',
                                background: `linear-gradient(135deg, ${powerTier.color}, #7c3aed)`,
                                boxShadow: `0 4px 24px ${powerTier.color}40`,
                                position: 'relative',
                            }}
                        >
                            {username[0]?.toUpperCase()}
                        </motion.div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: FONT_ORBIT, fontWeight: 900, fontSize: 16, letterSpacing: '0.05em', marginBottom: 4 }}>
                                {username.toUpperCase()}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: 'var(--text-muted)' }}>
                                    {ranking > 0 ? `RANK #${ranking.toLocaleString()}` : 'EXPLORER'}
                                </span>
                                <span style={{
                                    padding: '2px 8px', borderRadius: 6, fontSize: 8, fontWeight: 700,
                                    fontFamily: FONT_ORBIT, color: powerTier.color,
                                    background: `${powerTier.color}10`,
                                    border: `1px solid ${powerTier.color}20`,
                                }}>{powerTier.name}</span>
                            </div>
                        </div>
                    </div>

                    {/* Power Level */}
                    <PowerLevelDisplay level={powerLevel} />

                    {/* Progress ring + stat pills row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
                        <ProgressRing value={totalSolved} max={estimatedTotal} size={isMobile ? 70 : 90} label="SOLVED" />
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {[
                                { icon: Zap, color: '#23d18b', count: easySolved, label: 'EASY' },
                                { icon: Code2, color: '#f5a623', count: medSolved, label: 'MEDIUM' },
                                { icon: Flame, color: '#ff3860', count: hardSolved, label: 'HARD' },
                            ].map(({ icon: Icon, color, count, label }, idx) => (
                                <motion.div
                                    key={label}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + idx * 0.1 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10,
                                        background: `${color}06`, border: `1px solid ${color}12`,
                                        transition: 'all 0.3s ease',
                                    }}
                                >
                                    <Icon size={13} color={color} />
                                    <div>
                                        <div style={{ fontFamily: FONT_ORBIT, fontSize: 13, fontWeight: 700, color }}>{count}</div>
                                        <div style={{ fontFamily: FONT_MONO, fontSize: 7, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Tabs ── */}
                <div style={{ display: 'flex', borderBottom: '1px solid var(--section-border)' }}>
                    {['stats', 'topics', 'activity'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={tabStyle(activeTab === tab)}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* ── Scrollable content ── */}
                <div style={{
                    flex: 1, overflowY: 'auto', padding: isMobile ? '12px 14px' : '16px 20px',
                    scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,245,212,0.15) transparent',
                    WebkitOverflowScrolling: 'touch',
                }}>
                    <AnimatePresence mode="wait">
                        {activeTab === 'stats' && (
                            <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                {/* Achievements */}
                                {sectionTitle('Achievements')}
                                <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                                    {achievements.map((a, i) => (
                                        <AchievementBadge key={a.label} {...a} delay={0.3 + i * 0.08} />
                                    ))}
                                </div>

                                {sectionTitle('Difficulty Breakdown')}
                                <div style={{ marginBottom: 20 }}>
                                    <DiffBar label="EASY" count={easySolved} total={totalSolved} color="#23d18b" index={0} />
                                    <DiffBar label="MEDIUM" count={medSolved} total={totalSolved} color="#f5a623" index={1} />
                                    <DiffBar label="HARD" count={hardSolved} total={totalSolved} color="#ff3860" index={2} />
                                </div>

                                {sectionTitle('Topic Strengths')}
                                <RadarChart districts={districts} size={200} />

                                {/* Quick topic list */}
                                <div style={{ marginTop: 16 }}>
                                    {districts?.slice(0, 5).map((p, i) => {
                                        const c = PLANET_COLORS[i % PLANET_COLORS.length];
                                        return (
                                            <motion.div
                                                key={p.name}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.8 + i * 0.06 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
                                                    borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                                }}
                                            >
                                                <span style={{
                                                    width: 8, height: 8, borderRadius: '50%', background: c,
                                                    boxShadow: `0 0 8px ${c}60`, flexShrink: 0,
                                                }} />
                                                <span style={{
                                                    flex: 1, fontSize: 11, fontFamily: FONT_MONO, color: 'var(--text-secondary)',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }}>{p.name}</span>
                                                <span style={{
                                                    fontSize: 12, fontFamily: FONT_ORBIT, fontWeight: 700, color: c,
                                                }}>{p.problemsSolved}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'topics' && (
                            <motion.div key="topics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                {sectionTitle(`All Districts (${districts?.length})`)}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    {districts?.map((p, i) => {
                                        const c = PLANET_COLORS[i % PLANET_COLORS.length];
                                        const maxSolved = districts[0]?.problemsSolved || 1;
                                        const pct = (p.problemsSolved / maxSolved) * 100;
                                        return (
                                            <motion.div
                                                key={p.name}
                                                initial={{ opacity: 0, x: -15 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 10,
                                                    background: 'var(--topic-row-bg)',
                                                    border: '1px solid var(--topic-row-border)',
                                                    transition: 'all 0.3s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = `${c}08`;
                                                    e.currentTarget.style.borderColor = `${c}20`;
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = 'var(--topic-row-bg)';
                                                    e.currentTarget.style.borderColor = 'var(--topic-row-border)';
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                }}
                                            >
                                                <span style={{
                                                    width: 10, height: 10, borderRadius: '50%', background: c,
                                                    boxShadow: `0 0 8px ${c}60`, flexShrink: 0,
                                                }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{
                                                        fontSize: 11, fontFamily: FONT_MONO, color: 'var(--text-secondary)',
                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
                                                    }}>{p.name}</div>
                                                    <div className="power-bar" style={{ width: '100%', background: 'rgba(255,255,255,0.03)', height: 3, borderRadius: 2, overflow: 'hidden' }}>
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, delay: i * 0.05 }}
                                                            style={{ height: '100%', borderRadius: 2, background: c, boxShadow: `0 0 6px ${c}40` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span style={{
                                                    fontSize: 13, fontFamily: FONT_ORBIT, fontWeight: 700, color: c, flexShrink: 0,
                                                }}>{p.problemsSolved}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'activity' && (
                            <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                {sectionTitle('Recent Submissions')}
                                {recent.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 11, fontStyle: 'italic' }}>No recent activity.</p>}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {recent.map((sub, idx) => {
                                        const ac = sub.statusDisplay === 'Accepted';
                                        return (
                                            <motion.div key={idx}
                                                initial={{ opacity: 0, x: -15 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.06 }}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                                                    background: ac ? 'rgba(35,209,139,0.04)' : 'rgba(255,56,96,0.04)',
                                                    border: `1px solid ${ac ? 'rgba(35,209,139,0.1)' : 'rgba(255,56,96,0.1)'}`,
                                                    transition: 'all 0.3s ease',
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(4px)';
                                                    e.currentTarget.style.borderColor = ac ? 'rgba(35,209,139,0.25)' : 'rgba(255,56,96,0.25)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateX(0)';
                                                    e.currentTarget.style.borderColor = ac ? 'rgba(35,209,139,0.1)' : 'rgba(255,56,96,0.1)';
                                                }}
                                            >
                                                <span style={{
                                                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                                    background: ac ? '#23d18b' : '#ff3860',
                                                    boxShadow: `0 0 8px ${ac ? '#23d18b' : '#ff3860'}`,
                                                }} />
                                                <span style={{
                                                    flex: 1, fontSize: 12, fontFamily: FONT_MONO, color: 'var(--text-secondary)',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                }} title={sub.title}>{sub.title}</span>
                                                <span style={{
                                                    fontSize: 10, fontFamily: FONT_ORBIT, fontWeight: 700, flexShrink: 0,
                                                    color: ac ? '#23d18b' : '#ff3860',
                                                    padding: '2px 8px', borderRadius: 6,
                                                    background: ac ? 'rgba(35,209,139,0.1)' : 'rgba(255,56,96,0.1)',
                                                }}>{ac ? 'AC' : 'WA'}</span>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* ── Footer ── */}
                <div style={{
                    padding: isMobile ? '8px 14px' : '10px 20px', borderTop: '1px solid var(--section-border)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ color: 'var(--text-ultra-muted)', fontSize: 9, fontFamily: FONT_MONO, letterSpacing: '0.1em' }}>
                        {isMobile ? 'PINCH TO ZOOM' : (viewMode === 'city' ? 'DRAG TO EXPLORE CITY' : 'DRAG TO ORBIT // SCROLL TO ZOOM')}
                    </span>
                    <span style={{ color: powerTier.color, fontSize: 9, fontFamily: FONT_ORBIT, fontWeight: 700, opacity: 0.5 }}>
                        v2.0
                    </span>
                </div>
            </motion.div>
        </div>
    );
}
