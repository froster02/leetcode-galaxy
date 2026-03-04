import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import GalaxyScene from './components/GalaxyScene';
import LandingUI from './components/LandingUI';
import SolarSystem from './components/SolarSystem';
import UserPanel from './components/UserPanel';
import TransitionOverlay from './components/TransitionOverlay';
import { useLeetCode } from './hooks/useLeetCode';
import { mapLeetCodeDataToSolarSystem } from './utils/dataMapper';

function App() {
  const [phase, setPhase] = useState(1); // 1: Landing, 2: Zoom, 3: Solar System
  const [transitionStage, setTransitionStage] = useState(0); // 0: None, 1: Locating, 2: Entering
  const [mappedData, setMappedData] = useState(null);
  const { fetchProfile } = useLeetCode();

  const handleSearch = async (username) => {
    setPhase(2);
    setTransitionStage(1);

    try {
      // Simulate slight delay for the locating animation to play before fetching
      await new Promise(r => setTimeout(r, 800));

      let rawData;
      try {
        rawData = await fetchProfile(username);
      } catch (e) {
        console.warn("Proxy fetch failed, using mock data for demonstration.");
        rawData = generateMockData(username);
      }

      const structuredData = mapLeetCodeDataToSolarSystem(rawData);
      setMappedData(structuredData);

      setTransitionStage(2);

      // Wait for fade to black transition
      setTimeout(() => {
        setPhase(3);
        setTransitionStage(0);
      }, 1500);

    } catch (err) {
      console.error(err);
      alert('Failed to transition properly.');
      setPhase(1);
      setTransitionStage(0);
    }
  };

  const handleBack = () => {
    setPhase(1);
    setMappedData(null);
  };

  return (
    <div className="w-full h-full relative font-mono text-white overflow-hidden bg-background">
      <Canvas
        camera={{ position: [0, 50, 100], fov: 60 }}
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#030508']} />
        <ambientLight intensity={0.5} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        {phase === 1 && <GalaxyScene />}
        {phase === 2 && <GalaxyScene isTransitioning />}
        {phase === 3 && <SolarSystem data={mappedData} />}

        <OrbitControls
          enablePan={phase === 3}
          enableZoom={phase === 3}
          maxDistance={phase === 3 ? 200 : 100}
          minDistance={10}
          autoRotate={phase === 1}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {phase === 1 && <LandingUI onSearch={handleSearch} />}
      <TransitionOverlay stage={transitionStage} />
      {phase === 3 && <UserPanel data={mappedData} onBack={handleBack} />}
    </div>
  );
}

// Helper to generate mock data if the cloudflare proxy fails or isn't deployed yet
function generateMockData(username) {
  return {
    profile: {
      matchedUser: {
        username: username,
        profile: { ranking: 4200, reputation: 1337, starRating: 5 },
        submitStats: {
          acSubmissionNum: [
            { difficulty: "All", count: 850 },
            { difficulty: "Easy", count: 300 },
            { difficulty: "Medium", count: 450 },
            { difficulty: "Hard", count: 100 }
          ]
        }
      }
    },
    tags: {
      matchedUser: {
        tagProblemCounts: {
          advanced: [
            { tagName: "Dynamic Programming", problemsSolved: 95 },
            { tagName: "Graphs", problemsSolved: 60 },
            { tagName: "Backtracking", problemsSolved: 45 }
          ],
          intermediate: [
            { tagName: "Trees", problemsSolved: 120 },
            { tagName: "Hash Table", problemsSolved: 140 },
            { tagName: "Two Pointers", problemsSolved: 80 }
          ],
          fundamental: [
            { tagName: "Arrays", problemsSolved: 200 },
            { tagName: "Strings", problemsSolved: 110 }
          ]
        }
      }
    },
    recent: {
      recentSubmissionList: [
        { title: "Two Sum", statusDisplay: "Accepted" },
        { title: "LRU Cache", statusDisplay: "Accepted" },
        { title: "Trapping Rain Water", statusDisplay: "Wrong Answer" },
        { title: "Merge k Sorted Lists", statusDisplay: "Accepted" },
        { title: "Valid Parentheses", statusDisplay: "Accepted" }
      ]
    }
  };
}

export default App;
