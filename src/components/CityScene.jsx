import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

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

const DISTRICT_COLORS = ['#00f5d4', '#8b5cf6', '#f5a623', '#3b82f6', '#ef4444', '#ec4899', '#10b981', '#f59e0b'];
const DIFF_COLORS = { Easy: '#23d18b', Medium: '#f5a623', Hard: '#ff3860' };

/* ─────────────────── City Building ─────────────────── */
function CityBuilding({ height, width, color, position, label }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        meshRef.current.material.emissiveIntensity = hovered
            ? 1.5
            : 0.3 + Math.sin(t * 2 + position[0] + position[2]) * 0.15;
    });

    return (
        <group position={position}
            onPointerOver={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
        >
            <mesh ref={meshRef} position={[0, height / 2, 0]} castShadow>
                <boxGeometry args={[width, height, width]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 1.5 : 0.3}
                    metalness={0.3}
                    roughness={0.5}
                    transparent
                    opacity={hovered ? 1 : 0.9}
                />
            </mesh>
            <mesh position={[0, height + 0.05, 0]}>
                <boxGeometry args={[width + 0.05, 0.1, width + 0.05]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 4 : 2}
                    transparent opacity={0.9}
                />
            </mesh>
            {height > 5 && [0.3, 0.5, 0.7].map((frac, i) => (
                <mesh key={i} position={[width / 2 + 0.01, height * frac, 0]}>
                    <boxGeometry args={[0.02, 0.1, 0.18]} />
                    <meshStandardMaterial color="#ffffff" emissive="#88aaff" emissiveIntensity={0.8} />
                </mesh>
            ))}
            {/* Hover tooltip */}
            {hovered && label && (
                <Html
                    position={[0, height + 0.6, 0]}
                    center
                    distanceFactor={15}
                    style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
                >
                    <div style={{
                        background: 'rgba(3,5,8,0.92)',
                        border: `1px solid ${color}50`,
                        borderRadius: 8,
                        padding: '6px 12px',
                        backdropFilter: 'blur(8px)',
                        boxShadow: `0 0 16px ${color}30`,
                    }}>
                        <div style={{
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: 10,
                            fontWeight: 700,
                            color,
                            letterSpacing: '0.1em',
                        }}>
                            {label.difficulty}
                        </div>
                        <div style={{
                            fontFamily: '"Share Tech Mono", monospace',
                            fontSize: 12,
                            color: '#e0e0e0',
                            marginTop: 2,
                        }}>
                            {label.count} problems
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

/* ─────────────────── District (topic cluster) ─────────────────── */
function District({ topic, color, centerPosition, maxSolved, districtIndex }) {
    // Count moons by difficulty to create meaningful buildings
    const diffCounts = useMemo(() => {
        const counts = { Easy: 0, Medium: 0, Hard: 0 };
        (topic.moons || []).forEach(m => {
            if (m.isSolved && counts[m.difficulty] !== undefined) {
                counts[m.difficulty]++;
            }
        });
        // Scale counts up proportionally to problemsSolved (moons are sampled subset)
        const moonTotal = counts.Easy + counts.Medium + counts.Hard;
        if (moonTotal > 0) {
            const scale = topic.problemsSolved / moonTotal;
            counts.Easy = Math.round(counts.Easy * scale);
            counts.Medium = Math.round(counts.Medium * scale);
            counts.Hard = Math.round(counts.Hard * scale);
        } else {
            // Fallback: rough distribution
            counts.Easy = Math.round(topic.problemsSolved * 0.4);
            counts.Medium = Math.round(topic.problemsSolved * 0.4);
            counts.Hard = Math.max(0, topic.problemsSolved - counts.Easy - counts.Medium);
        }
        return counts;
    }, [topic]);

    const buildings = useMemo(() => {
        const result = [];
        const entries = [
            { diff: 'Easy', count: diffCounts.Easy },
            { diff: 'Medium', count: diffCounts.Medium },
            { diff: 'Hard', count: diffCounts.Hard },
        ].filter(e => e.count > 0);

        const maxCount = Math.max(...entries.map(e => e.count), 1);
        const spacing = 2.2;

        entries.forEach((entry, i) => {
            const normalized = entry.count / Math.max(maxSolved, 1);
            const height = Math.max(1, normalized * 16 + entry.count * 0.05);
            const width = Math.max(0.6, Math.min(1.3, 0.6 + (entry.count / maxCount) * 0.7));
            const x = (i - (entries.length - 1) / 2) * spacing;
            result.push({
                height, width, x, z: 0,
                color: DIFF_COLORS[entry.diff],
                label: { difficulty: entry.diff, count: entry.count },
            });
        });
        return result;
    }, [diffCounts, maxSolved]);

    const maxHeight = Math.max(...buildings.map(b => b.height), 1);

    return (
        <group position={centerPosition}>
            {buildings.map((b, i) => (
                <CityBuilding
                    key={i}
                    height={b.height}
                    width={b.width}
                    color={b.color}
                    position={[b.x, 0, b.z]}
                    label={b.label}
                />
            ))}
            {/* District label */}
            <Html
                position={[0, maxHeight + 1.2, 0]}
                center
                distanceFactor={20}
                style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: 11,
                        fontWeight: 900,
                        color,
                        letterSpacing: '0.12em',
                        textShadow: `0 0 10px ${color}80`,
                        textTransform: 'uppercase',
                    }}>
                        {topic.name}
                    </div>
                    <div style={{
                        fontFamily: '"Share Tech Mono", monospace',
                        fontSize: 9,
                        color: `${color}aa`,
                        letterSpacing: '0.1em',
                        marginTop: 2,
                    }}>
                        {topic.problemsSolved} SOLVED
                    </div>
                    {/* Mini difficulty legend */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                        {diffCounts.Easy > 0 && (
                            <span style={{ fontSize: 8, fontFamily: '"Share Tech Mono", monospace', color: DIFF_COLORS.Easy }}>
                                E:{diffCounts.Easy}
                            </span>
                        )}
                        {diffCounts.Medium > 0 && (
                            <span style={{ fontSize: 8, fontFamily: '"Share Tech Mono", monospace', color: DIFF_COLORS.Medium }}>
                                M:{diffCounts.Medium}
                            </span>
                        )}
                        {diffCounts.Hard > 0 && (
                            <span style={{ fontSize: 8, fontFamily: '"Share Tech Mono", monospace', color: DIFF_COLORS.Hard }}>
                                H:{diffCounts.Hard}
                            </span>
                        )}
                    </div>
                </div>
            </Html>
        </group>
    );
}

/* ─────────────────── City Ground ─────────────────── */
function CityGround({ radius, isNight }) {
    return (
        <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <circleGeometry args={[radius + 5, 64]} />
                <meshStandardMaterial
                    color={isNight ? '#06070c' : '#0a0d14'}
                    roughness={1}
                    metalness={0}
                />
            </mesh>
            <Grid
                position={[0, 0.01, 0]}
                args={[radius * 2 + 10, radius * 2 + 10]}
                cellSize={2}
                cellThickness={0.3}
                cellColor={isNight ? '#0f0f22' : '#1a1a2e'}
                sectionSize={4}
                sectionThickness={0.6}
                sectionColor={isNight ? '#161633' : '#242440'}
                infiniteGrid={false}
                fadeStrength={0}
            />
        </group>
    );
}

/* ─────────────────── Central Monument ─────────────────── */
function CentralMonument({ username, totalSolved }) {
    const meshRef = useRef();
    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += 0.005;
        meshRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
    });

    return (
        <group>
            <mesh ref={meshRef} position={[0, 3, 0]}>
                <octahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial
                    color="#00f5d4"
                    emissive="#00f5d4"
                    emissiveIntensity={0.5}
                    metalness={0.6}
                    roughness={0.2}
                    transparent
                    opacity={0.85}
                />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                <cylinderGeometry args={[2, 2.5, 1, 8]} />
                <meshStandardMaterial
                    color="#111"
                    emissive="#00f5d4"
                    emissiveIntensity={0.1}
                    metalness={0.4}
                    roughness={0.6}
                />
            </mesh>
            <Html
                position={[0, 5.5, 0]}
                center
                distanceFactor={18}
                style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: 14,
                        fontWeight: 900,
                        color: '#00f5d4',
                        letterSpacing: '0.15em',
                        textShadow: '0 0 16px rgba(0,245,212,0.6)',
                        textTransform: 'uppercase',
                    }}>
                        {username || 'CODER'}
                    </div>
                    <div style={{
                        fontFamily: '"Share Tech Mono", monospace',
                        fontSize: 10,
                        color: 'rgba(0,245,212,0.6)',
                        letterSpacing: '0.1em',
                        marginTop: 2,
                    }}>
                        POP. {totalSolved}
                    </div>
                </div>
            </Html>
        </group>
    );
}

