import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/* Each slide is one idea on one solid color field. Text is always white on
   these deep fields, so contrast holds in both system themes. */

const SPRING = { type: 'spring', bounce: 0, duration: 0.6 };

function useCountUp(target, active, reduced, duration = 1100) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        if (!active || reduced) return;
        let raf;
        const start = performance.now();
        const tick = (now) => {
            const p = Math.min((now - start) / duration, 1);
            setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(raf);
            // Reset on leave so a revisit starts at 0 instead of flashing the old total
            setValue(0);
        };
    }, [target, active, reduced, duration]);
    return active && !reduced ? value : target;
}

/* Children rise in sequence once the slide becomes active. */
function Rise({ active, reduced, delay = 0, children, style }) {
    if (reduced) return <div style={style}>{children}</div>;
    return (
        <motion.div
            initial={false}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ ...SPRING, delay: active ? delay : 0 }}
            style={style}
        >
            {children}
        </motion.div>
    );
}

function Frame({ bg, children }) {
    return (
        <div style={{
            width: '100%', height: '100%', background: bg, color: '#fff',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            // Clears the floating header (safe area + progress + 44px buttons)
            // Side padding also caps the text column at ~600px on wide/landscape screens
            padding: 'calc(max(12px, env(safe-area-inset-top)) + 76px) max(24px, env(safe-area-inset-right), calc((100% - 600px) / 2)) max(32px, calc(env(safe-area-inset-bottom) + 20px)) max(24px, env(safe-area-inset-left), calc((100% - 600px) / 2))',
            gap: 'clamp(10px, 2.2vh, 18px)', overflow: 'hidden',
        }}>
            {children}
        </div>
    );
}

const caption = { fontSize: '0.8125rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' };
// Sizes follow the smaller of width and height so landscape phones don't overflow
const display = { fontSize: 'clamp(2.75rem, min(16vw, 12vh), 5.5rem)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' };
const title = { fontSize: 'clamp(1.75rem, min(9vw, 7vh), 2.75rem)', fontWeight: 700, lineHeight: 1.08, letterSpacing: '-0.03em' };
const body = { fontSize: 'clamp(1rem, 2.4vh, 1.125rem)', lineHeight: 1.45, color: 'rgba(255,255,255,0.78)', letterSpacing: '-0.005em' };

export function Intro({ w, active, reduced }) {
    return (
        <Frame bg="#0a0a0c">
            <Rise active={active} reduced={reduced}><div style={caption}>@{w.username}</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.08}>
                <div style={title}>Your LeetCode,<br />wrapped.</div>
            </Rise>
            <Rise active={active} reduced={reduced} delay={0.16}>
                <div style={body}>
                    {w.ranking ? `Ranked #${w.ranking.toLocaleString()} worldwide. ` : ''}Let’s look at what you’ve built.
                </div>
            </Rise>
        </Frame>
    );
}

export function Total({ w, active, reduced }) {
    const n = useCountUp(w.total, active, reduced);
    const pct = w.totalAvailable ? Math.round((w.total / w.totalAvailable) * 100) : null;
    return (
        <Frame bg="#0b1d3a">
            <Rise active={active} reduced={reduced}><div style={caption}>Problems solved</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.05}><div style={{ ...display, color: '#64d2ff' }}>{n.toLocaleString()}</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.15}>
                <div style={body}>
                    {pct != null ? `That’s ${pct}% of every problem on LeetCode.` : 'Every one of them, accepted.'}
                    {w.totalSubmissions > 0 && ` Across ${w.totalSubmissions.toLocaleString()} submissions this year.`}
                </div>
            </Rise>
        </Frame>
    );
}

export function Split({ w, active, reduced }) {
    const max = Math.max(w.easy, w.med, w.hard, 1);
    const rows = [
        { label: 'Easy', n: w.easy, color: '#30d158' },
        { label: 'Medium', n: w.med, color: '#ff9f0a' },
        { label: 'Hard', n: w.hard, color: '#ff453a' },
    ];
    const hardShare = w.total ? Math.round((w.hard / w.total) * 100) : 0;
    return (
        <Frame bg="#0f2418">
            <Rise active={active} reduced={reduced}><div style={caption}>How you like them</div></Rise>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2.2vh, 18px)', marginTop: 6 }}>
                {rows.map((r, i) => (
                    <Rise key={r.label} active={active} reduced={reduced} delay={0.06 + i * 0.07}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                            <span style={{ fontSize: '1.0625rem', fontWeight: 600 }}>{r.label}</span>
                            <span style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: r.color }}>{r.n.toLocaleString()}</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                            <motion.div
                                initial={false}
                                animate={{ scaleX: active || reduced ? r.n / max : 0 }}
                                transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.15 + i * 0.07 }}
                                style={{ height: '100%', background: r.color, borderRadius: 4, transformOrigin: 'left' }}
                            />
                        </div>
                    </Rise>
                ))}
            </div>
            <Rise active={active} reduced={reduced} delay={0.35}>
                <div style={body}>
                    {hardShare >= 15 ? `${hardShare}% Hard. You don’t pick easy fights.`
                        : hardShare >= 5 ? `${hardShare}% Hard. Brave when it counts.`
                        : 'Mostly warm-ups. The Hard tab is waiting.'}
                </div>
            </Rise>
        </Frame>
    );
}

