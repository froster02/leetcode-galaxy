import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import Moon from './Moon';

const PLANET_COLORS = [
    { color: '#00f5d4', emissive: '#006b5e' },
    { color: '#8b5cf6', emissive: '#4c1d95' },
    { color: '#f5a623', emissive: '#7c5200' },
    { color: '#3b82f6', emissive: '#1e3a8a' },
    { color: '#ef4444', emissive: '#7f1d1d' },
    { color: '#ec4899', emissive: '#831843' },
    { color: '#10b981', emissive: '#064e3b' },
    { color: '#f59e0b', emissive: '#78350f' },
];

/* ── Planet ring (for larger planets) ────────────────── */
function PlanetRing({ size, color, opacity = 0.15 }) {
    const ref = useRef();
    useFrame((state) => {
        if (ref.current) {
            ref.current.material.opacity = opacity + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
        }
    });
    return (
        <mesh ref={ref} rotation={[Math.PI / 2.5, 0.2, 0]}>
            <ringGeometry args={[size * 1.4, size * 1.9, 64]} />
            <meshBasicMaterial
                color={color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </mesh>
    );
}

export default function Planet({ planetData, onPlanetClick }) {
    const groupRef = useRef();
    const planetRef = useRef();
    const glowRef = useRef();
    const trailRef = useRef();
    const [hovered, setHovered] = useState(false);
    const colorSet = PLANET_COLORS[planetData.colorIndex % PLANET_COLORS.length] || PLANET_COLORS[0];
    const hasRing = planetData.size > 2.0;

    // Trail positions buffer
    const trailLength = 40;
    const trailPositions = useMemo(() => new Float32Array(trailLength * 3), []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            planetData.angle += delta * planetData.speed;
            const x = Math.cos(planetData.angle) * planetData.radius;
            const z = Math.sin(planetData.angle) * planetData.radius;
            groupRef.current.position.x = x;
            groupRef.current.position.z = z;

            // Update trail
            if (trailRef.current) {
                // Shift trail positions
                for (let i = trailLength - 1; i > 0; i--) {
                    trailPositions[i * 3] = trailPositions[(i - 1) * 3];
                    trailPositions[i * 3 + 1] = trailPositions[(i - 1) * 3 + 1];
                    trailPositions[i * 3 + 2] = trailPositions[(i - 1) * 3 + 2];
                }
                trailPositions[0] = x;
                trailPositions[1] = 0;
                trailPositions[2] = z;
                trailRef.current.geometry.attributes.position.needsUpdate = true;
            }
        }
        if (planetRef.current) {
            planetRef.current.rotation.y += delta * 0.4;
        }
        if (glowRef.current) {
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2 + planetData.radius) * 0.06;
            glowRef.current.scale.setScalar(pulse);
            glowRef.current.material.opacity = (hovered ? 0.4 : 0.2) + Math.sin(state.clock.elapsedTime * 2) * 0.05;
        }
    });

    // Orbit path
    const points = [];
    for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * planetData.radius, 0, Math.sin(a) * planetData.radius));
    }

    // Moon orbit ring
    const moonPath = [];
    for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        moonPath.push(new THREE.Vector3(Math.cos(a) * 7, 0, Math.sin(a) * 7));
    }

    return (
        <>
            {/* Orbit path */}
            <Line
                points={points}
                color={colorSet.color}
                lineWidth={0.5}
                transparent
                opacity={hovered ? 0.3 : 0.06}
                dashed={!hovered}
                dashSize={2}
                gapSize={2}
            />

            {/* Trail */}
            <points ref={trailRef}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={trailLength} array={trailPositions} itemSize={3} />
                </bufferGeometry>
                <pointsMaterial
                    size={0.3}
                    color={colorSet.color}
                    transparent
                    opacity={0.2}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            <group ref={groupRef} position={[Math.cos(planetData.angle) * planetData.radius, 0, Math.sin(planetData.angle) * planetData.radius]}>
                {/* Planet body */}
                <Sphere
                    ref={planetRef}
                    args={[planetData.size, 48, 48]}
                    onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                    onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'crosshair'; }}
                    onClick={(e) => { e.stopPropagation(); onPlanetClick?.(planetData); }}
                >
                    <meshStandardMaterial
                        color={colorSet.color}
                        emissive={colorSet.emissive}
                        emissiveIntensity={hovered ? 3 : 1.5}
                        roughness={0.35}
                        metalness={0.25}
                    />
                </Sphere>

                {/* Atmospheric glow shell */}
                <mesh ref={glowRef} scale={1.3}>
                    <sphereGeometry args={[planetData.size, 32, 32]} />
                    <meshBasicMaterial
                        color={colorSet.color}
                        transparent
                        opacity={0.2}
                        side={THREE.BackSide}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </mesh>

                {/* Planet ring for large planets */}
                {hasRing && <PlanetRing size={planetData.size} color={colorSet.color} />}

                {/* Planet light */}
                <pointLight color={colorSet.color} intensity={hovered ? 2 : 0.5} distance={15} decay={2} />

                {/* Planet label */}
                <Html center position={[0, planetData.size + 2.8, 0]} distanceFactor={40} occlude>
                    <div
                        style={{
                            fontFamily: 'Orbitron, sans-serif',
                            fontSize: hovered ? 13 : 10,
                            color: hovered ? colorSet.color : 'rgba(255,255,255,0.45)',
                            whiteSpace: 'nowrap',
                            textShadow: hovered ? `0 0 20px ${colorSet.color}` : 'none',
                            transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                            background: hovered ? 'rgba(0,0,0,0.8)' : 'transparent',
                            padding: hovered ? '6px 14px' : '2px 6px',
                            borderRadius: 8,
                            border: hovered ? `1px solid ${colorSet.color}30` : 'none',
                            cursor: 'pointer',
                            letterSpacing: '0.1em',
                            backdropFilter: hovered ? 'blur(12px)' : 'none',
                            animation: hovered ? 'holo-flicker 5s infinite' : 'none',
                        }}
                        onClick={() => onPlanetClick?.(planetData)}
                    >
                        {planetData.name.toUpperCase()}
                        {hovered && (
                            <span style={{
                                display: 'block', textAlign: 'center', fontSize: 9,
                                color: 'rgba(255,255,255,0.5)', marginTop: 3,
                                fontFamily: '"Share Tech Mono", monospace',
                            }}>
                                {planetData.problemsSolved} PROBLEMS SOLVED
                            </span>
                        )}
                    </div>
                </Html>

                {/* Moon orbit guide */}
                <Line points={moonPath} color={colorSet.color} lineWidth={0.3} transparent opacity={0.06} />

                {/* Moons */}
                {planetData.moons.map((moon) => (
                    <Moon key={moon.id} moonData={moon} />
                ))}
            </group>
        </>
    );
}
