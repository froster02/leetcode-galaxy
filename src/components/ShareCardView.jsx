import React from 'react';
import { parseCalendar, calendarStats } from '../utils/calendar';
import { Heatmap } from './Heatmap';
import { buildWrapped } from '../utils/wrapped';

const Fs = 'var(--font)';
const Fm = 'var(--font-mono)';
const Fo = 'var(--font)';

/* ── Rank ── */
function getRank(hard, rating) {
    if (rating >= 2400 || hard >= 500) return { name: 'Guardian', top: 'Top 0.5% of all LeetCode users.', sub: 'Elite problem solver.', color: '#f59e0b', glow: '#f59e0b', badge: '#fbbf24', elite: true };
    if (rating >= 2100 || hard >= 300) return { name: 'Knight',   top: 'Top 2% of all LeetCode users.',   sub: 'Highly skilled coder.',   color: '#a78bfa', glow: '#8b5cf6', badge: '#c4b5fd', elite: true };
    if (rating >= 1800 || hard >= 150) return { name: 'Expert',   top: 'Top 8% of all LeetCode users.',   sub: 'Advanced algorithmist.',  color: '#22d3ee', glow: '#06b6d4', badge: '#67e8f9', elite: false };
    if (rating >= 1500 || hard >= 50)  return { name: 'Solver',   top: 'Top 20% of all LeetCode users.',  sub: 'Solid problem-solver.',   color: '#60a5fa', glow: '#3b82f6', badge: '#93c5fd', elite: false };
    return                                    { name: 'Coder',    top: 'Keep climbing.',                   sub: 'Every problem counts.',   color: '#94a3b8', glow: '#64748b', badge: '#cbd5e1', elite: false };
}

/* ── Premium 3D Hex Badge ── */
function HexBadge({ rank, size = 170 }) {
    const cx = size / 2, cy = size / 2, r = size * 0.42;
    const pts = (scale = 1) => Array.from({ length: 6 }, (_, i) => {
        const a = (Math.PI / 180) * (60 * i - 30);
        return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`;
    }).join(' ');
    const id = `hx_${rank.name}`;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
            <defs>
                {/* Body gradient — dark chrome */}
                <radialGradient id={`${id}_bg`} cx="38%" cy="28%" r="75%">
                    <stop offset="0%"   stopColor="#2d3a52" />
                    <stop offset="30%"  stopColor="#1a2236" />
                    <stop offset="70%"  stopColor="#0f1626" />
                    <stop offset="100%" stopColor="#080d18" />
                </radialGradient>
                {/* Rim chrome gradient */}
                <linearGradient id={`${id}_rim`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor={rank.badge}  stopOpacity="1" />
                    <stop offset="25%"  stopColor="#ffffff"     stopOpacity="0.95" />
                    <stop offset="50%"  stopColor={rank.color}  stopOpacity="0.8" />
                    <stop offset="75%"  stopColor="#ffffff"     stopOpacity="0.6" />
                    <stop offset="100%" stopColor={rank.badge}  stopOpacity="0.7" />
                </linearGradient>
                {/* Inner rim */}
                <linearGradient id={`${id}_rim2`} x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%"  stopColor={rank.color} stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#ffffff"    stopOpacity="0.08" />
                    <stop offset="100%" stopColor={rank.color} stopOpacity="0.15" />
                </linearGradient>
                {/* Top shine */}
                <linearGradient id={`${id}_shine`} x1="20%" y1="0%" x2="80%" y2="60%">
                    <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.0" />
                </linearGradient>
                {/* Letter gradient */}
                <linearGradient id={`${id}_txt`} x1="0%" y1="0%" x2="20%" y2="100%">
                    <stop offset="0%"   stopColor="#ffffff" />
                    <stop offset="40%"  stopColor={rank.badge} />
                    <stop offset="100%" stopColor={rank.color} stopOpacity="0.8" />
                </linearGradient>
                {/* Outer glow filter */}
                <filter id={`${id}_glow`} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="10" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id={`${id}_glow2`} x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="20" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <filter id={`${id}_txtglow`} x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="4" result="b"/>
                    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>

            {/* Deep ambient glow */}
            <polygon points={pts(1.25)} fill={rank.glow} opacity="0.1" filter={`url(#${id}_glow2)`} />
            {/* Outer rim glow */}
            <polygon points={pts(1.06)} fill="none" stroke={rank.color} strokeWidth="4" opacity="0.55" filter={`url(#${id}_glow)`} />
            {/* Second rim */}
            <polygon points={pts(1.03)} fill="none" stroke={rank.badge} strokeWidth="1.5" opacity="0.35" />
            {/* Body */}
            <polygon points={pts()} fill={`url(#${id}_bg)`} />
            {/* Shine layer */}
            <polygon points={pts(0.97)} fill={`url(#${id}_shine)`} />
            {/* Chrome rim */}
            <polygon points={pts()} fill="none" stroke={`url(#${id}_rim)`} strokeWidth="3.5" />
            {/* Inner detail ring */}
            <polygon points={pts(0.78)} fill="none" stroke={`url(#${id}_rim2)`} strokeWidth="1.2" />
            {/* Specular highlight top-left */}
            <ellipse cx={cx * 0.65} cy={cy * 0.55} rx={r * 0.28} ry={r * 0.14} fill="white" opacity="0.08" transform={`rotate(-20 ${cx} ${cy})`} />

            {/* Letter */}
            <text x={cx} y={cy + 3} textAnchor="middle" dominantBaseline="middle"
                fontFamily="system-ui, -apple-system, sans-serif" fontSize={size * 0.3} fontWeight="900"
                fill={`url(#${id}_txt)`} filter={`url(#${id}_txtglow)`}>
                {rank.name[0]}
            </text>
        </svg>
    );
}

/* ── Glass panel ── */
function Panel({ children, style, accent }) {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: `1px solid ${accent || 'rgba(255,255,255,0.1)'}`,
            borderRadius: 18,
            padding: '14px 16px',
            position: 'relative',
            transform: 'translateZ(0)',       /* force GPU layer so overflow clips backdrop-filter */
            WebkitTransform: 'translateZ(0)',
            ...style,
            overflow: 'hidden',              /* always last — cannot be overridden by style prop */
        }}>
            {/* Top luminous edge */}
            <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: `linear-gradient(90deg, transparent, ${accent || 'rgba(255,255,255,0.3)'}, transparent)`, borderRadius: 1 }} />
            {children}
        </div>
    );
}

