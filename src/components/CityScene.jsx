import React, { useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

import { CODERS } from '../utils/gameData';

/* ─────────────────── City Grid Constants ─────────────────── */
const BLOCK_SIZE = 14;
const STREET_WIDTH = 3;
const CELL_SIZE = BLOCK_SIZE + STREET_WIDTH;
const GRID_COLS = 10;
const GRID_ROWS = 10;
const USER_ROW = 5;
const USER_COL = 5;
const MAX_BUILDING_HEIGHT = 14;

/* ─────────────────── Seeded random for deterministic layouts ─── */
function seededRand(seed) {
    let s = Math.abs(seed * 2654435761) | 0 || 1;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/* ─────────────────── Procedural fill (grid density only, no fake usernames shown) ─── */
const PROC_NAMES = [
    'stack_overflow', 'bit_flipper', 'heap_master', 'queue_runner', 'linked_list',
    'merge_sort', 'quick_sort', 'bfs_walker', 'dfs_diver', 'trie_builder',
    'sliding_window', 'prefix_sum', 'mono_stack', 'segment_tree', 'fenwick',
    'kmp_matcher', 'dijkstra_fan', 'bellman_ford', 'floyd_warshall', 'prim_user',
    'kruskal_edge', 'union_find', 'topological', 'tarjan_scc', 'euler_path',
    'matrix_rain', 'sparse_table', 'lazy_prop', 'convex_hull', 'sweep_line',
    'bit_mask_dp', 'knapsack_pro', 'lis_finder', 'lcs_solver', 'edit_dist',
    'coin_change', 'rod_cutter', 'palindrome', 'anagram_fan', 'substring',
    'two_pointer', 'fast_slow', 'dutch_flag', 'kadane_algo', 'boyer_moore',
    'rabin_karp', 'z_function', 'suffix_arr', 'manacher', 'aho_corasick',
    'red_black', 'avl_tree', 'b_tree_fan', 'skip_list', 'bloom_filter',
    'lru_cache', 'lfu_cache', 'hash_map', 'open_addr', 'chain_hash',
    'regex_pro', 'automaton', 'cfg_parser', 'lexer_dev', 'compiler_gal',
    'os_kernel', 'scheduler', 'deadlock', 'page_fault', 'cache_miss',
    'tcp_stack', 'udp_blast', 'http_dev', 'dns_query', 'load_balance',
    'micro_svc', 'event_loop', 'async_await', 'promise_all', 'callback',
];

function generateProceduralUser(index) {
    const rng = seededRand(index * 7919 + 42);
    const tier = rng();
    let easy, med, hard, rank;
    if (tier < 0.05) {
        easy = 400 + Math.floor(rng() * 400); med = 600 + Math.floor(rng() * 800);
        hard = 200 + Math.floor(rng() * 400); rank = 10 + Math.floor(rng() * 200);
    } else if (tier < 0.25) {
        easy = 200 + Math.floor(rng() * 300); med = 300 + Math.floor(rng() * 500);
        hard = 50 + Math.floor(rng() * 200);  rank = 200 + Math.floor(rng() * 1000);
    } else if (tier < 0.6) {
        easy = 80 + Math.floor(rng() * 200);  med = 100 + Math.floor(rng() * 300);
        hard = 10 + Math.floor(rng() * 80);   rank = 1000 + Math.floor(rng() * 5000);
    } else {
        easy = 10 + Math.floor(rng() * 100);  med = 5 + Math.floor(rng() * 80);
        hard = Math.floor(rng() * 15);         rank = 5000 + Math.floor(rng() * 20000);
    }
    const name = PROC_NAMES[index % PROC_NAMES.length] + (index >= PROC_NAMES.length ? `_${index}` : '');
    return { u: name, easy, med, hard, rank };
}

/* ─────────────────── Build roster ─────────────────── */
function buildRoster(currentUserData) {
    const stats = currentUserData?.stats || [];
    const currentUser = {
        u: currentUserData?.username || 'you',
        easy: stats.find(s => s.difficulty === 'Easy')?.count || 0,
        med: stats.find(s => s.difficulty === 'Medium')?.count || 0,
        hard: stats.find(s => s.difficulty === 'Hard')?.count || 0,
        rank: currentUserData?.profile?.ranking || 999,
        isCurrent: true,
    };

    const usedNames = new Set([currentUser.u.toLowerCase()]);
    const realUsers = [currentUser];

    for (const c of CODERS) {
        if (usedNames.has(c.u.toLowerCase())) continue;
        usedNames.add(c.u.toLowerCase());
        realUsers.push({ ...c, isCurrent: false });
    }

    let procIdx = 0;
    while (realUsers.length < 100) {
        const user = generateProceduralUser(procIdx++);
        if (!usedNames.has(user.u.toLowerCase())) {
            usedNames.add(user.u.toLowerCase());
            realUsers.push({ ...user, isCurrent: false });
        }
    }

    realUsers.sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return a.rank - b.rank;
    });

    const grid = new Array(GRID_ROWS * GRID_COLS).fill(null);
    const centerIdx = USER_ROW * GRID_COLS + USER_COL;
    grid[centerIdx] = realUsers[0];

    let rosterIdx = 1;
    for (let i = 0; i < grid.length && rosterIdx < realUsers.length; i++) {
        if (i !== centerIdx) grid[i] = realUsers[rosterIdx++];
    }

    return grid;
}

