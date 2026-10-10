import React from 'react';
import { motion } from 'framer-motion';
import { Heatmap } from '../Heatmap';
import { CollapsibleGroup } from './widgets';
import { Fd, Fm, C_EASY, C_MED, C_HARD, timeAgo } from './theme';

/** Collapsible "Activity" group of the Full stats page: momentum, heatmap, specialties, recent submissions. */
export default function ActivitySection({ panelSurface, tileSurface, blockPad, sectionGap, compactLaptop, isMobile, lastSubmit, streak, winRate, winColor, recentHardCount, topPct, calendarRaw, activeDays, maxStreak, totalSubmissions, topDistricts, maxDistrictSolved, tier, recent }) {
    return (
        <CollapsibleGroup title="Activity" panelSurface={panelSurface}>
            {/* Battle Momentum */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                style={{ ...tileSurface, padding: blockPad, marginBottom: sectionGap }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compactLaptop?8:12 }}>
                    <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Battle Momentum</span>
                    {lastSubmit && <span style={{ fontFamily: Fm, fontSize: 12, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.06em' }}>LAST ACTIVE · {lastSubmit}</span>}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                        { head: 'AC STREAK',      val: streak,                color: streak >= 3 ? C_EASY : streak >= 1 ? C_MED : 'rgba(255,255,255,0.2)', sub: streak >= 5 ? '🔥 on fire' : streak >= 1 ? 'wins' : 'break the ice' },
                        { head: 'WIN RATE',       val: `${winRate}%`,          color: winColor,  sub: winRate >= 80 ? 'Dominant' : 'Building' },
                        { head: 'HARD BATTLES',   val: recentHardCount,        color: recentHardCount >= 3 ? C_HARD : 'rgba(255,255,255,0.5)', sub: 'last 10 subs' },
                        { head: 'GLOBAL TOP',     val: topPct ? `${topPct}%` : '—', color: '#3b82f6', sub: topPct ? `Top ${Math.round(100-topPct)}%` : null },
                    ].map(({ head, val, color, sub }) => (
                        <motion.div key={head} whileHover={{ y: -1 }}
                            style={{ ...tileSurface, padding: '7px 10px', border: '1px solid rgba(10,132,255,0.15)', transition: 'border-color 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                            <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>{head}</div>
                            <div style={{ fontFamily: Fd, fontSize: 16, fontWeight: 900, color, lineHeight: 1, marginBottom: 3 }}>{val ?? '—'}</div>
                            {sub && <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{sub}</div>}
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Submission Heatmap */}
            {Object.keys(calendarRaw).length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
                    style={{ ...tileSurface, padding: blockPad, marginBottom: sectionGap }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Submission Activity</span>
                        <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{activeDays} active days</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 12 }}>
                        {[
                            { head: 'Active Days',  val: activeDays,        color: '#0a84ff' },
                            { head: 'Max Streak',   val: maxStreak,         color: '#f5a623' },
                            { head: 'Submissions',  val: totalSubmissions,  color: '#3b82f6' },
                        ].map(({ head, val, color }) => (
                            <div key={head} style={{ ...tileSurface, padding: '7px 10px' }}>
                                <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>{head}</div>
                                <div style={{ fontFamily: Fd, fontSize: 16, fontWeight: 900, color, lineHeight: 1 }}>{val ?? 0}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <Heatmap rawMap={calendarRaw} months={isMobile ? 3 : 5} />
                    </div>
                </motion.div>
            )}

            {/* Specialties + Recent (side-by-side) */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : (topDistricts.length > 0 ? '1fr 1.6fr' : '1fr'), gap: 5 }}>

                {/* Specialties */}
                {topDistricts.length > 0 && (
                    <div style={{ ...tileSurface, padding: blockPad }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                            <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Specialties</span>
                            <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>BY SOLVE VOLUME</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                            {topDistricts.map((d, i) => (
                                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontFamily: Fm, fontSize: 12, color: 'rgba(255,255,255,0.7)', width: 72, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                                    <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(d.problemsSolved / maxDistrictSolved) * 100}%` }}
                                            transition={{ duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.1 + i * 0.04 }}
                                            style={{ height: '100%', borderRadius: 2, background: i === 0 ? tier.color : 'rgba(255,255,255,0.22)' }} />
                                    </div>
                                    <span style={{ fontFamily: Fd, fontSize: 13, fontWeight: 700, color: i === 0 ? tier.color : 'rgba(255,255,255,0.45)', width: 28, textAlign: 'right', flexShrink: 0 }}>{d.problemsSolved}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Battles */}
                <div style={{ ...tileSurface, padding: blockPad }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Last 8 Submissions</span>
                        {lastSubmit && <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>LATEST · {lastSubmit}</span>}
                    </div>
                    {recent.length === 0 ? (
                        <div style={{ fontFamily: Fm, fontSize: 13, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em' }}>$ no_submissions_yet...</div>
                    ) : (
                        recent.slice(0, 8).map((r, i) => {
                            const ok = r.statusDisplay === 'Accepted';
                            const ts = timeAgo(r.timestamp);
                            const diffColor = r.difficulty === 'Easy' ? C_EASY : r.difficulty === 'Hard' ? C_HARD : r.difficulty === 'Medium' ? C_MED : null;
                            return (
                                <motion.div key={i} whileHover={{ x: 4, transition: { duration: 0.1 } }}
                                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                    <div style={{ width: 5, height: 5, borderRadius: '50%', flexShrink: 0, background: ok ? C_EASY : C_HARD }} />
                                    <span style={{ flex: 1, fontFamily: Fm, fontSize: 13, color: 'rgba(255,255,255,0.72)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                                    {diffColor && <span style={{ fontFamily: Fm, fontSize: 11, color: diffColor, padding: '2px 5px', background: `${diffColor}14`, borderRadius: 3, flexShrink: 0, textTransform: 'uppercase' }}>{r.difficulty}</span>}
                                    {ts && <span style={{ fontFamily: Fm, fontSize: 12, color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>{ts}</span>}
                                    <span style={{ fontFamily: Fm, fontSize: 12, color: ok ? C_EASY : C_HARD, flexShrink: 0, fontWeight: 700 }}>{ok ? 'AC' : 'WA'}</span>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </CollapsibleGroup>
    );
}
