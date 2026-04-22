import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FONT_ORBIT = 'Orbitron, sans-serif';
const FONT_MONO = '"Share Tech Mono", monospace';

const LOADING_MESSAGES = [
    'CALIBRATING QUANTUM DRIVE',
    'SCANNING STAR CHARTS',
    'ALIGNING COSMIC COORDINATES',
    'CHARGING HYPERDRIVE',
    'CALCULATING ORBITAL PATHS',
];

function HyperspaceStreaks({ count = 60 }) {
    const streaks = useMemo(() => Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 360;
        return {
            angle,
            length: 60 + Math.random() * 200,
            delay: Math.random() * 0.5,
            duration: 0.3 + Math.random() * 0.4,
            hue: Math.random() > 0.7 ? 270 : 170,
            width: Math.random() > 0.5 ? 2 : 1,
        };
    }), [count]);

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {streaks.map((s, i) => (
                <motion.div
                    key={i}
                    style={{
                        position: 'absolute', left: '50%', top: '50%',
                        width: s.width,
                        height: s.length,
                        background: `linear-gradient(to bottom, transparent 0%, hsla(${s.hue}, 80%, 60%, 0) 10%, hsla(${s.hue}, 80%, 70%, 0.9) 50%, hsla(0, 0%, 100%, 0.6) 80%, transparent 100%)`,
                        transformOrigin: 'top center',
                        transform: `rotate(${s.angle}deg) translateX(-50%)`,
                        borderRadius: 4,
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{
                        scaleY: [0, 1.2, 1.5, 0],
                        opacity: [0, 0.9, 0.9, 0],
                    }}
                    transition={{ duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'easeIn' }}
                />
            ))}
        </div>
    );
}

function LoadingSequence({ message }) {
    const [subMsg, setSubMsg] = useState(LOADING_MESSAGES[0]);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        let idx = 0;
        const interval = setInterval(() => {
            idx = (idx + 1) % LOADING_MESSAGES.length;
            setSubMsg(LOADING_MESSAGES[idx]);
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => Math.min(p + Math.random() * 15 + 5, 95));
        }, 400);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            style={{
                position: 'relative', display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 20, padding: '32px 40px', borderRadius: 20,
                background: 'rgba(3,5,8,0.9)',
                border: '1px solid rgba(0,245,212,0.2)',
                backdropFilter: 'blur(30px)',
                boxShadow: '0 0 80px rgba(0,245,212,0.08), inset 0 1px 0 rgba(255,255,255,0.03)',
            }}
        >
            {/* Spinner */}
            <div style={{ position: 'relative', width: 72, height: 72 }}>
                <motion.div
                    style={{
                        position: 'absolute', inset: 0,
                        border: '2px solid transparent', borderRadius: '50%',
                        borderTopColor: '#00f5d4', borderRightColor: 'rgba(0,245,212,0.3)',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.7, ease: 'linear' }}
                />
                <motion.div
                    style={{
                        position: 'absolute', inset: 6,
                        border: '2px solid transparent', borderRadius: '50%',
                        borderTopColor: '#8b5cf6', borderLeftColor: 'rgba(139,92,246,0.3)',
                    }}
                    animate={{ rotate: -360 }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                />
                <motion.div
                    style={{
                        position: 'absolute', inset: 12,
                        border: '1px solid transparent', borderRadius: '50%',
                        borderTopColor: '#f5a623',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                />
                {/* Center dot */}
                <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <motion.div
                        style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: '#00f5d4',
                            boxShadow: '0 0 16px #00f5d4, 0 0 32px rgba(0,245,212,0.4)',
                        }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                </div>
            </div>

            {/* Main message */}
            <motion.h2
                style={{
                    fontSize: 16, fontFamily: FONT_ORBIT, fontWeight: 700,
                    letterSpacing: '0.2em', color: '#00f5d4',
                    textShadow: '0 0 24px rgba(0,245,212,0.5)',
                }}
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
            >
                {message}
            </motion.h2>

            {/* Sub message */}
            <AnimatePresence mode="wait">
                <motion.p
                    key={subMsg}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 0.5, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    style={{
                        fontSize: 10, fontFamily: FONT_MONO, color: '#6b7280',
                        letterSpacing: '0.12em',
                    }}
                >
                    {subMsg}...
                </motion.p>
            </AnimatePresence>

            {/* Progress bar */}
            <div style={{
                width: 200, height: 3, borderRadius: 2,
                background: 'rgba(255,255,255,0.05)', overflow: 'hidden',
            }}>
                <motion.div
                    style={{
                        height: '100%', borderRadius: 2,
                        background: 'linear-gradient(90deg, #00f5d4, #8b5cf6)',
                        boxShadow: '0 0 8px rgba(0,245,212,0.5)',
                    }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                />
            </div>

            {/* Progress dots */}
            <div style={{ display: 'flex', gap: 3 }}>
                {[0, 1, 2, 3, 4].map(i => (
                    <motion.div
                        key={i}
                        style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: '#00f5d4',
                        }}
                        animate={{ opacity: [0.15, 1, 0.15] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    />
                ))}
            </div>
        </motion.div>
    );
}

function TransitionOverlay({ stage, message }) {
    if (stage === 0) return null;

    return (
        <AnimatePresence>
            <motion.div
                key={stage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'none', zIndex: 50,
                    background: stage === 2
                        ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.97) 0%, #000 100%)'
                        : 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)',
                }}
            >
                {/* Hyperspace streaks */}
                {stage === 2 && <HyperspaceStreaks />}

                {/* Vignette */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
                    pointerEvents: 'none',
                }} />

                <LoadingSequence message={message} />
            </motion.div>
        </AnimatePresence>
    );
}

export default React.memo(TransitionOverlay);