/* ─────────────────── Generate buildings for a block ─────────── */
function generateBlockBuildings(easy, med, hard, globalMax, seed) {
    const rng = seededRand(seed);
    const buildings = [];
    const total = easy + med + hard;
    if (total === 0) return buildings;

    const slots = [
        [-3.5, -3.5], [0, -3.5], [3.5, -3.5],
        [-3.5, 0],               [3.5, 0],
        [-3.5, 3.5],  [0, 3.5],  [3.5, 3.5],
    ];

    let idx = 0;
    const addBuildings = (count, color, heightScale) => {
        if (count === 0 || idx >= slots.length) return;
        const n = Math.min(3, Math.max(1, Math.ceil(count / (total * 0.4))));
        for (let i = 0; i < n && idx < slots.length; i++) {
            const [x, z] = slots[idx++];
            const variation = 0.75 + rng() * 0.5;
            const h = Math.max(0.6, (count / Math.max(globalMax, 1)) * MAX_BUILDING_HEIGHT * heightScale * variation);
            const w = 1.2 + rng() * 0.8;
            buildings.push({ x, z, height: h, width: w, color });
        }
    };

    addBuildings(easy, '#23d18b', 0.6);
    addBuildings(med, '#f5a623', 0.85);
    addBuildings(hard, '#ff3860', 1.0);

    return buildings;
}

