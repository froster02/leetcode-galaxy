import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Star, Users, ChevronRight, Rocket, Sparkles, Globe, Terminal } from 'lucide-react';

const FEATURED = ['cpcs', 'votrubac', '1337c0d3r', 'Ma_Lin', 'leetgoat_dot_io'];
const FONT_ORBIT = 'Orbitron, sans-serif';
const FONT_MONO = '"Share Tech Mono", monospace';

/* ── Animated counter ────────────────────────────────── */
function Counter({ target, duration = 2000 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        let rafId;
        const start = performance.now();
        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [target, duration]);
    return <span>{count.toLocaleString()}</span>;
}

function useTotalQuestionsCount() {
    const [totalQuestions, setTotalQuestions] = useState(3907);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const res = await fetch('https://leetcode.com/graphql', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: `query questionStats { allQuestionsCount { difficulty count } }`,
                    }),
                });

                if (!res.ok) throw new Error('Failed to fetch total questions');

                const json = await res.json();
                const counts = Array.isArray(json?.data?.allQuestionsCount) ? json.data.allQuestionsCount : [];
                const total = counts.reduce((sum, item) => sum + (Number(item?.count) || 0), 0);
                if (!cancelled && total > 0) setTotalQuestions(total);
            } catch {
                if (!cancelled) setTotalQuestions(3907);
            }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    return totalQuestions;
}

/* ── Last weekly contest participant count ───────────────
   Anchored at Weekly Contest 431 = 2025-01-12 (known).
   Computes current slug dynamically, tries ±2 around it,
   falls back to 28,400 if LeetCode API unreachable.
────────────────────────────────────────────────────────── */
function useLastContestParticipants() {
    const [count, setCount] = useState(28400);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const ANCHOR_N    = 431;
                const ANCHOR_DATE = new Date('2025-01-12T02:30:00Z').getTime();
                const weeksSince  = Math.floor((Date.now() - ANCHOR_DATE) / (7 * 24 * 60 * 60 * 1000));
                const base        = ANCHOR_N + weeksSince;

                for (const n of [base, base - 1, base - 2, base + 1]) {
                    const slug = `weekly-contest-${n}`;
                    const res  = await fetch(`https://leetcode.com/contest/api/info/${slug}/`, {
                        signal: AbortSignal.timeout(5000),
                    });
                    if (!res.ok) continue;
                    const json = await res.json();
                    const num  = json?.contest?.user_num;
                    if (num && num > 1000 && !cancelled) {
                        setCount(num);
                        return;
                    }
                }
            } catch { /* use fallback */ }
        };

        load();
        return () => { cancelled = true; };
    }, []);

    return count;
}

/* ── Longest possible streak — days since daily challenge launched ────
   Daily Challenge went live 2020-04-01. Anyone solving every single day
   from launch has exactly this many days. No API needed — computed live.
────────────────────────────────────────────────────────────────────── */
function useLongestStreak() {
    const DAILY_CHALLENGE_LAUNCH = new Date('2020-04-01T00:00:00Z').getTime();
    return Math.floor((Date.now() - DAILY_CHALLENGE_LAUNCH) / (24 * 60 * 60 * 1000));
}

/* ── Recently-explored chip marquee ──────────────────── */

/* ── Typewriter with cursor ──────────────────────────── */
function TypeWriter({ text, delay = 40 }) {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
        let i = 0;
        const timer = setInterval(() => {
            setDisplayed(text.slice(0, i));
            i++;
            if (i > text.length) clearInterval(timer);
        }, delay);
        return () => clearInterval(timer);
    }, [text, delay]);
    return <span>{displayed}<span style={{ animation: 'blink 1s steps(1) infinite', color: '#00f5d4' }}>_</span></span>;
}

