import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import Moon from './Moon';

export default function Planet({ planetData }) {
    const groupRef = useRef();
    const planetRef = useRef();

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Orbit around the sun
            planetData.angle += delta * planetData.speed;
            groupRef.current.position.x = Math.cos(planetData.angle) * planetData.radius;
            groupRef.current.position.z = Math.sin(planetData.angle) * planetData.radius;
        }
        if (planetRef.current) {
            // Planet's own rotation
            planetRef.current.rotation.y += delta * 0.5;
        }
    });

    // Generate orbit path for the planet
    const points = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * planetData.radius, 0, Math.sin(angle) * planetData.radius));
    }

    // Generate orbit ring for moons (approximate visual guide)
    const moonPath = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        moonPath.push(new THREE.Vector3(Math.cos(angle) * 7, 0, Math.sin(angle) * 7));
    }

    return (
        <>
            <Line points={points} color="#112233" lineWidth={1} transparent opacity={0.3} />

            <group ref={groupRef} position={[Math.cos(planetData.angle) * planetData.radius, 0, Math.sin(planetData.angle) * planetData.radius]}>
                <Sphere ref={planetRef} args={[planetData.size, 32, 32]}>
                    <meshStandardMaterial color="#4d5b6e" wireframe />
                </Sphere>

                <Line points={moonPath} color="#223344" lineWidth={0.5} transparent opacity={0.2} />

                {planetData.moons.map((moon) => (
                    <Moon key={moon.id} moonData={moon} />
                ))}
            </group>
        </>
    );
}