export function Topic({ w, active, reduced, stageH }) {
    const [top, ...rest] = w.topics;
    return (
        <Frame bg="#2a1706">
            <Rise active={active} reduced={reduced}><div style={caption}>Your home turf</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.06}><div style={{ ...title, color: '#ffb340' }}>{top.name}</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.12}><div style={body}>{top.solved.toLocaleString()} problems solved.</div></Rise>
            {rest.length > 0 && stageH >= 560 && (
                <Rise active={active} reduced={reduced} delay={0.22} style={{ marginTop: 10 }}>
                    <div style={{ ...caption, marginBottom: 10 }}>Also on rotation</div>
                    {rest.slice(0, 3).map(t => (
                        <div key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid rgba(255,255,255,0.12)', fontSize: '1.0625rem' }}>
                            <span>{t.name}</span>
                            <span style={{ fontVariantNumeric: 'tabular-nums', color: 'rgba(255,255,255,0.7)' }}>{t.solved}</span>
                        </div>
                    ))}
                </Rise>
            )}
        </Frame>
    );
}

export function Rhythm({ w, active, reduced }) {
    const max = Math.max(...w.months.map(m => m.count), 1);
    return (
        <Frame bg="#1d0f33">
            <Rise active={active} reduced={reduced}><div style={caption}>Your peak month</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.06}><div style={{ ...title, color: '#da8fff' }}>{w.busiestMonth.name}</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.12}>
                <div style={body}>{w.busiestMonth.count.toLocaleString()} submissions.{w.busiestWeekday && ` ${w.busiestWeekday.name}s are your day.`}</div>
            </Rise>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 'min(120px, 18vh)', marginTop: 12 }} aria-hidden>
                {w.months.map((m, i) => (
                    <div key={`${m.year}-${m.month}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                        <motion.div
                            initial={false}
                            animate={{ scaleY: active || reduced ? Math.max(m.count / max, 0.03) : 0 }}
                            transition={reduced ? { duration: 0 } : { ...SPRING, delay: 0.2 + i * 0.03 }}
                            style={{
                                width: '100%', height: '100%', borderRadius: 4, transformOrigin: 'bottom',
                                background: m.year === w.busiestMonth.year && m.month === w.busiestMonth.month ? '#da8fff' : 'rgba(255,255,255,0.22)',
                            }}
                        />
                        <span style={{ fontSize: '0.625rem', color: 'rgba(255,255,255,0.5)' }}>{m.label[0]}</span>
                    </div>
                ))}
            </div>
        </Frame>
    );
}

export function Streak({ w, active, reduced }) {
    const n = useCountUp(w.maxStreak, active, reduced, 900);
    return (
        <Frame bg="#350c12">
            <Rise active={active} reduced={reduced}><div style={caption}>Longest streak</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.05}>
                <div style={{ ...display, color: '#ff6961' }}>{n}<span style={{ fontSize: '0.35em', fontWeight: 600, letterSpacing: 0, marginLeft: 8 }}>days</span></div>
            </Rise>
            <Rise active={active} reduced={reduced} delay={0.15}>
                <div style={body}>
                    {w.currentStreak > 0 ? `You’re on a ${w.currentStreak}-day run right now. Don’t break it.` : 'Current streak: zero. Today’s a good day to restart.'}
                    {` Active on ${w.activeDays} days this year.`}
                </div>
            </Rise>
        </Frame>
    );
}

export function Contest({ w, active, reduced }) {
    const n = useCountUp(w.contest.rating, active, reduced);
    return (
        <Frame bg="#06262b">
            <Rise active={active} reduced={reduced}><div style={caption}>Contest rating</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.05}><div style={{ ...display, color: '#66d4cf' }}>{n.toLocaleString()}</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.15}>
                <div style={body}>
                    {w.contest.attended} contests entered{w.contest.topPercentage != null ? ` — top ${w.contest.topPercentage}% of competitors` : ''}.
                    {w.contest.topRating && w.contest.topRating > w.contest.rating ? ` Peak: ${w.contest.topRating.toLocaleString()}.` : ''}
                </div>
            </Rise>
        </Frame>
    );
}

export function Personality({ w, active, reduced }) {
    const p = w.personality;
    return (
        <Frame bg="#0a0a0c">
            <Rise active={active} reduced={reduced}><div style={caption}>Your coder type</div></Rise>
            <div style={{ display: 'flex', gap: 8 }}>
                {p.code.split('').map((ch, i) => (
                    <Rise key={i} active={active} reduced={reduced} delay={0.06 + i * 0.07} style={{ flex: '1 1 0', maxWidth: 64 }}>
                        <div style={{
                            width: '100%', aspectRatio: '64 / 76', borderRadius: 14, background: '#0a84ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 'clamp(1.75rem, min(9vw, 7vh), 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em',
                        }}>{ch}</div>
                    </Rise>
                ))}
            </div>
            <Rise active={active} reduced={reduced} delay={0.4}><div style={title}>{p.title}</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.48}><div style={body}>{p.blurb} {p.detail}</div></Rise>
        </Frame>
    );
}

export function Roast({ w, active, reduced }) {
    return (
        <Frame bg="#1c1c1e">
            <Rise active={active} reduced={reduced}><div style={caption}>One more thing</div></Rise>
            <Rise active={active} reduced={reduced} delay={0.1}>
                <div style={{ ...title, fontWeight: 600 }}>“{w.roast}”</div>
            </Rise>
        </Frame>
    );
}
