/** Accepts "name", "@name", or a leetcode.com / leetcode.cn profile URL; returns the bare handle. */
export function parseHandle(input) {
    const s = String(input ?? '').trim();
    const url = s.match(/leetcode\.(?:com|cn)\/(?:u\/)?([^/?#\s]+)/i);
    return (url ? url[1] : s).replace(/^@/, '').trim();
}
