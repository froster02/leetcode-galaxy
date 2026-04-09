import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { mapLeetCodeDataToCity } from './utils/dataMapper';

const MAX_RECENT = 12;
const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = ['#00f5d4', '#8b5cf6', '#3b82f6', '#f5a623'];

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

function App() {
  const [phase, setPhase] = useState(1);
  const [viewMode, setViewMode] = useState('city');
  const [isNight, setIsNight] = useState(true);
  const [transitionStage, setTransitionStage] = useState(0);
  const [transitionMsg, setTransitionMsg] = useState('');
  const [mappedData, setMappedData] = useState(null);
  const [recentlyExplored, setRecentlyExplored] = useState(() => {
    try { return JSON.parse(localStorage.getItem('recentExplorers') || '[]'); }
    catch { return []; }
  });
  const { fetchProfile } = useLeetCode();

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
    setTransitionMsg('LOCKING COORDINATES...');

    if (pushUrl) {
      window.history.pushState({}, '', `/u/${encodeURIComponent(username)}`);
    }

    try {
      await new Promise(r => setTimeout(r, 800));
      setTransitionMsg('MAPPING STAR SYSTEM...');

      let rawData;
      try {
        rawData = await fetchProfile(username);
      } catch {
        console.warn('Proxy fetch failed, using mock data.');
        rawData = generateMockData(username);
      }

      const structuredData = mapLeetCodeDataToCity(rawData);
      setMappedData(structuredData);
      addToRecent(username);

      setTransitionStage(2);
      setTransitionMsg('INITIATING HYPERSPACE JUMP...');

      setTimeout(() => {
        setPhase(3);
        setTransitionStage(0);
      }, 1800);

    } catch (err) {
      console.error(err);
      setPhase(1);
      setTransitionStage(0);
    }
  }, [fetchProfile, addToRecent]);

  // Clickable blocks within the City Scene
  const handleQuickInspect = useCallback(async (username) => {
    setTransitionStage(1);
    setTransitionMsg(`FETCHING: ${username.toUpperCase()}`);
    
    let rawData;
    try {
      rawData = await fetchProfile(username);
    } catch {
      rawData = generateMockData(username);
    }

    const structuredData = mapLeetCodeDataToCity(rawData);
    setMappedData(structuredData);
    addToRecent(username);
    
    setTransitionStage(0);
    setViewMode('card');
    window.history.pushState({}, '', `/u/${encodeURIComponent(username)}`);
  }, [fetchProfile, addToRecent]);

  const handleBack = useCallback((pushUrl = true) => {
    setPhase(1);
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
      background: '#030508', color: '#fff', fontFamily: '"Share Tech Mono", monospace',
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

      {/* Status bar */}
      <div className="status-bar-bottom" style={{
        position: 'fixed', bottom: 12, left: 16, zIndex: 50, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', gap: 8,
        fontFamily: '"Share Tech Mono", monospace', fontSize: 9, color: 'rgba(0,245,212,0.3)',
        letterSpacing: '0.15em',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: '#00f5d4',
          boxShadow: '0 0 8px #00f5d4', animation: 'energy-pulse 2s ease infinite',
        }} />
        SYS.ONLINE // PHASE_{phase} // LEETCODE_GALAXY_v2.0
      </div>

      {/* 3D Canvas */}
      {phase === 3 && viewMode === 'city' ? (
        <CityCanvas data={mappedData} isNight={isNight} onSelectUser={handleQuickInspect} />
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

      {/* Fighter Card overlay with animated reveal */}
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
                position: 'absolute', inset: 0, background: '#030508', overflow: 'auto',
                pointerEvents: 'auto', transformStyle: 'preserve-3d',
              }}
            >
              <FighterCard data={mappedData} username={mappedData?.username} onBack={() => setViewMode('city')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* UI Overlays */}
      {phase === 1 && <LandingUI onSearch={handleSearch} recentlyExplored={recentlyExplored} />}
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

function generateMockData(username) {
  return {
    profile: {
      matchedUser: {
        username,
        profile: { ranking: Math.floor(Math.random() * 50000) + 1000, reputation: 1337, starRating: 5 },
        submitStats: {
          acSubmissionNum: [
            { difficulty: 'All', count: 850 },
            { difficulty: 'Easy', count: 300 },
            { difficulty: 'Medium', count: 450 },
            { difficulty: 'Hard', count: 100 }
          ]
        }
      }
    },
    tags: {
      matchedUser: {
        tagProblemCounts: {
          advanced: [
            { tagName: 'Dynamic Programming', problemsSolved: 95 },
            { tagName: 'Graphs', problemsSolved: 60 },
            { tagName: 'Backtracking', problemsSolved: 45 }
          ],
          intermediate: [
            { tagName: 'Trees', problemsSolved: 120 },
            { tagName: 'Hash Table', problemsSolved: 140 },
            { tagName: 'Two Pointers', problemsSolved: 80 }
          ],
          fundamental: [
            { tagName: 'Arrays', problemsSolved: 200 },
            { tagName: 'Strings', problemsSolved: 110 }
          ]
        }
      }
    },
    recent: {
      recentSubmissionList: [
        { title: 'Two Sum', statusDisplay: 'Accepted' },
        { title: 'LRU Cache', statusDisplay: 'Accepted' },
        { title: 'Trapping Rain Water', statusDisplay: 'Wrong Answer' },
        { title: 'Merge k Sorted Lists', statusDisplay: 'Accepted' },
        { title: 'Valid Parentheses', statusDisplay: 'Accepted' }
      ]
    }
  };
}

export default App;
