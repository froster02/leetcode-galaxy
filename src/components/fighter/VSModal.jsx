import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { calcPower, getFighterClass } from '../../utils/gameData';
import { Fd, Fm } from './theme';

/* ══════════════════════════════════════════════════════════
   VS Modal
══════════════════════════════════════════════════════════ */
const FighterCol = React.memo(function FighterCol({ cls, name, pow, isMe, won }) {
    return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            padding: '24px 12px', borderRadius: 14, minWidth: 0,
            background: won ? `${cls.color}0c` : 'rgba(255,255,255,0.03)',
            border: `1px solid ${won ? cls.color + '40' : 'rgba(255,255,255,0.08)'}`,
            position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: `${cls.color}12`,
                border: `2px solid ${cls.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: Fd, fontSize: 22, fontWeight: 900, color: cls.color }}>
                {name[0].toUpperCase()}
            </div>
            {isMe && <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 20, padding: '2px 8px', textTransform: 'uppercase' }}>YOU</div>}
            <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.2em', color: cls.color, textTransform: 'uppercase' }}>{cls.label}</div>
            <div style={{ fontFamily: Fd, fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textAlign: 'center' }}>{name}</div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: Fd, fontSize: 'clamp(1.375rem, 7vw, 2rem)', fontWeight: 900, color: won ? cls.color : 'rgba(255,255,255,0.5)',
                    lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                    {pow.toLocaleString()}
                </div>
                <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', marginTop: 4 }}>POWER</div>
            </div>
            {won && <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.2em', color: cls.color, padding: '3px 10px',
                borderRadius: 20, background: `${cls.color}15`, border: `1px solid ${cls.color}30` }}>
                ★ WINNER
            </div>}
        </div>
    );
});

export function VSModal({ myData, opponent, onClose }) {
    const reduced = useReducedMotion();
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
            data-theme="dark" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)',
                display: 'flex', overflowY: 'auto', overscrollBehavior: 'contain', padding: 'max(16px, env(safe-area-inset-top)) 16px max(16px, env(safe-area-inset-bottom))' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
                transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
                onClick={e => e.stopPropagation()}
                style={{ background: 'var(--bg-surface)', margin: 'auto',
                    border: `1px solid ${resultColor}30`, borderRadius: 20,
                    padding: 'clamp(20px, 5vw, 32px) clamp(16px, 5vw, 28px)', maxWidth: 580, width: '100%',
                    position: 'relative', overflow: 'hidden' }}
            >
                {/* Result header */}
                <div style={{ textAlign: 'center', marginBottom: 24, position: 'relative' }}>
                    <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>BATTLE RESULT</div>
                    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, duration: 0.35, ease: [0.16,1,0.3,1] }}
                        style={{ fontFamily: Fd, fontSize: 'clamp(2rem, 9vw, 2.625rem)', fontWeight: 900, color: resultColor,
                            letterSpacing: '0.05em' }}>
                        {iWin ? 'VICTORY' : 'DEFEAT'}
                    </motion.div>
                    <div style={{ marginTop: 10, fontFamily: Fm, fontSize: 12, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
                        More powerful: <span style={{ color: resultColor }}>{winnerName}</span> · {winnerPow.toLocaleString()} power
                    </div>
                </div>

                {/* Fighter columns */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', marginBottom: 20, flexWrap: 'wrap' }}>
                    <FighterCol cls={myCls} name={myData.username} pow={myPow} isMe won={iWin} reduced={reduced} />
                    {/* VS divider */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, minWidth: 36 }}>
                        <div style={{ flex: 1, width: 1, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
                        <div style={{ fontFamily: Fd, fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.18)', letterSpacing: '0.1em' }}>VS</div>
                        <div style={{ flex: 1, width: 1, background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
                    </div>
                    <FighterCol cls={oppCls} name={opponent.u} pow={oppPow} isMe={false} won={!iWin} reduced={reduced} />
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
                    {[
                        { label: 'Power Gap',   value: diff.toLocaleString(), color: resultColor },
                        { label: 'Dominance',   value: `${dominance}%`,       color: iWin ? '#0a84ff' : '#f5a623' },
                        { label: 'Your Rank',   value: myCls.label,           color: myCls.color },
                    ].map(({ label, value, color }) => (
                        <div key={label} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(10,132,255,0.22)' }}>
                            <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
                            <div style={{ fontFamily: Fd, fontSize: 13, fontWeight: 700, color }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Motivational line */}
                <div style={{ textAlign: 'center', fontFamily: Fm, fontSize: 12, color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.06em', marginBottom: 20, fontStyle: 'italic' }}>
                    {iWin ? `You outpower ${opponent.u} by ${diff.toLocaleString()} pts. Keep climbing.`
                           : `Close the ${diff.toLocaleString()} pt gap. Solve harder problems.`}
                </div>

                <div style={{ textAlign: 'center' }}>
                    <button onClick={onClose} style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em',
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

export function ChallengeNoticeModal({ query, onClose }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
            data-theme="dark" style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
                transition={{ duration: 0.18, ease: [0.16,1,0.3,1] }}
                onClick={e => e.stopPropagation()}
                style={{ background: 'var(--bg-surface)', border: '1px solid rgba(245,166,35,0.35)', borderRadius: 20, padding: '28px 24px', maxWidth: 520, width: '100%', position: 'relative', overflow: 'hidden' }}
            >
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                    <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>BATTLE RESULT</div>
                    <div style={{ fontFamily: Fd, fontSize: 30, fontWeight: 900, color: '#f5a623', letterSpacing: '0.05em' }}>NO MATCH</div>
                </div>
                <div style={{ textAlign: 'center', fontFamily: Fm, fontSize: 13, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.08em', marginBottom: 16 }}>
                    No user found for <span style={{ color: '#fff' }}>{query}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <button onClick={onClose} style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.75)', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '9px 32px', cursor: 'pointer', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,166,35,0.55)'; e.currentTarget.style.color = '#f5a623'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}>
                        CLOSE
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
