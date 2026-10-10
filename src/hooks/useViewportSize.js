import { useState, useEffect } from 'react';

function read() {
    return typeof window === 'undefined'
        ? { width: 1024, height: 768 }
        : { width: window.innerWidth, height: window.innerHeight };
}

/** Live window size; updates on resize and orientation change. */
export default function useViewportSize() {
    const [size, setSize] = useState(read);
    useEffect(() => {
        const onResize = () => setSize(read());
        window.addEventListener('resize', onResize);
        window.addEventListener('orientationchange', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('orientationchange', onResize);
        };
    }, []);
    return size;
}
