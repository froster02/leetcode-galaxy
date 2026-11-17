import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildYearGrid } from '../../utils/calendar';
import { fmt, pct, timeAgo, langLabel, badgeIcon } from '../../utils/profile';

/* Ledger rows for ProfilePage. Every section returns null when it has no
   data, so a user without contests or a calendar never sees an empty row. */

export function Section({ label, children }) {
    return (
        <section className="ledger-row" aria-label={label}>
            <h2 className="ledger-label">{label}</h2>
            <div className="ledger-body">{children}</div>
        </section>
    );
}

function initials(name, username) {
    const src = (name || username || '?').trim();
    const parts = src.split(/\s+/).filter(Boolean);
    return (parts.length > 1 ? parts[0][0] + parts[1][0] : src.slice(0, 2)).toUpperCase();
}

export function Avatar({ identity, username, size = 64 }) {
    const [broken, setBroken] = useState(false);
    const style = {
        width: size, height: size, borderRadius: '50%', flex: 'none',
        background: 'var(--fill)', border: '1px solid var(--separator)',
    };
    if (identity.avatar && !broken) {
        return <img src={identity.avatar} alt="" width={size} height={size} style={{ ...style, objectFit: 'cover' }} onError={() => setBroken(true)} />;
    }
    return (
        <div aria-hidden="true" style={{
            ...style, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: size * 0.32, color: 'var(--secondary-label)',
        }}>{initials(identity.name, username)}</div>
    );
}

export function Header({ data, onShare, onCopyLink, copied }) {
    const { identity, username } = data;
    const meta = [`@${username}`, identity.country, identity.company, identity.school].filter(Boolean);
    const links = [
        { label: 'LeetCode', url: `https://leetcode.com/u/${encodeURIComponent(username)}/` },
        ...identity.links,
    ];
    return (
        <header style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', minWidth: 0 }}>
                    <Avatar identity={identity} username={username} />
                    <div style={{ minWidth: 0 }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>
                            {identity.name || username}
                        </h1>
                        <p className="num muted" style={{ fontSize: '0.8125rem', marginTop: 2, overflowWrap: 'anywhere' }}>
                            {meta.join(' · ')}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-ink press" onClick={onShare} style={{ borderRadius: 10 }}>
                        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" /><path d="M12 15V3" /><path d="m7 8 5-5 5 5" />
                        </svg>
                        Post to LinkedIn
                    </button>
                    <button type="button" className="btn btn-outline press" onClick={onCopyLink} style={{ borderRadius: 10 }} aria-live="polite">
                        {copied ? 'Link copied' : 'Copy link'}
                    </button>
                </div>
            </div>
            {identity.about && <p className="muted" style={{ maxWidth: 640, overflowWrap: 'anywhere' }}>{identity.about}</p>}
            <nav aria-label="Profile links" style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: '0.875rem' }}>
                {links.map(l => (
                    <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="hit link-quiet muted">{l.label}</a>
                ))}
            </nav>
        </header>
    );
}

export function Headline({ s }) {
    const cells = [
        { value: fmt(s.total), label: s.totals.all ? `Solved of ${fmt(s.totals.all)}` : 'Solved' },
        s.contest && {
            value: fmt(s.contest.rating),
            label: s.contest.topPercentage != null ? `Contest rating · top ${pct(s.contest.topPercentage)}%` : 'Contest rating',
        },
        s.ranking && { value: fmt(s.ranking), label: 'Global rank' },
        s.activeDays > 0 && {
            value: fmt(s.currentStreak),
            label: `Day streak · best ${fmt(s.maxStreak)}`,
        },
    ].filter(Boolean);
    return (
        <section className="ledger-headline" aria-label="Headline numbers">
            {cells.map(c => (
                <div key={c.label}>
                    <div className="num ledger-big">{c.value}</div>
                    <div className="t-footnote">{c.label}</div>
                </div>
            ))}
        </section>
    );
}