function SectionLabel({ icon, children, right }) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontSize: 13 }}>{icon}</span>
                <span style={{ fontFamily: Fs, fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', color: '#f59e0b', textTransform: 'uppercase' }}>{children}</span>
            </div>
            {right}
        </div>
    );
}

/* ══════════════════════════════════════════════
   CARD
══════════════════════════════════════════════ */
export function ShareCardView({ data, roast = false }) {
    if (!data) return null;
    const { username, stats, badgesInfo, contestInfo, calendar } = data;

    const easy  = stats?.find(s => s.difficulty === 'Easy')?.count   || 0;
    const med   = stats?.find(s => s.difficulty === 'Medium')?.count  || 0;
    const hard  = stats?.find(s => s.difficulty === 'Hard')?.count   || 0;
    const total = stats?.find(s => s.difficulty === 'All')?.count    || 0;

    const rating    = contestInfo?.rating    ? Math.round(contestInfo.rating)    : null;
    const topRating = contestInfo?.topRating ? Math.round(contestInfo.topRating) : rating;
    const ranking   = contestInfo?.ranking   || null;
    const attended  = contestInfo?.attended  || 0;
    const topPct    = contestInfo?.topPercentage ?? null;

    const badgesCount = badgesInfo?.total || 0;
    const badgesList  = Array.isArray(badgesInfo?.badges) ? badgesInfo.badges : [];

    const rank = getRank(hard, rating || 0);
    const calendarRaw = parseCalendar(calendar);
    const { activeDays, maxStreak, totalSubmissions } = calendarStats(calendarRaw);

    // Same roast inputs as the Wrapped story, so both views agree for one profile
    const roastLine = roast ? buildWrapped(data)?.roast ?? null : null;

    return (
        /* ONE div. overflow:hidden clips every child — glow, content, everything —
           to the same 26px rounded rectangle. No inner card-body div.
           Border is via box-shadow so it renders outside the clip and follows
           the radius automatically — no separate layer, no stitched strips. */
        <div style={{
            width: 520,
            borderRadius: 26,
            overflow: 'hidden',
            position: 'relative',
            background: 'linear-gradient(160deg, #0a0c18 0%, #0d1020 45%, #080b1a 75%, #06080f 100%)',
            color: '#f8fafc',
            fontFamily: Fs,
            boxShadow: [
                /* Hairline outer border — follows border-radius, no separate div */
                '0 0 0 1px rgba(255,255,255,0.13)',
                /* Inner glass highlight — inset, also follows border-radius */
                'inset 0 0 0 1px rgba(255,255,255,0.06)',
                /* Ambient halo */
                '0 0 48px rgba(245,120,20,0.08)',
                '0 0 72px rgba(59,130,246,0.06)',
                '0 60px 100px rgba(0,0,0,0.95)',
            ].join(', '),
        }}>

            {/* Ambient glows — clipped to card shape by overflow:hidden above */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <div style={{
                    position: 'absolute', left: 0, top: 0, width: 220, height: 160,
                    background: 'radial-gradient(ellipse at 15% 15%, rgba(245,110,15,0.28) 0%, rgba(245,110,15,0.08) 50%, transparent 75%)',
                    filter: 'blur(14px)',
                }} />
                <div style={{
                    position: 'absolute', right: 0, top: 0, width: 220, height: 160,
                    background: 'radial-gradient(ellipse at 85% 15%, rgba(59,130,246,0.24) 0%, rgba(59,130,246,0.07) 50%, transparent 75%)',
                    filter: 'blur(14px)',
                }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)' }} />
            </div>

            {/* Content */}
            <div style={{ position: 'relative', zIndex: 1, padding: '36px 36px 22px' }}>

                {/* ══ HEADER ══ */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/leetcode-dark.png" alt="LeetCode" width="28" height="28" style={{ objectFit: 'contain' }} crossOrigin="anonymous" />
                        <span style={{ fontFamily: Fs, fontSize: 17, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>LeetCode</span>
                    </div>
                    {/* User : <username> — right-aligned, clear of corner safe zone */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontFamily: Fs, fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.72)', letterSpacing: '0.01em' }}>User :</span>
                        <span style={{ fontFamily: Fs, fontSize: 13, fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>{username}</span>
                    </div>
                </div>

                {/* ══ HERO ══ */}
                <div style={{ display: 'flex', gap: 18, marginBottom: 16, alignItems: 'center' }}>
                    {/* 3D Badge */}
                    <div style={{ flexShrink: 0, filter: `drop-shadow(0 0 24px ${rank.glow}55)` }}>
                        <HexBadge rank={rank} size={162} />
                    </div>
                    {/* Rank info */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', marginBottom: 8 }}>
                            <span style={{ fontFamily: Fs, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.14em' }}>RANK</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontFamily: Fs, fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>{rank.name}</span>
                            <span style={{ color: rank.color, fontSize: 20, filter: `drop-shadow(0 0 8px ${rank.color})` }}>✦</span>
                        </div>
                        <div style={{ fontFamily: Fs, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: 14 }}>
                            {rank.top}<br />{rank.sub}
                        </div>
                        {/* Contest rating */}
                        {rating && (
                            <Panel accent="rgba(34,211,238,0.3)" style={{ padding: '12px 16px', background: 'rgba(34,211,238,0.06)' }}>
                                <div style={{ fontFamily: Fs, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', color: '#22d3ee', marginBottom: 6, textTransform: 'uppercase' }}>Peak Contest Rating</div>
                                <div style={{ fontFamily: Fs, fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1, textShadow: '0 0 30px rgba(255,255,255,0.2)' }}>{(topRating || rating)?.toLocaleString()}</div>
                            </Panel>
                        )}
                    </div>
                </div>

                {/* ══ PROBLEM SOLVING ══ */}
                <Panel accent="rgba(245,158,11,0.35)" style={{ marginBottom: 10, background: 'rgba(245,158,11,0.05)' }}>
                    <SectionLabel icon="⟨/⟩">Problem Solving</SectionLabel>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: Fs, fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>Total Questions Solved</div>
                            <div style={{ fontFamily: Fs, fontSize: 34, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{total.toLocaleString()}</div>
                        </div>
                        <div style={{ width: 1, height: 52, background: 'rgba(255,255,255,0.12)', marginRight: 22, flexShrink: 0 }} />
                        <div style={{ display: 'flex', gap: 22 }}>
                            {[
                                { label: 'Easy',   val: easy, color: '#22c55e' },
                                { label: 'Medium', val: med,  color: '#f59e0b' },
                                { label: 'Hard',   val: hard, color: '#ef4444' },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 5 }}>
                                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: `0 0 7px ${color}` }} />
                                        <span style={{ fontFamily: Fs, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{label}</span>
                                    </div>
                                    <div style={{ fontFamily: Fs, fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em', lineHeight: 1 }}>{val.toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Panel>

                {/* ══ CONTEST + ACTIVITY ══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <Panel accent="rgba(167,139,250,0.35)" style={{ background: 'rgba(139,92,246,0.06)' }}>
                        <SectionLabel icon="🏆">Contest Performance</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 12, columnGap: 8 }}>
                            {[
                                { label: 'Contest Rating',    value: topRating ? topRating.toLocaleString() : '—', big: true },
                                { label: 'Global Ranking',    value: ranking ? `#${ranking.toLocaleString()}` : '—', big: true },
                                { label: 'Top Percentage',    value: topPct != null ? `Top ${topPct.toFixed(1)}%` : '—' },
                                { label: 'Contests Attended', value: attended ? attended.toLocaleString() : '—' },
                            ].map(({ label, value, big }) => (
                                <div key={label}>
                                    <div style={{ fontFamily: Fs, fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 500 }}>{label}</div>
                                    <div style={{ fontFamily: Fs, fontSize: big ? 21 : 15, fontWeight: 800, color: big ? '#a78bfa' : '#fff', letterSpacing: '-0.01em', lineHeight: 1 }}>{value}</div>
                                </div>
                            ))}
                        </div>
                    </Panel>

                    <Panel accent="rgba(34,211,238,0.25)" style={{ background: 'rgba(34,211,238,0.05)' }}>
                        <SectionLabel icon="📈">Activity</SectionLabel>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 12, columnGap: 8 }}>
                            {[
                                { label: 'Total Submissions\n(Past 1 Year)', value: totalSubmissions > 0 ? totalSubmissions.toLocaleString() : '—', icon: null },
                                { label: 'Total Badges',    value: badgesCount || '—',  icon: '⭐', color: '#f59e0b' },
                                { label: 'Total Active Days', value: activeDays || '—', icon: '📅' },
                                { label: 'Max Streak',      value: maxStreak || '—',    icon: '🔥', color: '#ef4444' },
                            ].map(({ label, value, icon, color }) => (
                                <div key={label}>
                                    <div style={{ fontFamily: Fs, fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 4, fontWeight: 500, whiteSpace: 'pre-line', lineHeight: 1.3 }}>{label}</div>
                                    <div style={{ fontFamily: Fs, fontSize: 21, fontWeight: 800, color: color || '#fff', letterSpacing: '-0.01em', lineHeight: 1, display: 'flex', alignItems: 'center', gap: 5 }}>
                                        {icon && <span style={{ fontSize: 15 }}>{icon}</span>}{value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Panel>
                </div>

                {/* ══ BADGES ══ */}
                {(badgesList.length > 0 || badgesCount > 0) && (
                    <Panel accent="rgba(251,191,36,0.3)" style={{ marginBottom: 10, background: 'rgba(251,191,36,0.04)' }}>
                        <SectionLabel icon="⭐" right={
                            <span style={{ fontFamily: Fs, fontSize: 9, color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2px 10px' }}>{badgesCount} Total</span>
                        }>Badges</SectionLabel>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {badgesList.slice(0, 8).map((b, i) => {
                                const raw = b.medal?.config?.iconGif || b.medal?.config?.icon || b.icon || b.iconGif || null;
                                const src = raw ? (raw.startsWith('http') ? raw : `https://leetcode.com${raw}`) : null;
                                const name = b.displayName || b.name || '';
                                return (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div style={{
                                            width: 52, height: 52, borderRadius: 14,
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))',
                                            border: '1px solid rgba(255,255,255,0.18)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                                        }}>
                                            {src ? (
                                                <>
                                                    <img src={src} alt="" style={{ width: 38, height: 38, objectFit: 'contain' }} crossOrigin="anonymous"
                                                        onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }} />
                                                    <span style={{ fontFamily: Fo, fontSize: 18, color: '#f59e0b', display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>★</span>
                                                </>
                                            ) : (
                                                <span style={{ fontFamily: Fo, fontSize: 18, color: '#f59e0b' }}>★</span>
                                            )}
                                        </div>
                                        {name && i < 2 && (
                                            <span style={{ fontFamily: Fs, fontSize: 8.5, color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: 52, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                                        )}
                                    </div>
                                );
                            })}
                            {badgesCount > 8 && (
                                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontFamily: Fs, fontSize: 13, fontWeight: 800, color: '#fff' }}>{badgesCount - 8}+</span>
                                    <span style={{ fontFamily: Fs, fontSize: 7.5, color: 'rgba(255,255,255,0.4)' }}>Total</span>
                                </div>
                            )}
                        </div>
                    </Panel>
                )}

                {/* ══ HEATMAP ══ */}
                <Panel accent="rgba(34,197,94,0.3)" style={{ marginBottom: 18, background: 'rgba(22,101,52,0.08)' }}>
                    <SectionLabel icon="🔥" right={
                        <span style={{ fontFamily: Fs, fontSize: 9, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{activeDays ? `${activeDays} active days` : ''}</span>
                    }>Submission Activity</SectionLabel>
                    <Heatmap rawMap={calendarRaw} />
                </Panel>

                {/* ══ FOOTER ══ */}
                <div style={{ textAlign: 'center', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    {roastLine ? (
                        <span style={{ fontFamily: Fs, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.02em', color: '#fb923c', fontStyle: 'italic' }}>
                            <span style={{ marginRight: 8 }}>🔥</span>{roastLine}
                        </span>
                    ) : (
                        <span style={{ fontFamily: Fs, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.04em' }}>
                            <span style={{ color: 'rgba(255,255,255,0.3)', marginRight: 8 }}>{'</>'}</span>
                            <span style={{ color: '#f59e0b' }}>Consistency. </span>
                            <span style={{ color: '#22d3ee' }}>Precision. </span>
                            <span style={{ color: '#818cf8' }}>Excellence.</span>
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