/* ─────────────────── City Building ─────────────────── */
// No per-building useFrame — static emissive + bloom handles glow.
// Saves ~500 frame callbacks (100 blocks × ~5 buildings each).
function CityBuilding({ height, width, color, position }) {
    const tiers = height > 6 ? 3 : height > 3.5 ? 2 : 1;
    const tierHeights = tiers === 3
        ? [height * 0.55, height * 0.28, height * 0.17]
        : tiers === 2
        ? [height * 0.65, height * 0.35]
        : [height];
    const tierWidths = tierHeights.map((_, i) => width * (1 - i * 0.22));

    // Cap at 3 stripes — no refs, static emissive
    const stripeCount = Math.min(Math.floor(height / 1.4), 3);
    const stripePositions = Array.from({ length: stripeCount }, (_, i) =>
        ((i + 1) / (stripeCount + 1)) * height
    );

    let yOffset = 0;
    const tierMeshes = tierHeights.map((th, ti) => {
        const tw = tierWidths[ti];
        const y = yOffset + th / 2;
        yOffset += th;
        return (
            <mesh key={`tier-${ti}`} position={[0, y, 0]}>
                <boxGeometry args={[tw, th, tw]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.3}
                    metalness={0.55}
                    roughness={0.35}
                    transparent
                    opacity={0.92}
                />
            </mesh>
        );
    });

    return (
        <group position={position}>
            {tierMeshes}

            {stripePositions.map((sy, i) => (
                <mesh key={`stripe-${i}`} position={[0, sy, width / 2 + 0.01]}>
                    <boxGeometry args={[width * 0.92, 0.045, 0.02]} />
                    <meshBasicMaterial
                        color={color}
                        toneMapped={false}
                    />
                </mesh>
            ))}

            {height > 2.5 && [0.35, 0.65].map((frac, i) => (
                <mesh key={`win-${i}`} position={[tierWidths[0] / 2 + 0.01, height * frac, 0]}>
                    <boxGeometry args={[0.02, 0.12, 0.24]} />
                    <meshBasicMaterial color="#88aaff" toneMapped={false} />
                </mesh>
            ))}

            {height > 5 && (
                <group position={[0, height, 0]}>
                    <mesh position={[0, 0.5, 0]}>
                        <cylinderGeometry args={[0.03, 0.06, 1.0, 5]} />
                        <meshStandardMaterial color="#aaaacc" metalness={0.9} roughness={0.2} />
                    </mesh>
                    {/* Bloom on emissive beacon — no pointLight needed */}
                    <mesh position={[0, 1.1, 0]}>
                        <sphereGeometry args={[0.09, 6, 6]} />
                        <meshBasicMaterial color="#ff2244" toneMapped={false} />
                    </mesh>
                </group>
            )}
        </group>
    );
}

/* ─────────────────── Single City Block (township) ─────────────── */
function CityBlock({ user, gridRow, gridCol, globalMax, isNight, onSelect }) {
    const [hovered, setHovered] = useState(false);
    const isCurrent = user?.isCurrent;

    const worldX = (gridCol - USER_COL) * CELL_SIZE;
    const worldZ = (gridRow - USER_ROW) * CELL_SIZE;

    const buildings = useMemo(() => {
        if (!user) return [];
        return generateBlockBuildings(user.easy, user.med, user.hard, globalMax, gridRow * 100 + gridCol);
    }, [user, globalMax, gridRow, gridCol]);

    const accentColor = isCurrent ? '#00f5d4' : '#3b82f6';

    return (
        <group 
            position={[worldX, 0, worldZ]}
            onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
            onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'auto'; }}
            onClick={(e) => { e.stopPropagation(); if (user && onSelect) onSelect(user.u); }}
        >
            {/* Block ground plate */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.02, 0]}
                receiveShadow
            >
                <planeGeometry args={[BLOCK_SIZE, BLOCK_SIZE]} />
                <meshStandardMaterial
                    color={isCurrent ? '#0a1a1a' : (isNight ? '#060810' : '#0a0d18')}
                    emissive={isCurrent ? '#00f5d4' : '#000000'}
                    emissiveIntensity={isCurrent ? 0.05 : 0}
                    roughness={0.9}
                    metalness={0}
                />
            </mesh>

            {/* Block border */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
                <ringGeometry args={[BLOCK_SIZE / 2 - 0.1, BLOCK_SIZE / 2, 4]} />
                <meshStandardMaterial
                    color={isCurrent ? '#00f5d4' : (isNight ? '#0a0e1a' : '#10142a')}
                    emissive={accentColor}
                    emissiveIntensity={isCurrent ? 0.3 : 0.05}
                    transparent
                    opacity={isCurrent ? 0.3 : 0.15}
                    side={2}
                />
            </mesh>

            {/* Buildings */}
            {buildings.map((b, i) => (
                <CityBuilding
                    key={i}
                    height={b.height}
                    width={b.width}
                    color={b.color}
                    position={[b.x, 0, b.z]}
                />
            ))}

            {/* Current user beacon */}
            {isCurrent && <UserBeacon />}

            {/* Block label */}
            {(hovered || isCurrent) && user && (
                <Html
                    position={[0, isCurrent ? -0.2 : 0.2, BLOCK_SIZE / 2 + 0.5]}
                    center
                    distanceFactor={isCurrent ? 16 : 22}
                    style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
                >
                    <div style={{
                        background: 'rgba(3,5,8,0.88)',
                        border: `1px solid ${accentColor}40`,
                        borderRadius: 6,
                        padding: '4px 10px',
                        backdropFilter: 'blur(6px)',
                        boxShadow: `0 0 12px ${accentColor}20`,
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: isCurrent ? 11 : 9,
                            fontWeight: 700,
                            color: accentColor,
                            letterSpacing: '0.1em',
                            textTransform: 'uppercase',
                        }}>
                            {user.u}
                        </div>
                        <div style={{
                            fontFamily: '"Share Tech Mono", monospace',
                            fontSize: 8,
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 1,
                            display: 'flex',
                            gap: 6,
                            justifyContent: 'center',
                        }}>
                            <span style={{ color: '#23d18b' }}>E:{user.easy}</span>
                            <span style={{ color: '#f5a623' }}>M:{user.med}</span>
                            <span style={{ color: '#ff3860' }}>H:{user.hard}</span>
                        </div>
                    </div>
                </Html>
            )}
        </group>
    );
}