/* ── Floating grid background ────────────────────────── */
function GridBackground() {
    return (
        <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
            opacity: 0.03,
            backgroundImage: `
                linear-gradient(rgba(0,245,212,0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,245,212,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        }} />
    );
}

/* ── Orbiting ring decoration ────────────────────────── */
function OrbitRing({ size, duration, color, opacity = 0.08, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            transition={{
                opacity: { delay, duration: 1 },
                scale: { delay, duration: 1 },
                rotate: { duration, repeat: Infinity, ease: 'linear' },
            }}
            style={{
                position: 'absolute',
                width: size, height: size,
                border: `1px solid ${color}`,
                borderRadius: '50%',
                opacity,
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
            }}
        />
    );
}

/* ── Stat card with hover effect ─────────────────────── */
function StatCard({ icon: Icon, value, label, color, delay }) {
    const [hovered, setHovered] = useState(false);
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.6 }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '12px 14px', borderRadius: 16, cursor: 'default',
                minWidth: 0, flex: '1 1 auto', maxWidth: 160,
                background: hovered ? `rgba(${color === '#00f5d4' ? '0,245,212' : color === '#f5a623' ? '245,166,35' : '139,92,246'},0.06)` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.04)'}`,
                transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)',
                transform: hovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
                boxShadow: hovered ? `0 8px 40px ${color}15` : 'none',
            }}
        >
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}10`, border: `1px solid ${color}20`,
            }}>
                <Icon size={16} style={{ color }} />
            </div>
            <div style={{
                fontFamily: FONT_ORBIT, fontSize: 22, fontWeight: 900, color,
                textShadow: hovered ? `0 0 20px ${color}40` : 'none',
                transition: 'text-shadow 0.3s ease',
            }}>
                <Counter target={value} duration={2500} />
            </div>
            <div style={{
                color: 'var(--text-muted)', fontSize: 9, fontFamily: FONT_MONO,
                letterSpacing: '0.15em',
            }}>{label}</div>
        </motion.div>
    );
}

/* ── Featured user card with holographic effect ──────── */
function FeaturedCard({ user, index, onSelect }) {
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef();
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * -12, y: x * 12 });
    };

    const handleMouseLeave = () => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
    };

    const colors = ['#00f5d4', '#8b5cf6', '#f5a623', '#3b82f6', '#ef4444', '#ec4899', '#10b981', '#f59e0b'];
    const color = colors[index % colors.length];

    return (
        <motion.button
            ref={cardRef}
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.0 + index * 0.06, type: 'spring', stiffness: 200 }}
            onClick={() => onSelect(user)}
            onMouseEnter={() => setHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="cyber-btn"
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 12, cursor: 'pointer',
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                background: hovered ? `${color}12` : 'rgba(10,14,22,0.75)',
                border: `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.08)'}`,
                color: hovered ? color : '#b7bfcc',
                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${hovered ? 'translateZ(8px)' : ''}`,
                boxShadow: hovered ? `0 4px 20px ${color}20, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
                position: 'relative', overflow: 'hidden',
            }}
        >
            {/* Shimmer effect on hover */}
            {hovered && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: `linear-gradient(105deg, transparent 40%, ${color}08 45%, ${color}15 50%, ${color}08 55%, transparent 60%)`,
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s ease-in-out infinite',
                }} />
            )}
            <span style={{
                width: 10, height: 10, borderRadius: '50%',
                background: hovered ? color : `${color}60`,
                boxShadow: hovered ? `0 0 12px ${color}` : 'none',
                transition: 'all 0.3s ease', flexShrink: 0,
            }} />
            <span style={{ position: 'relative' }}>{user}</span>
            <ChevronRight size={12} style={{
                transition: 'transform 0.3s ease',
                transform: hovered ? 'translateX(3px)' : 'translateX(0)',
            }} />
        </motion.button>
    );
}

/* ── Command palette hint ────────────────────────────── */
function CommandHint() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(10,14,22,0.75)',
                border: '1px solid rgba(255,255,255,0.06)',
                backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                marginTop: 24,
            }}
        >
            <Terminal size={12} style={{ color: '#9aa3b2' }} />
            <span style={{ color: '#b7bfcc', fontSize: 10, fontFamily: FONT_MONO, letterSpacing: '0.1em' }}>
                TIP: TRY "rocky", "tars", "murph", "cooper", OR "hail mary"
            </span>
        </motion.div>
    );
}

