import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fd, Fm, C_TEAL, elasticOut } from './theme';

/* ── Contest rating sparkline — inline SVG, oldest → newest ── */
export const RatingSparkline = React.memo(function RatingSparkline({ history, color = '#0a84ff', width = 200, height = 36 }) {
    if (!Array.isArray(history) || history.length < 2) return null;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const span = max - min || 1;
    const pad = 3;
    const pts = history.map((r, i) => {
        const x = pad + (i / (history.length - 1)) * (width - pad * 2);
        const y = pad + (1 - (r - min) / span) * (height - pad * 2);
        return [x, y];
    });
    const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const [lastX, lastY] = pts[pts.length - 1];
    return (
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }} aria-label="Contest rating history">
            <polyline points={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
            <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
        </svg>
    );
});

/* ══════════════════════════════════════════════════════════
   CircularGauge — 240° arc, car-startup sweep animation
    Phase 1: 0 → 100% (ignition sweep, ~1050ms)
    Phase 2: 100% → actual (elastic settle, ~1550ms)
══════════════════════════════════════════════════════════ */
export const CircularGauge = React.memo(function CircularGauge({ count, total, color, label, size = 130, delay = 0 }) {
    const [displayPct, setDisplayPct] = useState(0);
    const actual = total > 0 ? Math.min((count / total) * 100, 100) : 0;

    useEffect(() => {
        let raf;
        const timer = setTimeout(() => {
            /* Phase 1 — ignition sweep to max */
            const t0 = performance.now();
            const sweep = (now) => {
                const p = Math.min((now - t0) / 1050, 1);
                const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // ease-in-out quad
                setDisplayPct(ease * 100);
                if (p < 1) {
                    raf = requestAnimationFrame(sweep);
                } else {
                    /* Phase 2 — elastic settle to real value */
                    const t1 = performance.now();
                    const settle = (now2) => {
                        const p2 = Math.min((now2 - t1) / 1550, 1);
                        const ep = elasticOut(p2);
                        setDisplayPct(100 - (100 - actual) * ep);
                        if (p2 < 1) {
                            raf = requestAnimationFrame(settle);
                        } else {
                            setDisplayPct(actual);
                        }
                    };
                    raf = requestAnimationFrame(settle);
                }
            };
            raf = requestAnimationFrame(sweep);
        }, delay);

        return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
    }, [actual, delay]);

    /* Geometry — 240° arc (standard gauge) */
    const stroke = 7;
    const cx = size / 2;
    const cy = size / 2;
    const r  = (size - stroke) / 2;
    const circ   = 2 * Math.PI * r;
    const arcLen = (240 / 360) * circ;       // 240° of the full circle
    const gap    = circ - arcLen;
    const fillLen = Math.max(0, (displayPct / 100) * arcLen);

    /* Tip dot position — tracks the live percentage */
    const tipAngle = (-210 + (240 * displayPct) / 100) * (Math.PI / 180);
    const tipX = cx + r * Math.cos(tipAngle);
    const tipY = cy + r * Math.sin(tipAngle);

    /* Tick marks — 9 evenly spaced along the 240° arc */
    const ticks = Array.from({ length: 9 }, (_, i) => {
        const ang = (-210 + (240 / 8) * i) * (Math.PI / 180);
        const rOuter = r - stroke / 2 - 2;
        const rInner = rOuter - (i % 2 === 0 ? 7 : 4);
        return {
            x1: cx + rOuter * Math.cos(ang), y1: cy + rOuter * Math.sin(ang),
            x2: cx + rInner * Math.cos(ang), y2: cy + rInner * Math.sin(ang),
            major: i % 2 === 0,
        };
    });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                <svg width={size} height={size}>
                    {/* Outer glow ring (ambient) */}
                    <circle cx={cx} cy={cy} r={r + 1}
                        fill="none" stroke={color} strokeWidth={1}
                        strokeDasharray={`${arcLen} ${gap}`}
                        transform={`rotate(-210 ${cx} ${cy})`}
                        opacity={0.08}
                    />
                    {/* Track */}
                    <circle cx={cx} cy={cy} r={r}
                        fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke}
                        strokeDasharray={`${arcLen} ${gap}`}
                        strokeLinecap="round"
                        transform={`rotate(-210 ${cx} ${cy})`}
                    />
                    {/* Tick marks */}
                    {ticks.map((t, i) => (
                        <line key={i}
                            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                            stroke={t.major ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}
                            strokeWidth={t.major ? 1.5 : 1}
                            strokeLinecap="round"
                        />
                    ))}
                    {/* Fill arc */}
                    <circle cx={cx} cy={cy} r={r}
                        fill="none" stroke={color} strokeWidth={stroke}
                        strokeDasharray={`${fillLen} ${circ - fillLen}`}
                        strokeLinecap="round"
                        transform={`rotate(-210 ${cx} ${cy})`}
                    />
                    {/* Tip dot — tracks the needle */}
                    {fillLen > 4 && (
                        <circle cx={tipX} cy={tipY} r={stroke / 2 + 1} fill={color} />
                    )}
                </svg>

                {/* Center readout */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                    <span style={{ fontFamily: Fd, fontSize: 17, fontWeight: 900, color, lineHeight: 1 }}>
                        {count}
                    </span>
                    <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                        / {total}
                    </span>
                    <span style={{ fontFamily: Fm, fontSize: 12, color, opacity: 0.75, fontWeight: 700, letterSpacing: '0.04em' }}>
                        {Math.round(actual)}%
                    </span>
                </div>
            </div>
            <span style={{ fontFamily: Fd, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color, opacity: 0.85 }}>
                {label}
            </span>
        </div>
    );
});

