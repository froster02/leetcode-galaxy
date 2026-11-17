import { forwardRef } from 'react';
import { fmt, pct } from '../../utils/profile';

export const SHARE_W = 1200;
export const SHARE_H = 627;

/* The LinkedIn image. html2canvas rasterizes it, so it uses explicit hex
   colors, no CSS variables, no backdrop-filter and no remote images. */
const INK = '#1d1d1f', MUTED = '#5c5c61', LINE = '#e3e3e6', BG = '#ffffff';
const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const MONO = 'ui-monospace, "SF Mono", SFMono-Regular, Menlo, Consolas, monospace';

function Stat({ value, label }) {
    return (
        <div>
            <div style={{ fontFamily: MONO, fontSize: 64, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.05, color: INK }}>{value}</div>
            <div style={{ fontSize: 22, color: MUTED, marginTop: 8 }}>{label}</div>
        </div>
    );
}

const ShareImage = forwardRef(function ShareImage({ s, name, site, style }, ref) {
    const stats = [
        { value: fmt(s.total), label: s.totals.all ? `solved of ${fmt(s.totals.all)}` : 'problems solved' },
        s.contest
            ? { value: fmt(s.contest.rating), label: s.contest.topPercentage != null ? `contest rating · top ${pct(s.contest.topPercentage)}%` : 'contest rating' }
            : s.maxStreak > 0 && { value: fmt(s.maxStreak), label: 'longest streak, days' },
        s.ranking
            ? { value: fmt(s.ranking), label: 'global rank' }
            : s.activeDays > 0 && { value: fmt(s.activeDays), label: 'active days' },
    ].filter(Boolean);

    const split = [
        { label: 'Easy', n: s.easy, color: '#b4b4b9' },
        { label: 'Medium', n: s.medium, color: '#6e6e73' },
        { label: 'Hard', n: s.hard, color: INK },
    ];
    const total = s.easy + s.medium + s.hard;

    return (
        <div ref={ref} style={{
            width: SHARE_W, height: SHARE_H, boxSizing: 'border-box', padding: '64px 72px',
            background: BG, color: INK, fontFamily: FONT,
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            ...style,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: `2px solid ${INK}`, paddingBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: '-0.01em' }}>{name || s.username}</div>
                    <div style={{ fontFamily: MONO, fontSize: 22, color: MUTED, marginTop: 6 }}>@{s.username} on LeetCode</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 72 }}>
                {stats.map(x => <Stat key={x.label} value={x.value} label={x.label} />)}
            </div>

            <div>
                {total > 0 && (
                    <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', gap: 3, background: LINE }}>
                        {split.filter(d => d.n > 0).map(d => <div key={d.label} style={{ flex: d.n, background: d.color }} />)}
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, fontSize: 20, color: MUTED }}>
                    <div style={{ display: 'flex', gap: 28 }}>
                        {split.map(d => (
                            <span key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ width: 14, height: 14, borderRadius: 4, background: d.color, display: 'inline-block' }} />
                                {d.label} <span style={{ fontFamily: MONO, color: INK }}>{fmt(d.n)}</span>
                            </span>
                        ))}
                    </div>
                    {site && <span style={{ fontFamily: MONO }}>{site}</span>}
                </div>
            </div>
        </div>
    );
});

export default ShareImage;
