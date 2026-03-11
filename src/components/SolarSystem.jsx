import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import Sun from './Sun';
import Planet from './Planet';

/* ── Asteroid Belt ──────────────────────────────────── */
function AsteroidBelt({ innerRadius = 12, outerRadius = 15, count = 200 }) {
    const ref = useRef();

    const [positions, sizes] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const sz = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const r = innerRadius + Math.random() * (outerRadius - innerRadius);
            const angle = Math.random() * Math.PI * 2;
            pos[i * 3] = Math.cos(angle) * r;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
            pos[i * 3 + 2] = Math.sin(angle) * r;
            sz[i] = Math.random() * 0.15 + 0.05;
        }
        return [pos, sz];
    }, [innerRadius, outerRadius, count]);

    useFrame((_, delta) => {
        if (ref.current) ref.current.rotation.y += delta * 0.02;
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.15}
                color="#4a5568"
                transparent
                opacity={0.5}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

/* ── Ambient particle dust ──────────────────────────── */
function CosmicDust({ count = 300, radius = 100 }) {
    const ref = useRef();

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            const r = Math.random() * radius;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
        }
        return pos;
    }, [count, radius]);

    useFrame((state) => {
        if (ref.current) {
            ref.current.rotation.y = state.clock.elapsedTime * 0.005;
        }
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial
                size={0.08}
                color="#00f5d4"
                transparent
                opacity={0.15}
                sizeAttenuation
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </points>
    );
}

export default function SolarSystem({ data, onPlanetClick }) {
    if (!data || !data.planets) return null;

    const coloredPlanets = data.planets.map((p, i) => ({ ...p, colorIndex: i }));

    return (
        <group>
            {/* Ambient cosmic dust */}
            <CosmicDust />

            {/* Inner asteroid belt */}
            <AsteroidBelt innerRadius={11} outerRadius={14} count={150} />

            {/* Sun */}
            <Sun profile={data.profile} username={data.username} />

            {/* Planets */}
            {coloredPlanets.map((planet) => (
                <Planet key={planet.name} planetData={planet} onPlanetClick={onPlanetClick} />
            ))}

            {/* Outer asteroid belt */}
            <AsteroidBelt innerRadius={80} outerRadius={90} count={300} />
        </group>
    );
}
