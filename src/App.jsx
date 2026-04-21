import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import GalaxyScene from './components/GalaxyScene';
import LandingUI from './components/LandingUI';
import UserPanel from './components/UserPanel';
import TransitionOverlay from './components/TransitionOverlay';
import CityCanvas from './components/CityScene';
import FighterCard from './components/FighterCard';
import { useLeetCode } from './hooks/useLeetCode';
import { playDrone, playWarpSweep, playArrivalChord, startCityAmbient, stopCityAmbient } from './hooks/useSpaceSound';
import { mapLeetCodeDataToCity } from './utils/dataMapper';

const MAX_RECENT = 12;
const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = ['#00f5d4', '#8b5cf6', '#3b82f6', '#f5a623'];

/* ── Rotating status ticker messages (PHM + Interstellar easter eggs) ── */
const STATUS_TICKS = [
  'SYS.ONLINE // HAIL_MARY // READY',
  'TARS: HUMOR 75% // HONESTY 90% // TRUST ∞',
  'QUESTION? ... ANSWER: YES. AMAZE.',
  'DO NOT GO GENTLE INTO THAT GOOD NIGHT',
  'PETROVA LINE BREACHED // TAUMOEBA ACTIVE',
  'GARGANTUA HORIZON // 1hr = 7yrs',
  'COOPER... WE\'VE GOT A WAVE',
  'FIST MY BUMP // ROCKY ONLINE',
  'EUREKA — MURPH, IT\'S YOU',
  'ASTROPHAGE CONTAINMENT: NOMINAL',
];
const TRANSITION_LINES = {
  lock: [
    'LOCKING COORDINATES... // ENDURANCE SPIN-UP',
    'LOCKING COORDINATES... // HAIL MARY AWAKEN',
    'LOCKING COORDINATES... // TARS, ARE YOU WITH ME?',
  ],
  map: [
    'MAPPING STAR SYSTEM... // TAU CETI BEARING LOCKED',
    'MAPPING STAR SYSTEM... // CROSS-REFERENCING ASTROPHAGE GRID',
    'MAPPING STAR SYSTEM... // PLOTTING WORMHOLE VECTOR',
  ],
  jump: [
    'INITIATING HYPERSPACE JUMP... // GARGANTUA SLINGSHOT',
    'INITIATING HYPERSPACE JUMP... // ERIDANI 40 INTERCEPT',
    'INITIATING HYPERSPACE JUMP... // PLAN A, MURPH',
  ],
};
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ── Cursor trail particle system ──────────────────────── */
function CursorTrail() {
  const particles = useRef([]);
  const containerRef = useRef();
  const mousePos = useRef({ x: -100, y: -100 });
  const rafId = useRef();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create particle DOM elements
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const el = document.createElement('div');
      el.className = 'cursor-particle';
      const size = Math.random() * 6 + 2;
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.background = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
      el.style.boxShadow = `0 0 ${size * 2}px ${PARTICLE_COLORS[i % PARTICLE_COLORS.length]}`;
      el.style.opacity = '0';
      container.appendChild(el);
      particles.current.push({
        el,
        x: -100, y: -100,
        vx: 0, vy: 0,
        life: 0, maxLife: 20 + Math.random() * 20,
        size,
        delay: i * 2,
      });
    }

    const handleMouse = (e) => {
      mousePos.current.x = e.clientX;
      mousePos.current.y = e.clientY;
    };

    let frame = 0;
    const animate = () => {
      frame++;
      particles.current.forEach((p, i) => {
        if (frame % 3 === (i % 3)) {
          p.x += (mousePos.current.x - p.x) * (0.15 - i * 0.008);
          p.y += (mousePos.current.y - p.y) * (0.15 - i * 0.008);
        } else {
          p.x += (mousePos.current.x - p.x) * 0.08;
          p.y += (mousePos.current.y - p.y) * 0.08;
        }
        const dx = mousePos.current.x - p.x;
        const dy = mousePos.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const opacity = Math.min(dist / 50, 0.6) * (1 - i / PARTICLE_COUNT);
        p.el.style.transform = `translate(${p.x - p.size / 2}px, ${p.y - p.size / 2}px)`;
        p.el.style.opacity = `${opacity}`;
      });
      rafId.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouse);
    rafId.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouse);
      cancelAnimationFrame(rafId.current);
      particles.current.forEach(p => p.el.remove());
      particles.current = [];
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }} />;
}

