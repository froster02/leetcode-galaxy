import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { calcPower, getFighterClass } from '../utils/gameData';
import { mapLeetCodeDataToCity } from '../utils/dataMapper';

/* ── Canvas star field — drawn once, zero ongoing CPU cost ── */
function StarCanvas() {
    const canvasRef = React.useRef(null);

    const draw = React.useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const W = canvas.width = window.innerWidth;
        const H = canvas.height = window.innerHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, W, H);
        const cols = ['#ccd6f6','#e8eeff','#c8d8ff','#ffffff','#b8ccff','#a8c4ff'];
        for (let i = 0; i < 470; i++) {
            const big = i > 420;
            const mid = i > 300;
            const x = ((i * 137.508) % 100) / 100 * W;
            const y = ((i * 93.172) % 100) / 100 * H;
            const r = big ? 1.1 + (i % 3) * 0.25 : mid ? 0.45 + (i % 4 === 0 ? 0.2 : 0) : 0.3;
            const op = big ? 0.6 + (i % 3) * 0.1 : mid ? 0.15 + (i % 5) * 0.05 : 0.04 + (i % 6) * 0.015;
            const col = cols[i % cols.length];
            if (big) {
                const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
                g.addColorStop(0, col);
                g.addColorStop(1, 'transparent');
                ctx.globalAlpha = op * 0.4;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(x, y, r * 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = op;
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }, []);

    React.useEffect(() => {
        draw();
        window.addEventListener('resize', draw);
        return () => window.removeEventListener('resize', draw);
    }, [draw]);

    return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />;
}

/* ── Fonts ───────────────────────────────────────────────── */
const Fd = 'Orbitron, sans-serif';          // display — headings, numbers, power
const Fm = '"Share Tech Mono", monospace';  // mono — labels, tags, secondary text
const C_TEAL = '#00f5d4';

