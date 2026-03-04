import { useState, useCallback } from 'react';

// For local dev, you might run wrangler dev in the worker directory (http://127.0.0.1:8787)
const WORKER_URL = import.meta.env.VITE_WORKER_URL || 'https://leetcode-galaxy-proxy.workers.dev';

export function useLeetCode() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchProfile = useCallback(async (username) => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${WORKER_URL}?username=${encodeURIComponent(username)}`);
            if (!res.ok) {
                throw new Error('Failed to fetch user data');
            }
            const json = await res.json();
            setData(json);
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
