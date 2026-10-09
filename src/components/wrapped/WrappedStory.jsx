import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, animate, useMotionValue } from 'framer-motion';
import { buildWrapped } from '../../utils/wrapped';
import { Intro, Total, Split, Topic, Rhythm, Streak, Contest, Personality, Roast } from './slides';
import WrappedCard, { CARD_W, CARD_H } from './WrappedCard';
import useShareCapture from '../../hooks/useShareCapture';
import useReducedMotion from '../../hooks/useReducedMotion';
import useViewportSize from '../../hooks/useViewportSize';

const SLIDE_MS = 5500;
const HOLD_MS = 220;
const TAP_SLOP = 10;
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Ordered slide list; slides without data are skipped rather than shown empty. */
function buildSlides(w) {
    return [
        { id: 'intro', Component: Intro },
        { id: 'total', Component: Total },
        { id: 'split', Component: Split },
        w.topics.length && { id: 'topic', Component: Topic },
        w.busiestMonth && { id: 'rhythm', Component: Rhythm },
        w.maxStreak > 0 && { id: 'streak', Component: Streak },
        w.contest && { id: 'contest', Component: Contest },
        { id: 'personality', Component: Personality },
        { id: 'roast', Component: Roast },
    ].filter(Boolean);
}

/** Callback ref that reports an element's rendered height; disconnects on unmount. */
function heightObserver(setter) {
    let ro = null;
    return (el) => {
        ro?.disconnect();
        ro = null;
        if (!el) return;
        ro = new ResizeObserver(() => setter(Math.round(el.getBoundingClientRect().height)));
        ro.observe(el);
    };
}

/* Apple's scroll-deceleration projection: where a flick would come to rest. */
function project(velocity, rate = 0.998) {
    return ((velocity / 1000) * rate) / (1 - rate);
}

/* The card sits above the action bar in portrait and beside it in landscape;
   `layout` carries the measured chrome so the card scales into what's left. */
function FinalSlide({ w, site, stageH, stageW, layout }) {
    const { top, bar, landscape, panelW } = layout;
    const availW = landscape ? stageW - panelW - 36 : stageW - 32;
    const availH = landscape ? stageH - top - 16 : stageH - top - bar - 28;
    const scale = Math.max(0.2, Math.min(availH / CARD_H, availW / CARD_W, 1));
    return (
        <div style={{
            width: landscape ? stageW - panelW - 12 : '100%', height: '100%', background: '#000',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: top + 4,
        }}>
            <div style={{ width: CARD_W * scale, height: CARD_H * scale, borderRadius: 28 * scale + 4, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <WrappedCard w={w} site={site} style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }} />
            </div>
        </div>
    );
}

