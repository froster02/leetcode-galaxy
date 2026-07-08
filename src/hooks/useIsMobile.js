import { useState, useEffect } from 'react';

const QUERY_WIDTH = 768;

/** True when viewport width <= 768px; tracks window resize. */
export default function useIsMobile() {
    const [isMobile, setIsMobile] = useState(
        () => typeof window !== 'undefined' && window.innerWidth <= QUERY_WIDTH
    );

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= QUERY_WIDTH);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return isMobile;
}