/* ── Main component ──────────────────────────────────── */
function LandingUI({ onSearch, errorMessage = '' }) {
    const [username, setUsername] = useState('');
    const [focused, setFocused] = useState(false);
    const [searchHovered, setSearchHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const inputRef = useRef();
    const totalQuestions       = useTotalQuestionsCount();
    const contestParticipants  = useLastContestParticipants();
    const longestStreak        = useLongestStreak();

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const [eggType, setEggType] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        const val = username.trim();
        if (!val) return;
        const lower = val.toLowerCase();
        if (lower === 'rocky' || lower === 'tars' || lower === 'murph' || lower === 'cooper' || lower === 'hail mary') {
            setEggType(lower);
            setUsername('');
            setTimeout(() => setEggType(null), 4800);
            return;
        }
        onSearch(val);
    };

    useEffect(() => {
        const handler = (e) => {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? '16px 12px' : 16,
            pointerEvents: 'none', userSelect: 'none', zIndex: 10,
            overflowY: isMobile ? 'auto' : 'hidden',
            WebkitOverflowScrolling: 'touch',
        }}>
            <div aria-hidden style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 620px 560px at 50% 50%, rgba(3,5,8,0.82) 0%, rgba(3,5,8,0.62) 40%, rgba(3,5,8,0.28) 70%, transparent 100%)',
            }} />
            <GridBackground />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    pointerEvents: 'auto', width: '100%', maxWidth: 680, position: 'relative',
                }}
            >
                {/* Decorative orbit rings behind title */}
                {!isMobile && (
                    <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                        <OrbitRing size={500} duration={30} color="rgba(0,245,212,0.15)" opacity={0.06} delay={0.5} />
                        <OrbitRing size={400} duration={25} color="rgba(139,92,246,0.15)" opacity={0.05} delay={0.7} />
                        <OrbitRing size={300} duration={20} color="rgba(59,130,246,0.15)" opacity={0.04} delay={0.9} />
                    </div>
                )}

                {/* ── Version badge ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 16px', borderRadius: 999, marginBottom: 20,
                        background: 'rgba(139,92,246,0.06)',
                        border: '1px solid rgba(139,92,246,0.15)',
                    }}
                >
                    <Sparkles size={12} style={{ color: '#a78bfa' }} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#c4b5fd', letterSpacing: '0.1em' }}>
                        v2.0 — HAIL MARY // ENDURANCE
                    </span>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#23d18b',
                        boxShadow: '0 0 8px #23d18b', animation: 'energy-pulse 2s ease infinite',
                    }} />
                </motion.div>

                {/* ── Title with glitch ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
                    style={{ marginBottom: 8, position: 'relative', textAlign: 'center' }}
                >
                    <div style={{
                        position: 'absolute', inset: 0, filter: 'blur(60px)',
                        opacity: 0.15, background: 'radial-gradient(circle, #00f5d4, #7c3aed)',
                        borderRadius: '50%', transform: 'scale(2)',
                    }} />
                    <h1
                        className="glitch-text"
                        data-text="LC GALAXY"
                        style={{
                            position: 'relative',
                            fontSize: 'clamp(44px, 9vw, 80px)',
                            fontFamily: FONT_ORBIT, fontWeight: 900,
                            letterSpacing: '0.08em', lineHeight: 1.05,
                            background: 'linear-gradient(135deg, #00f5d4 0%, #a78bfa 50%, #00f5d4 100%)',
                            backgroundSize: '200% 200%',
                            animation: 'gradient-shift 14s ease infinite',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent', color: 'transparent',
                        }}
                    >
                        LC GALAXY
                    </h1>
                </motion.div>

                {/* ── Subtitle ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        color: '#9aa3b2', marginBottom: 28, fontFamily: FONT_MONO,
                        fontSize: 13, textAlign: 'center', letterSpacing: '0.18em', height: 24,
                        textShadow: '0 0 6px rgba(3,5,8,0.9), 0 0 12px rgba(3,5,8,0.7)',
                    }}
                >
                    <TypeWriter text="LC // CODE FROM EVERYWHERE" delay={35} />
                </motion.p>

                {/* ── Stats row ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{ display: 'flex', gap: isMobile ? 8 : 16, marginBottom: isMobile ? 20 : 32, flexWrap: 'wrap', justifyContent: 'center' }}
                >
                    <StatCard icon={Zap}   value={totalQuestions      ?? 3907}  label="TOTAL QUESTIONS"   color="#00f5d4" delay={0.9} />
                    <StatCard icon={Users} value={contestParticipants ?? 28400} label="LAST CONTEST"       color="#f5a623" delay={1.0} />
                    <StatCard icon={Star}  value={longestStreak        ?? 2200}  label="MAX DAILY STREAK"  color="#8b5cf6" delay={1.1} />
                </motion.div>

                {/* ── Search bar ── */}
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                    onMouseEnter={() => setSearchHovered(true)}
                    onMouseLeave={() => setSearchHovered(false)}
                    className="gradient-border"
                    style={{
                        position: 'relative', width: '100%', maxWidth: 480, marginBottom: 16,
                        borderRadius: 16,
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        {/* Animated glow border */}
                        <div style={{
                            position: 'absolute', inset: -2, borderRadius: 16, filter: 'blur(8px)',
                            background: 'linear-gradient(90deg, #00f5d4, #7c3aed, #f5a623, #00f5d4)',
                            backgroundSize: '300% 100%',
                            animation: 'gradient-shift 4s ease infinite',
                            opacity: focused ? 0.7 : searchHovered ? 0.4 : 0.15,
                            transition: 'opacity 0.4s ease',
                        }} />
                        <div style={{
                            position: 'relative', display: 'flex', alignItems: 'center',
                            background: 'var(--input-bg)', borderRadius: 16, overflow: 'hidden',
                            border: '1px solid var(--section-border)',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 48, flexShrink: 0,
                            }}>
                                <Search size={16} style={{
                                    color: focused ? 'var(--accent)' : 'var(--text-muted)',
                                    transition: 'color 0.3s ease',
                                }} />
                            </div>
                            <input
                                ref={inputRef}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setFocused(true)}
                                onBlur={() => setFocused(false)}
                                placeholder={isMobile ? 'USERNAME' : 'ENTER LC HANDLE'}
                                style={{
                                    flex: 1, background: 'transparent', color: 'var(--input-color)',
                                    border: 'none', padding: isMobile ? '14px 0' : '16px 0',
                                    fontFamily: FONT_MONO, fontSize: isMobile ? 12 : 14, outline: 'none',
                                    letterSpacing: '0.05em',
                                    minWidth: 0,
                                }}
                            />
                            <button
                                type="submit"
                                className="cyber-btn"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 20px', margin: 6, borderRadius: 12,
                                    border: 'none', cursor: 'pointer',
                                    fontFamily: FONT_ORBIT, fontSize: 11, fontWeight: 700,
                                    color: '#030508', letterSpacing: '0.08em',
                                    background: 'linear-gradient(135deg, #00f5d4, #00b8a0)',
                                    boxShadow: '0 0 20px rgba(0,245,212,0.25)',
                                    transition: 'all 0.3s ease',
                                    position: 'relative', overflow: 'hidden',
                                }}
                            >
                                <Rocket size={14} />
                                LAUNCH
                            </button>
                        </div>
                    </div>
                    {!isMobile && (
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            marginTop: 10, padding: '0 8px',
                        }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center', gap: 4 }}>
                                Press <kbd style={{
                                    background: 'var(--kbd-bg)', padding: '2px 7px',
                                    borderRadius: 4, color: 'var(--text-secondary)', fontSize: 10,
                                    border: '1px solid var(--kbd-border)',
                                }}>/</kbd> to focus
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: FONT_MONO }}>
                                Enter to launch
                            </span>
                        </div>
                    )}
                </motion.form>

                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            marginTop: 2,
                            marginBottom: 6,
                            padding: '7px 12px',
                            borderRadius: 10,
                            background: 'rgba(255,56,96,0.08)',
                            border: '1px solid rgba(255,56,96,0.25)',
                            color: '#ff7d95',
                            fontFamily: FONT_MONO,
                            fontSize: 10,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {errorMessage}
                    </motion.div>
                )}

                {/* ── Featured explorers ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    style={{ marginTop: 28, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                    <div style={{
                        textAlign: 'center', color: '#b7bfcc', fontSize: 10,
                        fontFamily: FONT_MONO, letterSpacing: '0.15em',
                        marginBottom: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                        padding: '5px 14px', borderRadius: 999,
                        background: 'rgba(3,5,8,0.7)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
                        marginLeft: 'auto', marginRight: 'auto',
                    }}>
                        <span style={{ height: 1, width: 40, background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.35))' }} />
                        <Star size={10} style={{ color: 'var(--amber)' }} />
                        LEGENDARY EXPLORERS
                        <Star size={10} style={{ color: 'var(--amber)' }} />
                        <span style={{ height: 1, width: 40, background: 'linear-gradient(90deg, rgba(148,163,184,0.35), transparent)' }} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? 6 : 8 }}>
                        {FEATURED.slice(0, isMobile ? 4 : FEATURED.length).map((user, i) => (
                            <FeaturedCard key={user} user={user} index={i} onSelect={onSearch} />
                        ))}
                    </div>
                </motion.div>

                {/* ── Hint ── */}
                {!isMobile && <CommandHint />}
            </motion.div>

            {/* ── Easter egg overlays ── */}
            <AnimatePresence>
                {eggType && <EasterEggOverlay type={eggType} />}
            </AnimatePresence>
        </div>
    );
}

