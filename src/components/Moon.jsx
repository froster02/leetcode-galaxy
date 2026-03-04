import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import { COLORS } from '../utils/colors';

export default function Moon({ moonData }) {
    const moonRef = useRef();

    // Calculate size based on difficulty
    const size = moonData.difficulty === 'Hard' ? 0.35 : (moonData.difficulty === 'Medium' ? 0.25 : 0.15);

    // Calculate color based on difficulty
    let color = COLORS.easy;
    if (!moonData.isSolved) color = '#555555';
    else if (moonData.difficulty === 'Medium') color = COLORS.medium;
    else if (moonData.difficulty === 'Hard') color = COLORS.hard;

    useFrame((state, delta) => {
        if (moonRef.current) {
            // Orbit around the planet
            moonData.orbitAngle += delta * moonData.orbitSpeed;
            moonRef.current.position.x = Math.cos(moonData.orbitAngle) * moonData.orbitRadius;
            moonRef.current.position.z = Math.sin(moonData.orbitAngle) * moonData.orbitRadius;
        }
    });

    return (
        <Sphere
            ref={moonRef}
            args={[size, 16, 16]}
            position={[Math.cos(moonData.orbitAngle) * moonData.orbitRadius, 0, Math.sin(moonData.orbitAngle) * moonData.orbitRadius]}
        >
            <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={moonData.isSolved ? 0.8 : 0}
                transparent={!moonData.isSolved}
                opacity={moonData.isSolved ? 1 : 0.4}
            />
        </Sphere>
    );
}
