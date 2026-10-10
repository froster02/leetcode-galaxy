import React from 'react';
import { motion } from 'framer-motion';
import { CollapsibleGroup, RatingSparkline } from './widgets';
import { Fd, Fm, C_EASY, C_MED, C_HARD } from './theme';

/** Collapsible "Deep Stats" group of the Full stats page: contest standing, power DNA, challenge form. */
export default function DeepStatsSection({ panelSurface, tileSurface, blockPad, sectionGap, isMobile, profile, topPct, rating, cls, streak, lastSubmit, attended, tier, nextTier, power, badges, badgesList, ratingHistory, motiv, easy, med, hard, easyPwr, medPwr, hardPwr, easyPct, medPct, hardPct, onChallenge, challengeName, setChallengeName }) {
    return (
        <CollapsibleGroup title="Deep Stats" panelSurface={panelSurface}>
            {/* Contest & Standing */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                style={{ ...tileSurface, padding: blockPad, marginBottom: sectionGap }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Contest & Standing</span>
                    <span style={{ fontFamily: Fm, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
                        RANK #{profile.ranking?.toLocaleString() || '—'}
                        {topPct && <span style={{ marginLeft: 8, color: C_EASY }}>· TOP {topPct}%</span>}
                    </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                        { head: 'Rating',  val: rating,    color: '#0a84ff', sub: cls.label },
                        { head: 'Streak',  val: streak,    color: '#3b82f6', sub: lastSubmit ? `Last AC ${lastSubmit}` : null },
                        { head: 'Contests', val: attended, color: '#fb923c', sub: topPct ? `Top ${topPct}%` : null },
                        { head: 'Top %',   val: topPct ? `${topPct}%` : null, color: C_EASY, sub: 'Global' },
                        { head: 'Tier',    val: tier.name, color: tier.color, sub: nextTier ? `→ ${nextTier.name}` : 'MAX' },
                        { head: 'Class',   val: cls.label, color: cls.color,  sub: `${power.toLocaleString()} pts` },
                        { head: 'Rank',    val: profile.ranking ? `#${profile.ranking.toLocaleString()}` : '—', color: 'rgba(255,255,255,0.7)', sub: null },
                        { head: 'Badges',  val: badges || '—', color: '#fbbf24', sub: badgesList.length > 0 ? `${badgesList.length} earned` : null },
                    ].map(({ head, val, color, sub }) => (
                        <motion.div key={head} whileHover={{ y: -1 }}
                            style={{ ...tileSurface, padding: '7px 10px', transition: 'border-color 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}30`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}>
                            <div style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>{head}</div>
                            <div style={{ fontFamily: Fd, fontSize: 13, fontWeight: 900, color: val ? color : 'rgba(255,255,255,0.15)', lineHeight: 1, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val ?? '—'}</div>
                            {sub && <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
                        </motion.div>
                    ))}
                </div>
                {ratingHistory.length >= 2 && (
                    <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, background: 'rgba(10,132,255,0.04)', border: '1px solid rgba(10,132,255,0.12)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                            <span style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Rating History</span>
                            <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em' }}>
                                {ratingHistory.length} contests · {Math.round(ratingHistory[0])} → {Math.round(ratingHistory[ratingHistory.length - 1])}
                            </span>
                        </div>
                        <RatingSparkline history={ratingHistory} width={isMobile ? 240 : 320} />
                    </div>
                )}
                {badgesList.length > 0 && (
                    <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                        {badgesList.slice(0, 8).map((b, i) => (
                            <span key={i} style={{ fontFamily: Fm, fontSize: 11, letterSpacing: '0.1em', color: '#fbbf24', padding: '2px 8px', borderRadius: 20, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                                {b.displayName || b.name || `Badge ${i + 1}`}
                            </span>
                        ))}
                    </div>
                )}
            </motion.div>

            {/* Power DNA */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}
                style={{ ...tileSurface, padding: blockPad, marginBottom: sectionGap }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Power DNA</span>
                    <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', fontStyle: 'italic' }}>"{motiv}"</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 6 }}>
                    {[
                        { label: 'Easy', mult: '×1',  count: easy, pwr: easyPwr, pct: easyPct, color: C_EASY },
                        { label: 'Medium', mult: '×3', count: med,  pwr: medPwr,  pct: medPct,  color: C_MED  },
                        { label: 'Hard',  mult: '×10', count: hard, pwr: hardPwr, pct: hardPct, color: C_HARD },
                    ].map(({ label, mult, count, pwr, pct, color }) => (
                        <div key={label} style={{ padding: '9px 11px', borderRadius: 10, background: `${color}07`, border: `1px solid ${color}18` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <span style={{ fontFamily: Fd, fontSize: 11, letterSpacing: '0.05em', color, textTransform: 'uppercase' }}>{label}</span>
                                <span style={{ fontFamily: Fm, fontSize: 11, color: `${color}80` }}>{mult}</span>
                            </div>
                            <div style={{ fontFamily: Fd, fontSize: 16, fontWeight: 900, color, lineHeight: 1, marginBottom: 2 }}>{pwr.toLocaleString()}</div>
                            <div style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{count} solved · {pct}%</div>
                            <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                                    transition={{ duration: 0.6, ease: [0.16,1,0.3,1], delay: 0.1 }}
                                    style={{ height: '100%', borderRadius: 2, background: color }} />
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Challenge a Legend */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
                style={{ ...tileSurface, padding: blockPad }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <span style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>Challenge a Legend</span>
                    <span style={{ fontFamily: Fm, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Type username, compare power in popup</span>
                </div>
                <form onSubmit={onChallenge} style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                    <input value={challengeName} onChange={(e) => setChallengeName(e.target.value)} placeholder="Enter username"
                        autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go"
                        style={{ flex: '1 1 160px', minWidth: 0, minHeight: isMobile ? 44 : undefined, padding: '8px 12px', borderRadius: 9, border: '1px solid rgba(10,132,255,0.22)', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.9)', fontFamily: Fm, fontSize: isMobile ? 16 : 10, letterSpacing: '0.06em', outline: 'none' }} />
                    <button type="submit"
                        style={{ fontFamily: Fm, fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#0a84ff', background: 'rgba(10,132,255,0.08)', border: '1px solid rgba(10,132,255,0.28)', borderRadius: 9, padding: isMobile ? '0 16px' : '8px 14px', minHeight: isMobile ? 44 : undefined, width: isMobile ? '100%' : 'auto', cursor: 'pointer', transition: 'all 0.18s', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(10,132,255,0.5)'; e.currentTarget.style.background = 'rgba(10,132,255,0.14)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(10,132,255,0.28)'; e.currentTarget.style.background = 'rgba(10,132,255,0.08)'; }}>
                        CHALLENGE
                    </button>
                </form>
            </motion.div>
        </CollapsibleGroup>
    );
}
