import { useCallback } from 'react';
import html2canvas from 'html2canvas';

async function inlineImage(img) {
    if (img.src.startsWith('data:')) return;
    const res = await fetch(img.src, { cache: 'force-cache' });
    const blob = await res.blob();
    img.src = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function dataUrlToBlob(dataUrl) {
    return (await fetch(dataUrl)).blob();
}

export function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.download = filename;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Renders the element behind `ref` to a PNG. The element may sit at opacity 0
 * (browsers skip painting off-screen nodes, so callers keep it in-viewport).
 */
export default function useShareCapture(ref, { backgroundColor = null, scale = 2 } = {}) {
    const capture = useCallback(async () => {
        const node = ref.current;
        if (!node) throw new Error('capture target not mounted');

        // Cross-origin <img>s taint the canvas and make toDataURL() throw, so
        // inline them first; anything unfetchable is hidden for the capture.
        const imgs = Array.from(node.querySelectorAll('img[src]'));
        const origSrcs = imgs.map(i => i.getAttribute('src'));
        const origDisp = imgs.map(i => i.style.display);
        await Promise.allSettled(imgs.map(img => inlineImage(img).catch(() => { img.style.display = 'none'; })));

        try {
            const canvas = await html2canvas(node, {
                backgroundColor,
                scale,
                useCORS: false,
                allowTaint: false,
                logging: false,
                onclone: (_doc, el) => {
                    el.style.opacity = '1';
                    // html2canvas v1 can't render backdrop-filter
                    el.querySelectorAll('*').forEach(n => {
                        if (!n.style) return;
                        n.style.backdropFilter = '';
                        n.style.webkitBackdropFilter = '';
                    });
                },
            });
            return canvas.toDataURL('image/png');
        } finally {
            imgs.forEach((img, i) => {
                img.style.display = origDisp[i];
                if (origSrcs[i]) img.setAttribute('src', origSrcs[i]);
            });
        }
    }, [ref, backgroundColor, scale]);

    // Each action takes an optional pre-rendered dataUrl: Safari drops the
    // user-activation needed by share()/clipboard if we await a render first.
    const download = useCallback(async (filename, dataUrl) => {
        downloadDataUrl(dataUrl || await capture(), filename);
    }, [capture]);

    const copy = useCallback(async (dataUrl) => {
        const blob = await dataUrlToBlob(dataUrl || await capture());
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    }, [capture]);

    /** Native share sheet with the image attached; returns false when unsupported. */
    const share = useCallback(async ({ filename, title, text, url, dataUrl }) => {
        const blob = await dataUrlToBlob(dataUrl || await capture());
        const file = new File([blob], filename, { type: 'image/png' });
        if (!navigator.canShare?.({ files: [file] })) return false;
        await navigator.share({ files: [file], title, text, url });
        return true;
    }, [capture]);

    return { capture, download, copy, share };
}
