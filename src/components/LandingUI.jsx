import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Star, Users, ChevronRight, Rocket, Sparkles, Globe, Terminal } from 'lucide-react';

const FEATURED = ['neal_wu', 'tourist', 'jiangly', 'Um_nik', 'Petr', 'ecnerwala', 'ksun48', 'yxc'];
const FONT_ORBIT = 'Orbitron, sans-serif';
const FONT_MONO = '"Share Tech Mono", monospace';

/* ── Animated counter ────────────────────────────────── */
function Counter({ target, duration = 2000 }) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        const start = performance.now();
        const tick = (now) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [target, duration]);
    return <span>{count.toLocaleString()}</span>;
}

/* ── Recently-explored chip marquee ──────────────────── */
function RecentChips({ recent, onSelect }) {
    if (!recent || recent.length === 0) return null;
    const doubled = [...recent, ...recent];
    return (
        <div style={{
            marginTop: 16, overflow: 'hidden', width: '100%', maxWidth: 480,
            maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
        }}>
            <motion.div
                style={{ display: 'flex', flexDirection: 'row', gap: 8, whiteSpace: 'nowrap' }}
                animate={{ x: ['0%', '-50%'] }}
                transition={{ repeat: Infinity, duration: recent.length * 3, ease: 'linear' }}
            >
                {doubled.map((u, i) => (
                    <button
                        key={`${u}-${i}`}
                        onClick={() => onSelect(u)}
                        className="cyber-btn"
                        style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 999, fontSize: 11, fontFamily: FONT_MONO,
                            border: '1px solid rgba(0,245,212,0.2)', background: 'rgba(0,245,212,0.04)',
                            color: '#00f5d4', cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <Star size={10} />{u}
                    </button>
                ))}
            </motion.div>
        </div>
    );
}

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
                padding: '16px 20px', borderRadius: 16, cursor: 'default',
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
                color: '#4b5563', fontSize: 9, fontFamily: FONT_MONO,
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
                background: hovered ? `${color}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${hovered ? color + '40' : 'rgba(255,255,255,0.06)'}`,
                color: hovered ? color : '#6b7280',
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
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.04)',
                marginTop: 24,
            }}
        >
            <Terminal size={12} style={{ color: '#374151' }} />
            <span style={{ color: '#374151', fontSize: 10, fontFamily: FONT_MONO, letterSpacing: '0.1em' }}>
                TIP: CLICK GLOWING BEACONS IN THE GALAXY TO EXPLORE
            </span>
        </motion.div>
    );
}

