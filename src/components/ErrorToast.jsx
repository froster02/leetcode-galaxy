import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AUTO_DISMISS_MS = 5000;

/* Copy per error code set by App.jsx's handleSearch. */
const COPY = {
    not_found: 'No user found. Check the handle and try again.',
    rate_limited: 'LeetCode is busy right now. Try again in a moment.',
    network: 'Couldn’t load that profile.',
};

/** Top-center toast for search errors. `code` is a key of COPY, or '' when hidden. */
export default function ErrorToast({ code, onRetry, onClose }) {
    useEffect(() => {
        if (!code) return;
        const t = setTimeout(onClose, AUTO_DISMISS_MS);
        return () => clearTimeout(t);
    }, [code, onClose]);

    const canRetry = onRetry && code && code !== 'not_found';

    return (
        <AnimatePresence>
            {code && (
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
                        {COPY[code] || COPY.network}
                    </span>
                    {canRetry && (
                        <button onClick={onRetry} className="btn btn-plain press" style={{ minHeight: 40, padding: '0 12px', fontSize: '0.875rem' }}>
                            Retry
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        aria-label="Dismiss"
                        className="press"
                        style={{
                            flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: 'none',
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
