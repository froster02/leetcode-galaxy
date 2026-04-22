import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { COLORS } from '../utils/colors';

// Shooting star component — brighter, longer trail
function ShootingStar({ onComplete }) {
    const ref = useRef();
    const progress = useRef(0);
    const start = useRef(new THREE.Vector3(
        (Math.random() - 0.5) * 200,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 200
    ));
    const direction = useRef(new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        -Math.random() * 0.1,
        (Math.random() - 0.5) * 0.5
    ).normalize());

    useFrame((_, delta) => {
        progress.current += delta * 0.6;
        if (ref.current) {
            ref.current.position.copy(start.current).addScaledVector(direction.current, progress.current * 100);
            ref.current.material.opacity = Math.sin(progress.current * Math.PI) * 0.95;
        }
        if (progress.current > 1) onComplete?.();
    });

    return (
        <points ref={ref}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    count={1}
                    array={new Float32Array([0, 0, 0])}
                    itemSize={3}
                />
            </bufferGeometry>
            <pointsMaterial size={2} color="#ffffff" transparent opacity={0.9} sizeAttenuation blending={THREE.AdditiveBlending} />
        </points>
    );
}

// Floating beacon for a featured user — enhanced with pulse ring
function FloatingBeacon({ position, username, onSelect }) {
    const ref = useRef();
    const ringRef = useRef();
    const [hovered, setHovered] = React.useState(false);
    const time = useRef(Math.random() * Math.PI * 2);

    useFrame((_, delta) => {
        time.current += delta;
        if (ref.current) {
            ref.current.position.y = position[1] + Math.sin(time.current * 0.8) * 2;
            ref.current.material.emissiveIntensity = hovered ? 3.5 : 1.5 + Math.sin(time.current * 2) * 0.5;
        }
        if (ringRef.current) {
            ringRef.current.rotation.z += delta * 0.5;
            ringRef.current.position.y = position[1] + Math.sin(time.current * 0.8) * 2;
            const pulse = 1 + Math.sin(time.current * 3) * 0.15;
            ringRef.current.scale.setScalar(hovered ? 1.4 : pulse);
        }
    });

    return (
        <group>
            <mesh
                ref={ref}
                position={position}
                onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
                onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'crosshair'; }}
                onClick={(e) => { e.stopPropagation(); onSelect(username); }}
                scale={hovered ? 1.5 : 1}
            >
                <sphereGeometry args={[1.2, 16, 16]} />
                <meshStandardMaterial
                    color={hovered ? '#ffffff' : '#00f5d4'}
                    emissive={hovered ? '#00f5d4' : '#00a890'}
                    emissiveIntensity={2}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Outer glow ring */}
            <mesh ref={ringRef} position={position}>
                <ringGeometry args={[1.8, 2.4, 32]} />
                <meshBasicMaterial color="#00f5d4" transparent opacity={hovered ? 0.5 : 0.18} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* Point light for ambient glow */}
            {hovered && <pointLight position={position} color="#00f5d4" intensity={2} distance={15} />}

            {hovered && (
                <Html position={[position[0], position[1] + 5.5, position[2]]} center>
                    <div style={{
                        background: 'rgba(3,5,8,0.9)',
                        border: '1px solid rgba(0,245,212,0.4)',
                        borderRadius: 10,
                        padding: '8px 16px',
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: 11,
                        color: '#00f5d4',
                        whiteSpace: 'nowrap',
                        letterSpacing: '0.12em',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 0 30px rgba(0,245,212,0.25), inset 0 1px 0 rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        textShadow: '0 0 10px rgba(0,245,212,0.5)',
                    }} onClick={() => onSelect(username)}>
                        ⟐ {username}
                    </div>
                </Html>
            )}
        </group>
    );
}

// Nebula cloud component — enhanced with layering
function NebulaCloud({ position, color, opacity = 0.04, scale = 1 }) {
    const ref = useRef();
    useFrame((state) => {
        if (ref.current) {
            const t = state.clock.elapsedTime * 0.1;
            ref.current.material.opacity = opacity + Math.sin(t + position[0]) * 0.01;
        }
    });
    return (
        <mesh ref={ref} position={position} scale={scale}>
            <sphereGeometry args={[30, 8, 8]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.BackSide} blending={THREE.AdditiveBlending} />
        </mesh>
    );
}

const FEATURED_USERS = [
    { username: 'neal_wu', position: [45, 8, -30] },
    { username: 'tourist', position: [-60, -5, 20] },
    { username: 'jiangly', position: [30, 12, 50] },
    { username: 'Um_nik', position: [-40, 3, -55] },
    { username: 'Petr', position: [70, -8, 15] },
    { username: 'ecnerwala', position: [-25, 15, 35] },
];