/* ─────────────────── Current user beacon ─────────────────── */
const BEAM_HEIGHT = 40;

function UserBeacon() {
    const crystalRef = useRef();
    const beamRef = useRef();
    const ringRef = useRef();

    useFrame((state) => {
        const t = state.clock.elapsedTime;

        if (crystalRef.current) {
            crystalRef.current.rotation.y += 0.012;
            crystalRef.current.material.emissiveIntensity = 1.2 + Math.sin(t * 2) * 0.4;
        }
        if (beamRef.current) {
            beamRef.current.material.opacity = 0.10 + Math.sin(t * 1.4) * 0.04;
        }
        if (ringRef.current) {
            ringRef.current.rotation.z += 0.008;
            const pulse = 1 + Math.sin(t * 3) * 0.08;
            ringRef.current.scale.setScalar(pulse);
        }
    });

    return (
        <group>
            {/* Vertical beam column */}
            <mesh ref={beamRef} position={[0, BEAM_HEIGHT / 2, 0]}>
                <cylinderGeometry args={[0.18, 0.6, BEAM_HEIGHT, 16, 1, true]} />
                <meshBasicMaterial
                    color="#00f5d4"
                    transparent
                    opacity={0.12}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Bright inner core of beam */}
            <mesh position={[0, BEAM_HEIGHT / 2, 0]}>
                <cylinderGeometry args={[0.04, 0.18, BEAM_HEIGHT, 8, 1, true]} />
                <meshBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0.18}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Spinning crystal at top of beam */}
            <mesh ref={crystalRef} position={[0, 3.2, 0]}>
                <octahedronGeometry args={[0.7, 0]} />
                <meshStandardMaterial
                    color="#00f5d4"
                    emissive="#00f5d4"
                    emissiveIntensity={1.2}
                    metalness={0.8}
                    roughness={0.1}
                    transparent
                    opacity={0.92}
                />
            </mesh>

            {/* Pulsing ring at base */}
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <ringGeometry args={[2.5, 3.2, 48]} />
                <meshBasicMaterial
                    color="#00f5d4"
                    transparent
                    opacity={0.25}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Base platform */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.9, 1.1, 0.5, 6]} />
                <meshStandardMaterial
                    color="#021a1a"
                    emissive="#00f5d4"
                    emissiveIntensity={0.4}
                    metalness={0.6}
                    roughness={0.4}
                />
            </mesh>

            {/* Point light casting cyan glow on nearby blocks */}
            <pointLight position={[0, 4, 0]} color="#00f5d4" intensity={3} distance={28} decay={2} />
            {/* Secondary warm fill light to avoid flat look */}
            <pointLight position={[0, 12, 0]} color="#00f5d4" intensity={1.2} distance={50} decay={2} />
        </group>
    );
}

