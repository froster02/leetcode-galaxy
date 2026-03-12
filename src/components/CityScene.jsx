import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
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

/* ─────────────────── Generate procedural users ─────────────────── */
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
        easy = 400 + Math.floor(rng() * 400);
        med = 600 + Math.floor(rng() * 800);
        hard = 200 + Math.floor(rng() * 400);
        rank = 10 + Math.floor(rng() * 200);
    } else if (tier < 0.25) {
        easy = 200 + Math.floor(rng() * 300);
        med = 300 + Math.floor(rng() * 500);
        hard = 50 + Math.floor(rng() * 200);
        rank = 200 + Math.floor(rng() * 1000);
    } else if (tier < 0.6) {
        easy = 80 + Math.floor(rng() * 200);
        med = 100 + Math.floor(rng() * 300);
        hard = 10 + Math.floor(rng() * 80);
        rank = 1000 + Math.floor(rng() * 5000);
    } else {
        easy = 10 + Math.floor(rng() * 100);
        med = 5 + Math.floor(rng() * 80);
        hard = Math.floor(rng() * 15);
        rank = 5000 + Math.floor(rng() * 20000);
    }
    const name = PROC_NAMES[index % PROC_NAMES.length] + (index >= PROC_NAMES.length ? `_${index}` : '');
    return { u: name, easy, med, hard, rank };
}

/* ─────────────────── Build 100-user roster ─────────────────── */
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

    const roster = [currentUser];
    const usedNames = new Set([currentUser.u.toLowerCase()]);

    for (const c of CODERS) {
        if (roster.length >= 100) break;
        if (usedNames.has(c.u.toLowerCase())) continue;
        usedNames.add(c.u.toLowerCase());
        roster.push({ ...c, isCurrent: false });
    }

    let procIdx = 0;
    while (roster.length < 100) {
        const user = generateProceduralUser(procIdx++);
        if (!usedNames.has(user.u.toLowerCase())) {
            usedNames.add(user.u.toLowerCase());
            roster.push({ ...user, isCurrent: false });
        }
    }

    roster.sort((a, b) => {
        if (a.isCurrent) return -1;
        if (b.isCurrent) return 1;
        return a.rank - b.rank;
    });

    // Place current user at center, fill rest sequentially
    const grid = new Array(GRID_ROWS * GRID_COLS).fill(null);
    const centerIdx = USER_ROW * GRID_COLS + USER_COL;
    grid[centerIdx] = roster[0]; // current user

    let rosterIdx = 1;
    for (let i = 0; i < grid.length && rosterIdx < roster.length; i++) {
        if (i !== centerIdx) {
            grid[i] = roster[rosterIdx++];
        }
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
function CityBuilding({ height, width, color, position }) {
    const meshRef = useRef();

    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.elapsedTime;
        meshRef.current.material.emissiveIntensity =
            0.3 + Math.sin(t * 2 + position[0] + position[2]) * 0.15;
    });

    return (
        <group position={position}>
            <mesh ref={meshRef} position={[0, height / 2, 0]} castShadow>
                <boxGeometry args={[width, height, width]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={0.3}
                    metalness={0.3}
                    roughness={0.5}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            <mesh position={[0, height + 0.05, 0]}>
                <boxGeometry args={[width + 0.05, 0.1, width + 0.05]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={2}
                    transparent
                    opacity={0.9}
                />
            </mesh>
            {height > 4 && [0.3, 0.5, 0.7].map((frac, i) => (
                <mesh key={i} position={[width / 2 + 0.01, height * frac, 0]}>
                    <boxGeometry args={[0.02, 0.12, 0.2]} />
                    <meshStandardMaterial color="#ffffff" emissive="#88aaff" emissiveIntensity={0.8} />
                </mesh>
            ))}
        </group>
    );
}

/* ─────────────────── Single City Block (township) ─────────────── */
function CityBlock({ user, gridRow, gridCol, globalMax, isNight }) {
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
        <group position={[worldX, 0, worldZ]}>
            {/* Block ground plate */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.02, 0]}
                receiveShadow
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
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
function UserBeacon() {
    const meshRef = useRef();
    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.rotation.y += 0.008;
        meshRef.current.material.emissiveIntensity =
            0.5 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
    });
    return (
        <group>
            <mesh ref={meshRef} position={[0, 2.5, 0]}>
                <octahedronGeometry args={[0.6, 0]} />
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
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.8, 1, 0.6, 6]} />
                <meshStandardMaterial
                    color="#111"
                    emissive="#00f5d4"
                    emissiveIntensity={0.1}
                    metalness={0.4}
                    roughness={0.6}
                />
            </mesh>
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
        camera.position.set(12, 18, 18);
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
    }, [camera]);
    return null;
}

/* ─────────────────── City Scene Inner ─────────────────── */
function CitySceneInner({ data, isNight }) {
    const roster = useMemo(() => buildRoster(data), [data]);
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
            <StreetGrid isNight={isNight} />

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
                    />
                );
            })}

            <EffectComposer>
                <Bloom
                    mipmapBlur
                    luminanceThreshold={0.4}
                    luminanceSmoothing={0.9}
                    intensity={isNight ? 2.0 : 1.5}
                    radius={0.8}
                />
            </EffectComposer>
        </>
    );
}

/* ─────────────────── Main Export ─────────────────── */
export default function CityCanvas({ data, isNight }) {
    const totalWidth = GRID_COLS * CELL_SIZE;
    return (
        <Canvas
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            shadows
            camera={{ fov: 45, near: 0.1, far: 500 }}
            gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true }}
            dpr={[1, 1.5]}
        >
            <color attach="background" args={[isNight ? '#020308' : '#05060a']} />
            <fog attach="fog" args={[isNight ? '#020308' : '#05060a', 30, totalWidth * 0.7]} />
            <ambientLight intensity={isNight ? 0.08 : 0.15} color={isNight ? '#1111aa' : '#2020ff'} />
            <directionalLight position={[30, 40, 30]} intensity={isNight ? 0.15 : 0.4} color="#ffffff" castShadow />
            <directionalLight position={[-20, 30, -20]} intensity={isNight ? 0.08 : 0.2} color="#8080ff" />
            <pointLight position={[0, 10, 0]} intensity={isNight ? 0.4 : 0.6} color="#00f5d4" distance={60} />
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
            {data && <CitySceneInner data={data} isNight={isNight} />}
        </Canvas>
    );
}
