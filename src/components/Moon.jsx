import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from '../utils/colors';

const DIFF_COLORS = {
    Easy: { color: COLORS.easy, emissive: '#0d6641' },
    Medium: { color: COLORS.medium, emissive: '#7c5200' },
    Hard: { color: COLORS.hard, emissive: '#7f1d1d' },
};
const UNSOLVED_COLOR = { color: '#2a3040', emissive: '#000000' };

export default function Moon({ moonData }) {
    const moonRef = useRef();
    const glowRef = useRef();
    const size = moonData.difficulty === 'Hard' ? 0.38 : (moonData.difficulty === 'Medium' ? 0.28 : 0.18);
    const colorSet = moonData.isSolved ? (DIFF_COLORS[moonData.difficulty] || DIFF_COLORS.Easy) : UNSOLVED_COLOR;

    useFrame((state, delta) => {
        if (moonRef.current) {
            moonData.orbitAngle += delta * moonData.orbitSpeed;
            moonRef.current.position.x = Math.cos(moonData.orbitAngle) * moonData.orbitRadius;
            moonRef.current.position.z = Math.sin(moonData.orbitAngle) * moonData.orbitRadius;
            moonRef.current.position.y = Math.sin(moonData.orbitAngle * 2 + moonData.orbitRadius) * 0.5;
        }
        if (glowRef.current && moonData.isSolved) {
            glowRef.current.position.copy(moonRef.current.position);
            glowRef.current.material.opacity = 0.12 + Math.sin(state.clock.elapsedTime * 2 + moonData.orbitRadius) * 0.06;
        }
    });

    return (
        <group>
            <Sphere
                ref={moonRef}
                args={[size, 14, 14]}
                position={[Math.cos(moonData.orbitAngle) * moonData.orbitRadius, 0, Math.sin(moonData.orbitAngle) * moonData.orbitRadius]}
            >
                <meshStandardMaterial
                    color={colorSet.color}
                    emissive={colorSet.emissive}
                    emissiveIntensity={moonData.isSolved ? 1.5 : 0}
                    roughness={moonData.isSolved ? 0.25 : 0.9}
                    metalness={moonData.isSolved ? 0.4 : 0}
                    transparent={!moonData.isSolved}
                    opacity={moonData.isSolved ? 1 : 0.3}
                />
            </Sphere>
            {/* Outer glow shell for solved moons */}
            {moonData.isSolved && (
                <Sphere ref={glowRef} args={[size * 1.6, 10, 10]}>
                    <meshBasicMaterial
                        color={colorSet.color}
                        transparent
                        opacity={0.12}
                        blending={THREE.AdditiveBlending}
                        depthWrite={false}
                    />
                </Sphere>
            )}
        </group>
    );
}