export function Solved({ s, beats, acceptance }) {
    if (!s.total) return null;
    const rows = [
        { key: 'easy', label: 'Easy', n: s.easy, of: s.totals.easy },
        { key: 'medium', label: 'Medium', n: s.medium, of: s.totals.medium },
        { key: 'hard', label: 'Hard', n: s.hard, of: s.totals.hard },
    ];
    return (
        <Section label="Solved">
            {rows.map(r => (
                <div key={r.key} className="diff-row">
                    <span>{r.label}</span>
                    <div className="bar" aria-hidden="true">
                        <span style={{ width: `${r.of ? Math.min(100, (r.n / r.of) * 100) : 0}%` }} />
                    </div>
                    <span className="num" style={{ fontSize: '0.8125rem', textAlign: 'right' }}>
                        {fmt(r.n)}{r.of ? ` / ${fmt(r.of)}` : ''}
                    </span>
                    {beats && (
                        <span className="t-footnote diff-beats" style={{ textAlign: 'right' }}>
                            {beats[r.key] != null ? `beats ${pct(beats[r.key])}%` : ''}
                        </span>
                    )}
                </div>
            ))}
            {acceptance && (
                <p className="t-footnote">
                    Acceptance rate {pct(acceptance.rate)}% across {fmt(acceptance.submissions)} submissions.
                </p>
            )}
        </Section>
    );
}

export function YearHeatmap({ map }) {
    const { cells } = useMemo(() => buildYearGrid(map), [map]);
    const scrollRef = useRef(null);
    // On narrow screens the grid scrolls: start on the most recent weeks
    useLayoutEffect(() => {
        const el = scrollRef.current;
        if (el) el.scrollLeft = el.scrollWidth;
    }, [cells]);
    return (
        <div className="heat-scroll" ref={scrollRef}>
            <div className="heat-grid" role="img" aria-label="Submission heatmap for the past year">
                {cells.map(c => (
                    <span
                        key={c.date}
                        title={c.level < 0 ? undefined : `${c.count} submission${c.count === 1 ? '' : 's'} on ${c.date}`}
                        style={{ background: c.level < 0 ? 'transparent' : `var(--heat-${c.level})` }}
                    />
                ))}
            </div>
        </div>
    );
}

export function Activity({ s }) {
    if (!s.activeDays) return null;
    const parts = [`${fmt(s.activeDays)} active days and ${fmt(s.totalSubmissions)} submissions in the past year.`];
    if (s.busiestMonth) parts.push(`Busiest month ${s.busiestMonth.name}.`);
    if (s.busiestWeekday) parts.push(`Most active on ${s.busiestWeekday.name}s.`);
    return (
        <Section label="Activity">
            <YearHeatmap map={s.calendarMap} />
            <p className="t-footnote">{parts.join(' ')}</p>
        </Section>
    );
}