/* ─────────────────── Camera Setup ─────────────────── */
function CityCamera() {
    const { camera } = useThree();
    React.useEffect(() => {
        camera.position.set(20, 16, 20);
        camera.lookAt(0, 2, 0);
        camera.updateProjectionMatrix();
    }, []);
    return null;
}

/* ─────────────────── City Scene (data-driven) ─────────────────── */
function CitySceneInner({ data, isNight }) {
    const { planets, username, stats } = data;
    const totalSolved = stats?.find(s => s.difficulty === 'All')?.count || 0;
    const maxSolved = Math.max(...planets.map(p => p.problemsSolved), 1);

    const districtRadius = Math.max(14, 10 + planets.length * 2);
    const districts = useMemo(() => {
        return planets.map((planet, i) => {
            const angle = (i / planets.length) * Math.PI * 2 - Math.PI / 2;
            return {
                topic: planet,
                color: DISTRICT_COLORS[i % DISTRICT_COLORS.length],
                position: [
                    Math.cos(angle) * districtRadius,
                    0,
                    Math.sin(angle) * districtRadius,
                ],
            };
        });
    }, [planets, districtRadius]);

    return (
        <>
            <CityGround radius={districtRadius + 8} isNight={isNight} />
            <CentralMonument username={username} totalSolved={totalSolved} />

            {districts.map(({ topic, color, position }, i) => (
                <District
                    key={topic.name}
                    topic={topic}
                    color={color}
                    centerPosition={position}
                    maxSolved={maxSolved}
                    districtIndex={i}
                />
            ))}

            <EffectComposer>
                <Bloom
                    mipmapBlur
                    luminanceThreshold={0.4}
                    luminanceSmoothing={0.9}
                    intensity={isNight ? 2.5 : 1.8}
                    radius={0.8}
                />
            </EffectComposer>
        </>
    );
}

/* ─────────────────── Main Export ─────────────────── */
export default function CityCanvas({ data, isNight }) {
    return (
        <Canvas
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            shadows
            camera={{ fov: 45, near: 0.1, far: 200 }}
            gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
            dpr={[1, 1.5]}
        >
            <color attach="background" args={[isNight ? '#020308' : '#05060a']} />
            <fog attach="fog" args={[isNight ? '#020308' : '#05060a', 35, 90]} />
            <ambientLight intensity={isNight ? 0.08 : 0.15} color={isNight ? '#1111aa' : '#2020ff'} />
            <directionalLight position={[10, 20, 10]} intensity={isNight ? 0.15 : 0.4} color="#ffffff" castShadow />
            <directionalLight position={[-8, 12, -8]} intensity={isNight ? 0.08 : 0.2} color="#8080ff" />
            <pointLight position={[0, 8, 0]} intensity={isNight ? 0.3 : 0.6} color="#00f5d4" distance={50} />
            <CityCamera />
            <OrbitControls
                target={[0, 2, 0]}
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
            {data && <CitySceneInner data={data} isNight={isNight} />}
        </Canvas>
    );
}
