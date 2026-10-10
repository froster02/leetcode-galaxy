import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { calcPower, getFighterClass, getPowerTier } from '../utils/gameData';
import { mapProfile } from '../utils/dataMapper';
import { parseCalendar, calendarStats } from '../utils/calendar';
import useViewportSize from '../hooks/useViewportSize';

// Lazy-loaded: pulls html2canvas out of the main bundle
const ShareModal = lazy(() => import('./ShareCard'));

import { Fd, Fm, C_TEAL, C_EASY, C_MED, C_HARD, tierProgress, timeAgo } from './fighter/theme';
import { CircularGauge, StatCard, PowerCounter, MiniRing } from './fighter/widgets';
import { VSModal, ChallengeNoticeModal } from './fighter/VSModal';
import ActivitySection from './fighter/ActivitySection';
import DeepStatsSection from './fighter/DeepStatsSection';

/* ══════════════════════════════════════════════════════════
   FIGHTER CARD — Galaxy Dashboard
══════════════════════════════════════════════════════════ */
function FighterCard({ data, username, onBack, fetchProfile }) {
    const reducedMotion = useReducedMotion();
    const [vsOpponent, setVsOpponent] = useState(null);
    const [quickSearch, setQuickSearch] = useState('');
    const [challengeName, setChallengeName] = useState('');
    const [challengeMiss, setChallengeMiss] = useState('');
    const [showShare, setShowShare] = useState(false);
    const viewport = useViewportSize();

    useEffect(() => {
        const prev = document.documentElement.style.overscrollBehavior;
        document.documentElement.style.overscrollBehavior = 'none';
        return () => { document.documentElement.style.overscrollBehavior = prev; };
    }, []);

    const compactLaptop = viewport.width <= 1440 && viewport.height <= 900;
    const isMobile = viewport.width <= 768;
    const contentMaxWidth = compactLaptop ? 960 : 1100;
    const pageBottomPad = 24;
    const heroPad = '10px 14px';
    const blockPad = '10px 12px';
    const blockPadWide = '10px 14px';
    const sectionGap = 5;
    const panelSurface = {
        background: 'var(--surface)',
        border: '1px solid transparent',
        borderRadius: 16,
    };
    const tileSurface = {
        background: 'var(--surface-2)',
        border: '1px solid transparent',
        borderRadius: 12,
    };

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

    const { profile, stats, recent, districts, contestInfo, badgesInfo, totalQuestions, calendar } = data;

    const easyStats = stats.find(s => s.difficulty === 'Easy');
    const medStats  = stats.find(s => s.difficulty === 'Medium');
    const hardStats = stats.find(s => s.difficulty === 'Hard');

    const easy  = easyStats?.count || 0;
    const med   = medStats?.count  || 0;
    const hard  = hardStats?.count || 0;
    const total = stats.find(s => s.difficulty === 'All')?.count || 0;

    /* Denominators — use API totals but never let solved exceed them */
    const LC_EASY_FB  = 900;
    const LC_MED_FB   = 1900;
    const LC_HARD_FB  = 850;
    const LC_TOTAL_FB = 3700;
    const lcEasy  = Math.max(totalQuestions?.easy   || LC_EASY_FB,  easy);
    const lcMed   = Math.max(totalQuestions?.medium || LC_MED_FB,   med);
    const lcHard  = Math.max(totalQuestions?.hard   || LC_HARD_FB,  hard);
    const lcTotal = Math.max(totalQuestions?.all    || LC_TOTAL_FB, total);

    const totalPctCleared = lcTotal > 0 ? Math.min(Math.round((total / lcTotal) * 100), 100) : null;

    /* Beats % — may or may not be in API response */
    const easyBeats = easyStats?.beatPercentage ?? easyStats?.beats ?? null;
    const medBeats  = medStats?.beatPercentage  ?? medStats?.beats  ?? null;
    const hardBeats = hardStats?.beatPercentage ?? hardStats?.beats ?? null;

    const power   = calcPower(easy, med, hard);
    const cls     = getFighterClass(hard);
    const tier    = getPowerTier(power);
    const tierPct = tierProgress(power, tier);

    /* Next tier */
    const nextTier    = tier.max < 8000 ? getPowerTier(tier.max) : null;
    const toNextTier  = Math.max(0, tier.max - power);

    const accepted = recent.filter(r => r.statusDisplay === 'Accepted').length;
    const winRate  = recent.length > 0 ? Math.round((accepted / recent.length) * 100) : 0;

    const rating    = contestInfo?.rating    ? Math.round(contestInfo.rating)    : null;
    const topRating = contestInfo?.topRating ? Math.round(contestInfo.topRating) : null;
    const attended  = contestInfo?.attended  ?? null;
    const topPct    = contestInfo?.topPercentage ?? null;
    const ratingHistory = Array.isArray(contestInfo?.history) ? contestInfo.history : [];
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
                const mapped = mapProfile(raw);
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

    /* Submission heatmap */
    const calendarRaw = parseCalendar(calendar);
    const { activeDays, maxStreak, totalSubmissions } = calendarStats(calendarRaw);

    const motiv = hard >= 300 ? 'Among the rarest. You solve what others abandon.' :
                  hard >= 150 ? 'Elite solver. Hard problems are your domain.' :
                  hard >= 50  ? 'Battle-hardened. The algorithms respect you.' :
                  hard >= 10  ? 'Rising fast. Keep pushing the hard problems.' :
                                'Every legend started here. Keep going.';

    return (
        <>
            <div className="page-viewport" data-theme="dark" style={{ position: 'relative', background: 'var(--bg)', color: 'var(--label)' }}>

                {/* ── Content ── */}
                <div style={{ position: 'relative', zIndex: 1, maxWidth: contentMaxWidth, margin: '0 auto', padding: compactLaptop ? `0 18px ${pageBottomPad}px` : `0 24px ${pageBottomPad}px` }}>

                    {/* ── Nav ── */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
                        style={{
                            position: 'sticky', top: 0, zIndex: 20,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: compactLaptop ? '12px 18px' : '14px 24px',
                            paddingTop: compactLaptop ? 'max(12px, env(safe-area-inset-top))' : 'max(14px, env(safe-area-inset-top))',
                            marginBottom: 8,
                        }}>
                        {/* Floating pill */}
                        <div className="material" style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            borderRadius: 999, padding: '6px 8px',
                        }}>
                            {/* ← CITY */}
                            <motion.button onClick={onBack}
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                title="Back to your Wrapped"
                                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '13px 12px' : '7px 13px', minHeight: isMobile ? 44 : undefined, borderRadius: 12, background: 'rgba(10,132,255,0.07)', border: '1px solid rgba(10,132,255,0.2)', color: C_TEAL, cursor: 'pointer', fontFamily: Fm, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', transition: 'background 0.18s' }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,132,255,0.16)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(10,132,255,0.07)'}>
                                ← Wrapped
                            </motion.button>

                            {/* Divider */}
                            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

                            {/* ✦ SHARE CARD ✦ — highlighted */}
                            <motion.button onClick={() => setShowShare(true)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.96 }}
                                title="Share Card"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: isMobile ? '13px 14px' : '7px 14px', minHeight: isMobile ? 44 : undefined, borderRadius: 12, cursor: 'pointer',
                                    fontFamily: Fm, fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
                                    color: 'var(--accent)',
                                    background: 'rgba(10,132,255,0.08)',
                                    border: '1px solid rgba(10,132,255,0.25)',
                                    transition: 'background 0.18s',
                                }}>
                                <span style={{ fontSize: 13 }}>✦</span>
                                Share card
                            </motion.button>

                            {/* Divider */}
                            <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

                            {/* Search — hidden on mobile (Challenge section below covers this) */}
                            {!isMobile && (
                                <form onSubmit={handleQuickSearch} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <input
                                        value={quickSearch}
                                        onChange={(e) => setQuickSearch(e.target.value)}
                                        placeholder="Search user"
                                        style={{
                                            width: compactLaptop ? 130 : 160,
                                            padding: '7px 12px', borderRadius: 10,
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'rgba(255,255,255,0.88)',
                                            fontFamily: Fm, fontSize: 11, letterSpacing: '0.04em', outline: 'none',
                                        }}
                                    />
                                    <motion.button type="submit"
                                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 10, background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.25)', color: C_TEAL, cursor: 'pointer', transition: 'background 0.18s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(10,132,255,0.18)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(10,132,255,0.08)'}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                                        </svg>
                                    </motion.button>
                                </form>
                            )}
                        </div>
                    </motion.div>

                    {/* ════ 1. HERO HEADER ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.08 }}
                        style={{ ...panelSurface, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? 12 : 0, padding: heroPad, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: compactLaptop ? 14 : 20, flex: isMobile ? '1 1 100%' : 1, minWidth: 0 }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                                <div
                                    style={{ width: compactLaptop ? 58 : 72, height: compactLaptop ? 58 : 72, borderRadius: 14, background: `${tier.color}12`, border: `2px solid ${tier.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: Fd, fontSize: compactLaptop ? 22 : 28, fontWeight: 900, color: tier.color }}>
                                    {username.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div style={{ minWidth: 0 }}>
                                <div style={{ fontFamily: Fd, fontSize: compactLaptop ? 20 : 24, fontWeight: 900, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.02em', lineHeight: 1.05, marginBottom: compactLaptop ? 4 : 6, overflowWrap: 'anywhere' }}>{username}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: Fm, fontSize: compactLaptop ? 12 : 13, letterSpacing: '0.1em', color: tier.color, textTransform: 'uppercase', padding: compactLaptop ? '2px 7px' : '2px 8px', borderRadius: 4, background: `${tier.color}12`, border: `1px solid ${tier.color}28` }}>{tier.name}</span>
                                    <span style={{ fontFamily: Fm, fontSize: compactLaptop ? 12 : 13, color: 'rgba(255,255,255,0.78)' }}>·</span>
                                    {topPct && <span style={{ fontFamily: Fm, fontSize: compactLaptop ? 12 : 13, letterSpacing: '0.06em', color: C_EASY }}>TOP {topPct}% GLOBAL</span>}
                                </div>
                                <div style={{ fontFamily: Fm, fontSize: compactLaptop ? 13 : 11, color: 'rgba(255,255,255,0.86)', letterSpacing: '0.03em' }}>
                                    Rank #{profile.ranking?.toLocaleString() || '—'}
                                    <span style={{ margin: compactLaptop ? '0 6px' : '0 8px', color: 'rgba(255,255,255,0.3)' }}>·</span>
                                    <span style={{ color: cls.color }}>{cls.label}</span>
                                </div>
                            </div>
                        </div>
                        <div style={isMobile
                            ? { display: 'flex', flexDirection: 'row-reverse', justifyContent: 'flex-end', alignItems: 'center', gap: 14, flex: '1 1 100%', paddingTop: 12, borderTop: '1px solid var(--separator)' }
                            : { textAlign: 'center', paddingLeft: compactLaptop ? 14 : 24 }}>
                            <div style={{ fontFamily: Fm, fontSize: compactLaptop ? 11 : 12, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', marginBottom: isMobile ? 0 : 8 }} title="AC rate over the most recent submissions, not lifetime">Recent AC Rate</div>
                            <MiniRing pct={winRate} size={compactLaptop ? 68 : 76} color={winColor} stroke={5}>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontFamily: Fd, fontSize: compactLaptop ? 14 : 16, fontWeight: 900, color: winColor, lineHeight: 1 }}>{winRate}%</div>
                                    <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', marginTop: 1 }}>LAST {'≤'}20 SUBS</div>
                                </div>
                            </MiniRing>
                        </div>
                    </motion.div>

                    {/* ════ 2. POWER LEVEL ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.14 }}
                        style={{ ...panelSurface, padding: blockPadWide, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', alignItems: 'center', columnGap: 14, rowGap: 4, marginBottom: 6, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                            <div style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', flexBasis: isMobile ? '100%' : 'auto' }}>Power Level</div>
                            <PowerCounter target={power} color={tier.color} />
                            <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>/ {tier.max.toLocaleString()}</span>
                            {toNextTier > 0 && <span style={{ fontFamily: Fm, fontSize: 12, color: tier.color, letterSpacing: '0.06em', marginLeft: isMobile ? 0 : 'auto', flexBasis: isMobile ? '100%' : 'auto' }}>{toNextTier.toLocaleString()} TO NEXT TIER</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: Fd, fontSize: 11, letterSpacing: '0.1em', color: tier.color, whiteSpace: 'nowrap' }}>{tier.name}</span>
                            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${tierPct}%` }} transition={{ duration: 1.4, ease: [0.16,1,0.3,1], delay: 0.3 }}
                                    style={{ height: '100%', borderRadius: 3, background: tier.color }} />
                            </div>
                            {nextTier && <span style={{ fontFamily: Fd, fontSize: 11, letterSpacing: '0.09em', color: nextTier.color, whiteSpace: 'nowrap' }}>{nextTier.name}</span>}
                        </div>
                    </motion.div>

                    {/* ════ 3. STATS ROW ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.2 }}
                        style={isMobile
                            ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: sectionGap }
                            : { display: 'flex', gap: 10, marginBottom: sectionGap, flexWrap: 'wrap' }}>
                        <StatCard label="Total Solved" value={total} color="rgba(255,255,255,0.85)" sub={lcTotal > 0 ? `/ ${lcTotal.toLocaleString()}` : undefined} />
                        <StatCard label="Contest Rating" value={rating} color="#0a84ff" sub={topRating ? `Peak ${topRating.toLocaleString()}` : undefined} />
                        <StatCard label="Global Rank" value={profile.ranking ? `#${profile.ranking.toLocaleString()}` : '—'} color={tier.color} sub={topPct ? `Top ${topPct}%` : undefined} />
                        <StatCard label="Contests" value={attended} color="#3b82f6" sub={attended && topPct ? `Top ${topPct}% finish` : undefined} />
                    </motion.div>

                    {/* ════ 4. PROBLEM BREAKDOWN ════ */}
                    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.16,1,0.3,1], delay: 0.27 }}
                        style={{ ...panelSurface, padding: blockPadWide, marginBottom: sectionGap }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compactLaptop?10:16 }}>
                            <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Problem Breakdown</span>
                            <span style={{ fontFamily: Fm, fontSize: 12, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em' }}>
                                {total} / {lcTotal > 0 ? lcTotal.toLocaleString() : '--'}
                                <span style={{ marginLeft: 8, color: tier.color }}>· {totalPctCleared != null ? `${totalPctCleared}% CLEARED` : '--'}</span>
                            </span>
                        </div>
                        <div style={isMobile
                            ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', justifyItems: 'center', rowGap: 16, columnGap: 8 }
                            : { display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', gap: 8 }}>
                            {[
                                { count: easy, total: lcEasy, color: C_EASY, label: 'Easy',   beats: easyBeats, delay: 360 },
                                { count: med,  total: lcMed,  color: C_MED,  label: 'Medium', beats: medBeats,  delay: 740 },
                                { count: hard, total: lcHard, color: C_HARD, label: 'Hard',   beats: hardBeats, delay: 1120 },
                            ].map(({ count: c, total: t, color, label, beats, delay: d }) => (
                                <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                    <CircularGauge count={c} total={t} color={color} label={label} size={84} delay={d} />
                                    {beats != null && (
                                        <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em' }}>
                                            BEATS <span style={{ color }}>{typeof beats === 'number' ? beats.toFixed(1) : beats}%</span>
                                        </span>
                                    )}
                                </div>
                            ))}
                            {/* Total ring */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                <MiniRing pct={lcTotal > 0 ? Math.min((total / lcTotal) * 100, 100) : 0} size={84} color={tier.color} stroke={6}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ fontFamily: Fd, fontSize: 14, fontWeight: 900, color: tier.color, lineHeight: 1 }}>{total}</div>
                                        <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>/ {lcTotal > 0 ? lcTotal : '--'}</div>
                                        <div style={{ fontFamily: Fm, fontSize: 11, color: tier.color, opacity: 0.75, fontWeight: 700 }}>{totalPctCleared != null ? `${totalPctCleared}%` : '--'}</div>
                                    </div>
                                </MiniRing>
                                <span style={{ fontFamily: Fd, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: tier.color, opacity: 0.85 }}>Total</span>
                            </div>
                        </div>
                    </motion.div>

                    <ActivitySection
                        {...{ panelSurface, tileSurface, blockPad, sectionGap, compactLaptop, isMobile, lastSubmit, streak, winRate, winColor, recentHardCount, topPct, calendarRaw, activeDays, maxStreak, totalSubmissions, topDistricts, maxDistrictSolved, tier, recent }}
                    />

                    <DeepStatsSection
                        {...{ panelSurface, tileSurface, blockPad, sectionGap, isMobile, profile, topPct, rating, cls, streak, lastSubmit, attended, tier, nextTier, power, badges, badgesList, ratingHistory, motiv, easy, med, hard, easyPwr, medPwr, hardPwr, easyPct, medPct, hardPct, challengeName, setChallengeName }}
                        onChallenge={handleChallengeSubmit}
                    />

                    {/* Bottom accent line */}
                    <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1, ease: [0.16,1,0.3,1], delay: 0.7 }}
                        style={{ height: 1, marginTop: 8, transformOrigin: 'right', background: C_TEAL }} />

                    {/* ════ BOTTOM ACTION BAR ════ */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.75 }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compactLaptop ? '12px 0 0' : '16px 0 4px', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <motion.div animate={reducedMotion ? undefined : { opacity: [1, 0.3, 1] }} transition={reducedMotion ? undefined : { duration: 2, repeat: Infinity }}
                                style={{ width: 6, height: 6, borderRadius: '50%', background: C_EASY, opacity: reducedMotion ? 1 : undefined }} />
                            <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.75)' }}>ONLINE · LAST SEEN JUST NOW</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {username && (
                                <a href={`https://leetcode.com/${username}`} target="_blank" rel="noreferrer"
                                    style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontFamily: Fm, fontSize: 12, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)', padding: '0 16px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(10,132,255,0.2)', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.18s' }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
                                    VIEW ON LEETCODE ↗
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Share Modal */}
            {showShare && (
                <Suspense fallback={null}>
                    <ShareModal data={data} onClose={() => setShowShare(false)} />
                </Suspense>
            )}

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
