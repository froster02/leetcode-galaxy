import React, { useRef, useState, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import useShareCapture, { downloadDataUrl } from '../hooks/useShareCapture';
import { motion, AnimatePresence } from 'framer-motion';
import { ShareCardView } from './ShareCardView';

const Fm = 'var(--font-mono)';
const Fo = 'var(--font)';

/* ══════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════ */
export default function ShareModal({ data, onClose }) {
    const cardRef    = useRef(null);
    const measureRef = useRef(null);
    const [previewScale, setPreviewScale] = useState(1);
    const [cardNaturalH, setCardNaturalH] = useState(null);
    const [roastMode, setRoastMode] = useState(false);

    /* Fit the preview to the screen: measure the unscaled capture node, then
       re-fit whenever the viewport changes (rotation, resize) or roast mode
       changes the card's height. */
    useLayoutEffect(() => {
        const fit = () => {
            if (!cardRef.current) return;
            const naturalH = cardRef.current.scrollHeight;
            setCardNaturalH(naturalH);
            const CARD_W = 520;
            /* Reserve: top pad + title + gaps + action rows + bottom. Narrow screens
               wrap the four actions onto two rows. */
            const reserved = window.innerWidth < 560 ? 290 : 210;
            const availableH = window.innerHeight - reserved;
            const availableW = window.innerWidth - 32; // 16px padding each side
            const scale = Math.min(availableH / naturalH, availableW / CARD_W, 1);
            setPreviewScale(Math.max(0.35, scale));
        };
        fit();
        window.addEventListener('resize', fit);
        window.addEventListener('orientationchange', fit);
        return () => {
            window.removeEventListener('resize', fit);
            window.removeEventListener('orientationchange', fit);
        };
    }, [data, roastMode]);

    const { capture, copy } = useShareCapture(cardRef, { backgroundColor: '#0a0c18' });

    /* 'idle' | 'download' | 'copy' | 'linkedin'
       | 'done-download' | 'done-copy' | 'done-linkedin'
       | 'error-download' | 'error-copy' | 'error-linkedin' */
    const [actionState, setActionState] = useState('idle');
    const busy = actionState === 'download' || actionState === 'copy' || actionState === 'linkedin';

    const handleDownload = useCallback(async () => {
        if (busy) return;
        setActionState('download');
        try {
            const dataUrl = await capture();
            downloadDataUrl(dataUrl, `leetcode-${data?.username || 'card'}.png`);
            setActionState('done-download');
        } catch (err) {
            console.error('[ShareCard] Download failed:', err);
            setActionState('error-download');
        } finally {
            setTimeout(() => setActionState('idle'), 2200);
        }
    }, [capture, data, busy]);

    const handleCopy = useCallback(async () => {
        if (busy) return;
        setActionState('copy');
        try {
            await copy();
            setActionState('done-copy');
        } catch (err) {
            console.error('[ShareCard] Copy failed:', err);
            setActionState('error-copy');
        } finally {
            setTimeout(() => setActionState('idle'), 2200);
        }
    }, [copy, busy]);

    const handleLinkedIn = useCallback(async () => {
        if (busy) return;
        setActionState('linkedin');
        try {
            const dataUrl = await capture();
            /* Download the image first — LinkedIn can't receive images via URL,
               so we hand it to the user and open the post composer. */
            downloadDataUrl(dataUrl, `leetcode-${data?.username || 'card'}.png`);
            /* Small delay so the download dialog appears before the new tab */
            await new Promise(r => setTimeout(r, 300));
            window.open('https://www.linkedin.com/feed/?shareActive=true', '_blank', 'noopener,noreferrer');
            setActionState('done-linkedin');
        } catch (err) {
            console.error('[ShareCard] LinkedIn share failed:', err);
            setActionState('error-linkedin');
        } finally {
            setTimeout(() => setActionState('idle'), 3000);
        }
    }, [capture, data, busy]);

    const dlLabel = actionState === 'download'      ? '⏳ RENDERING…'
                  : actionState === 'done-download'  ? '✓  DOWNLOADED'
                  : actionState === 'error-download' ? '✕  FAILED'
                  : '⬇  DOWNLOAD PNG';

    const cpLabel = actionState === 'copy'           ? '⏳ RENDERING…'
                  : actionState === 'done-copy'       ? '✓  COPIED'
                  : actionState === 'error-copy'      ? '✕  FAILED'
                  : '⎘  COPY IMAGE';

    const liLabel = actionState === 'linkedin'       ? '⏳ RENDERING…'
                  : actionState === 'done-linkedin'   ? '✓  OPENING…'
                  : actionState === 'error-linkedin'  ? '✕  FAILED'
                  : 'in  LINKEDIN';

    return createPortal(
        <AnimatePresence>
            <motion.div key="share-bg"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                data-theme="dark" style={{ position: 'fixed', inset: 0, zIndex: 16777272, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'max(16px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))', overflowY: 'auto', overscrollBehavior: 'contain' }}
                onClick={onClose}>

                <motion.div
                    initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%', maxWidth: 560, margin: 'auto' }}>

                    <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div style={{ fontFamily: Fo, fontSize: 14, fontWeight: 900, color: '#fff', letterSpacing: '0.12em', marginBottom: 4 }}>SHARE YOUR CARD</div>
                        <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' }}>EXPORT AS HIGH-RES PNG · PERFECT FOR LINKEDIN</div>
                    </div>

                    {/* Capture target — in viewport at opacity 0 so browser paints it.
                        position:fixed left:-9999 causes browsers to skip painting. */}
                    <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                        <div ref={cardRef} style={{ width: 520, borderRadius: 24, overflow: 'hidden' }}>
                            <ShareCardView data={data} roast={roastMode} />
                        </div>
                    </div>

                    {/* Scaled visual preview — overflow:hidden clips to scaled height */}
                    <div style={{
                        flexShrink: 0,
                        width: 520 * previewScale,
                        height: cardNaturalH ? cardNaturalH * previewScale : 'auto',
                        position: 'relative',
                        borderRadius: 24 * previewScale,
                        boxShadow: '0 0 0 1.5px rgba(255,255,255,0.1)',
                        overflow: 'hidden',
                    }}>
                        <div
                            ref={measureRef}
                            style={{
                                position: 'absolute', top: 0, left: 0,
                                transformOrigin: 'top left',
                                transform: `scale(${previewScale})`,
                                borderRadius: 24, overflow: 'hidden',
                                pointerEvents: 'none',
                            }}
                        >
                            <ShareCardView data={data} roast={roastMode} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 520 }}>
                        {/* Row 1 — action buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
                            {/* Roast toggle */}
                            <motion.button onClick={() => setRoastMode(m => !m)}
                                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                title="Swap the footer tagline for a snarky one-liner"
                                style={{ minHeight: 44, padding: '0 8px', cursor: 'pointer', borderRadius: 12, fontFamily: Fm, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', transition: 'all 0.18s',
                                    background: roastMode ? 'rgba(251,146,60,0.22)' : 'rgba(251,146,60,0.08)',
                                    border: `1px solid rgba(251,146,60,${roastMode ? 0.7 : 0.35})`,
                                    color: '#fb923c',
                                    boxShadow: roastMode ? '0 0 20px rgba(251,146,60,0.25)' : 'none' }}>
                                🔥 ROAST {roastMode ? 'ON' : 'OFF'}
                            </motion.button>
                            {/* Download */}
                            <motion.button onClick={handleDownload} disabled={busy}
                                whileHover={{ scale: busy ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                                style={{ minHeight: 44, padding: '0 8px', cursor: busy ? 'not-allowed' : 'pointer', borderRadius: 12, fontFamily: Fm, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', opacity: busy ? 0.55 : 1, transition: 'all 0.18s', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.5)', color: '#22d3ee', boxShadow: '0 0 20px rgba(34,211,238,0.1)' }}>
                                {dlLabel}
                            </motion.button>
                            {/* Copy */}
                            <motion.button onClick={handleCopy} disabled={busy}
                                whileHover={{ scale: busy ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                                style={{ minHeight: 44, padding: '0 8px', cursor: busy ? 'not-allowed' : 'pointer', borderRadius: 12, fontFamily: Fm, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', opacity: busy ? 0.55 : 1, transition: 'all 0.18s', background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.5)', color: '#a78bfa', boxShadow: '0 0 20px rgba(167,139,250,0.1)' }}>
                                {cpLabel}
                            </motion.button>
                            {/* LinkedIn */}
                            <motion.button onClick={handleLinkedIn} disabled={busy}
                                whileHover={{ scale: busy ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}
                                style={{ minHeight: 44, padding: '0 8px', cursor: busy ? 'not-allowed' : 'pointer', borderRadius: 12, fontFamily: Fm, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', opacity: busy ? 0.55 : 1, transition: 'all 0.18s', background: 'rgba(10,102,194,0.15)', border: '1px solid rgba(10,102,194,0.6)', color: '#4fa3e0', boxShadow: '0 0 20px rgba(10,102,194,0.12)' }}>
                                {liLabel}
                            </motion.button>
                        </div>

                        {/* LinkedIn hint — shown after LinkedIn action */}
                        {actionState === 'done-linkedin' && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                                style={{ textAlign: 'center', fontFamily: Fm, fontSize: 12, color: '#4fa3e0', letterSpacing: '0.02em', padding: '6px 0' }}>
                                Image downloaded ↑ · Attach it to your LinkedIn post
                            </motion.div>
                        )}

                        {/* Row 2 — close */}
                        <motion.button onClick={onClose} disabled={busy}
                            whileHover={{ scale: busy ? 1 : 1.02 }} whileTap={{ scale: 0.98 }}
                            style={{ width: '100%', padding: '13px 0', minHeight: 44, cursor: busy ? 'not-allowed' : 'pointer', borderRadius: 12, fontFamily: Fm, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', opacity: busy ? 0.4 : 1, transition: 'all 0.18s', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                            ✕  CLOSE
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