/* ── Elastic-out easing (rubber-band settle) ─────────────── */
function elasticOut(t) {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const p = 0.38;
    return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

/* ── Difficulty palette (matches City page) ───────────────── */
const C_EASY = '#23d18b';
const C_MED  = '#f5a623';
const C_HARD = '#ff3860';

/* ── Tier system ─────────────────────────────────────────── */
function getTier(power) {
    if (power >= 5000) return { name: 'HAIL MARY HERO',    color: '#fbbf24', min: 5000, max: 8000 };
    if (power >= 3000) return { name: 'ENDURANCE CAPTAIN', color: '#a78bfa', min: 3000, max: 5000 };
    if (power >= 1500) return { name: 'RANGER PILOT',      color: '#00f5d4', min: 1500, max: 3000 };
    if (power >= 800)  return { name: 'LAZARUS CREW',      color: '#60a5fa', min: 800,  max: 1500 };
    if (power >= 300)  return { name: 'SPACE CADET',       color: '#fb923c', min: 300,  max: 800  };
    return               { name: 'EXPLORER',               color: '#94a3b8', min: 0,    max: 300  };
}

function tierProgress(power, tier) {
    return Math.min(((power - tier.min) / (tier.max - tier.min)) * 100, 100);
}

/* ── Time ago ────────────────────────────────────────────── */
function timeAgo(ts) {
    if (!ts) return null;
    const s = Math.floor(Date.now() / 1000 - Number(ts));
    if (s < 60)    return `${s}s ago`;
    if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

/* ══════════════════════════════════════════════════════════
   CircularGauge — 240° arc, car-startup sweep animation
    Phase 1: 0 → 100% (ignition sweep, ~1050ms)
    Phase 2: 100% → actual (elastic settle, ~1550ms)
══════════════════════════════════════════════════════════ */
function CircularGauge({ count, total, color, label, size = 130, delay = 0 }) {
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
                        style={{ filter: `drop-shadow(0 0 6px ${color}bb)` }}
                    />
                    {/* Glowing tip dot — tracks the needle */}
                    {fillLen > 4 && (
                        <>
                            <circle cx={tipX} cy={tipY} r={stroke / 2 + 3} fill={color} opacity={0.2} />
                            <circle cx={tipX} cy={tipY} r={stroke / 2 + 1} fill={color}
                                style={{ filter: `drop-shadow(0 0 8px ${color})` }}
                            />
                        </>
                    )}
                </svg>

                {/* Center readout */}
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                    <span style={{ fontFamily: Fd, fontSize: 17, fontWeight: 900, color, lineHeight: 1, textShadow: `0 0 12px ${color}70` }}>
                        {count}
                    </span>
                    <span style={{ fontFamily: Fm, fontSize: 7, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                        / {total}
                    </span>
                    <span style={{ fontFamily: Fm, fontSize: 8.5, color, opacity: 0.75, fontWeight: 700, letterSpacing: '0.04em' }}>
                        {Math.round(actual)}%
                    </span>
                </div>
            </div>
            <span style={{ fontFamily: Fd, fontSize: 8, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color, opacity: 0.85 }}>
                {label}
            </span>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   StatCard — glassmorphism info card
══════════════════════════════════════════════════════════ */
function StatCard({ label, value, color, sub }) {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            style={{
                flex: 1, minWidth: 0,
                padding: '12px 14px',
                background: `linear-gradient(160deg, ${color}0c 0%, rgba(255,255,255,0.04) 100%)`,
                border: `1px solid ${color}35`,
                borderRadius: 10,
                display: 'flex', flexDirection: 'column', gap: 4,
                position: 'relative', overflow: 'hidden',
                boxShadow: `0 0 20px ${color}0a`,
            }}
        >
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1,
                background: `linear-gradient(90deg, ${color}60, ${color}20, transparent)` }} />
            <span style={{ fontFamily: Fm, fontSize: 8, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
                {label}
            </span>
            <span style={{ fontFamily: Fd, fontSize: 18, fontWeight: 900, color, lineHeight: 1.1, textShadow: `0 0 20px ${color}60` }}>
                {value ?? '—'}
            </span>
            {sub && (
                <span style={{ fontFamily: Fm, fontSize: 8, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em' }}>
                    {sub}
                </span>
            )}
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════════
   PowerCounter — animated number
══════════════════════════════════════════════════════════ */
function PowerCounter({ target, color }) {
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
            textShadow: `0 0 40px ${color}60`,
        }}>
            {val.toLocaleString()}
        </span>
    );
}

/* ══════════════════════════════════════════════════════════
   MiniRing — compact SVG ring (used for win-rate indicator)
══════════════════════════════════════════════════════════ */
function MiniRing({ pct, size, color, stroke = 5, children }) {
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
                    style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${color}80)` }}
                />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {children}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════════════
   VS Modal
══════════════════════════════════════════════════════════ */
const LEGENDS_SHORT = [
    { u: 'tourist',  easy: 800, med: 1700, hard: 800 },
    { u: 'neal_wu',  easy: 720, med: 1400, hard: 620 },
    { u: 'lee215',   easy: 680, med: 1350, hard: 580 },
    { u: 'votrubac', easy: 660, med: 1200, hard: 540 },
    { u: 'neetcode', easy: 460, med:  780, hard: 220 },
];

function FighterCol({ cls, name, pow, isMe, won }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: '24px 16px', borderRadius: 14,
            background: won ? `linear-gradient(160deg, ${cls.color}18 0%, ${cls.color}06 100%)` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${won ? cls.color + '40' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: won ? `0 0 32px ${cls.color}20` : 'none',
            position: 'relative', overflow: 'hidden' }}>
            {won && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${cls.color}, transparent)` }} />}
            <motion.div animate={{ boxShadow: won ? [`0 0 0 2px ${cls.color}40`, `0 0 0 6px ${cls.color}60`, `0 0 0 2px ${cls.color}40`] : [`0 0 0 1px ${cls.color}20`] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{ width: 56, height: 56, borderRadius: 14, background: `radial-gradient(circle at 35% 35%, ${cls.color}30, ${cls.color}0a)`,
                    border: `2px solid ${cls.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: Fd, fontSize: 22, fontWeight: 900, color: cls.color }}>
                {name[0].toUpperCase()}
            </motion.div>
            {isMe && <div style={{ fontFamily: Fm, fontSize: 7.5, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase' }}>YOU</div>}
            <div style={{ fontFamily: Fm, fontSize: 7.5, letterSpacing: '0.2em', color: cls.color, textTransform: 'uppercase' }}>{cls.label}</div>
            <div style={{ fontFamily: Fd, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>{name}</div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: Fd, fontSize: 32, fontWeight: 900, color: won ? cls.color : 'rgba(255,255,255,0.5)',
                    textShadow: won ? `0 0 24px ${cls.color}80` : 'none', lineHeight: 1 }}>
                    {pow.toLocaleString()}
                </div>
                <div style={{ fontFamily: Fm, fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.14em', marginTop: 4 }}>POWER</div>
            </div>
            {won && <div style={{ fontFamily: Fm, fontSize: 8, letterSpacing: '0.2em', color: cls.color, padding: '3px 10px',
                borderRadius: 20, background: `${cls.color}15`, border: `1px solid ${cls.color}30` }}>
                ★ WINNER
            </div>}
        </div>
    );
}

function VSModal({ myData, opponent, onClose }) {
    const myPow  = calcPower(myData.easy, myData.med, myData.hard);
    const oppPow = calcPower(opponent.easy, opponent.med, opponent.hard);
    const iWin   = myPow > oppPow;
    const myCls  = getFighterClass(myData.hard);
    const oppCls = getFighterClass(opponent.hard);
    const resultColor = iWin ? '#22c55e' : '#ef4444';
    const diff = Math.abs(myPow - oppPow);
    const dominance = Math.round((Math.max(myPow, oppPow) / (myPow + oppPow)) * 100);
    const winnerName = iWin ? myData.username : opponent.u;
    const winnerPow = iWin ? myPow : oppPow;

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
                transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
                onClick={e => e.stopPropagation()}
                style={{ background: 'rgba(5,7,16,0.99)', backdropFilter: 'blur(6px)',
                    border: `1px solid ${resultColor}30`, borderRadius: 20,
                    padding: '32px 28px', maxWidth: 580, width: '100%',
                    boxShadow: `0 0 0 1px ${resultColor}15, 0 40px 80px rgba(0,0,0,0.9), 0 0 60px ${resultColor}10`,
                    position: 'relative', overflow: 'hidden' }}
            >
                {/* top glow bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, transparent, ${resultColor}, transparent)` }} />
                {/* ambient bg glow */}
                <div style={{ position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)',
                    width: '80%', height: '60%', borderRadius: '50%', pointerEvents: 'none',
                    background: `radial-gradient(ellipse, ${resultColor}12 0%, transparent 70%)`, filter: 'blur(20px)' }} />

                {/* Result header */}
                <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}>
                    <div style={{ fontFamily: Fm, fontSize: 8, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>BATTLE RESULT</div>
                    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.35, ease: [0.16,1,0.3,1] }}
                        style={{ fontFamily: Fd, fontSize: 42, fontWeight: 900, color: resultColor,
                            textShadow: `0 0 40px ${resultColor}80, 0 0 80px ${resultColor}30`, letterSpacing: '0.05em' }}>
                        {iWin ? 'VICTORY' : 'DEFEAT'}
                    </motion.div>
                    <div style={{ marginTop: 10, fontFamily: Fm, fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                        More powerful: <span style={{ color: resultColor }}>{winnerName}</span> · {winnerPow.toLocaleString()} power
                    </div>
                </div>

                {/* Fighter columns */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 20 }}>
                    <FighterCol cls={myCls} name={myData.username} pow={myPow} isMe won={iWin} />
                    {/* VS divider */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 36 }}>
                        <div style={{ flex: 1, width: 1, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
                        <div style={{ fontFamily: Fd, fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em' }}>VS</div>
                        <div style={{ flex: 1, width: 1, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
                    </div>
                    <FighterCol cls={oppCls} name={opponent.u} pow={oppPow} isMe={false} won={!iWin} />
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                    {[
                        { label: 'Power Gap',   value: diff.toLocaleString(), color: resultColor },
                        { label: 'Dominance',   value: `${dominance}%`,       color: iWin ? '#00f5d4' : '#f5a623' },
                        { label: 'Your Rank',   value: myCls.label,           color: myCls.color },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,245,212,0.22)' }}>
                            <div style={{ fontFamily: Fm, fontSize: 7, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                            <div style={{ fontFamily: Fd, fontSize: 13, fontWeight: 700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Motivational line */}
                <div style={{ textAlign: 'center', fontFamily: Fm, fontSize: 9.5, color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.06em', marginBottom: 20, fontStyle: 'italic' }}>
                    {iWin ? `You outpower ${opponent.u} by ${diff.toLocaleString()} pts. Keep climbing.`
                           : `Close the ${diff.toLocaleString()} pt gap. Solve harder problems.`}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button onClick={onClose} style={{ fontFamily: Fm, fontSize: 9.5, letterSpacing: '0.2em',
                        color: 'rgba(255,255,255,0.75)', background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                        padding: '9px 32px', cursor: 'pointer', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = `${resultColor}50`; e.currentTarget.style.color = resultColor; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                        CLOSE
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

function ChallengeNoticeModal({ query, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
                transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
                onClick={e => e.stopPropagation()}
                style={{ background: 'rgba(5,7,16,0.99)', backdropFilter: 'blur(6px)', border: '1px solid rgba(245,166,35,0.35)', borderRadius: 20, padding: '28px 24px', maxWidth: 520, width: '100%', boxShadow: '0 0 0 1px rgba(245,166,35,0.12), 0 40px 80px rgba(0,0,0,0.9), 0 0 60px rgba(245,166,35,0.08)', position: 'relative', overflow: 'hidden' }}
            >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #f5a623, transparent)' }} />
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <div style={{ fontFamily: Fm, fontSize: 8, letterSpacing: '0.35em', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>BATTLE RESULT</div>
                    <div style={{ fontFamily: Fd, fontSize: 30, fontWeight: 900, color: '#f5a623', letterSpacing: '0.05em' }}>NO MATCH</div>
                </div>
                <div style={{ textAlign: 'center', fontFamily: Fm, fontSize: 10, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', marginBottom: 16 }}>
                    No user found for <span style={{ color: '#fff' }}>{query}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <button onClick={onClose} style={{ fontFamily: Fm, fontSize: 9.5, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 32px', cursor: 'pointer', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.55)'; e.currentTarget.style.color = '#f5a623'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                        CLOSE
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════════════════
   FIGHTER CARD — Galaxy Dashboard
══════════════════════════════════════════════════════════ */
function FighterCard({ data, username, onBack, fetchProfile }) {
    const [vsOpponent, setVsOpponent] = useState(null);
    const [quickSearch, setQuickSearch] = useState('');
    const [challengeName, setChallengeName] = useState('');
    const [challengeMiss, setChallengeMiss] = useState('');
    const [viewport, setViewport] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1440,
        height: typeof window !== 'undefined' ? window.innerHeight : 900,
    }));

    useEffect(() => {
        const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    useEffect(() => {
        const prev = document.documentElement.style.overscrollBehavior;
        document.documentElement.style.overscrollBehavior = 'none';
        return () => { document.documentElement.style.overscrollBehavior = prev; };
    }, []);

    const compactLaptop = viewport.width <= 1440 && viewport.height <= 900;
    const contentMaxWidth = compactLaptop ? 920 : 1060;
    const pageBottomPad = compactLaptop ? 44 : 80;
    const heroPad = compactLaptop ? '16px 18px' : '22px 28px';
    const blockPad = compactLaptop ? '16px 18px' : '22px 24px';
    const blockPadWide = compactLaptop ? '18px 20px' : '24px 28px';
    const sectionGap = compactLaptop ? 6 : 10;
    const panelSurface = {
        background: 'linear-gradient(165deg, rgba(12,18,34,0.86) 0%, rgba(8,12,24,0.76) 100%)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,245,212,0.22)',
        borderRadius: 12,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 40px rgba(0,0,0,0.34), 0 0 0 1px rgba(0,245,212,0.07)',
    };
    const tileSurface = {
        background: 'linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.025) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 11,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
    };

    const shooters = useMemo(() => Array.from({length:3},(_,i) => ({ x:8+i*28, y:3+i*18, dur:8+i*5, del:i*5+2 })), []);

    const handleQuickSearch = (e) => {
        e.preventDefault();
        const nextUser = quickSearch.trim();
        if (!nextUser) return;
        window.dispatchEvent(new CustomEvent('quickSearch', {
            detail: { username: nextUser, targetView: 'card' }
        }));
        setQuickSearch('');
    };

    if (!data) return null;

    const { profile, stats, recent, districts, contestInfo, badgesInfo, totalQuestions } = data;

    const lcEasy = totalQuestions?.easy || 0;
    const lcMed = totalQuestions?.medium || 0;
    const lcHard = totalQuestions?.hard || 0;
    const lcTotal = totalQuestions?.all || 0;

    const easyStats = stats.find(s => s.difficulty === 'Easy');
    const medStats  = stats.find(s => s.difficulty === 'Medium');
    const hardStats = stats.find(s => s.difficulty === 'Hard');

    const easy  = easyStats?.count || 0;
    const med   = medStats?.count  || 0;
    const hard  = hardStats?.count || 0;
    const total = stats.find(s => s.difficulty === 'All')?.count || 0;
    const totalPctCleared = lcTotal > 0 ? Math.round((total / lcTotal) * 100) : null;

    /* Beats % — may or may not be in API response */
    const easyBeats = easyStats?.beatPercentage ?? easyStats?.beats ?? null;
    const medBeats  = medStats?.beatPercentage  ?? medStats?.beats  ?? null;
    const hardBeats = hardStats?.beatPercentage ?? hardStats?.beats ?? null;

    const power   = calcPower(easy, med, hard);
    const cls     = getFighterClass(hard);
    const tier    = getTier(power);
    const tierPct = tierProgress(power, tier);

    /* Next tier */
    const nextTier    = tier.max < 8000 ? getTier(tier.max) : null;
    const toNextTier  = Math.max(0, tier.max - power);

    const accepted = recent.filter(r => r.statusDisplay === 'Accepted').length;
    const winRate  = recent.length > 0 ? Math.round((accepted / recent.length) * 100) : 0;

    const rating    = contestInfo?.rating    ? Math.round(contestInfo.rating)    : null;
    const topRating = contestInfo?.topRating ? Math.round(contestInfo.topRating) : null;
    const attended  = contestInfo?.attended  ?? null;
    const topPct    = contestInfo?.topPercentage ?? null;
    const badges    = badgesInfo?.total ?? 0;
    const badgesList = Array.isArray(badgesInfo?.badges) ? badgesInfo.badges : [];

    const handleChallengeSubmit = (e) => {
        e.preventDefault();
        const query = challengeName.trim();
        if (!query) return;

        const run = async () => {
            try {
                if (!fetchProfile) throw new Error('No user found');
                const raw = await fetchProfile(query);
                const mapped = mapLeetCodeDataToCity(raw);
                const opponent = {
                    u: mapped.username,
                    easy: mapped.stats.find(s => s.difficulty === 'Easy')?.count || 0,
                    med: mapped.stats.find(s => s.difficulty === 'Medium')?.count || 0,
                    hard: mapped.stats.find(s => s.difficulty === 'Hard')?.count || 0,
                };
                setVsOpponent(opponent);
                setChallengeMiss('');
            } catch {
                setVsOpponent(null);
                setChallengeMiss(query);
            }
        };

        run();
    };

    /* Districts / specialties */
    const topDistricts  = districts ? [...districts].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 5) : [];
    const maxDistrictSolved = topDistricts[0]?.problemsSolved || 1;

    const winColor = winRate >= 70 ? C_EASY : winRate >= 50 ? C_MED : C_HARD;
    const myFighterData = { username, easy, med, hard };

    /* Power DNA */
    const easyPwr = easy;
    const medPwr  = med * 3;
    const hardPwr = hard * 10;
    const easyPct = power > 0 ? Math.round((easyPwr / power) * 100) : 0;
    const medPct  = power > 0 ? Math.round((medPwr  / power) * 100) : 0;
    const hardPct = power > 0 ? Math.round((hardPwr / power) * 100) : 0;

    /* Streak */
    let streak = 0;
    for (const r of recent.slice(0, 10)) {
        if (r.statusDisplay === 'Accepted') streak++;
        else break;
    }

    const recentHardCount = recent.slice(0, 10).filter(r => r.difficulty === 'Hard').length;
    const lastSubmit      = recent[0]?.timestamp ? timeAgo(recent[0].timestamp) : null;
    const estHours        = Math.round(total * 0.75);

    const motiv = hard >= 300 ? 'Among the rarest. You solve what others abandon.' :
                  hard >= 150 ? 'Elite solver. Hard problems are your domain.' :
                  hard >= 50  ? 'Battle-hardened. The algorithms respect you.' :
                  hard >= 10  ? 'Rising fast. Keep pushing the hard problems.' :
                                'Every legend started here. Keep going.';

    /* ── Chip helper ── */
    const Chip = ({ dot, dotColor, children }) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', fontFamily: Fm, fontSize: 9, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            {dot && <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor || '#23d18b', flexShrink: 0, boxShadow: `0 0 6px ${dotColor || '#23d18b'}` }} />}
            {children}
        </div>
    );

    return (
        <>
            {/* ── Full-page galaxy canvas ── */}
            <div style={{ position: 'relative', minHeight: '100vh', background: '#080c18', color: '#e8eaf0' }}>

                {/* ── Base gradient ── */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                    background: 'radial-gradient(ellipse at 30% 0%, #0d1a2e 0%, #080c18 50%, #050810 100%)' }} />

                {/* ── Grid overlay ── */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '40px 40px' }} />

                {/* ── Teal top aurora ── */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400, pointerEvents: 'none', zIndex: 0,
                    background: 'radial-gradient(ellipse at 50% -10%, rgba(0,245,212,0.25) 0%, rgba(0,100,120,0.06) 40%, transparent 70%)' }} />

                {/* ── Side accent ── */}
                <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, pointerEvents: 'none', zIndex: 0,
                    background: 'linear-gradient(180deg, #00f5d4 0%, rgba(0,245,212,0.3) 30%, transparent 70%)' }} />

                {/* ── Star field (canvas — single draw call) ── */}
                <StarCanvas />

                {/* ── Shooting stars ── */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    {shooters.map((sh, i) => (
                        <motion.div key={i}
                            animate={{ x: ['0vw', '60vw'], y: ['0vh', '40vh'], opacity: [0, 0.6, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: sh.dur, delay: sh.del, ease: 'easeOut' }}
                            style={{
                                position: 'absolute', left: `${sh.x}%`, top: `${sh.y}%`,
                                width: 60, height: 1,
                                background: 'linear-gradient(90deg, rgba(255,255,255,0.65), transparent)',
                                borderRadius: 1, transform: 'rotate(35deg)', transformOrigin: 'left center',
                            }}
                        />
                    ))}
                </div>

                {/* ── Content ── */}
                <div style={{ position: 'relative', zIndex: 1, maxWidth: contentMaxWidth, margin: '0 auto', padding: compactLaptop ? `0 18px ${pageBottomPad}px` : `0 24px ${pageBottomPad}px` }}>

                    {/* Top accent line */}
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease: [0.16,1,0.3,1] }}
                        style={{ height: 1, transformOrigin: 'left', background: `linear-gradient(90deg, ${C_TEAL}, ${C_TEAL}60, transparent)`, boxShadow: `0 0 12px ${C_TEAL}80` }} />

                    {/* ── Nav back ── */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
                        style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            width: '100vw',
                            marginLeft: 'calc(50% - 50vw)',
                            marginRight: 'calc(50% - 50vw)',
                            padding: compactLaptop ? '10px 18px 8px' : '10px 24px 8px',
                            marginBottom: 8,
                            background: 'rgba(8,12,24,0.78)',
                            backdropFilter: 'blur(10px)',
                            borderBottom: '1px solid rgba(0,245,212,0.18)',
                            boxShadow: '0 10px 24px rgba(0,0,0,0.35)',
                        }}>
                        <button onClick={onBack} style={{ fontFamily: Fm, fontSize: 10, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.88)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,245,212,0.2)', borderRadius: 20, padding: '6px 14px', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = C_TEAL; e.currentTarget.style.borderColor = `${C_TEAL}50`; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(0,245,212,0.2)'; }}>
                            ← ARENA
                        </button>
                        <form onSubmit={handleQuickSearch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input
                                value={quickSearch}
                                onChange={(e) => setQuickSearch(e.target.value)}
                                placeholder="search username..."
                                style={{
                                    width: compactLaptop ? 160 : 190,
                                    padding: '7px 10px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(0,245,212,0.2)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'rgba(255,255,255,0.88)',
                                    fontFamily: Fm,
                                    fontSize: 11,
                                    letterSpacing: '0.04em',
                                    outline: 'none',
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    fontFamily: Fm,
                                    fontSize: 10,
                                    letterSpacing: '0.1em',
                                    color: C_TEAL,
                                    background: 'rgba(0,245,212,0.08)',
                                    border: '1px solid rgba(0,245,212,0.28)',
                                    borderRadius: 10,
                                    padding: '7px 10px',
                                    cursor: 'pointer',
                                }}
                            >
                                SEARCH
                            </button>
                        </form>
                    </motion.div>

                    {/* ════ 1. HERO HEADER ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.08 }}
                        style={{ ...panelSurface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: heroPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: compactLaptop ? 14 : 20 }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <motion.div animate={{ boxShadow: [`0 0 0 2px ${tier.color}30`, `0 0 0 5px ${tier.color}50`, `0 0 0 2px ${tier.color}30`] }} transition={{ duration: 3, repeat: Infinity }}
                                    style={{ width: compactLaptop ? 58 : 72, height: compactLaptop ? 58 : 72, borderRadius: 14, background: `radial-gradient(circle at 35% 35%, ${tier.color}30, ${tier.color}0a)`, border: `2px solid ${tier.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: Fd, fontSize: compactLaptop ? 22 : 28, fontWeight: 900, color: tier.color }}>
                                    {username.charAt(0).toUpperCase()}
                                </motion.div>
                            </div>
                            <div>
                                <div style={{ fontFamily: Fd, fontSize: compactLaptop ? 20 : 24, fontWeight: 900, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.02em', lineHeight: 1.05, marginBottom: compactLaptop ? 4 : 6 }}>{username}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: Fm, fontSize: compactLaptop ? 9 : 10, letterSpacing: '0.1em', color: tier.color, textTransform: 'uppercase', padding: compactLaptop ? '2px 7px' : '2px 8px', borderRadius: 4, background: `${tier.color}12`, border: `1px solid ${tier.color}28` }}>{tier.name}</span>
                                    <span style={{ fontFamily: Fm, fontSize: compactLaptop ? 9 : 10, color: 'rgba(255,255,255,0.78)' }}>·</span>
                                    {topPct && <span style={{ fontFamily: Fm, fontSize: compactLaptop ? 9 : 10, letterSpacing: '0.06em', color: C_EASY }}>TOP {topPct}% GLOBAL</span>}
                                </div>
                                <div style={{ fontFamily: Fm, fontSize: compactLaptop ? 10 : 11, color: 'rgba(255,255,255,0.86)', letterSpacing: '0.03em' }}>
                                    Rank #{profile.ranking?.toLocaleString() || '—'}
                                    <span style={{ margin: compactLaptop ? '0 6px' : '0 8px', color: 'rgba(255,255,255,0.3)' }}>·</span>
                                    <span style={{ color: cls.color }}>{cls.label}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'center', paddingLeft: compactLaptop ? 14 : 24 }}>
                            <div style={{ fontFamily: Fm, fontSize: compactLaptop ? 8 : 8.5, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', marginBottom: 8 }}>Acceptance Rate</div>
                            <MiniRing pct={winRate} size={compactLaptop ? 68 : 76} color={winColor} stroke={5}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: Fd, fontSize: compactLaptop ? 14 : 16, fontWeight: 900, color: winColor, lineHeight: 1 }}>{winRate}%</div>
                                    <div style={{ fontFamily: Fm, fontSize: 8, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginTop: 1 }}>AC RATE</div>
                                </div>
                            </MiniRing>
                        </div>
                    </motion.div>

                    {/* ════ 2. POWER LEVEL ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.14 }}
                        style={{ ...panelSurface, padding: blockPadWide, marginBottom: sectionGap, display: 'flex', alignItems: 'center', gap: compactLaptop ? 20 : 28 }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', marginBottom: 6 }}>Power Level</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: compactLaptop?8:12 }}>
                                <PowerCounter target={power} color={tier.color} />
                                <span style={{ fontFamily: Fm, fontSize: compactLaptop?11:13, color: 'rgba(255,255,255,0.7)' }}>/ {tier.max.toLocaleString()}</span>
                            </div>
                            {/* Tier progress bar */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontFamily: Fd, fontSize: 8.5, letterSpacing: '0.1em', color: tier.color, whiteSpace: 'nowrap' }}>{tier.name}</span>
                                <div style={{ flex: 1, height: compactLaptop?3:5, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${tierPct}%` }} transition={{ duration: 1.4, ease: [0.16,1,0.3,1], delay: 0.3 }}
                                        style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${tier.color}70, ${tier.color})`, boxShadow: `0 0 10px ${tier.color}70` }} />
                                </div>
                                {nextTier && <span style={{ fontFamily: Fd, fontSize: 9, letterSpacing: '0.09em', color: nextTier.color, whiteSpace: 'nowrap' }}>{nextTier.name}</span>}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.06em' }}>{tier.min.toLocaleString()}</span>
                                {toNextTier > 0 && <span style={{ fontFamily: Fm, fontSize: 9, color: tier.color, letterSpacing: '0.06em' }}>{toNextTier.toLocaleString()} TO NEXT TIER</span>}
                                <span style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.78)', letterSpacing: '0.06em' }}>{tier.max.toLocaleString()}</span>
                            </div>
                        </div>
                        <MiniRing pct={winRate} size={compactLaptop?66:78} color={winColor} stroke={5}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: Fd, fontSize: compactLaptop?13:15, fontWeight: 900, color: winColor }}>{winRate}%</div>
                                <div style={{ fontFamily: Fm, fontSize: 6.5, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', marginTop: 1 }}>AC RATE</div>
                            </div>
                        </MiniRing>
                    </motion.div>

                    {/* ════ 3. STATS ROW ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.2 }}
                        style={{ display: 'flex', gap: 10, marginBottom: sectionGap, flexWrap: 'wrap' }}>
                        <StatCard label="Total Solved" value={total} color="rgba(255,255,255,0.85)" sub={lcTotal > 0 ? `/ ${lcTotal.toLocaleString()}` : undefined} />
                        <StatCard label="Contest Rating" value={rating} color="#00f5d4" sub={topRating ? `Peak ${topRating.toLocaleString()}` : undefined} />
                        <StatCard label="Global Rank" value={profile.ranking ? `#${profile.ranking.toLocaleString()}` : '—'} color={tier.color} sub={topPct ? `Top ${topPct}%` : undefined} />
                        <StatCard label="Contests" value={attended} color="#a78bfa" sub={attended && topPct ? `Top ${topPct}% finish` : undefined} />
                    </motion.div>

                    {/* ════ 4. PROBLEM BREAKDOWN ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.27 }}
                        style={{ ...panelSurface, padding: blockPadWide, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compactLaptop?10:16 }}>
                            <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Problem Breakdown</span>
                            <span style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>
                                {total} / {lcTotal > 0 ? lcTotal.toLocaleString() : '--'}
                                <span style={{ marginLeft: 8, color: tier.color }}>· {totalPctCleared != null ? `${totalPctCleared}% CLEARED` : '--'}</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                            {[
                                { count: easy, total: lcEasy, color: C_EASY, label: 'Easy',   beats: easyBeats, delay: 360 },
                                { count: med,  total: lcMed,  color: C_MED,  label: 'Medium', beats: medBeats,  delay: 740 },
                                { count: hard, total: lcHard, color: C_HARD, label: 'Hard',   beats: hardBeats, delay: 1120 },
                            ].map(({ count: c, total: t, color, label, beats, delay: d }) => (
                                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                    <CircularGauge count={c} total={t} color={color} label={label} size={compactLaptop?100:118} delay={d} />
                                    {beats != null && (
                                        <span style={{ fontFamily: Fm, fontSize: 8.5, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em' }}>
                                            BEATS <span style={{ color }}>{typeof beats === 'number' ? beats.toFixed(1) : beats}%</span>
                                        </span>
                                    )}
                                </div>
                            ))}
                            {/* Total ring */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                <MiniRing pct={lcTotal > 0 ? Math.min((total / lcTotal) * 100, 100) : 0} size={compactLaptop?100:118} color={tier.color} stroke={7}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontFamily: Fd, fontSize: compactLaptop?16:20, fontWeight: 900, color: tier.color, lineHeight: 1 }}>{total}</div>
                                        <div style={{ fontFamily: Fm, fontSize: 7.5, color: 'rgba(255,255,255,0.7)' }}>/ {lcTotal > 0 ? lcTotal : '--'}</div>
                                        <div style={{ fontFamily: Fm, fontSize: compactLaptop?8:9.5, color: tier.color, opacity: 0.75, fontWeight: 700 }}>{totalPctCleared != null ? `${totalPctCleared}%` : '--'}</div>
                                    </div>
                                </MiniRing>
                                <span style={{ fontFamily: Fd, fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: tier.color, opacity: 0.85 }}>Total</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* ════ 5. CONTEST & RATING ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.33 }}
                        style={{ ...panelSurface, padding: blockPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compactLaptop?8:12 }}>
                            <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Contest & Rating</span>
                            {attended && <span style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>{attended} ATTENDED</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {[
                                { head: 'Current Rating', val: rating,    color: '#00f5d4', sub: cls.label,   big: true  },
                                { head: 'Accepted Streak', val: streak,   color: '#a78bfa', sub: lastSubmit ? `Last AC ${lastSubmit}` : 'Recent activity', big: true  },
                                { head: 'Contests',       val: attended,  color: '#fb923c', sub: topPct ? `Top ${topPct}%` : null, big: false },
                                { head: 'Top %',          val: topPct ? `${topPct}%` : null, color: C_EASY, sub: 'Global',  big: false },
                            ].map(({ head, val, color, sub, big }) => (
                                <motion.div key={head} whileHover={{ y: -2 }}
                                    style={{ ...tileSurface, padding: compactLaptop ? '9px 12px' : '13px 16px', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                    <div style={{ fontFamily: Fm, fontSize: 8.5, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.84)', textTransform: 'uppercase', marginBottom: 8 }}>{head}</div>
                                    <div style={{ fontFamily: Fd, fontSize: big ? (compactLaptop?18:22) : (compactLaptop?15:18), fontWeight: 900, color: val ? color : 'rgba(255,255,255,0.15)', lineHeight: 1, marginBottom: 4 }}>{val ?? '—'}</div>
                                    {sub && <div style={{ fontFamily: Fm, fontSize: 8.5, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* ════ 6. STANDING ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.38 }}
                        style={{ ...panelSurface, padding: blockPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compactLaptop?8:12 }}>
                            <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Standing</span>
                            <span style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em' }}>
                                RANK #{profile.ranking?.toLocaleString() || '—'}
                                {topPct && <span style={{ marginLeft: 8, color: C_EASY }}>· TOP {topPct}%</span>}
                            </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {[
                                {
                                    head: 'Tier', val: tier.name, color: tier.color,
                                    sub: nextTier ? `NEXT · ${nextTier.name} @ ${tier.max}` : 'MAX TIER',
                                },
                                {
                                    head: 'Class', val: cls.label, color: cls.color,
                                    sub: `${power.toLocaleString()} PTS`,
                                },
                                {
                                    head: 'Rank', val: profile.ranking ? `#${profile.ranking.toLocaleString()}` : '—', color: 'rgba(255,255,255,0.7)',
                                    sub: topPct ? `Top ${topPct}% global` : null,
                                },
                                {
                                    head: 'Badges', val: badges || '—', color: '#fbbf24',
                                    sub: badgesList.length > 0 ? `${badgesList.length} earned` : null,
                                },
                            ].map(({ head, val, color, sub }) => (
                                <motion.div key={head} whileHover={{ y: -2 }}
                                    style={{ ...tileSurface, padding: compactLaptop ? '8px 11px' : '12px 14px', border: '1px solid rgba(0,245,212,0.2)', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}35`; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                    <div style={{ fontFamily: Fm, fontSize: 8.5, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.84)', textTransform: 'uppercase', marginBottom: 6 }}>{head}</div>
                                    <div style={{ fontFamily: Fd, fontSize: compactLaptop?11:13, fontWeight: 900, color, letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{val}</div>
                                    {sub && <div style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
                                </motion.div>
                            ))}
                        </div>

                        {/* Badge pills */}
                        {badgesList.length > 0 && (
                            <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
                                {badgesList.slice(0, 8).map((b, i) => (
                                    <motion.span key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.45 + i * 0.04 }}
                                        style={{ fontFamily: Fm, fontSize: 8.5, letterSpacing: '0.1em', color: '#fbbf24', padding: '3px 10px', borderRadius: 20, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                                        {b.displayName || b.name || `Badge ${i + 1}`}
                                    </motion.span>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* ════ 6.5. POWER DNA ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.40 }}
                        style={{ ...panelSurface, padding: blockPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: compactLaptop?8:12 }}>
                            <div>
                                <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Power DNA</span>
                                <div style={{ fontFamily: Fm, fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 6, letterSpacing: '0.04em', fontStyle: 'italic' }}>"{motiv}"</div>
                            </div>
                            <span style={{ fontFamily: Fm, fontSize: 8, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>~{estHours.toLocaleString()}h INVESTED</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                            {[
                                { label: 'Easy', mult: '×1',  count: easy, pwr: easyPwr, pct: easyPct, color: C_EASY },
                                { label: 'Medium', mult: '×3', count: med,  pwr: medPwr,  pct: medPct,  color: C_MED  },
                                { label: 'Hard',  mult: '×10', count: hard, pwr: hardPwr, pct: hardPct, color: C_HARD },
                            ].map(({ label, mult, count, pwr, pct, color }) => (
                                <div key={label} style={{ padding: '14px 16px', borderRadius: 12, background: `${color}07`, border: `1px solid ${color}18` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span style={{ fontFamily: Fd, fontSize: 7.5, letterSpacing: '0.22em', color, textTransform: 'uppercase' }}>{label}</span>
                                        <span style={{ fontFamily: Fm, fontSize: 8, color: `${color}80`, letterSpacing: '0.08em' }}>{mult}</span>
                                    </div>
                                    <div style={{ fontFamily: Fd, fontSize: compactLaptop?18:22, fontWeight: 900, color, lineHeight: 1, marginBottom: 3 }}>{pwr.toLocaleString()}</div>
                                    <div style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.04em', marginBottom: 10 }}>{count} solved · {pct}% of power</div>
                                    <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1.2, ease: [0.16,1,0.3,1], delay: 0.5 }}
                                            style={{ height: '100%', borderRadius: 2, background: color, boxShadow: `0 0 8px ${color}80` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ fontFamily: Fm, fontSize: 9.5, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.06em', textAlign: 'center' }}>
                            Hard problems are <span style={{ color: C_HARD }}>10× more powerful</span> — your {hard} hard solves alone generate{' '}
                            <span style={{ color: tier.color, fontWeight: 700 }}>{hardPwr.toLocaleString()} pts</span>.
                            {hard > 0 && hardPct >= 40 && <span style={{ color: C_EASY }}> Hard is your superpower.</span>}
                        </div>
                    </motion.div>

                    {/* ════ 6.8. BATTLE MOMENTUM ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.42 }}
                        style={{ ...panelSurface, padding: blockPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compactLaptop?8:12 }}>
                            <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Battle Momentum</span>
                            {lastSubmit && <span style={{ fontFamily: Fm, fontSize: 8.5, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>LAST ACTIVE · {lastSubmit}</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
                            {[
                                {
                                    head: 'AC STREAK', val: streak, color: streak >= 3 ? C_EASY : streak >= 1 ? C_MED : 'rgba(255,255,255,0.2)',
                                    big: true, sub: streak >= 5 ? '🔥 on fire' : streak >= 1 ? 'consecutive wins' : 'break the ice',
                                },
                                {
                                    head: 'RECENT WIN RATE', val: `${winRate}%`, color: winColor,
                                    big: true, sub: winRate >= 80 ? 'Dominant form' : winRate >= 60 ? 'Strong performer' : 'Building momentum',
                                },
                                {
                                    head: 'HARD BATTLES', val: recentHardCount, color: recentHardCount >= 3 ? C_HARD : 'rgba(255,255,255,0.5)',
                                    big: false, sub: 'in last 10 subs',
                                },
                                {
                                    head: 'GLOBAL TOP', val: topPct ? `${topPct}%` : '—', color: '#a78bfa',
                                    big: false, sub: topPct ? `Better than ${Math.round(100 - topPct)}% of users` : null,
                                },
                            ].map(({ head, val, color, big, sub }) => (
                                <motion.div key={head} whileHover={{ y: -2 }}
                                    style={{ ...tileSurface, padding: compactLaptop ? '8px 11px' : '12px 14px', border: '1px solid rgba(0,245,212,0.2)', transition: 'border-color 0.2s' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                                    <div style={{ fontFamily: Fm, fontSize: 8.5, letterSpacing: '0.13em', color: 'rgba(255,255,255,0.84)', textTransform: 'uppercase', marginBottom: 8 }}>{head}</div>
                                    <div style={{ fontFamily: Fd, fontSize: big ? (compactLaptop?19:23) : (compactLaptop?16:19), fontWeight: 900, color, lineHeight: 1, marginBottom: 4 }}>{val ?? '—'}</div>
                                    {sub && <div style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.04em' }}>{sub}</div>}
                                </motion.div>
                            ))}
                        </div>
                        {/* Motivational insight row */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                            {total >= 100 && (
                                <div style={{ flex: 1, minWidth: 160, padding: '10px 14px', borderRadius: 10, background: `${C_EASY}08`, border: `1px solid ${C_EASY}18` }}>
                                    <span style={{ fontFamily: Fm, fontSize: 8.5, color: C_EASY, letterSpacing: '0.06em' }}>
                                        You've cracked <strong>{totalPctCleared != null ? `${totalPctCleared}%` : '--'}</strong> of all LeetCode — that's top-tier dedication.
                                    </span>
                                </div>
                            )}
                            {hard >= 10 && (
                                <div style={{ flex: 1, minWidth: 160, padding: '10px 14px', borderRadius: 10, background: `${C_HARD}08`, border: `1px solid ${C_HARD}18` }}>
                                    <span style={{ fontFamily: Fm, fontSize: 8.5, color: C_HARD, letterSpacing: '0.06em' }}>
                                        {hard} Hard problems solved — fewer than <strong>8% of users</strong> reach this milestone.
                                    </span>
                                </div>
                            )}
                            {toNextTier > 0 && (
                                <div style={{ flex: 1, minWidth: 160, padding: '10px 14px', borderRadius: 10, background: `${tier.color}08`, border: `1px solid ${tier.color}18` }}>
                                    <span style={{ fontFamily: Fm, fontSize: 8.5, color: tier.color, letterSpacing: '0.06em' }}>
                                        Only <strong>{toNextTier.toLocaleString()} pts</strong> to {nextTier?.name || 'next tier'} — you're close.
                                    </span>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ════ 7. WHERE YOU'RE POWERFUL ════ */}
                    {topDistricts.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.43 }}
                            style={{ ...panelSurface, padding: blockPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                            <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Where You're Powerful</span>
                            <span style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.62)', letterSpacing: '0.06em' }}>TOP SPECIALTIES · BY SOLVE VOLUME</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
                            {/* Specialty bar list */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {topDistricts.map((d, i) => (
                                    <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span style={{ fontFamily: Fm, fontSize: 10, color: 'rgba(255,255,255,0.75)', width: 80, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                                        <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: 0 }} animate={{ width: `${(d.problemsSolved / maxDistrictSolved) * 100}%` }}
                                                transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: 0.5 + i * 0.06 }}
                                                style={{ height: '100%', borderRadius: 2, background: i === 0 ? tier.color : `rgba(255,255,255,0.25)` }}
                                            />
                                        </div>
                                        <span style={{ fontFamily: Fd, fontSize: 11, fontWeight: 700, color: i === 0 ? tier.color : 'rgba(255,255,255,0.5)', width: 32, textAlign: 'right', flexShrink: 0 }}>{d.problemsSolved}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        </motion.div>
                    )}

                    {/* ════ 8. RECENT BATTLES ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.48 }}
                        style={{ ...panelSurface, padding: blockPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compactLaptop?8:12 }}>
                            <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Recent Battles</span>
                            <span style={{ fontFamily: Fm, fontSize: 10, color: 'rgba(255,255,255,0.62)' }}>{Math.min(recent.length, 10)} submissions</span>
                        </div>
                        {recent.length === 0 ? (
                            <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '12px 0', letterSpacing: '0.08em' }}>$ no_submissions_yet...</div>
                        ) : (
                            <div>
                                {recent.slice(0, 10).map((r, i) => {
                                    const ok = r.statusDisplay === 'Accepted';
                                    const ts = timeAgo(r.timestamp);
                                    const diffColor = r.difficulty === 'Easy' ? C_EASY : r.difficulty === 'Hard' ? C_HARD : r.difficulty === 'Medium' ? C_MED : null;
                                    return (
                                        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.52 + i * 0.03 }} whileHover={{ x: 5, transition: { duration: 0.12 } }}
                                            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: compactLaptop?'4px 0':'6px 0', borderBottom: i < Math.min(recent.length, 10) - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none', cursor: 'default' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: ok ? C_EASY : C_HARD, boxShadow: `0 0 6px ${ok ? C_EASY : C_HARD}80` }} />
                                            <span style={{ flex: 1, fontFamily: Fm, fontSize: compactLaptop?10:11, color: 'rgba(255,255,255,0.75)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                                            {diffColor && <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.08em', color: diffColor, padding: '3px 7px', background: `${diffColor}14`, borderRadius: 4, border: `1px solid ${diffColor}28`, flexShrink: 0, textTransform: 'uppercase' }}>{r.difficulty}</span>}
                                            {ts && <span style={{ fontFamily: Fm, fontSize: 10, color: 'rgba(255,255,255,0.58)', flexShrink: 0 }}>{ts}</span>}
                                            <span style={{ fontFamily: Fm, fontSize: 10, letterSpacing: '0.1em', color: ok ? C_EASY : C_HARD, flexShrink: 0, fontWeight: 700 }}>{ok ? 'AC' : 'WA'}</span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </motion.div>

                    {/* ════ CHALLENGE A LEGEND ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.53 }}
                        style={{ ...panelSurface, padding: blockPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                            <div>
                                <div style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', marginBottom: 6 }}>Challenge a Legend</div>
                                <div style={{ fontFamily: Fm, fontSize: 10, color: 'rgba(255,255,255,0.66)', letterSpacing: '0.04em' }}>Type legend name, then compare power in popup.</div>
                            </div>
                            <div style={{ fontFamily: Fm, fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>search any username</div>
                        </div>
                        <form onSubmit={handleChallengeSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <input
                                value={challengeName}
                                onChange={(e) => setChallengeName(e.target.value)}
                                placeholder="enter username..."
                                style={{
                                    flex: '1 1 240px',
                                    minWidth: 220,
                                    padding: compactLaptop ? '10px 12px' : '12px 14px',
                                    borderRadius: 10,
                                    border: '1px solid rgba(0,245,212,0.22)',
                                    background: 'rgba(255,255,255,0.04)',
                                    color: 'rgba(255,255,255,0.9)',
                                    fontFamily: Fm,
                                    fontSize: 10,
                                    letterSpacing: '0.08em',
                                    outline: 'none',
                                }}
                            />
                            <button
                                type="submit"
                                style={{
                                    fontFamily: Fm,
                                    fontSize: 9.5,
                                    letterSpacing: '0.16em',
                                    textTransform: 'uppercase',
                                    color: '#00f5d4',
                                    background: 'rgba(0,245,212,0.08)',
                                    border: '1px solid rgba(0,245,212,0.28)',
                                    borderRadius: 10,
                                    padding: compactLaptop ? '10px 14px' : '12px 16px',
                                    cursor: 'pointer',
                                    transition: 'all 0.18s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,245,212,0.5)'; e.currentTarget.style.background = 'rgba(0,245,212,0.12)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,245,212,0.28)'; e.currentTarget.style.background = 'rgba(0,245,212,0.08)'; }}
                            >
                                Challenge
                            </button>
                        </form>
                    </motion.div>

                    {/* Bottom accent line */}
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: 0.7 }}
                        style={{ height: 1, marginTop: 8, transformOrigin: 'right', background: `linear-gradient(90deg, transparent, ${C_TEAL}60, ${C_TEAL}90)`, boxShadow: `0 0 8px ${C_TEAL}40` }} />

                    {/* ════ BOTTOM ACTION BAR ════ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.75 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compactLaptop ? '12px 0 0' : '16px 0 4px', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: C_EASY, boxShadow: `0 0 8px ${C_EASY}` }} />
                            <span style={{ fontFamily: Fm, fontSize: 9, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.75)' }}>ONLINE · LAST SEEN JUST NOW</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {username && (
                                <a href={`https://leetcode.com/${username}`} target="_blank" rel="noreferrer"
                                    style={{ fontFamily: Fm, fontSize: 9.5, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.7)', padding: '7px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(0,245,212,0.2)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.18s' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                                    VIEW ON LEETCODE ↗
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* VS Modal */}
            {createPortal(
                <AnimatePresence>
                    {challengeMiss && (
                        <ChallengeNoticeModal
                            query={challengeMiss}
                            onClose={() => setChallengeMiss('')}
                        />
                    )}
                    {vsOpponent && (
                        <VSModal
                            myData={myFighterData}
                            opponent={vsOpponent}
                            onClose={() => setVsOpponent(null)}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

export default React.memo(FighterCard);