export default function WrappedStory({ data, onClose, onFullStats, onAnother }) {
    const reduced = useReducedMotion();
    const viewport = useViewportSize();
    // Phones in either orientation (and any short window) get the full-bleed story
    const compact = viewport.width <= 768 || viewport.height < 600;
    const w = useMemo(() => buildWrapped(data), [data]);
    const site = `${window.location.host}${BASE_PATH}`;
    const slides = useMemo(() => [...buildSlides(w), { id: 'final', Component: FinalSlide }], [w]);
    const n = slides.length;
    const last = n - 1;

    const [index, setIndex] = useState(0);
    const [paused, setPaused] = useState(false);
    const [size, setSize] = useState({ w: 0, h: 0 });
    const stageRef = useRef(null);
    const x = useMotionValue(0);
    const progress = useMotionValue(0);
    const indexRef = useRef(0);

    useLayoutEffect(() => {
        const el = stageRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setSize({ w: width, h: height });
            x.stop(); // a running spring would otherwise land on the old width's offset
            x.set(-indexRef.current * width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [x]);

    // Stop iOS from rubber-banding the whole page while the user swipes slides
    useEffect(() => {
        const root = document.documentElement;
        const prev = root.style.overscrollBehavior;
        root.style.overscrollBehavior = 'none';
        return () => { root.style.overscrollBehavior = prev; };
    }, []);

    const [chromeH, setChromeH] = useState(72);
    const [barH, setBarH] = useState(150);
    const headerRef = useMemo(() => heightObserver(setChromeH), []);
    const barRef = useMemo(() => heightObserver(setBarH), []);
    const landscape = size.w > size.h && size.w >= 520;
    const panelW = landscape ? Math.min(320, Math.round(size.w * 0.42)) : 0;
    const layout = { top: chromeH, bar: barH, landscape, panelW };

    const goTo = useCallback((target, velocity = 0, instant = false) => {
        const i = Math.max(0, Math.min(last, target));
        indexRef.current = i;
        setIndex(i);
        progress.set(i === last ? 1 : 0);
        const dest = -i * size.w;
        if (instant || reduced || !size.w) { x.stop(); x.set(dest); return; }
        // Bounce only when a flick carried momentum into the move
        animate(x, dest, { type: 'spring', bounce: Math.abs(velocity) > 400 ? 0.2 : 0, duration: 0.4, velocity });
    }, [last, size.w, reduced, x, progress]);

    const next = useCallback(() => goTo(indexRef.current + 1), [goTo]);
    const prev = useCallback(() => goTo(indexRef.current - 1), [goTo]);

    // Auto-advance; elapsed time lives in `progress`, so pausing resumes where it stopped.
    useEffect(() => {
        if (reduced || paused || index === last) return;
        let raf, prevT = performance.now();
        const tick = (now) => {
            const p = progress.get() + (now - prevT) / SLIDE_MS;
            prevT = now;
            if (p >= 1) { next(); return; }
            progress.set(p);
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [index, paused, reduced, last, next, progress]);

    useEffect(() => {
        const onKey = (e) => {
            if (e.target.closest?.('input, textarea')) return;
            if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
            else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
            else if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [next, prev, onClose]);

    /* Tap left/right to step, press-and-hold to pause. Drags are handled by
       framer and flagged so their pointerup doesn't also count as a tap. */
    const press = useRef(null);
    const onPointerDown = (e) => {
        const holdTimer = setTimeout(() => setPaused(true), HOLD_MS);
        press.current = { x: e.clientX, y: e.clientY, t: performance.now(), holdTimer, dragged: false };
    };
    const onPointerUp = (e) => {
        const p = press.current;
        press.current = null;
        if (!p) return;
        clearTimeout(p.holdTimer);
        setPaused(false);
        const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
        if (p.dragged || moved > TAP_SLOP || performance.now() - p.t > HOLD_MS) return;
        const rect = stageRef.current.getBoundingClientRect();
        if (e.clientX - rect.left < rect.width * 0.3) prev(); else next();
    };
    const onPointerCancel = () => {
        if (press.current) clearTimeout(press.current.holdTimer);
        press.current = null;
        setPaused(false);
    };

    const onDragStart = () => {
        if (press.current) { press.current.dragged = true; clearTimeout(press.current.holdTimer); }
        setPaused(true);
    };
    const onDragEnd = (_e, info) => {
        setPaused(false);
        const v = info.velocity.x;
        const projected = x.get() + project(v);
        const cur = indexRef.current;
        const target = Math.max(cur - 1, Math.min(cur + 1, Math.round(-projected / size.w)));
        goTo(target, v);
    };

    /* Share: render once when the final slide is reached so the click handler
       can call navigator.share() synchronously-enough to keep user activation. */
    const captureRef = useRef(null);
    const { capture, download, copy, share } = useShareCapture(captureRef, { backgroundColor: '#000000' });
    const [image, setImage] = useState(null);
    const [status, setStatus] = useState('');
    useEffect(() => {
        if (index !== last || image) return;
        let alive = true;
        capture().then(url => { if (alive) setImage(url); }).catch(() => {});
        return () => { alive = false; };
    }, [index, last, image, capture]);

    const filename = `leetcode-wrapped-${w.username}.png`;
    const flash = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 2200); };
    const onShare = async () => {
        try {
            const shared = await share({
                filename, dataUrl: image,
                title: 'My LeetCode Wrapped',
                text: `I'm ${w.personality.code} — ${w.personality.title}. What's your LeetCode type?`,
                url: `${window.location.origin}${BASE_PATH}/u/${encodeURIComponent(w.username)}`,
            });
            if (!shared) { await download(filename, image); flash('Image saved'); }
        } catch (err) {
            if (err?.name !== 'AbortError') flash('Couldn’t share — try Save');
        }
    };
    const onSave = async () => {
        try { await download(filename, image); flash('Image saved'); } catch { flash('Couldn’t save image'); }
    };
    const onCopy = async () => {
        try { await copy(image); flash('Copied to clipboard'); } catch { flash('Copy not supported here'); }
    };

    const frame = compact
        ? { position: 'fixed', inset: 0 }
        : { position: 'relative', width: 'min(440px, 100vw)', height: 'min(900px, calc(100dvh - 48px))', borderRadius: 32, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.35)' };
    const Current = slides[index].Component;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }}>
            {/* Desktop step affordances sit outside the frame so they never cover content */}
            {!compact && (
                <button aria-label="Previous" onClick={prev} disabled={index === 0} className="press"
                    style={{ ...arrowBtn, marginRight: 20, opacity: index === 0 ? 0.3 : 1 }}>‹</button>
            )}
            <div data-theme="dark" style={{ ...frame, background: '#000', color: '#fff', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'pan-y' }}
                role="region" aria-roledescription="carousel" aria-label={`LeetCode Wrapped for ${w.username}`}>

                <div ref={stageRef} style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
                    onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
                    {reduced ? (
                        <AnimatePresence initial={false}>
                            <motion.div key={slides[index].id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }} style={{ position: 'absolute', inset: 0 }}>
                                <Current w={w} site={site} active reduced stageW={size.w} stageH={size.h} layout={layout} />
                            </motion.div>
                        </AnimatePresence>
                    ) : (
                        <motion.div
                            drag="x"
                            dragConstraints={{ left: -last * size.w, right: 0 }}
                            dragElastic={0.18}
                            dragMomentum={false}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            style={{ x, position: 'absolute', inset: 0, display: 'flex', willChange: 'transform' }}
                        >
                            {slides.map(({ id, Component }, i) => (
                                <div key={id} aria-hidden={i !== index} style={{ flex: '0 0 100%', height: '100%' }}>
                                    {Math.abs(i - index) <= 1 && (
                                        <Component w={w} site={site} active={i === index} reduced={false} stageW={size.w} stageH={size.h} layout={layout} />
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Progress + header — floating chrome above the slides */}
                <div ref={headerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'max(12px, env(safe-area-inset-top)) max(12px, env(safe-area-inset-right)) 0 max(12px, env(safe-area-inset-left))', pointerEvents: 'none' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                        {slides.map(({ id }, i) => (
                            <div key={id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
                                <motion.div style={{
                                    height: '100%', background: '#fff', transformOrigin: 'left',
                                    scaleX: i < index ? 1 : i > index ? 0 : progress,
                                }} />
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, pointerEvents: 'auto' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>
                                {w.username[0]?.toUpperCase()}
                            </div>
                            <span style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.username}</span>
                            {paused && <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Paused</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                            <button onClick={onFullStats} className="press" style={chromeBtn}>Full stats</button>
                            <button onClick={onClose} aria-label="Close" className="press" style={{ ...chromeBtn, width: 44, padding: 0, fontSize: 22 }}>×</button>
                        </div>
                    </div>
                </div>

                {index === last && (
                    <motion.div
                        ref={barRef}
                        initial={reduced ? false : (landscape ? { opacity: 0, x: 20 } : { opacity: 0, y: 20 })}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="material"
                        style={{
                            position: 'absolute', borderRadius: 24, padding: 12,
                            display: 'flex', flexDirection: 'column', gap: 8,
                            ...(landscape
                                ? { right: 'max(12px, env(safe-area-inset-right))', width: panelW, top: chromeH + 4, bottom: 'max(12px, env(safe-area-inset-bottom))', justifyContent: 'center' }
                                : { left: 12, right: 12, bottom: 'max(12px, env(safe-area-inset-bottom))' }),
                        }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: landscape ? 'wrap' : 'nowrap' }}>
                            <button onClick={onShare} disabled={!image} className="btn btn-primary press" style={{ flex: landscape ? '1 1 100%' : 1, minWidth: 0, opacity: image ? 1 : 0.5 }}>
                                {image ? 'Share' : 'Preparing…'}
                            </button>
                            <button onClick={onSave} disabled={!image} className="btn btn-secondary press" style={{ flex: landscape ? 1 : 'none', opacity: image ? 1 : 0.5 }}>Save</button>
                            <button onClick={onCopy} disabled={!image} className="btn btn-secondary press" style={{ flex: landscape ? 1 : 'none', opacity: image ? 1 : 0.5 }}>Copy</button>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px', gap: 8 }}>
                            <button onClick={onAnother} className="btn btn-plain press" style={{ padding: 0, fontSize: 15 }}>{landscape ? 'New' : 'Wrap someone else'}</button>
                            <span role="status" aria-live="polite" style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 13, color: 'var(--secondary-label)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{status}</span>
                            <button onClick={() => goTo(0, 0, true)} className="btn btn-plain press" style={{ padding: 0, fontSize: 15 }}>Replay</button>
                        </div>
                    </motion.div>
                )}
            </div>
            {!compact && (
                <button aria-label="Next" onClick={next} disabled={index === last} className="press"
                    style={{ ...arrowBtn, marginLeft: 20, opacity: index === last ? 0.3 : 1 }}>›</button>
            )}

            {/* Off-screen-but-painted capture target (browsers skip painting nodes far off-viewport) */}
            {/* Clipped to the viewport so the 540px node can't widen a phone's layout viewport */}
            <div aria-hidden style={{ position: 'fixed', inset: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                <WrappedCard ref={captureRef} w={w} site={site} />
            </div>
        </div>
    );
}

const chromeBtn = {
    height: 44, padding: '0 14px', borderRadius: 22, border: 'none',
    background: 'rgba(255,255,255,0.16)', color: '#fff', fontSize: 14, fontWeight: 600,
};

const arrowBtn = {
    flexShrink: 0, width: 44, height: 44, borderRadius: '50%', border: 'none',
    background: 'var(--fill)', color: 'var(--label)', fontSize: 26, lineHeight: 1,
};
