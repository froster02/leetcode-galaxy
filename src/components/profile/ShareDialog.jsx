import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useShareCapture, { dataUrlToBlob } from '../../hooks/useShareCapture';
import ShareImage, { SHARE_W, SHARE_H } from './ShareImage';
import { buildShareCaption, linkedInShareUrl } from '../../utils/profile';

/*
 * LinkedIn can't receive an image from another site, so the flow is:
 * 1 download the image, 2 copy the caption, 3 open the composer and paste.
 * The image is rendered as soon as the dialog opens: Safari only allows
 * share() and clipboard writes while the tap's user activation is fresh,
 * so the buttons must never wait on a render.
 */
export default function ShareDialog({ s, name, url, onClose }) {
    const imageRef = useRef(null);
    const dialogRef = useRef(null);
    const { capture, download, share } = useShareCapture(imageRef, { backgroundColor: '#ffffff', scale: 2 });
    const [image, setImage] = useState(null);       // { dataUrl, blob }
    const [failed, setFailed] = useState(false);
    const [caption, setCaption] = useState(() => buildShareCaption(s, url));
    const [copied, setCopied] = useState(false);
    const [canNativeShare, setCanNativeShare] = useState(false);

    useEffect(() => {
        let alive = true;
        // Let the hidden card paint once before rasterizing it
        const id = requestAnimationFrame(() => {
            capture()
                .then(async (dataUrl) => {
                    const blob = await dataUrlToBlob(dataUrl);
                    if (!alive) return;
                    setImage({ dataUrl, blob });
                    const file = new File([blob], 'profile.png', { type: 'image/png' });
                    setCanNativeShare(Boolean(navigator.canShare?.({ files: [file] })));
                })
                .catch(() => { if (alive) setFailed(true); });
        });
        return () => { alive = false; cancelAnimationFrame(id); };
    }, [capture]);

    // Esc closes; focus starts inside the dialog and returns afterwards
    useEffect(() => {
        const previous = document.activeElement;
        dialogRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = overflow;
            previous?.focus?.();
        };
    }, [onClose]);

    const filename = `leetcode-${s.username}.png`;

    const copyCaption = async () => {
        try {
            await navigator.clipboard.writeText(caption);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard blocked: the textarea is still there to copy from */ }
    };

    // Copy as well when opening LinkedIn, in case the composer drops the prefill
    const openLinkedIn = () => { navigator.clipboard?.writeText(caption).catch(() => {}); };

    const nativeShare = () => {
        if (!image) return;
        share({ filename, text: caption, blob: image.blob }).catch(() => {});
    };

    return createPortal(
        <div className="share-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            {/* Off-screen copy that html2canvas rasterizes (must stay in the viewport, so opacity 0) */}
            <div aria-hidden="true" style={{ position: 'fixed', left: 0, top: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                <ShareImage ref={imageRef} s={s} name={name} site={window.location.host} />
            </div>

            <div ref={dialogRef} className="share-dialog" role="dialog" aria-modal="true" aria-labelledby="share-title" tabIndex={-1}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 16px 14px 24px', borderBottom: '1px solid var(--separator)' }}>
                    <h2 id="share-title" className="t-headline">Post to LinkedIn</h2>
                    <button type="button" className="btn btn-plain" aria-label="Close" onClick={onClose} style={{ padding: 0, width: 44, color: 'var(--secondary-label)' }}>
                        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ aspectRatio: `${SHARE_W} / ${SHARE_H}`, borderRadius: 12, border: '1px solid var(--separator)', overflow: 'hidden', background: 'var(--fill)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {image
                            ? <img src={image.dataUrl} alt="Image that will go with your post" style={{ width: '100%', height: '100%', display: 'block' }} />
                            : <span className="t-footnote" role="status">{failed ? 'Couldn’t render the image. You can still post the caption.' : 'Preparing image…'}</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label htmlFor="share-caption" className="t-footnote" style={{ fontWeight: 600 }}>Caption</label>
                        <textarea
                            id="share-caption" className="field" rows={6} value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            style={{ padding: '12px 14px', minHeight: 140, resize: 'vertical', fontSize: '1rem', lineHeight: 1.5 }}
                        />
                    </div>

                    <ol className="share-steps" style={{ listStyle: 'none' }}>
                        <li>
                            <button type="button" className="btn btn-outline press" disabled={!image} onClick={() => download(filename, image?.dataUrl)}>
                                1 · Download image
                            </button>
                        </li>
                        <li>
                            <button type="button" className="btn btn-outline press" onClick={copyCaption} aria-live="polite">
                                {copied ? 'Caption copied' : '2 · Copy caption'}
                            </button>
                        </li>
                        <li>
                            <a className="btn btn-ink press" href={linkedInShareUrl(caption)} target="_blank" rel="noopener noreferrer" onClick={openLinkedIn} style={{ textDecoration: 'none' }}>
                                3 · Open LinkedIn
                            </a>
                        </li>
                    </ol>
                    {canNativeShare && (
                        <button type="button" className="btn btn-secondary press" onClick={nativeShare} style={{ borderRadius: 'var(--radius-sm)' }}>
                            Share image and caption…
                        </button>
                    )}
                    <p className="t-footnote">
                        LinkedIn doesn’t let other sites attach images to a post, so add the downloaded image in the composer and paste the caption.
                    </p>
                </div>
            </div>
        </div>,
        document.body,
    );
}