export default React.memo(LandingUI);

/* ── Easter egg overlay — PHM + Interstellar references ── */
function EasterEggOverlay({ type }) {
    const content = {
        rocky: {
            color: '#d4c168',
            title: 'AMAZE.',
            body: 'QUESTION? ... ANSWER: YES.\nFIST MY BUMP, HUMAN ENGINEER.',
            sub: '— Rocky, Eridani 40',
        },
        tars: {
            color: '#d1d5db',
            title: 'HUMOR SETTING: 100%',
            body: 'EVERYBODY GOOD? PLENTY OF SLAVES\nFOR MY ROBOT COLONY?',
            sub: '— TARS, Endurance mission',
        },
        murph: {
            color: '#00f5d4',
            title: 'EUREKA.',
            body: 'DO NOT GO GENTLE INTO THAT GOOD NIGHT.\nRAGE, RAGE AGAINST THE DYING OF THE LIGHT.',
            sub: '— Murph Cooper',
        },
        cooper: {
            color: '#f5a623',
            title: "WE'VE GOT A WAVE.",
            body: "LOVE IS THE ONE THING\nTHAT TRANSCENDS TIME AND SPACE.",
            sub: '— Cooper, Endurance',
        },
        'hail mary': {
            color: '#ff6b35',
            title: 'HAIL MARY ONLINE',
            body: 'ASTROPHAGE CONTAINMENT: NOMINAL\nTAUMOEBA INCUBATION: ACTIVE',
            sub: '— Dr. Ryland Grace',
        },
    }[type];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
                background: `radial-gradient(ellipse at center, ${content.color}18 0%, transparent 60%)`,
            }}
        >
            <div style={{
                padding: 'clamp(20px, 5vw, 28px) clamp(16px, 8vw, 44px)', borderRadius: 4,
                background: 'linear-gradient(180deg, rgba(6,9,13,0.95), rgba(3,5,8,0.95))',
                border: `1px solid ${content.color}60`,
                boxShadow: `0 0 60px ${content.color}40, inset 0 0 40px ${content.color}08`,
                textAlign: 'center', fontFamily: FONT_MONO,
                animation: type === 'hail mary' ? 'astrophage-pulse 1.6s ease-in-out infinite' : 'none',
            }}>
                <div style={{
                    fontFamily: FONT_ORBIT, fontSize: 32, fontWeight: 900,
                    color: content.color, letterSpacing: '0.2em', marginBottom: 14,
                    textShadow: `0 0 20px ${content.color}80`,
                }}>{content.title}</div>
                <div style={{
                    color: 'var(--text-secondary)', fontSize: 13, letterSpacing: '0.08em',
                    lineHeight: 1.8, marginBottom: 16, whiteSpace: 'pre-line',
                }}>{content.body}</div>
                <div style={{
                    color: content.color, fontSize: 10, letterSpacing: '0.15em',
                    fontStyle: 'italic', opacity: 0.75,
                }}>{content.sub}</div>
                {type === 'rocky' && (
                    <div style={{
                        marginTop: 18, display: 'flex', justifyContent: 'center', gap: 4, height: 18,
                    }}>
                        {[0, 1, 2, 3, 4, 5, 6].map(i => (
                            <span key={i} style={{
                                width: 3, height: '100%', background: content.color, borderRadius: 1,
                                animation: `rocky-wave 0.6s ease-in-out infinite ${i * 0.08}s`,
                                transformOrigin: 'center',
                                boxShadow: `0 0 6px ${content.color}`,
                            }} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
