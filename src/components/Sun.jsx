import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import { COLORS } from '../utils/colors';

export default function Sun({ profile }) {
    const meshRef = useRef();

    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2;
        }
    });

    return (
        <group>
            <Sphere ref={meshRef} args={[4, 64, 64]}>
                <MeshDistortMaterial
                    color={COLORS.accent}
                    envMapIntensity={1}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    metalness={0.2}
                    roughness={0.1}
                    distort={0.3}
                    speed={2}
                    emissive={COLORS.accent}
                    emissiveIntensity={1}
                />
            </Sphere>
            <pointLight color={COLORS.accent} intensity={2} distance={100} decay={2} />
        </group>
    );
}