/* ── TARS monolith HUD (Interstellar easter egg) ──────── */
function TarsHud() {
  const [settings, setSettings] = useState({ humor: 75, honesty: 90, trust: 100 });
  const [openQuote, setOpenQuote] = useState(false);
  const quips = [
    '"Cooper, this is no time for caution."',
    '"Everybody good? Plenty of slaves for my robot colony?"',
    '"I have a cue light I can use when I\'m joking if you like."',
    '"That\'s impossible." — "No. It\'s necessary."',
  ];
  const [quip, setQuip] = useState(quips[0]);
  const quoteTimerRef = useRef(null);

  useEffect(() => () => clearTimeout(quoteTimerRef.current), []);

  const cycle = (key) => {
    setSettings(s => ({ ...s, [key]: s[key] >= 100 ? 0 : s[key] + 25 }));
    setQuip(quips[Math.floor(Math.random() * quips.length)]);
    setOpenQuote(true);
    clearTimeout(quoteTimerRef.current);
    quoteTimerRef.current = setTimeout(() => setOpenQuote(false), 2800);
  };

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 60,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
      fontFamily: '"Share Tech Mono", monospace', pointerEvents: 'auto',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', borderRadius: 6,
        background: 'linear-gradient(180deg, #0a0e14 0%, #06090d 100%)',
        border: '1px solid rgba(209,213,219,0.15)',
        boxShadow: '0 0 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
        animation: 'tars-idle 6s ease-in-out infinite',
      }}>
        {/* Monolith slab */}
        <div style={{
          width: 18, height: 42, borderRadius: 2,
          background: 'linear-gradient(180deg, #1a1d24 0%, #0b0d12 100%)',
          border: '1px solid rgba(209,213,219,0.25)',
          boxShadow: 'inset 0 0 4px rgba(255,255,255,0.08)',
          position: 'relative',
        }}>
          <span style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 2, height: 18, background: 'var(--amber)', borderRadius: 1,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 8px var(--amber)',
            animation: 'energy-pulse 2.5s ease infinite',
          }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 9, letterSpacing: '0.12em' }}>
          <div style={{ color: 'var(--tars)', fontWeight: 700, marginBottom: 2 }}>TARS</div>
          {[
            ['HUMOR', 'humor', '#f5a623'],
            ['HONESTY', 'honesty', '#00f5d4'],
            ['TRUST', 'trust', '#8b5cf6'],
          ].map(([label, key, color]) => (
            <button
              key={key}
              onClick={() => cycle(key)}
              title={`Adjust ${label.toLowerCase()}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: 'var(--text-muted)', fontFamily: 'inherit', fontSize: 9, letterSpacing: '0.12em',
              }}
            >
              <span style={{ minWidth: 54, textAlign: 'left' }}>{label}</span>
              <span style={{ color, fontWeight: 700, minWidth: 34, textAlign: 'right' }}>{settings[key]}%</span>
            </button>
          ))}
        </div>
      </div>
      <AnimatePresence>
        {openQuote && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{
              maxWidth: 260, padding: '8px 12px', borderRadius: 6,
              background: 'rgba(245,166,35,0.08)', border: '1px solid rgba(245,166,35,0.25)',
              color: 'var(--amber)', fontSize: 10, letterSpacing: '0.06em',
              textShadow: '0 0 8px rgba(245,166,35,0.3)',
            }}
          >
            {quip}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function App() {
  const [phase, setPhase] = useState(1);
  const [viewMode, setViewMode] = useState('city');
  const [isNight, setIsNight] = useState(true);
  const [transitionStage, setTransitionStage] = useState(0);
  const [transitionMsg, setTransitionMsg] = useState('');
  const [mappedData, setMappedData] = useState(null);
  const transitionTimerRef = useRef(null);
  const [recentlyExplored, setRecentlyExplored] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentExplorers') || '[]'); }
    catch { return []; }
  });
  const [tickIndex, setTickIndex] = useState(0);
  const { fetchProfile } = useLeetCode();

  // Rotating status bar ticker
  useEffect(() => {
    const id = setInterval(() => {
      setTickIndex(i => (i + 1) % STATUS_TICKS.length);
    }, 4200);
    return () => clearInterval(id);
  }, []);

  // Console easter egg — Rocky + TARS greeting
  useEffect(() => {
    console.log(
      '%c QUESTION? \n%c TARS :: HUMOR 75% // HONESTY 90% // LEETCODE_GALAXY v2.0 \n%c Try typing "rocky" or "tars" into the search. ',
      'background:#d4c168;color:#030508;font-weight:700;padding:4px 10px;border-radius:4px;font-family:monospace;',
      'color:#00f5d4;font-family:monospace;padding:4px 0;',
      'color:#f5a623;font-style:italic;font-family:monospace;'
    );
  }, []);

  const addToRecent = useCallback((username) => {
    setRecentlyExplored(prev => {
      const filtered = prev.filter(u => u !== username);
      const next = [username, ...filtered].slice(0, MAX_RECENT);
      localStorage.setItem('recentExplorers', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleSearch = useCallback(async (username, pushUrl = true) => {
    setPhase(2);
    setViewMode('city');
    setTransitionStage(1);
    setTransitionMsg(pick(TRANSITION_LINES.lock));
    playDrone();

    if (pushUrl) {
      window.history.pushState({}, '', `/u/${encodeURIComponent(username)}`);
    }

    try {
      await new Promise(r => setTimeout(r, 800));
      setTransitionMsg(pick(TRANSITION_LINES.map));

      const rawData = await fetchProfile(username);
      const structuredData = mapLeetCodeDataToCity(rawData);
      setMappedData(structuredData);
      addToRecent(username);

      setTransitionStage(2);
      setTransitionMsg(pick(TRANSITION_LINES.jump));
      playWarpSweep();

      transitionTimerRef.current = setTimeout(() => {
        setPhase(3);
        setTransitionStage(0);
        playArrivalChord();
        startCityAmbient();
      }, 1800);

    } catch (err) {
      console.error(err);
      clearTimeout(transitionTimerRef.current);
      setPhase(1);
      setTransitionStage(0);
      if (pushUrl) window.history.pushState({}, '', '/');
    }
  }, [fetchProfile, addToRecent]);

  // Clickable blocks within the City Scene
  const handleQuickInspect = useCallback(async (username) => {
    setTransitionStage(1);
    setTransitionMsg(`FETCHING: ${username.toUpperCase()}`);

    try {
      const rawData = await fetchProfile(username);
      const structuredData = mapLeetCodeDataToCity(rawData);
      setMappedData(structuredData);
      addToRecent(username);
      setTransitionStage(0);
      setViewMode('card');
      window.history.pushState({}, '', `/u/${encodeURIComponent(username)}`);
    } catch (err) {
      console.error(err);
      setTransitionStage(0);
    }
  }, [fetchProfile, addToRecent]);

  const handleBack = useCallback((pushUrl = true) => {
    clearTimeout(transitionTimerRef.current);
    stopCityAmbient();
    setPhase(1);
    setTransitionStage(0);
    setMappedData(null);
    setViewMode('city');
    if (pushUrl) {
      window.history.pushState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    const handler = (e) => handleSearch(e.detail);
    window.addEventListener('quickSearch', handler);
    return () => window.removeEventListener('quickSearch', handler);
  }, [handleSearch]);

  useEffect(() => {
    const onHide = () => { if (document.hidden) stopCityAmbient(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // URL-based profile loading
  useEffect(() => {
    const path = window.location.pathname;
    const match = path.match(/^\/u\/(.+)$/);
    if (match) {
      handleSearch(decodeURIComponent(match[1]), false);
    }
  }, [handleSearch]);

  // Handle browser back/forward
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/u\/(.+)$/);
      if (match) {
        handleSearch(decodeURIComponent(match[1]), false);
      } else {
        handleBack(false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [handleSearch, handleBack]);

  return (
    <div style={{
      width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden',
      background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: '"Share Tech Mono", monospace',
      transition: 'background 0.3s ease, color 0.3s ease',
    }}>
      {/* Cinematic overlays */}
      <div className="noise-overlay" />
      <div className="scanline-overlay" />
      <CursorTrail />

      {/* Corner decorations */}
      <div className="corner-deco" style={{
        position: 'fixed', top: 0, left: 0, width: 120, height: 120,
        borderTop: '1px solid rgba(0,245,212,0.15)', borderLeft: '1px solid rgba(0,245,212,0.15)',
        pointerEvents: 'none', zIndex: 50,
      }} />
      <div className="corner-deco" style={{
        position: 'fixed', bottom: 0, right: 0, width: 120, height: 120,
        borderBottom: '1px solid rgba(0,245,212,0.15)', borderRight: '1px solid rgba(0,245,212,0.15)',
        pointerEvents: 'none', zIndex: 50,
      }} />

      {/* Status bar — rotating PHM/Interstellar ticker */}
      <div className="status-bar-bottom" style={{
        position: 'fixed', bottom: 12, left: 16, zIndex: 50, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: '"Share Tech Mono", monospace', fontSize: 9.5, color: 'rgba(0,245,212,0.9)',
        letterSpacing: '0.15em',
        padding: '6px 12px', borderRadius: 6,
        background: 'rgba(3,5,8,0.78)',
        border: '1px solid rgba(0,245,212,0.12)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#00f5d4',
          boxShadow: '0 0 8px #00f5d4', animation: 'energy-pulse 2s ease infinite',
        }} />
        <span style={{ opacity: 0.85 }}>PHASE_{phase}</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>//</span>
        <span
          key={tickIndex}
          style={{
            color: 'var(--amber)',
            animation: 'ticker-fade 4.2s ease-in-out both',
            textShadow: '0 0 8px rgba(245,166,35,0.35)',
          }}
        >
          {STATUS_TICKS[tickIndex]}
        </span>
      </div>

      {/* TARS monolith HUD — top right on landing */}
      {phase === 1 && <TarsHud />}

      {/* 3D Canvas */}
      {phase === 3 && viewMode === 'city' ? (
        <CityCanvas data={mappedData} isNight={isNight} onSelectUser={handleQuickInspect} recentlyExplored={recentlyExplored} />
      ) : (
        <Canvas
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          camera={{ position: [0, 60, 120], fov: 60 }}
          gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
          dpr={[1, 1.5]}
        >
          <color attach="background" args={['#030508']} />
          <ambientLight intensity={0.3} />
          <Stars radius={300} depth={60} count={5000} factor={4} saturation={0} fade speed={0.5} />

          {phase === 1 && <GalaxyScene onSelectUser={handleSearch} />}
          {phase === 2 && <GalaxyScene isTransitioning onSelectUser={handleSearch} />}

          <OrbitControls
            enablePan={phase === 3}
            enableZoom={phase === 3}
            maxDistance={phase === 3 ? 250 : 120}
            minDistance={5}
            autoRotate={phase === 1}
            autoRotateSpeed={0.3}
            enableDamping
            dampingFactor={0.05}
          />
        </Canvas>
      )}

      {/* Fighter Card overlay */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 15, pointerEvents: 'none', perspective: 1200 }}>
        <AnimatePresence>
          {phase === 3 && viewMode === 'card' && (
            <motion.div
              key="card-reveal"
              initial={{ opacity: 0, scale: 0.85, rotateY: -30 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.85, rotateY: 30 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', inset: 0, background: 'var(--bg-primary)', overflow: 'auto',
                pointerEvents: 'auto', transformStyle: 'preserve-3d',
                transition: 'background 0.3s ease',
              }}
            >
              <FighterCard
                data={mappedData}
                username={mappedData?.username}
                onBack={() => setViewMode('city')}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* UI Overlays */}
      {phase === 1 && <LandingUI onSearch={handleSearch} />}
      <TransitionOverlay stage={transitionStage} message={transitionMsg} />
      {phase === 3 && viewMode !== 'card' && (
        <UserPanel
          data={mappedData}
          onBack={handleBack}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          isNight={isNight}
          onToggleNight={() => setIsNight(n => !n)}
        />
      )}
    </div>
  );
}


export default App;
