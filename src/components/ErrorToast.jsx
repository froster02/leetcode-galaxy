import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FONT_MONO = '"Share Tech Mono", monospace';
const AUTO_DISMISS_MS = 4000;

/* Maps the exact strings App.jsx's searchError produces to themed copy. */
function themedCopy(message) {
    if (message === 'No user found') return 'SIGNAL LOST — no coder found at this coordinate';
    if (message === 'API rate limited — try again in a moment') return 'CHANNEL CONGESTED — try again in a moment';
    if (message === 'Unable to load profile') return 'TRANSMISSION FAILED — unable to load profile';
    return message;
}

/** Fixed top-center toast for search/quick-inspect errors — visible regardless of phase. */
export default function ErrorToast({ message, onRetry, onClose }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, AUTO_DISMISS_MS);
        return () => clearTimeout(t);
    }, [message, onClose]);

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.2 }}
                    style={{
                        position: 'fixed', top: 'max(16px, env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)',
                        zIndex: 500, display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 10px 9px 14px', borderRadius: 10,
                        background: 'rgba(20,4,8,0.92)', backdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255,56,96,0.3)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(255,56,96,0.08)',
                        maxWidth: 'calc(100vw - 32px)',
                    }}
                >
                    <span style={{
                        fontFamily: FONT_MONO, fontSize: 10, letterSpacing: '0.06em',
                        textTransform: 'uppercase', color: '#ff7d95', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                        {themedCopy(message)}
                    </span>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            style={{
                                flexShrink: 0, fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700,
                                letterSpacing: '0.14em', color: '#ff7d95', background: 'rgba(255,56,96,0.12)',
                                border: '1px solid rgba(255,56,96,0.35)', borderRadius: 6,
                                padding: '10px 14px', cursor: 'pointer',
                            }}
                        >
                            RETRY
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Dismiss"
                        style={{
                            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: 44, height: 44, margin: '-13px -13px -13px -8px',
                            borderRadius: '50%', background: 'transparent',
                            border: 'none', color: 'rgba(255,125,149,0.6)', cursor: 'pointer', fontSize: 16,
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
