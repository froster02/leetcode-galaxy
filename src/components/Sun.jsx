import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from '../utils/colors';

export default function Sun({ profile }) {
    const meshRef = useRef();
    const corona1Ref = useRef();
    const corona2Ref = useRef();
    const corona3Ref = useRef();
    const corona4Ref = useRef();
    const flareRef = useRef();

    useFrame((state, delta) => {
        if (meshRef.current) meshRef.current.rotation.y += delta * 0.12;

        const t = state.clock.elapsedTime;

        // Corona pulse layers
        if (corona1Ref.current) {
            const s = 1.5 + Math.sin(t * 1.4) * 0.1;
            corona1Ref.current.scale.setScalar(s);
            corona1Ref.current.material.opacity = 0.15 + Math.sin(t * 1.4) * 0.05;
        }
        if (corona2Ref.current) {
            const s = 1.9 + Math.sin(t * 0.9 + 1) * 0.12;
            corona2Ref.current.scale.setScalar(s);
            corona2Ref.current.material.opacity = 0.08 + Math.sin(t * 0.9) * 0.03;
        }
        if (corona3Ref.current) {
            const s = 2.5 + Math.sin(t * 0.6 + 2) * 0.15;
            corona3Ref.current.scale.setScalar(s);
            corona3Ref.current.material.opacity = 0.04 + Math.sin(t * 0.6) * 0.02;
        }
        if (corona4Ref.current) {
            const s = 3.2 + Math.sin(t * 0.3 + 3) * 0.2;
            corona4Ref.current.scale.setScalar(s);
            corona4Ref.current.material.opacity = 0.02 + Math.sin(t * 0.3) * 0.01;
        }

        // Lens flare rotation
        if (flareRef.current) {
            flareRef.current.rotation.z = t * 0.1;
            flareRef.current.material.opacity = 0.06 + Math.sin(t * 0.8) * 0.02;
        }
    });

    const totalSolved = profile?.ranking ? ` // RANK #${profile.ranking.toLocaleString()}` : '';

    return (
        <group>
            {/* Outermost corona */}
            <mesh ref={corona4Ref} scale={3.2}>
                <sphereGeometry args={[4, 16, 16]} />
                <meshBasicMaterial color="#00f5d4" transparent opacity={0.02} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={corona3Ref} scale={2.5}>
                <sphereGeometry args={[4, 16, 16]} />
                <meshBasicMaterial color={COLORS.accent} transparent opacity={0.04} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={corona2Ref} scale={1.9}>
                <sphereGeometry args={[4, 16, 16]} />
                <meshBasicMaterial color={COLORS.accent} transparent opacity={0.08} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>
            <mesh ref={corona1Ref} scale={1.5}>
                <sphereGeometry args={[4, 20, 20]} />
                <meshBasicMaterial color="#7affeb" transparent opacity={0.15} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* Lens flare disk */}
            <mesh ref={flareRef} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[5, 18, 6]} />
                <meshBasicMaterial color={COLORS.accent} transparent opacity={0.06} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
            </mesh>

            {/* Main sun body */}
            <Sphere ref={meshRef} args={[4, 64, 64]}>
                <MeshDistortMaterial
                    color="#7affeb"
                    emissive={COLORS.accent}
                    emissiveIntensity={2}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    metalness={0.1}
                    roughness={0.1}
                    distort={0.3}
                    speed={2.5}
                />
            </Sphere>

            {/* Sun light */}
            <pointLight color={COLORS.accent} intensity={4} distance={250} decay={1.5} />
            <pointLight color="#8b5cf6" intensity={1} distance={100} decay={2} />

            {/* Floating label */}
            <Html center position={[0, 7, 0]} distanceFactor={50}>
                <div style={{
                    fontFamily: 'Orbitron, sans-serif',
                    fontSize: 11,
                    color: COLORS.accent,
                    textShadow: `0 0 16px ${COLORS.accent}, 0 0 32px rgba(0,245,212,0.3)`,
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    letterSpacing: '0.15em',
                    pointerEvents: 'none',
                    animation: 'holo-flicker 5s infinite',
                    padding: '4px 12px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                    border: '1px solid rgba(0,245,212,0.15)',
                    backdropFilter: 'blur(4px)',
                }}>
                    YOUR STAR{totalSolved}
                </div>
            </Html>
        </group>
    );
}
