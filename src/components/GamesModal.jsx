import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { calcPower, getFighterClass, CODERS } from './CityScene';

/* ─────────────────────────────────────────────── */
/*  GAME 1 — HIGHER OR LOWER                       */
/* ─────────────────────────────────────────────── */
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function FighterCardMini({ coder, reveal, highlight }) {
    const pw = calcPower(coder.easy, coder.med, coder.hard);
    const cls = getFighterClass(coder.hard);
    return (
        <div style={{
            flex: 1, border: `1px solid ${highlight === 'win' ? '#22c55e' : highlight === 'lose' ? '#ef4444' : `${cls.color}40`}`,
            borderRadius: 14, padding: '20px 16px', background: `${cls.color}08`,
            boxShadow: highlight === 'win' ? '0 0 24px rgba(34,197,94,0.3)' : highlight === 'lose' ? '0 0 24px rgba(239,68,68,0.2)' : 'none',
            transition: 'all 0.3s', cursor: 'default', textAlign: 'center',
        }}>
            <div style={{ width: 42, height: 42, margin: '0 auto 12px', borderRadius: 11, background: `${cls.color}20`, border: `1.5px solid ${cls.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Orbitron, sans-serif', fontSize: 18, fontWeight: 900, color: cls.color }}>
                {coder.u.charAt(0).toUpperCase()}
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700, color: '#f0f0f0', marginBottom: 6 }}>{coder.u}</div>
            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 8, color: cls.color, letterSpacing: '0.18em', border: `1px solid ${cls.color}50`, borderRadius: 99, padding: '2px 8px', display: 'inline-block', marginBottom: 12 }}>{cls.label}</span>
            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: reveal ? 32 : 14, fontWeight: 900, color: reveal ? cls.color : '#333', letterSpacing: '-0.02em', marginTop: 6, textShadow: reveal ? `0 0 20px ${cls.color}80` : 'none', transition: 'all 0.4s' }}>
                {reveal ? pw.toLocaleString() : '???'}
            </div>
            {reveal && <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 8, color: '#444', letterSpacing: '0.15em', marginTop: 3 }}>POWER</div>}
            {reveal && (
                <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#555', display: 'flex', gap: 8, justifyContent: 'center' }}>
                    <span style={{ color: '#22c55e' }}>E:{coder.easy}</span>
                    <span style={{ color: '#f59e0b' }}>M:{coder.med}</span>
                    <span style={{ color: '#ef4444' }}>H:{coder.hard}</span>
                </div>
            )}
        </div>
    );
}

function HigherOrLower() {
    const [pool] = useState(() => shuffle(CODERS));
    const [idx, setIdx] = useState(0);
    const [pair, setPair] = useState([pool[0], pool[1]]);
    const [reveal, setReveal] = useState(false);
    const [result, setResult] = useState(null); // 'correct' | 'wrong'
    const [score, setScore] = useState(0);
    const [streak, setStreak] = useState(0);
    const [best, setBest] = useState(0);

    const guess = (choice) => {
        if (reveal) return;
        const powA = calcPower(pair[0].easy, pair[0].med, pair[0].hard);
        const powB = calcPower(pair[1].easy, pair[1].med, pair[1].hard);
        const correct = (choice === 'A' && powA >= powB) || (choice === 'B' && powB > powA);
        setReveal(true);
        setResult(correct ? 'correct' : 'wrong');
        if (correct) {
            setScore(s => s + 1);
            setStreak(k => { const nk = k + 1; if (nk > best) setBest(nk); return nk; });
        } else {
            setStreak(0);
        }
        setTimeout(() => {
            const ni = idx + 2;
            const next = [pool[ni % pool.length], pool[(ni + 1) % pool.length]];
            setPair(next);
            setIdx(ni);
            setReveal(false);
            setResult(null);
        }, 1800);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 16, fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: '#555', letterSpacing: '0.1em' }}>
                    <span>SCORE <span style={{ color: '#f0f0f0', fontSize: 16, fontWeight: 700 }}>{score}</span></span>
                    <span>STREAK <span style={{ color: streak > 0 ? '#f59e0b' : '#f0f0f0', fontSize: 16, fontWeight: 700 }}>{streak}🔥</span></span>
                    <span>BEST <span style={{ color: '#8b5cf6', fontSize: 16, fontWeight: 700 }}>{best}</span></span>
                </div>
                {result && (
                    <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                        style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 16, fontWeight: 900, color: result === 'correct' ? '#22c55e' : '#ef4444' }}>
                        {result === 'correct' ? '✓ CORRECT' : '✗ WRONG'}
                    </motion.div>
                )}
            </div>

            <p style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#444', marginBottom: 16 }}>
                Which fighter has a higher <span style={{ color: '#ef4444' }}>Power Level</span>?
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <FighterCardMini coder={pair[0]} reveal={reveal} highlight={reveal ? (calcPower(pair[0].easy, pair[0].med, pair[0].hard) >= calcPower(pair[1].easy, pair[1].med, pair[1].hard) ? 'win' : 'lose') : null} />
                <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 900, color: '#333', flexShrink: 0 }}>VS</div>
                <FighterCardMini coder={pair[1]} reveal={reveal} highlight={reveal ? (calcPower(pair[1].easy, pair[1].med, pair[1].hard) > calcPower(pair[0].easy, pair[0].med, pair[0].hard) ? 'win' : 'lose') : null} />
            </div>

            {!reveal && (
                <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => guess('A')} style={{ flex: 1, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: '#818cf8', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.target.style.background = 'rgba(99,102,241,0.2)'; e.target.style.boxShadow = '0 0 16px rgba(99,102,241,0.2)'; }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(99,102,241,0.1)'; e.target.style.boxShadow = 'none'; }}>
                        ← LEFT IS HIGHER
                    </button>
                    <button onClick={() => guess('B')} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif', fontSize: 11, letterSpacing: '0.1em', color: '#f87171', transition: 'all 0.18s' }}
                        onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.2)'; e.target.style.boxShadow = '0 0 16px rgba(239,68,68,0.2)'; }}
                        onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.boxShadow = 'none'; }}>
                        RIGHT IS HIGHER →
                    </button>
                </div>
            )}
            {reveal && <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#333', marginTop: 8 }}>Next battle loading...</div>}
        </div>
    );
}

/* ─────────────────────────────────────────────── */
/*  GAME 2 — TOURNAMENT BRACKET                    */
/* ─────────────────────────────────────────────── */
function TournamentBracket() {
    const makePool = () => shuffle(CODERS).slice(0, 8);
    const [fighters, setFighters] = useState(makePool);
    const [round, setRound] = useState(0); // 0=R1, 1=QF, 2=Semi, 3=Final
    const [rounds, setRounds] = useState([makePool()]);
    const [winner, setWinner] = useState(null);
    const [animBattle, setAnimBattle] = useState(null);

    const reset = () => {
        const pool = makePool();
        setFighters(pool);
        setRounds([pool]);
        setRound(0);
        setWinner(null);
        setAnimBattle(null);
    };

    const runRound = () => {
        const current = rounds[round];
        if (current.length === 1) return;
        const next = [];
        const pairs = [];
        for (let i = 0; i < current.length; i += 2) {
            const a = current[i];
            const b = current[i + 1] || a;
            const powA = calcPower(a.easy, a.med, a.hard);
            const powB = calcPower(b.easy, b.med, b.hard);
            const w = powA >= powB ? a : b;
            next.push(w);
            pairs.push({ a, b, w });
        }
        setAnimBattle(pairs);
        setTimeout(() => {
            setAnimBattle(null);
            if (next.length === 1) {
                setWinner(next[0]);
            } else {
                setRounds(r => [...r, next]);
                setRound(rn => rn + 1);
            }
        }, 2000);
    };

    const current = rounds[round] || [];
    const labels = ['Round 1', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#555', letterSpacing: '0.1em' }}>
                    {winner ? '🏆 CHAMPION CROWNED' : labels[round] || 'ROUND 1'}
                </div>
                <button onClick={reset} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#444', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.1em' }}>
                    NEW BRACKET
                </button>
            </div>

            {winner ? (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    style={{ textAlign: 'center', padding: 32 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, color: '#555', letterSpacing: '0.2em', marginBottom: 8 }}>TOURNAMENT CHAMPION</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>{winner.u}</div>
                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 22, fontWeight: 900, color: '#f59e0b', textShadow: '0 0 20px rgba(245,158,11,0.6)' }}>{calcPower(winner.easy, winner.med, winner.hard).toLocaleString()} PWR</div>
                    <button onClick={reset} style={{ marginTop: 20, background: '#f59e0b', color: '#000', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif', fontWeight: 700, fontSize: 11, letterSpacing: '0.1em' }}>
                        NEW TOURNAMENT
                    </button>
                </motion.div>
            ) : animBattle ? (
                <div>
                    {animBattle.map((b, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: b.w.u === b.a.u ? '#22c55e' : '#555', flex: 1, textAlign: 'right', fontWeight: b.w.u === b.a.u ? 700 : 400 }}>{b.a.u} ({calcPower(b.a.easy, b.a.med, b.a.hard).toLocaleString()})</span>
                            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 10, color: '#ef4444', letterSpacing: '0.1em', flexShrink: 0 }}>⚔️</span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: b.w.u === b.b.u ? '#22c55e' : '#555', flex: 1, fontWeight: b.w.u === b.b.u ? 700 : 400 }}>{b.b.u} ({calcPower(b.b.easy, b.b.med, b.b.hard).toLocaleString()})</span>
                            <span style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#22c55e', letterSpacing: '0.1em', flexShrink: 0 }}>→ {b.w.u}</span>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
                        {current.map((c, i) => {
                            const cls = getFighterClass(c.hard);
                            return (
                                <div key={c.u} style={{ textAlign: 'center', padding: '10px 8px', borderRadius: 10, background: `${cls.color}08`, border: `1px solid ${cls.color}30` }}>
                                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 20, color: cls.color, marginBottom: 4 }}>{cls.emoji}</div>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#ccc', fontWeight: 600, marginBottom: 2 }}>{c.u}</div>
                                    <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: cls.color, letterSpacing: '0.1em' }}>{cls.label}</div>
                                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#555', marginTop: 4 }}>{calcPower(c.easy, c.med, c.hard).toLocaleString()}</div>
                                </div>
                            );
                        })}
                    </div>
                    {current.length > 1 && (
                        <button onClick={runRound}
                            style={{ width: '100%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px', cursor: 'pointer', fontFamily: 'Orbitron, sans-serif', fontSize: 11, letterSpacing: '0.12em', color: '#ef4444', boxShadow: '0 0 16px rgba(239,68,68,0.1)' }}
                            onMouseEnter={e => { e.target.style.background = 'rgba(239,68,68,0.2)'; e.target.style.boxShadow = '0 0 24px rgba(239,68,68,0.25)'; }}
                            onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.1)'; e.target.style.boxShadow = '0 0 16px rgba(239,68,68,0.1)'; }}>
                            ⚔️ BATTLE  {current.length / 2} MATCHES → {current.length / 2} ADVANCE
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────── */
/*  GAME 3 — LIVE LEADERBOARD RACE                 */
/* ─────────────────────────────────────────────── */
const METRICS = [
    { key: 'power', label: 'POWER', fn: c => calcPower(c.easy, c.med, c.hard) },
    { key: 'hard', label: 'HARD', fn: c => c.hard },
    { key: 'med', label: 'MEDIUM', fn: c => c.med },
    { key: 'easy', label: 'EASY', fn: c => c.easy },
    { key: 'total', label: 'TOTAL', fn: c => c.easy + c.med + c.hard },
];

function LeaderboardRace() {
    const [metricIdx, setMetricIdx] = useState(0);
    const metric = METRICS[metricIdx];
    const sorted = [...CODERS].sort((a, b) => metric.fn(b) - metric.fn(a)).slice(0, 10);
    const maxVal = metric.fn(sorted[0]);

    return (
        <div>
            {/* Metric selector */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {METRICS.map((m, i) => (
                    <button key={m.key} onClick={() => setMetricIdx(i)}
                        style={{
                            fontFamily: 'Orbitron, sans-serif', fontSize: 9, letterSpacing: '0.1em', padding: '5px 12px', borderRadius: 6, cursor: 'pointer', border: '1px solid', transition: 'all 0.2s',
                            background: i === metricIdx ? 'rgba(239,68,68,0.15)' : 'transparent',
                            borderColor: i === metricIdx ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.08)',
                            color: i === metricIdx ? '#ef4444' : '#444',
                        }}>
                        {m.label}
                    </button>
                ))}
            </div>

            {/* Bars */}
            {sorted.map((c, i) => {
                const val = metric.fn(c);
                const pct = (val / maxVal) * 100;
                const cls = getFighterClass(c.hard);
                return (
                    <motion.div key={c.u} layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.35 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: i === 0 ? '#f59e0b' : '#444', width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</div>
                        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#ccc', width: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>{c.u}</div>
                        <div style={{ flex: 1, height: 20, borderRadius: 4, background: 'rgba(255,255,255,0.04)', overflow: 'hidden', position: 'relative' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: i * 0.05 }}
                                style={{ height: '100%', background: `linear-gradient(90deg, ${cls.color}80, ${cls.color})`, borderRadius: 4, boxShadow: `0 0 8px ${cls.color}60`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>
                            </motion.div>
                        </div>
                        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 11, fontWeight: 700, color: cls.color, width: 60, textAlign: 'right', flexShrink: 0 }}>
                            {val.toLocaleString()}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

/* ─────────────────────────────────────────────── */
/*  MAIN GAMES MODAL                               */
/* ─────────────────────────────────────────────── */
const GAMES = [
    { id: 'h', label: 'Higher or Lower', icon: '⚖️', desc: 'Guess which coder has more power' },
    { id: 't', label: 'Tournament', icon: '🏆', desc: 'Watch 8 fighters battle it out' },
    { id: 'l', label: 'Leaderboard', icon: '📊', desc: 'Compare fighters across metrics' },
];

export default function GamesModal({ onClose }) {
    const [activeGame, setActiveGame] = useState('h');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,6,10,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.94, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.94, y: 20 }}
                transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                onClick={e => e.stopPropagation()}
                style={{ background: '#090a10', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
                {/* Modal header */}
                <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <div>
                            <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 14, fontWeight: 700, color: '#f0f0f0', letterSpacing: '0.05em' }}>🎮 ARENA GAMES</div>
                            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#444', marginTop: 3 }}>Based on real LeetCode stats</div>
                        </div>
                        <button onClick={onClose} style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: '#444', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', letterSpacing: '0.12em' }}>
                            ✕ CLOSE
                        </button>
                    </div>

                    {/* Game tabs */}
                    <div style={{ display: 'flex', gap: 0 }}>
                        {GAMES.map((g) => (
                            <button key={g.id} onClick={() => setActiveGame(g.id)}
                                style={{ flex: 1, background: 'none', border: 'none', borderBottom: `2px solid ${activeGame === g.id ? '#ef4444' : 'transparent'}`, padding: '10px 8px', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.2s' }}>
                                <div style={{ fontSize: 18, marginBottom: 4 }}>{g.icon}</div>
                                <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 9, color: activeGame === g.id ? '#ef4444' : '#444', letterSpacing: '0.1em', transition: 'color 0.2s' }}>{g.label}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Game content */}
                <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeGame}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}>
                            {activeGame === 'h' && <HigherOrLower />}
                            {activeGame === 't' && <TournamentBracket />}
                            {activeGame === 'l' && <LeaderboardRace />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </motion.div>
    );
}
