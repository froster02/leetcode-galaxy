import React from 'react';

const Fs = '"Inter", "SF Pro Display", system-ui, sans-serif';

/* ── Month-block heatmap — N independent month grids side-by-side ── */
export function Heatmap({ rawMap, months: monthCount = 6 }) {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    /* Build submission count map keyed by "YYYY-M-D" */
    const countMap = {};
    Object.entries(rawMap).forEach(([ts, count]) => {
        const d = new Date(Number(ts) * 1000);
        const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        countMap[k] = (countMap[k] || 0) + Number(count);
    });
    const maxCount = Math.max(...Object.values(countMap), 1);

    function cellColor(count) {
        if (!count) return '#1e2433';
        const t = count / maxCount;
        if (t < 0.2)  return '#14532d';
        if (t < 0.4)  return '#166534';
        if (t < 0.6)  return '#16a34a';
        if (t < 0.8)  return '#22c55e';
        return '#4ade80';
    }

    /* Current month + (monthCount-1) previous — always dynamic */
    const months = Array.from({ length: monthCount }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth() - (monthCount - 1 - i), 1);
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    /* Build calendar grid for a month.
       Returns array of weeks; each week = 7 slots (null = outside month) */
    function buildGrid(year, month) {
        const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon…6=Sun
        const lastDay  = new Date(year, month + 1, 0).getDate();
        const numWeeks = Math.ceil((firstDow + lastDay) / 7);

        return Array.from({ length: numWeeks }, (_, w) =>
            Array.from({ length: 7 }, (_, d) => {
                const dayNum = w * 7 + d - firstDow + 1;
                if (dayNum < 1 || dayNum > lastDay) return null;
                const k = `${year}-${month}-${dayNum}`;
                const isToday = k === todayStr;
                return { dayNum, count: countMap[k] || 0, isToday };
            })
        );
    }

    const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const S = 11, G = 2; /* cell size & inner gap */

    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            {months.map(({ year, month }) => {
                const grid = buildGrid(year, month);
                return (
                    <div key={`${year}-${month}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        {/* 7 rows (Mon–Sun), each row spans all weeks of this month */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: G }}>
                            {Array.from({ length: 7 }, (_, dow) => (
                                <div key={dow} style={{ display: 'flex', gap: G }}>
                                    {grid.map((week, wi) => {
                                        const cell = week[dow];
                                        return (
                                            <div key={wi} style={{
                                                width: S, height: S, borderRadius: 3,
                                                background: cell ? cellColor(cell.count) : 'transparent',
                                                outline: cell?.isToday ? '1.5px solid #22d3ee' : 'none',
                                                outlineOffset: 1,
                                                boxShadow: cell?.isToday ? '0 0 6px #22d3ee80' : 'none',
                                            }} />
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        {/* Month label centered below block */}
                        <span style={{
                            fontFamily: Fs, fontSize: 10, fontWeight: 600,
                            color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em',
                        }}>{MN[month]}</span>
                    </div>
                );
            })}
        </div>
    );
}
