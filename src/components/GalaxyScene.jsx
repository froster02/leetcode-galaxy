import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { COLORS } from '../utils/colors';

// Generates a spiral galaxy with 600 stars
export default function GalaxyScene({ isTransitioning }) {
    const groupRef = useRef();

    const particleCount = 600;

    const [positions, colors, sizes] = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        const col = new Float32Array(particleCount * 3);
        const sz = new Float32Array(particleCount);

        const colorTeal = new THREE.Color(COLORS.accent);
        const colorWhite = new THREE.Color('#ffffff');

        for (let i = 0; i < particleCount; i++) {
            // Spiral equations
            const radius = Math.random() * 80 + 5;
            const branchAngle = (i % 3) * ((2 * Math.PI) / 3);
            const spinAngle = radius * 0.1;

            const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 10;
            const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 10;
            const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 10;

            pos[i * 3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            pos[i * 3 + 1] = randomY;
            pos[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            const mixedColor = colorWhite.clone().lerp(colorTeal, Math.random());
            col[i * 3 + 0] = mixedColor.r;
            col[i * 3 + 1] = mixedColor.g;
            col[i * 3 + 2] = mixedColor.b;

            sz[i] = Math.random() * 1.5 + 0.5;
        }
        return [pos, col, sz];
    }, [particleCount]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.05;
            if (isTransitioning) {
                // Move camera inwards
                state.camera.position.lerp(new THREE.Vector3(0, 5, 20), 0.02);
                state.camera.lookAt(0, 0, 0);
            }
        }
    });

    return (
        <group ref={groupRef}>
            <points>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particleCount}
                        array={positions}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        count={particleCount}
                        array={colors}
                        itemSize={3}
                    />
                    <bufferAttribute
                        attach="attributes-size"
                        count={particleCount}
                        array={sizes}
                        itemSize={1}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.6}
                    sizeAttenuation={true}
                    vertexColors={true}
                    transparent={true}
                    opacity={0.8}
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    );
}
