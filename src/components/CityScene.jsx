import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

/* ─────────────────── Game math ─────────────────── */
export function calcPower(easy, med, hard) { return easy * 1 + med * 3 + hard * 10; }

export function getFighterClass(hard) {
    if (hard >= 500) return { label: 'LEGEND', color: '#ef4444', emissive: '#7f0000', emoji: '🔥' };
    if (hard >= 300) return { label: 'CHAMPION', color: '#f59e0b', emissive: '#7a4f00', emoji: '⚡' };
    if (hard >= 150) return { label: 'ELITE', color: '#8b5cf6', emissive: '#3b1f7a', emoji: '💜' };
    if (hard >= 50) return { label: 'WARRIOR', color: '#3b82f6', emissive: '#1a3a7a', emoji: '⚔️' };
    if (hard >= 10) return { label: 'RECRUIT', color: '#22c55e', emissive: '#0f4a27', emoji: '🌱' };
    return { label: 'NOVICE', color: '#71717a', emissive: '#2a2a2a', emoji: '🥚' };
}

/* ─────────────────── Legend Dataset ─────────────────── */
export const CODERS = [
    { u: 'tourist', easy: 800, med: 1700, hard: 800, rank: 1 },
    { u: 'neal_wu', easy: 720, med: 1400, hard: 620, rank: 12 },
    { u: 'lee215', easy: 680, med: 1350, hard: 580, rank: 28 },
    { u: 'votrubac', easy: 660, med: 1200, hard: 540, rank: 44 },
    { u: 'awice', easy: 600, med: 1100, hard: 480, rank: 80 },
    { u: 'stefanpochmann', easy: 580, med: 1050, hard: 460, rank: 99 },
    { u: 'jianchao', easy: 560, med: 980, hard: 380, rank: 120 },
    { u: 'shawngao', easy: 520, med: 900, hard: 320, rank: 180 },
    { u: 'grandyang', easy: 500, med: 870, hard: 300, rank: 200 },
    { u: 'neetcode', easy: 460, med: 780, hard: 220, rank: 300 },
    { u: 'hayleycode', easy: 440, med: 750, hard: 200, rank: 350 },
    { u: 'dp_wizard', easy: 420, med: 700, hard: 180, rank: 400 },
    { u: 'tree_climber', easy: 400, med: 650, hard: 160, rank: 450 },
    { u: 'hash_queen', easy: 380, med: 600, hard: 140, rank: 500 },
    { u: 'binary_sage', easy: 360, med: 550, hard: 120, rank: 580 },
    { u: 'graph_king', easy: 340, med: 500, hard: 100, rank: 650 },
    { u: 'sort_master', easy: 320, med: 450, hard: 80, rank: 750 },
    { u: 'recursion_god', easy: 260, med: 340, hard: 50, rank: 1100 },
    { u: 'greedy_gal', easy: 180, med: 220, hard: 20, rank: 1800 },
    { u: 'weekender', easy: 140, med: 160, hard: 10, rank: 2500 },
    { u: 'daily_grinder', easy: 200, med: 180, hard: 25, rank: 2000 },
    { u: 'cp_nerd', easy: 320, med: 410, hard: 90, rank: 820 },
    { u: 'algo_sensei', easy: 280, med: 370, hard: 75, rank: 950 },
    { u: 'the_optimizer', easy: 250, med: 310, hard: 60, rank: 1050 },
    { u: 'newbie_dev', easy: 90, med: 80, hard: 3, rank: 5000 },
    { u: 'zero_to_hero', easy: 40, med: 20, hard: 0, rank: 10000 },
    { u: 'curious_dev', easy: 20, med: 10, hard: 0, rank: 15000 },
    { u: 'just_started', easy: 10, med: 5, hard: 0, rank: 20000 },
];

/* ─────────────────── Single 3D Building ─────────────────── */
function Building({ coder, position, onClick, isSelected }) {
    const meshRef = useRef();
    const topRef = useRef();
    const [hovered, setHovered] = useState(false);

    const power = calcPower(coder.easy, coder.med, coder.hard);
    const maxPow = calcPower(800, 1700, 800);
    const cls = getFighterClass(coder.hard);

    const H = Math.max(0.5, (power / maxPow) * 18);
    const W = Math.max(0.6, Math.min(1.4, Math.sqrt(power / maxPow) * 2));

    // Pulsing glow on legend/champion buildings
    useFrame((state) => {
        if (!meshRef.current) return;
        if (coder.hard >= 150) {
            const t = state.clock.elapsedTime;
            meshRef.current.material.emissiveIntensity = hovered
                ? 1.4
                : 0.4 + Math.sin(t * 2 + position[0]) * 0.3;
        }
        if (isSelected && meshRef.current) {
            meshRef.current.material.emissiveIntensity = 1.8;
        }
    });

    const color = new THREE.Color(cls.color);
    const emissive = new THREE.Color(cls.emissive);

    return (
        <group position={position}
            onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
            onClick={(e) => { e.stopPropagation(); onClick(coder); }}
        >
            {/* Main building body */}
            <mesh ref={meshRef} position={[0, H / 2, 0]} castShadow>
                <boxGeometry args={[W, H, W]} />
                <meshStandardMaterial
                    color={color}
                    emissive={emissive}
                    emissiveIntensity={hovered || isSelected ? 1.4 : (coder.hard >= 150 ? 0.5 : 0.15)}
                    metalness={0.3}
                    roughness={0.5}
                    transparent
                    opacity={hovered || isSelected ? 1 : 0.92}
                />
            </mesh>

            {/* Rooftop glow cap */}
            <mesh ref={topRef} position={[0, H + 0.05, 0]}>
                <boxGeometry args={[W + 0.05, 0.12, W + 0.05]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered || isSelected ? 4 : 2}
                    transparent opacity={0.9}
                />
            </mesh>

            {/* Windows on big buildings */}
            {H > 4 && [0.35, 0.6, 0.8].map((frac, i) => (
                <mesh key={i} position={[W / 2 + 0.01, H * frac, 0]}>
                    <boxGeometry args={[0.02, 0.12, 0.22]} />
                    <meshStandardMaterial color="#ffffff" emissive="#88aaff" emissiveIntensity={0.8} />
                </mesh>
            ))}

            {/* Floating name label */}
            {(hovered || isSelected) && (
                <Text
                    position={[0, H + 0.8, 0]}
                    fontSize={0.35}
                    color={cls.color}
                    anchorX="center"
                    anchorY="bottom"
                    font="https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2o-flEEny0FZhsfKu5WU4xD-IQ.woff2"
                    maxWidth={3}
                >
                    {coder.u}
                </Text>
            )}
        </group>
    );
}

