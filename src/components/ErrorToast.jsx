import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AUTO_DISMISS_MS = 5000;

/* Maps the exact strings App.jsx's searchError produces to plain-language copy. */
function friendlyCopy(message) {
    if (message === 'No user found') return 'No user found. Check the handle and try again.';
    if (message === 'API rate limited — try again in a moment') return 'LeetCode is busy right now. Try again in a moment.';
    if (message === 'Unable to load profile') return 'Couldn’t load that profile.';
    return message;
}

/** Top-center toast for search errors. */
export default function ErrorToast({ message, onRetry, onClose }) {
    useEffect(() => {
        if (!message) return;
        const t = setTimeout(onClose, AUTO_DISMISS_MS);
        return () => clearTimeout(t);
    }, [message, onClose]);

    const canRetry = onRetry && message && message !== 'No user found';

    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    role="alert"
                    initial={{ opacity: 0, y: -12, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: -12, x: '-50%' }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.35 }}
                    className="material"
                    style={{
                        position: 'fixed', top: 'max(16px, env(safe-area-inset-top))', left: '50%',
                        zIndex: 500, display: 'flex', alignItems: 'center', gap: 4,
                        padding: '6px 6px 6px 18px', borderRadius: 999,
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                        maxWidth: 'calc(100vw - 32px)',
                    }}
                >
                    <span className="t-footnote" style={{ color: 'var(--label)', fontWeight: 500 }}>
                        {friendlyCopy(message)}
                    </span>
                    {canRetry && (
                        <button onClick={onRetry} className="btn btn-plain press" style={{ minHeight: 36, padding: '0 12px', fontSize: '0.875rem' }}>
                            Retry
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Dismiss"
                        className="press"
                        style={{
                            flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: 'none',
                            background: 'var(--fill)', color: 'var(--secondary-label)', fontSize: 18, lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
