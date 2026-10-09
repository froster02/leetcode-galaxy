import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import WrappedCard, { CARD_W, CARD_H } from './wrapped/WrappedCard';
import useIsMobile from '../hooks/useIsMobile';
import useReducedMotion from '../hooks/useReducedMotion';
import { parseHandle } from '../utils/handle';

const FEATURED = ['cpcs', 'votrubac', '1337c0d3r', 'Ma_Lin', 'leetgoat_dot_io'];

const SAMPLE = {
    username: 'you',
    total: 742, hard: 96, maxStreak: 58, topTopic: 'Dynamic Programming',
    personality: { code: 'HDNA', title: 'The Relentless Climber' },
    roast: '742 solved. At this point it’s a personality trait.',
};

const EGGS = {
    rocky: { title: 'Amaze.', body: 'Question? … Answer: yes. Fist my bump, human engineer.', by: 'Rocky' },
    tars: { title: 'Humor setting: 100%', body: 'I have a cue light I can use when I’m joking, if you like.', by: 'TARS' },
    murph: { title: 'Eureka.', body: 'Do not go gentle into that good night.', by: 'Murph' },
    cooper: { title: 'We’ve got a wave.', body: 'Love is the one thing that transcends time and space.', by: 'Cooper' },
    'hail mary': { title: 'Hail Mary online.', body: 'Astrophage containment: nominal.', by: 'Dr. Ryland Grace' },
};

function Chip({ children, onClick }) {
    return (
        <button onClick={onClick} className="press" style={{
            minHeight: 36, padding: '0 14px', borderRadius: 999, border: 'none',
            background: 'var(--fill)', color: 'var(--label)', fontSize: '0.9375rem', fontWeight: 500,
        }}>{children}</button>
    );
}

function LandingUI({ onSearch, recent = [] }) {
    const [value, setValue] = useState('');
    const [egg, setEgg] = useState(null);
    const inputRef = useRef(null);
    const eggTimer = useRef(null);
    const isMobile = useIsMobile();
    const reduced = useReducedMotion();

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === '/' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => { window.removeEventListener('keydown', onKey); clearTimeout(eggTimer.current); };
    }, []);

    const submit = (e) => {
        e.preventDefault();
        const handle = parseHandle(value);
        if (!handle) { inputRef.current?.focus(); return; }
        const found = EGGS[handle.toLowerCase()];
        if (found) {
            setEgg(found);
            setValue('');
            clearTimeout(eggTimer.current);
            eggTimer.current = setTimeout(() => setEgg(null), 4800);
            return;
        }
        onSearch(handle);
    };

    const scale = isMobile ? 0.5 : 0.62;
    const enter = (delay) => reduced ? {} : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { type: 'spring', bounce: 0, duration: 0.6, delay },
    };
    const others = recent.filter(r => !FEATURED.some(f => f.toLowerCase() === r.toLowerCase()));

    return (
        <motion.main
            exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{
                minHeight: '100dvh', display: 'flex', flexDirection: 'column',
                padding: 'max(20px, env(safe-area-inset-top)) clamp(20px, 5vw, 56px) max(20px, env(safe-area-inset-bottom))',
            }}
        >
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="t-headline">LeetCode Wrapped</span>
                <a href="https://github.com/froster02/leetcode-galaxy" target="_blank" rel="noreferrer"
                    className="t-footnote" style={{ color: 'var(--tint)', textDecoration: 'none' }}>GitHub</a>
            </header>

            <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 40 : 'clamp(40px, 7vw, 112px)',
                padding: isMobile ? '40px 0 24px' : '32px 0',
            }}>
                <section style={{ width: '100%', maxWidth: 520 }}>
                    <motion.h1 className="t-display" {...enter(0)}>Your LeetCode,<br />wrapped.</motion.h1>
                    <motion.p className="t-body" {...enter(0.06)}
                        style={{ fontSize: '1.1875rem', color: 'var(--secondary-label)', marginTop: 16, maxWidth: 440 }}>
                        Your problems, streaks, and coder personality — in one story worth sharing.
                    </motion.p>

                    <motion.form onSubmit={submit} {...enter(0.12)} style={{ display: 'flex', gap: 10, marginTop: 32, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        <label htmlFor="handle" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
                            LeetCode username
                        </label>
                        <input
                            id="handle" ref={inputRef} className="field"
                            value={value} onChange={(e) => setValue(e.target.value)}
                            placeholder="LeetCode username"
                            autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                            enterKeyHint="go"
                        />
                        <button type="submit" className="btn btn-primary press" style={{ minHeight: 52, padding: '0 26px', width: isMobile ? '100%' : 'auto' }}>
                            Wrap it
                        </button>
                    </motion.form>
                    {!isMobile && (
                        <p className="t-footnote" style={{ marginTop: 10, color: 'var(--tertiary-label)' }}>
                            Press <kbd style={{ fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 5, background: 'var(--fill)' }}>/</kbd> to search. Profile URLs work too.
                        </p>
                    )}

                    {others.length > 0 && (
                        <motion.div {...enter(0.18)} style={{ marginTop: 28 }}>
                            <div className="t-caption" style={{ marginBottom: 10 }}>Recent</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {others.slice(0, 5).map(u => <Chip key={u} onClick={() => onSearch(u)}>{u}</Chip>)}
                            </div>
                        </motion.div>
                    )}

                    <motion.div {...enter(0.22)} style={{ marginTop: 28 }}>
                        <div className="t-caption" style={{ marginBottom: 10 }}>Try a legend</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {FEATURED.map(u => <Chip key={u} onClick={() => onSearch(u)}>{u}</Chip>)}
                        </div>
                    </motion.div>
                </section>

                <motion.div
                    aria-hidden
                    {...(reduced ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { type: 'spring', bounce: 0, duration: 0.8, delay: 0.15 } })}
                    style={{
                        width: CARD_W * scale, height: CARD_H * scale, flexShrink: 0,
                        borderRadius: 26, overflow: 'hidden',
                        boxShadow: '0 30px 80px rgba(0,0,0,0.25), 0 0 0 1px var(--separator)',
                    }}
                >
                    <WrappedCard w={SAMPLE} site={window.location.host} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} />
                </motion.div>
            </div>

            <footer className="t-footnote" style={{ textAlign: 'center', color: 'var(--tertiary-label)' }}>
                Uses public LeetCode data. Not affiliated with LeetCode. Made by froster02.
            </footer>

            <AnimatePresence>
                {egg && (
                    <motion.div
                        key="egg" role="dialog" aria-label={egg.title}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setEgg(null)}
                        style={{ position: 'fixed', inset: 0, background: 'var(--scrim)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 100 }}
                    >
                        <motion.div
                            initial={reduced ? false : { scale: 0.96, y: 8 }} animate={{ scale: 1, y: 0 }}
                            transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                            className="surface" style={{ padding: '28px 28px 24px', maxWidth: 360, textAlign: 'center' }}
                        >
                            <div className="t-title">{egg.title}</div>
                            <p className="t-body" style={{ color: 'var(--secondary-label)', marginTop: 10 }}>{egg.body}</p>
                            <p className="t-footnote" style={{ marginTop: 14 }}>— {egg.by}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.main>
    );
}

export default React.memo(LandingUI);