/* ══════════════════════════════════════════════════════════
   StatCard — glassmorphism info card
══════════════════════════════════════════════════════════ */
export const StatCard = React.memo(function StatCard({ label, value, color, sub }) {
    return (
        <div
            style={{
                flex: '1 1 140px', minWidth: 0,
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${color}30`,
                borderRadius: 10,
                display: 'flex', flexDirection: 'column', gap: 4,
            }}
        >
            <span style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                {label}
            </span>
            <span style={{ fontFamily: Fd, fontSize: 18, fontWeight: 900, color, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
                {value ?? '—'}
            </span>
            {sub && (
                <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}>
                    {sub}
                </span>
            )}
        </div>
    );
});

/* ══════════════════════════════════════════════════════════
   PowerCounter — animated number
══════════════════════════════════════════════════════════ */
export const PowerCounter = React.memo(function PowerCounter({ target, color }) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        let cur = 0;
        const step = target / 60;
        const id = setInterval(() => {
            cur += step;
            if (cur >= target) { setVal(target); clearInterval(id); }
            else setVal(Math.floor(cur));
        }, 16);
        return () => clearInterval(id);
    }, [target]);
    return (
        <span style={{
            fontFamily: Fd, fontSize: 'clamp(34px, 5vw, 50px)', fontWeight: 900,
            color, lineHeight: 1, letterSpacing: '-0.02em',
        }}>
            {val.toLocaleString()}
        </span>
    );
});

/* ══════════════════════════════════════════════════════════
   MiniRing — compact SVG ring (used for win-rate indicator)
══════════════════════════════════════════════════════════ */
export const MiniRing = React.memo(function MiniRing({ pct, size, color, stroke = 5, children }) {
    const [on, setOn] = useState(false);
    useEffect(() => { const t = setTimeout(() => setOn(true), 400); return () => clearTimeout(t); }, []);
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const offset = on ? circ * (1 - pct / 100) : circ;
    return (
        <div style={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', position: 'absolute', inset: 0 }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                    strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
});

/* ══════════════════════════════════════════════════════════
   CollapsibleGroup — progressive-disclosure section wrapper.
   Collapsed by default; the panels inside animate in on expand.
══════════════════════════════════════════════════════════ */
export function CollapsibleGroup({ title, panelSurface, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div style={{ ...panelSurface, padding: 0, marginBottom: 5, overflow: 'hidden' }}>
            <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
                    fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em',
                    color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase',
                }}
            >
                <span>{title}</span>
                <span style={{ color: C_TEAL, fontSize: 11, transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'none' }}>▸</span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div style={{ padding: '0 12px 12px' }}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
