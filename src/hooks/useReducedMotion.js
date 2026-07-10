import { useState, useEffect } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

/** True when the OS/browser requests reduced motion. For non-framer-motion contexts (e.g. Three.js scenes). */
export default function useReducedMotion() {
    const [reduced, setReduced] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches
    );

    useEffect(() => {
        const mql = window.matchMedia(QUERY);
        const onChange = () => setReduced(mql.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, []);

    return reduced;
}