function RatingLine({ history }) {
    if (!Array.isArray(history) || history.length < 2) return null;
    const W = 600, H = 90, pad = 6;
    const min = Math.min(...history), max = Math.max(...history);
    const span = max - min || 1;
    const points = history.map((r, i) => {
        const x = (i / (history.length - 1)) * W;
        const y = pad + (1 - (r - min) / span) * (H - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    const label = `Contest rating over ${history.length} contests, from ${fmt(Math.round(history[0]))} to ${fmt(Math.round(history[history.length - 1]))}`;
    return (
        <svg role="img" aria-label={label} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: H, display: 'block' }}>
            <polyline points={points} fill="none" stroke="var(--label)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>
    );
}

const TREND = { up: { glyph: '▲', label: 'up' }, down: { glyph: '▼', label: 'down' } };
const CONTEST_ROWS = 5;

export function Contests({ s, contestInfo }) {
    const [all, setAll] = useState(false);
    if (!s.contest) return null;
    const rows = contestInfo.rows || [];
    const shown = all ? rows : rows.slice(0, CONTEST_ROWS);
    const notes = [`${fmt(s.contest.attended)} contest${s.contest.attended === 1 ? '' : 's'} attended.`];
    if (s.contest.peak) notes.push(`Peak rating ${fmt(s.contest.peak)}.`);
    if (s.contest.ranking) {
        notes.push(`Contest rank ${fmt(s.contest.ranking)}${s.contest.totalParticipants ? ` of ${fmt(s.contest.totalParticipants)}` : ''}.`);
    }
    return (
        <Section label="Contests">
            <RatingLine history={contestInfo.history} />
            {shown.length > 0 && (
                <div>
                    <table className="ledger-table">
                        <thead>
                            <tr><th scope="col">Contest</th><th scope="col">Rank</th><th scope="col">Solved</th><th scope="col">Rating</th></tr>
                        </thead>
                        <tbody className="num">
                            {shown.map(r => (
                                <tr key={`${r.title}-${r.startTime}`}>
                                    <td style={{ fontFamily: 'var(--font)' }}>{r.title}</td>
                                    <td>{r.rank ? fmt(r.rank) : '–'}</td>
                                    <td>{r.solved != null ? `${r.solved}${r.total ? ` / ${r.total}` : ''}` : '–'}</td>
                                    <td>
                                        {r.rating ? fmt(Math.round(r.rating)) : '–'}
                                        {TREND[r.trend] && <span aria-label={TREND[r.trend].label}> {TREND[r.trend].glyph}</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {rows.length > CONTEST_ROWS && (
                <button type="button" className="link-btn" onClick={() => setAll(v => !v)}>
                    {all ? 'Show fewer' : `Show all ${rows.length}`}
                </button>
            )}
            <p className="t-footnote">{notes.join(' ')}</p>
        </Section>
    );
}

const TIERS = [['advanced', 'Advanced'], ['intermediate', 'Intermediate'], ['fundamental', 'Fundamental']];
const TAGS_PER_TIER = 8;

export function Skills({ skills }) {
    const [all, setAll] = useState(false);
    const tiers = TIERS.filter(([k]) => skills[k]?.length);
    if (!tiers.length) return null;
    const hidden = tiers.reduce((n, [k]) => n + Math.max(0, skills[k].length - TAGS_PER_TIER), 0);
    return (
        <Section label="Skills">
            {tiers.map(([k, label]) => (
                <div key={k} style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
                    <span className="t-footnote" style={{ flex: '0 0 104px', paddingTop: 2 }}>{label}</span>
                    <p style={{ flex: '1 1 300px', minWidth: 0 }}>
                        {(all ? skills[k] : skills[k].slice(0, TAGS_PER_TIER)).map((t, i) => (
                            <span key={t.slug || t.name}>
                                {i > 0 && <span className="muted"> · </span>}
                                {t.name} <span className="num muted" style={{ fontSize: '0.8125rem' }}>{t.solved}</span>
                            </span>
                        ))}
                    </p>
                </div>
            ))}
            {hidden > 0 && (
                <button type="button" className="link-btn" onClick={() => setAll(v => !v)}>
                    {all ? 'Show fewer' : `Show ${hidden} more`}
                </button>
            )}
        </Section>
    );
}

export function Languages({ languages }) {
    if (!languages.length) return null;
    return (
        <Section label="Languages">
            <p>
                {languages.map((l, i) => (
                    <span key={l.name}>
                        {i > 0 && <span className="muted"> · </span>}
                        {l.name} <span className="num muted" style={{ fontSize: '0.8125rem' }}>{fmt(l.solved)}</span>
                    </span>
                ))}
            </p>
        </Section>
    );
}

function BadgeIcon({ src }) {
    const [broken, setBroken] = useState(false);
    if (!src || broken) return null;
    return <img src={src} alt="" width="18" height="18" loading="lazy" onError={() => setBroken(true)} />;
}

export function Badges({ badgesInfo }) {
    const badges = badgesInfo.badges || [];
    if (!badges.length) return null;
    return (
        <Section label={`Badges · ${badges.length}`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {badges.map((b, i) => (
                    <span key={b.id || `${b.displayName}-${i}`} className="pill">
                        <BadgeIcon src={badgeIcon(b.icon)} />
                        {b.displayName || b.name}
                    </span>
                ))}
            </div>
        </Section>
    );
}

const RECENT_ROWS = 10;

export function Recent({ recentAccepted }) {
    if (!recentAccepted.length) return null;
    return (
        <Section label="Recent accepted">
            <ul className="ledger-list">
                {recentAccepted.slice(0, RECENT_ROWS).map((r, i) => {
                    const meta = [langLabel(r.lang), timeAgo(r.timestamp)].filter(Boolean).join(' · ');
                    return (
                        <li key={`${r.titleSlug || r.title}-${i}`}>
                            {r.titleSlug
                                ? <a className="link-quiet" href={`https://leetcode.com/problems/${encodeURIComponent(r.titleSlug)}/`} target="_blank" rel="noopener noreferrer">{r.title}</a>
                                : <span>{r.title}</span>}
                            {meta && <span className="t-footnote" style={{ whiteSpace: 'nowrap' }}>{meta}</span>}
                        </li>
                    );
                })}
            </ul>
        </Section>
    );
}