/* ─────────────────── Street grid lines ─────────────────── */
function StreetGrid({ isNight }) {
    const totalWidth = GRID_COLS * CELL_SIZE;
    const totalDepth = GRID_ROWS * CELL_SIZE;
    const offsetX = -USER_COL * CELL_SIZE;
    const offsetZ = -USER_ROW * CELL_SIZE;

    return (
        <group>
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[offsetX + totalWidth / 2 - CELL_SIZE / 2, -0.01, offsetZ + totalDepth / 2 - CELL_SIZE / 2]}
                receiveShadow
            >
                <planeGeometry args={[totalWidth + STREET_WIDTH * 2, totalDepth + STREET_WIDTH * 2]} />
                <meshStandardMaterial
                    color={isNight ? '#030508' : '#060a10'}
                    roughness={1}
                    metalness={0}
                />
            </mesh>

            {Array.from({ length: GRID_ROWS + 1 }, (_, r) => {
                const z = offsetZ + r * CELL_SIZE - CELL_SIZE / 2 - STREET_WIDTH / 2;
                return (
                    <mesh key={`h${r}`} rotation={[-Math.PI / 2, 0, 0]} position={[offsetX + totalWidth / 2 - CELL_SIZE / 2, 0.01, z]}>
                        <planeGeometry args={[totalWidth + STREET_WIDTH, 0.15]} />
                        <meshStandardMaterial
                            color="#00f5d4"
                            emissive="#00f5d4"
                            emissiveIntensity={0.15}
                            transparent
                            opacity={0.08}
                        />
                    </mesh>
                );
            })}

            {Array.from({ length: GRID_COLS + 1 }, (_, c) => {
                const x = offsetX + c * CELL_SIZE - CELL_SIZE / 2 - STREET_WIDTH / 2;
                return (
                    <mesh key={`v${c}`} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.01, offsetZ + totalDepth / 2 - CELL_SIZE / 2]}>
                        <planeGeometry args={[0.15, totalDepth + STREET_WIDTH]} />
                        <meshStandardMaterial
                            color="#00f5d4"
                            emissive="#00f5d4"
                            emissiveIntensity={0.15}
                            transparent
                            opacity={0.08}
                        />
                    </mesh>
                );
            })}
        </group>
    );
}

