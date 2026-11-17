import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useReducedMotion from '../hooks/useReducedMotion';
import { buildSummary } from '../utils/profile';
import {
    Header, Headline, Solved, Activity, Contests, Skills, Languages, Badges, Recent,
} from './profile/sections';
import ShareDialog from './profile/ShareDialog';

/* The single page profile ("Ledger"): every public LeetCode stat in one
   column, plus a LinkedIn share flow. `data` is a mapProfile() result. */
export default function ProfilePage({ data, onBack }) {
    const reduced = useReducedMotion();
    const s = useMemo(() => buildSummary(data), [data]);
    const [sharing, setSharing] = useState(false);
    const [copied, setCopied] = useState(false);
    const displayName = data.identity.name || data.username;

    useEffect(() => {
        const previous = document.title;
        document.title = `${displayName} · LeetCode profile`;
        return () => { document.title = previous; };
    }, [displayName]);

    const copyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard blocked: nothing useful to show */ }
    }, []);

    const closeShare = useCallback(() => setSharing(false), []);

    return (
        <motion.main
            className="ledger-page"
            initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
        >
            <div className="ledger">
                <Header data={data} onShare={() => setSharing(true)} onCopyLink={copyLink} copied={copied} />
                <Headline s={s} />
                <Solved s={s} beats={data.beats} acceptance={data.acceptance} />
                <Activity s={s} />
                <Contests s={s} contestInfo={data.contestInfo} />
                <Skills skills={data.skills} />
                <Languages languages={data.languages} />
                <Badges badgesInfo={data.badgesInfo} />
                <Recent recentAccepted={data.recentAccepted} />

                <footer style={{ borderTop: '1px solid var(--label)', paddingTop: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span className="t-footnote">Public LeetCode data, refreshed every 30 minutes. Not affiliated with LeetCode.</span>
                    <button type="button" className="btn btn-plain hit" onClick={onBack} style={{ padding: 0, fontSize: '0.875rem', color: 'var(--label)', textDecoration: 'underline' }}>
                        Look up another user
                    </button>
                </footer>
            </div>

            {sharing && <ShareDialog s={s} name={data.identity.name} url={window.location.href} onClose={closeShare} />}
        </motion.main>
    );
}
