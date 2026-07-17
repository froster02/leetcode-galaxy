import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Star, Users, ChevronRight, Rocket, Sparkles, Globe, Terminal } from 'lucide-react';
import { API, timeoutSignal } from '../hooks/useLeetCode';
import useIsMobile from '../hooks/useIsMobile';

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
                // leetcode.com/graphql blocks cross-origin requests, so we go
                // through the same Alfa API the profile search uses.
                const res = await fetch(`${API}/problems?limit=1`, {
                    signal: timeoutSignal(12000),
                });

                if (!res.ok) throw new Error('Failed to fetch total questions');

                const json = await res.json();
                const total = Number(json?.totalQuestions);
                if (!cancelled && Number.isFinite(total) && total > 0) setTotalQuestions(total);
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
   leetcode.com/contest/api is CORS-blocked from the browser and there is
   no Alfa API equivalent, so this is a typical-participation estimate,
   not a live number.
────────────────────────────────────────────────────────── */
function useLastContestParticipants() {
    return 28400;
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

/* ── Stat card ────────────────────────────────────────── */
const StatCard = React.memo(function StatCard({ icon: Icon, value, label, color, delay }) {
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
                padding: '12px 14px', borderRadius: 12, cursor: 'default',
                minWidth: 0, flex: '1 1 auto', maxWidth: 160,
                background: 'var(--bg-surface)',
                border: `1px solid ${hovered ? color + '50' : 'var(--border)'}`,
                transition: 'border-color 0.2s ease',
            }}
        >
            <div style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${color}10`, border: `1px solid ${color}20`,
            }}>
                <Icon size={16} style={{ color }} />
            </div>
            <div style={{ fontFamily: FONT_ORBIT, fontSize: 22, fontWeight: 900, color }}>
                <Counter target={value} duration={2500} />
            </div>
            <div style={{
                color: 'var(--text-muted)', fontSize: 9, fontFamily: FONT_MONO,
                letterSpacing: '0.15em',
            }}>{label}</div>
        </motion.div>
    );
});

/* ── Featured user card ───────────────────────────────── */
const FeaturedCard = React.memo(function FeaturedCard({ user, index, onSelect }) {
    const [hovered, setHovered] = useState(false);

    const colors = ['#00f5d4', '#f5a623', '#3b82f6', '#ef4444', '#ec4899', '#10b981', '#f59e0b', '#00f5d4'];
    const color = colors[index % colors.length];

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 1.0 + index * 0.06, type: 'spring', stiffness: 200 }}
            onClick={() => onSelect(user)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderRadius: 12, cursor: 'pointer', minHeight: 44,
                fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                background: 'var(--bg-surface)',
                border: `1px solid ${hovered ? color + '50' : 'var(--border)'}`,
                color: hovered ? color : '#b7bfcc',
                transition: 'border-color 0.2s ease, color 0.2s ease',
                position: 'relative',
            }}
        >
            <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: color,
                flexShrink: 0,
            }} />
            <span>{user}</span>
            <ChevronRight size={12} />
        </motion.button>
    );
});

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
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
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
function LandingUI({ onSearch }) {
    const [username, setUsername] = useState('');
    const [focused, setFocused] = useState(false);
    const [searchHovered, setSearchHovered] = useState(false);
    const isMobile = useIsMobile();
    const inputRef = useRef();
    const chipRowRef = useRef();
    const totalQuestions       = useTotalQuestionsCount();
    const contestParticipants  = useLastContestParticipants();
    const longestStreak        = useLongestStreak();

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

    /* Arrow-key nav across the Legendary Explorers chip row */
    const handleChipRowKeyDown = (e) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(e.key)) return;
        const buttons = Array.from(chipRowRef.current?.querySelectorAll('button') || []);
        const idx = buttons.indexOf(document.activeElement);
        if (idx === -1) return;
        e.preventDefault();
        const next = e.key === 'ArrowRight' ? (idx + 1) % buttons.length
                   : e.key === 'ArrowLeft'  ? (idx - 1 + buttons.length) % buttons.length
                   : e.key === 'Home'       ? 0
                   : buttons.length - 1;
        buttons[next]?.focus();
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
            {/* ── GitHub link — top-left ── */}
            <a
                href="https://github.com/froster02/leetcode-galaxy"
                target="_blank"
                rel="noreferrer"
                style={{
                    position: 'absolute', top: 16, left: 16,
                    display: 'flex', alignItems: 'center', gap: 6,
                    pointerEvents: 'auto',
                    color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                    fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
                    padding: '5px 10px', borderRadius: 8,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-surface)',
                    transition: 'color 0.18s, border-color 0.18s',
                    zIndex: 20,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                {!isMobile && <span>GITHUB</span>}
            </a>

            {/* ── Made by — bottom-right ── */}
            <div style={{
                position: 'absolute', bottom: 16, right: 16, zIndex: 20,
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.08em',
                color: 'rgba(255,255,255,0.7)',
                padding: '5px 10px', borderRadius: 8,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                pointerEvents: 'none',
            }}>
                <span>made with</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444" style={{ flexShrink: 0 }}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                <span>by froster02</span>
            </div>

            {/* ── Mobile warning popup ── */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    pointerEvents: 'auto', width: '100%', maxWidth: 680, position: 'relative',
                }}
            >
                {/* ── Version badge ── */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 16px', borderRadius: 999, marginBottom: 20,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <Sparkles size={12} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>
                        v2.0 — HAIL MARY // ENDURANCE
                    </span>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#23d18b',
                    }} />
                </motion.div>

                {/* ── Title ── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, type: 'spring' }}
                    style={{ marginBottom: 8, position: 'relative', textAlign: 'center' }}
                >
                    <h1
                        style={{
                            fontSize: 'clamp(44px, 9vw, 80px)',
                            fontFamily: FONT_ORBIT, fontWeight: 900,
                            letterSpacing: '0.08em', lineHeight: 1.05,
                            color: 'var(--accent)',
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
                        color: 'var(--text-secondary)', marginBottom: 12, fontFamily: FONT_MONO,
                        fontSize: 13, textAlign: 'center', letterSpacing: '0.18em', height: 24,
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
                    <StatCard icon={Star}  value={longestStreak        ?? 2200}  label="MAX DAILY STREAK"  color="#3b82f6" delay={1.1} />
                </motion.div>

                {/* ── Search bar ── */}
                <motion.form
                    onSubmit={handleSubmit}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0, duration: 0.6 }}
                    onMouseEnter={() => setSearchHovered(true)}
                    onMouseLeave={() => setSearchHovered(false)}
                    style={{
                        position: 'relative', width: '100%', maxWidth: 480, marginBottom: 16,
                        borderRadius: 16,
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            position: 'relative', display: 'flex', alignItems: 'center',
                            background: 'var(--input-bg)', borderRadius: 16, overflow: 'hidden',
                            border: `1px solid ${focused ? 'var(--accent-border)' : searchHovered ? 'var(--border)' : 'var(--section-border)'}`,
                            transition: 'border-color 0.2s ease',
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
                                    fontFamily: FONT_MONO, fontSize: isMobile ? 16 : 14, outline: 'none',
                                    letterSpacing: '0.05em',
                                    minWidth: 0,
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 20px', margin: 6, borderRadius: 12, minHeight: 44,
                                    border: 'none', cursor: 'pointer',
                                    fontFamily: FONT_ORBIT, fontSize: 11, fontWeight: 700,
                                    color: '#030508', letterSpacing: '0.08em',
                                    background: 'var(--accent)',
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
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        marginLeft: 'auto', marginRight: 'auto',
                    }}>
                        <span style={{ height: 1, width: 40, background: 'var(--border)' }} />
                        <Star size={10} style={{ color: 'var(--amber)' }} />
                        LEGENDARY EXPLORERS
                        <Star size={10} style={{ color: 'var(--amber)' }} />
                        <span style={{ height: 1, width: 40, background: 'var(--border)' }} />
                    </div>
                    <div ref={chipRowRef} onKeyDown={handleChipRowKeyDown} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? 6 : 8 }}>
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
                background: 'rgba(3,5,8,0.4)',
            }}
        >
            <div style={{
                padding: 'clamp(20px, 5vw, 28px) clamp(16px, 8vw, 44px)', borderRadius: 4,
                background: 'var(--bg-surface)',
                border: `1px solid ${content.color}`,
                textAlign: 'center', fontFamily: FONT_MONO,
            }}>
                <div style={{
                    fontFamily: FONT_ORBIT, fontSize: 32, fontWeight: 900,
                    color: content.color, letterSpacing: '0.2em', marginBottom: 14,
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
                        marginTop: 18, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 4, height: 18,
                    }}>
                        {[8, 14, 10, 18, 11, 15, 9].map((h, i) => (
                            <span key={i} style={{
                                width: 3, height: h, background: content.color, borderRadius: 1,
                            }} />
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