/* ─────────────────── Camera Setup ─────────────────── */
function CityCamera() {
    const { camera } = useThree();
    React.useEffect(() => {
        camera.position.set(8, 12, 14);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [camera]);
    return null;
}

/* ─────────────────── Smooth Scene Lighting & Fog ─────────────────── */
function SceneLighting({ isNight, totalWidth }) {
    const { scene } = useThree();
    const ambRef = useRef();
    const dirRef1 = useRef();
    const dirRef2 = useRef();
    const ptRef = useRef();
    const bgTarget = useMemo(() => new THREE.Color(isNight ? '#020308' : '#05060a'), [isNight]);
    const ambTargetColor = useMemo(() => new THREE.Color(isNight ? '#1111aa' : '#2020ff'), [isNight]);

    useFrame((_, delta) => {
        const d = Math.min(delta * 2, 1);
        if (scene.background) scene.background.lerp(bgTarget, d);
        if (scene.fog) scene.fog.color.lerp(bgTarget, d);

        if (ambRef.current) {
            ambRef.current.intensity += ((isNight ? 0.08 : 0.15) - ambRef.current.intensity) * d;
            ambRef.current.color.lerp(ambTargetColor, d);
        }
        if (dirRef1.current) dirRef1.current.intensity += ((isNight ? 0.15 : 0.4) - dirRef1.current.intensity) * d;
        if (dirRef2.current) dirRef2.current.intensity += ((isNight ? 0.08 : 0.2) - dirRef2.current.intensity) * d;
        if (ptRef.current) ptRef.current.intensity += ((isNight ? 0.4 : 0.6) - ptRef.current.intensity) * d;
    });

    return (
        <group>
            <fog attach="fog" args={['#020308', 30, totalWidth * 0.7]} />
            <ambientLight ref={ambRef} intensity={0.15} color="#2020ff" />
            <directionalLight ref={dirRef1} position={[30, 40, 30]} intensity={0.4} color="#ffffff" />
            <directionalLight ref={dirRef2} position={[-20, 30, -20]} intensity={0.2} color="#8080ff" />
            <pointLight ref={ptRef} position={[0, 10, 0]} intensity={0.6} color="#00f5d4" distance={60} />
        </group>
    );
}

/* ─────────────────── Car Lights ─────────────────── */
const STREET_Y = 0.2;
const TOTAL_SPAN = GRID_COLS * CELL_SIZE;
const EDGE_START = -USER_COL * CELL_SIZE;

// Pre-generate deterministic car data at module level (no re-computation)
const CAR_DATA = Array.from({ length: 24 }, (_, i) => {
    const rng = seededRand(i * 3571 + 999);
    const isHorizontal = i % 2 === 0;
    const laneIdx = Math.floor(rng() * (GRID_ROWS + 1));
    const laneOffset = (laneIdx - (isHorizontal ? USER_ROW : USER_COL)) * CELL_SIZE - CELL_SIZE / 2;
    const speed = (6 + rng() * 10) * (rng() > 0.5 ? 1 : -1);
    const startOffset = rng() * TOTAL_SPAN;
    const color = rng() > 0.25 ? '#ffffff' : '#ffd580';
    const size = 0.1 + rng() * 0.08;
    return { isHorizontal, laneOffset, speed, startOffset, color, size };
});

function CarLights() {
    const refs = useRef([]);

    useFrame((state) => {
        const t = state.clock.elapsedTime;
        CAR_DATA.forEach((car, i) => {
            const mesh = refs.current[i];
            if (!mesh) return;
            const raw = EDGE_START + ((car.startOffset + t * car.speed) % TOTAL_SPAN + TOTAL_SPAN) % TOTAL_SPAN;
            if (car.isHorizontal) {
                mesh.position.set(raw, STREET_Y, car.laneOffset);
            } else {
                mesh.position.set(car.laneOffset, STREET_Y, raw);
            }
        });
    });

    return (
        <>
            {CAR_DATA.map((car, i) => (
                <mesh key={i} ref={el => refs.current[i] = el}>
                    <sphereGeometry args={[car.size, 5, 5]} />
                    <meshBasicMaterial
                        color={car.color}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </>
    );
}

/* ─────────────────── Activity Overlay (Heatmap + Streak) ─────────────────── */
const FONT_MONO_CS = '"Share Tech Mono", monospace';
const WEEKS = 12;

function useActivityData(data) {
    return useMemo(() => {
        const toKey = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const calRaw = data?.calendar?.submissionCalendar;
        const calMap = {}; // 'YYYY-MM-DD' → count
        if (calRaw) {
            try {
                const parsed = JSON.parse(calRaw);
                Object.entries(parsed).forEach(([ts, count]) => {
                    const d = new Date(parseInt(ts, 10) * 1000);
                    calMap[toKey(d)] = (calMap[toKey(d)] || 0) + count;
                });
            } catch { /* malformed */ }
        }

        const today = new Date(); today.setHours(0,0,0,0);
        const startDay = new Date(today);
        startDay.setDate(today.getDate() - (WEEKS * 7 - 1));

        const cells = [];
        for (let i = 0; i < WEEKS * 7; i++) {
            const d = new Date(startDay);
            d.setDate(startDay.getDate() + i);
            const key = toKey(d);
            cells.push({ key, count: calMap[key] || 0 });
        }

        // Use API-provided streak values when available
        const currentStreak = data?.calendar?.streak ?? 0;
        const longestStreak = data?.calendar?.totalActiveDays ?? 0;

        const last7 = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today); d.setDate(today.getDate() - (6 - i));
            return calMap[toKey(d)] || 0;
        });

        return { cells, currentStreak, longestStreak, last7 };
    }, [data]);
}

function ActivityOverlay({ data }) {
    const { cells, currentStreak, longestStreak, last7 } = useActivityData(data);
    const maxLast7 = Math.max(...last7, 1);

    const cellColor = (count) => {
        if (count === 0) return 'rgba(255,255,255,0.04)';
        if (count >= 5) return '#00f5d4';
        if (count >= 3) return '#23d18b';
        return '#23d18b80';
    };

    return (
        <div style={{
            position: 'absolute', bottom: 16, right: 16, zIndex: 20,
            display: 'flex', flexDirection: 'column', gap: 6,
            pointerEvents: 'none',
        }}>
            {/* ── Heatmap ── */}
            <div style={{
                background: 'rgba(3,5,8,0.88)',
                border: '1px solid rgba(0,245,212,0.15)',
                borderRadius: 10, padding: '8px 10px',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}>
                <div style={{ fontFamily: FONT_MONO_CS, fontSize: 7, color: 'rgba(0,245,212,0.45)', letterSpacing: '0.18em', marginBottom: 6 }}>
                    SUBMISSIONS · 12W
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${WEEKS}, 9px)`, gridTemplateRows: 'repeat(7, 9px)', gap: 2 }}>
                    {Array.from({ length: WEEKS }, (_, w) =>
                        Array.from({ length: 7 }, (_, d) => {
                            const cell = cells[w * 7 + d];
                            const bg = cellColor(cell.count);
                            return (
                                <div key={`${w}-${d}`} style={{
                                    width: 9, height: 9, borderRadius: 2,
                                    background: bg,
                                    boxShadow: cell.count > 0 ? `0 0 4px ${bg}` : 'none',
                                }} />
                            );
                        })
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, fontFamily: FONT_MONO_CS, fontSize: 6, letterSpacing: '0.1em' }}>
                    {[['#23d18b80','1–2'],['#23d18b','3–4'],['#00f5d4','5+']].map(([c, l]) => (
                        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(255,255,255,0.35)' }}>
                            <span style={{ width: 6, height: 6, borderRadius: 1, background: c, display: 'inline-block' }} />
                            {l}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Streak Tracker ── */}
            <div style={{
                background: 'rgba(3,5,8,0.88)',
                border: '1px solid rgba(0,245,212,0.15)',
                borderRadius: 10, padding: '8px 10px',
                backdropFilter: 'blur(14px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
            }}>
                <div style={{ fontFamily: FONT_MONO_CS, fontSize: 7, color: 'rgba(0,245,212,0.45)', letterSpacing: '0.18em', marginBottom: 6 }}>
                    STREAK TRACKER
                </div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    {[{ label: 'CURRENT', val: currentStreak, color: '#00f5d4' }, { label: 'LONGEST', val: longestStreak, color: '#f5a623' }].map(({ label, val, color }) => (
                        <div key={label}>
                            <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: 18, fontWeight: 900, color, lineHeight: 1, textShadow: `0 0 12px ${color}60` }}>
                                {val}<span style={{ fontSize: 9, marginLeft: 2, opacity: 0.6 }}>d</span>
                            </div>
                            <div style={{ fontFamily: FONT_MONO_CS, fontSize: 6, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', marginTop: 2 }}>{label}</div>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 24 }}>
                    {last7.map((count, i) => (
                        <div key={i} style={{
                            flex: 1, borderRadius: '2px 2px 0 0',
                            height: count > 0 ? `${Math.max(20, (count / maxLast7) * 100)}%` : '8%',
                            background: count > 0 ? '#23d18b' : 'rgba(255,255,255,0.06)',
                            boxShadow: count > 0 ? '0 0 6px #23d18b80' : 'none',
                        }} />
                    ))}
                </div>
                <div style={{ fontFamily: FONT_MONO_CS, fontSize: 6, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginTop: 3, textAlign: 'right' }}>
                    LAST 7 DAYS
                </div>
            </div>
        </div>
    );
}

/* ─────────────────── Aurora ─────────────────── */
function Aurora() {
    const refs = useRef([null, null, null]);
    useFrame((state) => {
        const t = state.clock.elapsedTime * 0.15;
        refs.current.forEach((mesh, i) => {
            if (!mesh) return;
            mesh.material.opacity = 0.025 + Math.sin(t + i * 1.8) * 0.012;
            mesh.rotation.z += 0.0003 * (i % 2 === 0 ? 1 : -1);
        });
    });
    return (
        <group>
            {[
                { color: '#00f5d4', position: [-15, 28, -70], rotX: 1.45, rotY:  0.25 },
                { color: '#7c3aed', position: [ 25, 32, -90], rotX: 1.50, rotY: -0.15 },
                { color: '#3b82f6', position: [-35, 24, -55], rotX: 1.40, rotY:  0.40 },
            ].map((a, i) => (
                <mesh key={i} ref={el => refs.current[i] = el}
                    position={a.position} rotation={[a.rotX, a.rotY, 0]}
                >
                    <planeGeometry args={[140, 28]} />
                    <meshBasicMaterial
                        color={a.color} transparent opacity={0.028}
                        side={THREE.DoubleSide}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>
            ))}
        </group>
    );
}

/* ─────────────────── City Scene Inner ─────────────────── */
function CitySceneInner({ roster, isNight, onSelectUser }) {
    const globalMax = useMemo(() => {
        let m = 1;
        for (const user of roster) {
            if (!user) continue;
            m = Math.max(m, user.easy, user.med, user.hard);
        }
        return m;
    }, [roster]);

    return (
        <>
            <Aurora />
            <StreetGrid isNight={isNight} />
            <CarLights />

            {roster.map((user, i) => {
                if (!user) return null;
                const row = Math.floor(i / GRID_COLS);
                const col = i % GRID_COLS;
                return (
                    <CityBlock
                        key={`${row}-${col}`}
                        user={user}
                        gridRow={row}
                        gridCol={col}
                        globalMax={globalMax}
                        isNight={isNight}
                        onSelect={onSelectUser}
                    />
                );
            })}

            <EffectComposer multisampling={0}>
                <Bloom
                    mipmapBlur
                    luminanceThreshold={0.5}
                    luminanceSmoothing={0.7}
                    intensity={isNight ? 1.4 : 1.0}
                    radius={0.6}
                />
            </EffectComposer>
        </>
    );
}

/* ─────────────────── Main Export ─────────────────── */
export default function CityCanvas({ data, isNight, onSelectUser }) {
    const totalWidth = GRID_COLS * CELL_SIZE;
    const roster = useMemo(() => buildRoster(data), [data]);

    return (
        <div style={{ position: 'absolute', inset: 0 }}>
            <Canvas
                style={{ width: '100%', height: '100%' }}
                camera={{ fov: 55, near: 0.1, far: 500 }}
                gl={{ antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
                dpr={Math.min(window.devicePixelRatio, 1.5)}
            >
                <SceneLighting isNight={isNight} totalWidth={totalWidth} />
                <CityCamera />
                <OrbitControls
                    target={[0, 1, 0]}
                    enablePan
                    enableZoom
                    enableRotate
                    minDistance={6}
                    maxDistance={totalWidth * 0.6}
                    maxPolarAngle={Math.PI / 2.1}
                    zoomSpeed={1.2}
                    panSpeed={0.8}
                    rotateSpeed={0.5}
                />
                {data && <CitySceneInner roster={roster} isNight={isNight} onSelectUser={onSelectUser} />}
            </Canvas>
            {data && <ActivityOverlay data={data} />}
        </div>
    );
}