/* ── Main component ──────────────────────────────────── */
export default function LandingUI({ onSearch, recentlyExplored = [] }) {
    const [username, setUsername] = useState('');
    const [focused, setFocused] = useState(false);
    const [searchHovered, setSearchHovered] = useState(false);
    const inputRef = useRef();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (username.trim()) onSearch(username.trim());
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
            alignItems: 'center', justifyContent: 'center', padding: 16,
            pointerEvents: 'none', userSelect: 'none', zIndex: 10,
        }}>
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
                <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
                    <OrbitRing size={500} duration={30} color="rgba(0,245,212,0.15)" opacity={0.06} delay={0.5} />
                    <OrbitRing size={400} duration={25} color="rgba(139,92,246,0.15)" opacity={0.05} delay={0.7} />
                    <OrbitRing size={300} duration={20} color="rgba(59,130,246,0.15)" opacity={0.04} delay={0.9} />
                </div>

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
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: '#a78bfa', letterSpacing: '0.1em' }}>
                        v2.0 — NOW WITH HYPERSPACE
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
                        data-text="LEETCODE"
                        style={{
                            position: 'relative',
                            fontSize: 'clamp(44px, 9vw, 80px)',
                            fontFamily: FONT_ORBIT, fontWeight: 900,
                            letterSpacing: '0.1em', lineHeight: 1.05,
                            background: 'linear-gradient(135deg, #00f5d4 0%, #7c3aed 50%, #00f5d4 100%)',
                            backgroundSize: '200% 200%',
                            animation: 'gradient-shift 6s ease infinite',
                            WebkitBackgroundClip: 'text', backgroundClip: 'text',
                            WebkitTextFillColor: 'transparent', color: 'transparent',
                        }}
                    >
                        LEETCODE
                    </h1>
                    <h1 style={{
                        position: 'relative',
                        fontSize: 'clamp(44px, 9vw, 80px)',
                        fontFamily: FONT_ORBIT, fontWeight: 900,
                        letterSpacing: '0.1em', lineHeight: 1.05,
                        background: 'linear-gradient(135deg, #7c3aed 0%, #00f5d4 50%, #7c3aed 100%)',
                        backgroundSize: '200% 200%',
                        animation: 'gradient-shift 6s ease infinite',
                        WebkitBackgroundClip: 'text', backgroundClip: 'text',
                        WebkitTextFillColor: 'transparent', color: 'transparent',
                    }}>
                        GALAXY
                    </h1>
                </motion.div>

                {/* ── Subtitle ── */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        color: '#6b7280', marginBottom: 28, fontFamily: FONT_MONO,
                        fontSize: 13, textAlign: 'center', letterSpacing: '0.18em', height: 24,
                    }}
                >
                    <TypeWriter text="YOUR CODING UNIVERSE — VISUALIZED IN 3D" delay={35} />
                </motion.p>

                {/* ── Stats row ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{ display: 'flex', gap: 16, marginBottom: 32 }}
                >
                    <StatCard icon={Users} value={4829142} label="EXPLORERS" color="#00f5d4" delay={0.9} />
                    <StatCard icon={Zap} value={3100000} label="SOLVED TODAY" color="#f5a623" delay={1.0} />
                    <StatCard icon={Globe} value={196} label="COUNTRIES" color="#8b5cf6" delay={1.1} />
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
                            background: '#060b14', borderRadius: 16, overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: 48, flexShrink: 0,
                            }}>
                                <Search size={16} style={{
                                    color: focused ? '#00f5d4' : '#374151',
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
                                placeholder="ENTER LEETCODE USERNAME"
                                style={{
                                    flex: 1, background: 'transparent', color: '#fff',
                                    border: 'none', padding: '16px 0',
                                    fontFamily: FONT_MONO, fontSize: 14, outline: 'none',
                                    letterSpacing: '0.05em',
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
                    <div style={{
                        display: 'flex', justifyContent: 'space-between',
                        marginTop: 10, padding: '0 8px',
                    }}>
                        <span style={{ color: '#374151', fontSize: 10, fontFamily: FONT_MONO, display: 'flex', alignItems: 'center', gap: 4 }}>
                            Press <kbd style={{
                                background: 'rgba(255,255,255,0.06)', padding: '2px 7px',
                                borderRadius: 4, color: '#6b7280', fontSize: 10,
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}>/</kbd> to focus
                        </span>
                        <span style={{ color: '#374151', fontSize: 10, fontFamily: FONT_MONO }}>
                            Enter to launch
                        </span>
                    </div>
                </motion.form>

                {/* ── Recently explored ── */}
                <AnimatePresence>
                    {recentlyExplored.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        >
                            <div style={{
                                color: '#374151', fontSize: 10, fontFamily: FONT_MONO,
                                marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8,
                                letterSpacing: '0.12em',
                            }}>
                                <span style={{ width: 20, height: 1, background: '#1f2937' }} />
                                RECENTLY EXPLORED
                                <span style={{ width: 20, height: 1, background: '#1f2937' }} />
                            </div>
                            <RecentChips recent={recentlyExplored} onSelect={onSearch} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── Featured explorers ── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    style={{ marginTop: 28, width: '100%' }}
                >
                    <div style={{
                        textAlign: 'center', color: '#374151', fontSize: 10,
                        fontFamily: FONT_MONO, letterSpacing: '0.15em',
                        marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                    }}>
                        <span style={{ height: 1, width: 60, background: 'linear-gradient(90deg, transparent, #1f2937)' }} />
                        <Star size={10} style={{ color: '#374151' }} />
                        LEGENDARY GALAXIES
                        <Star size={10} style={{ color: '#374151' }} />
                        <span style={{ height: 1, width: 60, background: 'linear-gradient(90deg, #1f2937, transparent)' }} />
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                        {FEATURED.map((user, i) => (
                            <FeaturedCard key={user} user={user} index={i} onSelect={onSearch} />
                        ))}
                    </div>
                </motion.div>

                {/* ── Hint ── */}
                <CommandHint />
            </motion.div>
        </div>
    );
}