/* ─────────────────── Grid Ground ─────────────────── */
function CityGround({ cols, rows }) {
    const W = cols * 2.6;
    const D = rows * 2.6;
    return (
        <group>
            {/* Base plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[W / 2, 0, D / 2]} receiveShadow>
                <planeGeometry args={[W + 4, D + 4]} />
                <meshStandardMaterial color="#06070c" roughness={1} metalness={0} />
            </mesh>
            {/* Grid lines */}
            <Grid
                position={[W / 2, 0.01, D / 2]}
                args={[W + 4, D + 4]}
                cellSize={1.3}
                cellThickness={0.3}
                cellColor="#1a1a2e"
                sectionSize={2.6}
                sectionThickness={0.6}
                sectionColor="#242440"
                infiniteGrid={false}
                fadeStrength={0}
            />
        </group>
    );
}

/* ─────────────────── Camera Setup ─────────────────── */
function IsometricCamera({ target }) {
    const { camera } = useThree();
    const iso = Math.PI / 5;  // 36° from horizon
    const dir = Math.PI / 4; // 45° compass

    React.useEffect(() => {
        camera.position.set(
            Math.cos(dir) * 28,
            Math.tan(iso) * 28,
            Math.sin(dir) * 28
        );
        camera.lookAt(target[0], 2, target[2]);
        camera.updateProjectionMatrix();
    }, []);
    return null;
}

/* ─────────────────── Scene ─────────────────── */
function CityScene({ onSelectCoder, selectedUser }) {
    const cols = 7;
    const rows = Math.ceil(CODERS.length / cols);

    const coderGrid = useMemo(() => {
        return CODERS.map((c, i) => ({
            coder: c,
            pos: [(i % cols) * 2.6, 0, Math.floor(i / cols) * 2.6],
        }));
    }, []);

    const gridCenter = [(cols * 2.6) / 2, 0, (rows * 2.6) / 2];

    return (
        <>
            <color attach="background" args={['#05060a']} />
            <fog attach="fog" args={['#05060a', 30, 80]} />

            {/* Lighting */}
            <ambientLight intensity={0.15} color="#2020ff" />
            <directionalLight position={[10, 20, 10]} intensity={0.4} color="#ffffff" castShadow />
            <directionalLight position={[-8, 12, -8]} intensity={0.2} color="#8080ff" />
            <pointLight position={[gridCenter[0], 6, gridCenter[2]]} intensity={0.6} color="#222244" distance={40} />

            {/* Ground */}
            <CityGround cols={cols} rows={rows} />

            {/* Buildings */}
            {coderGrid.map(({ coder, pos }) => (
                <Building
                    key={coder.u}
                    coder={coder}
                    position={pos}
                    onClick={onSelectCoder}
                    isSelected={selectedUser === coder.u}
                />
            ))}

            {/* Bloom postprocessing */}
            <EffectComposer>
                <Bloom
                    mipmapBlur
                    luminanceThreshold={0.4}
                    luminanceSmoothing={0.9}
                    intensity={2.0}
                    radius={0.8}
                />
            </EffectComposer>

            {/* Camera + controls */}
            <IsometricCamera target={gridCenter} />
            <OrbitControls
                target={gridCenter}
                enablePan
                enableZoom
                enableRotate
                minDistance={8}
                maxDistance={60}
                maxPolarAngle={Math.PI / 2.1}
                zoomSpeed={1.2}
                panSpeed={0.8}
                rotateSpeed={0.5}
            />
        </>
    );
}

/* ─────────────────── Main Export ─────────────────── */
export default function CityCanvas({ onSelectCoder, selectedUser }) {
    return (
        <Canvas
            className="city-canvas"
            shadows
            camera={{ fov: 45, near: 0.1, far: 200 }}
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 1.5]}
        >
            <Suspense fallback={null}>
                <CityScene onSelectCoder={onSelectCoder} selectedUser={selectedUser} />
            </Suspense>
        </Canvas>
    );
}
