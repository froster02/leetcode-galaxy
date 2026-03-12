import { useState, useCallback } from 'react';

// For local dev, you might run wrangler dev in the worker directory (http://127.0.0.1:8787)
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://leetcode-galaxy-proxy.workers.dev';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached(username) {
    try {
        const raw = localStorage.getItem(`lc_${username.toLowerCase()}`);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) {
            localStorage.removeItem(`lc_${username.toLowerCase()}`);
            return null;
        }
        return data;
    } catch { return null; }
}

function setCache(username, data) {
    try {
        localStorage.setItem(`lc_${username.toLowerCase()}`, JSON.stringify({ data, ts: Date.now() }));
    } catch { /* quota exceeded */ }
}

export function useLeetCode() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async (username) => {
        setLoading(true);
        setError(null);

        const cached = getCached(username);
        if (cached) {
            setData(cached);
            setLoading(false);
            return cached;
        }

        try {
            const res = await fetch(`${WORKER_URL}?username=${encodeURIComponent(username)}`);
            if (!res.ok) {
                throw new Error('Failed to fetch user data');
            }
            const json = await res.json();
            setData(json);
            setCache(username, json);
            return json;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, fetchProfile };
}
