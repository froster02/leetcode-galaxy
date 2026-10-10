import React, { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import LandingUI from './components/LandingUI';
import ErrorToast from './components/ErrorToast';
import { useLeetCode, prewarmApi } from './hooks/useLeetCode';
import { mapProfile } from './utils/dataMapper';

// Lazy: story + stats code stays out of the landing bundle
const WrappedStory = lazy(() => import('./components/wrapped/WrappedStory'));
const FighterCard = lazy(() => import('./components/FighterCard'));

const MAX_RECENT = 8;
// '/leetcode-galaxy/' → '/leetcode-galaxy', '/' → ''
const BASE_PATH = import.meta.env.BASE_URL.replace(/\/$/, '');

function profileUrl(username, view) {
  return `${BASE_PATH}/u/${encodeURIComponent(username)}${view === 'card' ? '?view=card' : ''}`;
}

function parseLocation() {
  const path = window.location.pathname;
  const appPath = BASE_PATH && path.startsWith(BASE_PATH) ? path.slice(BASE_PATH.length) || '/' : path;
  const match = appPath.match(/^\/u\/(.+)$/);
  if (!match) return null;
  const view = new URLSearchParams(window.location.search).get('view') === 'card' ? 'card' : 'wrapped';
  return { username: decodeURIComponent(match[1]), view };
}

function Loading({ username }) {
  return (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      role="status" aria-live="polite"
      style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}
    >
      <div className="spinner" aria-hidden />
      <div className="t-footnote">Wrapping up @{username}…</div>
    </motion.div>
  );
}

function App() {
  // 'landing' | 'loading' | 'wrapped' | 'card'
  const [view, setView] = useState('landing');
  const [loadingName, setLoadingName] = useState('');
  const [searchError, setSearchError] = useState('');
  const [mappedData, setMappedData] = useState(null);
  // Monotonic id per search; an older search resolving late is ignored
  const searchSeqRef = useRef(0);
  const lastAttemptRef = useRef(null);
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentExplorers') || '[]'); }
    catch { return []; }
  });
  const { fetchProfile } = useLeetCode();

  useEffect(() => { prewarmApi(); }, []);

  const addToRecent = useCallback((username) => {
    setRecent(prev => {
      const next = [username, ...prev.filter(u => u.toLowerCase() !== username.toLowerCase())].slice(0, MAX_RECENT);
      try { localStorage.setItem('recentExplorers', JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

  const handleSearch = useCallback(async (username, pushUrl = true, targetView = 'wrapped') => {
    const seq = ++searchSeqRef.current;
    setSearchError('');
    setLoadingName(username);
    setView('loading');
    lastAttemptRef.current = [username, pushUrl, targetView];
    if (pushUrl) window.history.pushState({}, '', profileUrl(username, targetView));

    try {
      const raw = await fetchProfile(username);
      if (seq !== searchSeqRef.current) return;
      setMappedData(mapProfile(raw));
      addToRecent(username);
      setView(targetView);
    } catch (err) {
      if (seq !== searchSeqRef.current) return;
      const msg = err?.message;
      setSearchError(msg === 'No user found' ? 'No user found' : msg === 'Rate limited' ? 'API rate limited — try again in a moment' : 'Unable to load profile');
      setView('landing');
      // replace (not push) so the dead /u/<user> entry doesn't pollute history
      if (pushUrl) window.history.replaceState({}, '', `${BASE_PATH}/`);
    }
  }, [fetchProfile, addToRecent]);

  const handleRetry = useCallback(() => {
    if (!lastAttemptRef.current) return;
    setSearchError('');
    handleSearch(...lastAttemptRef.current);
  }, [handleSearch]);

  const dismissError = useCallback(() => setSearchError(''), []);

  const goLanding = useCallback((pushUrl = true) => {
    searchSeqRef.current++;
    setView('landing');
    setMappedData(null);
    if (pushUrl) window.history.pushState({}, '', `${BASE_PATH}/`);
  }, []);

  const switchView = useCallback((next) => {
    const u = mappedData?.username;
    if (!u) return;
    // Stats opened from the story: "back" pops that entry instead of pushing a new one
    if (next === 'wrapped' && window.history.state?.fromWrapped) { window.history.back(); return; }
    setView(next);
    window.history.pushState(next === 'card' ? { fromWrapped: true } : {}, '', profileUrl(u, next));
  }, [mappedData?.username]);

  // FighterCard's quick-search dispatches this
  useEffect(() => {
    const handler = (e) => {
      const d = e.detail;
      if (typeof d === 'string') handleSearch(d);
      else if (d && typeof d.username === 'string') handleSearch(d.username, true, d.targetView === 'card' ? 'card' : 'wrapped');
    };
    window.addEventListener('quickSearch', handler);
    return () => window.removeEventListener('quickSearch', handler);
  }, [handleSearch]);

  // Deep link on first load
  useEffect(() => {
    const loc = parseLocation();
    if (loc) handleSearch(loc.username, false, loc.view); // eslint-disable-line react-hooks/set-state-in-effect
  }, [handleSearch]);

  // Back/forward
  useEffect(() => {
    const onPop = () => {
      const loc = parseLocation();
      if (!loc) { goLanding(false); return; }
      if (mappedData && loc.username.toLowerCase() === mappedData.username.toLowerCase()) {
        searchSeqRef.current++; // cancel any search still in flight for another user
        setView(loc.view);
      } else {
        handleSearch(loc.username, false, loc.view);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [handleSearch, goLanding, mappedData]);

  return (
    <div className="app-viewport">
      <AnimatePresence mode="wait">
        {view === 'landing' && <LandingUI key="landing" onSearch={handleSearch} recent={recent} />}
        {view === 'loading' && <Loading key="loading" username={loadingName} />}
      </AnimatePresence>

      <Suspense fallback={null}>
        {view === 'wrapped' && mappedData && (
          <WrappedStory
            data={mappedData}
            onClose={() => goLanding()}
            onFullStats={() => switchView('card')}
            onAnother={() => goLanding()}
          />
        )}
        {view === 'card' && mappedData && (
          <FighterCard
            data={mappedData}
            username={mappedData.username}
            onBack={() => switchView('wrapped')}
            fetchProfile={fetchProfile}
          />
        )}
      </Suspense>

      <ErrorToast message={searchError} onRetry={handleRetry} onClose={dismissError} />

      <Analytics />
      <SpeedInsights />
    </div>
  );
}

export default App;