function GalaxyScene({ isTransitioning, onSelectUser }) {
    const groupRef = useRef();
    const { camera } = useThree();
    const mouseRef = useRef({ x: 0, y: 0 });
    const transitionTarget = useRef(new THREE.Vector3(0, 5, 20));
    const [shootingStars, setShootingStars] = React.useState([]);
    const shootingStarKey = useRef(0);

    // Mouse parallax
    useEffect(() => {
        const handler = (e) => {
            mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener('mousemove', handler);
        return () => window.removeEventListener('mousemove', handler);
    }, []);

    // Spawn shooting stars
    useEffect(() => {
        const spawn = () => {
            const key = shootingStarKey.current++;
            setShootingStars(prev => [...prev, key]);
            setTimeout(() => {
                setShootingStars(prev => prev.filter(k => k !== key));
            }, 2000);
        };
        const interval = setInterval(spawn, 2500 + Math.random() * 2000);
        spawn();
        return () => clearInterval(interval);
    }, []);

    const particleCount = 8000;

    const [positions, colors, sizes] = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        const col = new Float32Array(particleCount * 3);
        const sz = new Float32Array(particleCount);

        const colorTeal = new THREE.Color(COLORS.accent);
        const colorPurple = new THREE.Color('#8b5cf6');
        const colorBlue = new THREE.Color('#3b82f6');
        const colorWhite = new THREE.Color('#ffffff');

        const armColors = [colorTeal, colorPurple, colorBlue, colorWhite];

        for (let i = 0; i < particleCount; i++) {
            const armCount = 4;
            const radius = Math.random() * 100 + 3;
            const branchAngle = (i % armCount) * ((2 * Math.PI) / armCount);
            const spinAngle = radius * 0.12;

            const spreadFactor = Math.pow(Math.random(), 3);
            const randomX = spreadFactor * (Math.random() < 0.5 ? 1 : -1) * 8;
            const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * 5;
            const randomZ = spreadFactor * (Math.random() < 0.5 ? 1 : -1) * 8;

            pos[i * 3 + 0] = Math.cos(branchAngle + spinAngle) * radius + randomX;
            pos[i * 3 + 1] = randomY;
            pos[i * 3 + 2] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

            const armColor = armColors[i % armCount];
            const mixRatio = 1 - (radius / 100);
            const mixed = colorWhite.clone().lerp(armColor, mixRatio * 0.8 + 0.1);
            col[i * 3 + 0] = mixed.r;
            col[i * 3 + 1] = mixed.g;
            col[i * 3 + 2] = mixed.b;

            sz[i] = Math.random() < 0.02 ? Math.random() * 3 + 1.5 : Math.random() * 1.2 + 0.3;
        }
        return [pos, col, sz];
    }, []);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.03;

            // Mouse parallax tilt
            groupRef.current.rotation.x = THREE.MathUtils.lerp(
                groupRef.current.rotation.x,
                mouseRef.current.y * 0.05,
                0.05
            );
        }

        if (isTransitioning) {
            state.camera.position.lerp(transitionTarget.current, 0.025);
            state.camera.lookAt(0, 0, 0);
        }
    });

    return (
        <group ref={groupRef}>
            {/* Main galaxy particles */}
            <points>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
                    <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
                    <bufferAttribute attach="attributes-size" count={particleCount} array={sizes} itemSize={1} />
                </bufferGeometry>
                <pointsMaterial
                    size={0.5}
                    sizeAttenuation
                    vertexColors
                    transparent
                    opacity={0.85}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {/* Nebula clouds */}
            <NebulaCloud position={[30, 5, -20]} color="#7c3aed" opacity={0.05} scale={1.2} />
            <NebulaCloud position={[-40, -2, 30]} color="#0891b2" opacity={0.04} scale={1.5} />
            <NebulaCloud position={[10, 8, 50]} color="#00f5d4" opacity={0.03} scale={1.0} />
            <NebulaCloud position={[-60, 3, -10]} color="#db2777" opacity={0.04} scale={0.9} />
            <NebulaCloud position={[55, -4, 30]} color="#8b5cf6" opacity={0.05} scale={1.3} />

            {/* Shooting stars */}
            {shootingStars.map(key => (
                <ShootingStar key={key} />
            ))}

            {/* Featured user beacons */}
            {!isTransitioning && FEATURED_USERS.map(({ username, position }) => (
                <FloatingBeacon
                    key={username}
                    position={position}
                    username={username}
                    onSelect={onSelectUser}
                />
            ))}
        </group>
    );
}

export default React.memo(GalaxyScene);
