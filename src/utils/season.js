/* Seasonal biome palette — viewer's local month drives ambient mood, not user data. */
const SEASONS = {
    winter: { name: 'winter', bg: '#050a14', ambient: '#3a6bcc', aurora: ['#8ecbff', '#c9e8ff', '#4f7fd6'] },
    spring: { name: 'spring', bg: '#04120c', ambient: '#2fbf7a', aurora: ['#7CFFB2', '#ff9ecb', '#54e0a0'] },
    summer: { name: 'summer', bg: '#0a0512', ambient: '#c026d3', aurora: ['#ff4fd8', '#00f5d4', '#a855f7'] },
    autumn: { name: 'autumn', bg: '#120a04', ambient: '#d97706', aurora: ['#fb923c', '#facc15', '#f97316'] },
};

/** Month (0-11) → season bucket. Northern-hemisphere convention, purely cosmetic. */
function seasonForMonth(month) {
    if (month === 11 || month === 0 || month === 1) return SEASONS.winter;
    if (month >= 2 && month <= 4) return SEASONS.spring;
    if (month >= 5 && month <= 7) return SEASONS.summer;
    return SEASONS.autumn;
}

export function getSeasonPalette(date = new Date()) {
    return seasonForMonth(date.getMonth());
}
