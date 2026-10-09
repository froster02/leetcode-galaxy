import React from 'react';

/* 540×960 (exports at 2× → 1080×1920, story-sized). Explicit hex colors and
   no backdrop-filter: this node is rasterized by html2canvas. */
export const CARD_W = 540;
export const CARD_H = 960;

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function Stat({ label, value, color = '#fff' }) {
    return (
        <div style={{ background: '#1c1c1e', borderRadius: 20, padding: '20px 20px 18px', minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#8e8e93', marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, color, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
        </div>
    );
}

const WrappedCard = React.forwardRef(function WrappedCard({ w, site, style }, ref) {
    const year = new Date().getFullYear();
    return (
        <div ref={ref} style={{
            width: CARD_W, height: CARD_H, background: '#000', color: '#fff', fontFamily: FONT,
            padding: '56px 44px 48px', display: 'flex', flexDirection: 'column', gap: 28,
            boxSizing: 'border-box', overflow: 'hidden', ...style,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#8e8e93' }}>
                <span>LeetCode Wrapped</span>
                <span>{year}</span>
            </div>

            <div>
                <div style={{ fontSize: 22, fontWeight: 600, color: '#8e8e93', marginBottom: 10 }}>@{w.username}</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    {w.personality.code.split('').map((ch, i) => (
                        <div key={i} style={{ width: 72, height: 84, borderRadius: 16, background: '#0a84ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 800 }}>{ch}</div>
                    ))}
                </div>
                <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.08 }}>{w.personality.title}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                <Stat label="Solved" value={w.total.toLocaleString()} color="#64d2ff" />
                <Stat label="Hard" value={w.hard.toLocaleString()} color="#ff453a" />
                <Stat label="Streak" value={`${w.maxStreak}d`} color="#ff9f0a" />
                <div style={{ gridColumn: '1 / -1', minWidth: 0 }}>
                    <Stat label="Top topic" value={w.topTopic || '—'} color="#30d158" />
                </div>
            </div>

            <div style={{ fontSize: 26, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.015em', color: '#e5e5ea', flex: 1 }}>
                “{w.roast}”
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 18, color: '#8e8e93' }}>
                <span>{site}</span>
                <span style={{ color: '#0a84ff', fontWeight: 600 }}>Get yours →</span>
            </div>
        </div>
    );
});

export default WrappedCard;
