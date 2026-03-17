import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

// Procedurally generated simplistic human model for the hackathon
// since we don't have a guaranteed GLB. This gives a cool abstract tech/medical vibe.
function HumanBodyPart({ position, args, color, activeColor, name, setActivePart, activePart, geometry = 'box' }) {
    const mesh = useRef();
    const isActive = activePart === name;
    const isBonesMode = activePart === 'Bones';

    return (
        <mesh
            ref={mesh}
            position={position}
            onClick={(e) => {
                e.stopPropagation();
                setActivePart(isActive ? null : name);
            }}
        >
            {geometry === 'box' && <boxGeometry args={args} />}
            {geometry === 'sphere' && <sphereGeometry args={args} />}
            {geometry === 'cylinder' && <cylinderGeometry args={args} />}

            <meshStandardMaterial
                color={isActive ? activeColor : (isBonesMode ? '#ffffff' : color)}
                emissive={isActive ? activeColor : '#000000'}
                emissiveIntensity={isActive ? 0.8 : 0}
                transparent
                opacity={isBonesMode ? 0.4 : 0.9}
                roughness={0.2}
                metalness={0.1}
            />
            {isActive && (
                <Html distanceFactor={10} position={[0, args[1] / 2 + 0.2, 0]} center>
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg whitespace-nowrap animate-pulse font-bold pointer-events-none">
                        {name} Issue?
                    </div>
                </Html>
            )}
        </mesh>
    );
}

export default function HumanModel3D({ activePart, setActivePart }) {
    return (
        <div className="w-full h-[40vh] bg-gradient-to-b from-green-50 to-white relative rounded-b-3xl overflow-hidden shadow-inner">
            <Canvas camera={{ position: [0, 1.5, 6], fov: 45 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <directionalLight position={[-10, 5, -5]} intensity={0.5} color="#22c55e" />

                <group position={[0, 0.5, 0]}>
                    {/* Head */}
                    <HumanBodyPart position={[0, 1.8, 0]} args={[0.4, 32, 32]} color="#e2e8f0" activeColor="#ef4444" name="Head" setActivePart={setActivePart} activePart={activePart} geometry="sphere" />

                    {/* Neck */}
                    <HumanBodyPart position={[0, 1.45, 0]} args={[0.15, 0.15, 0.3, 32]} color="#cbd5e1" activeColor="#ef4444" name="Neck" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />

                    {/* Chest/Torso */}
                    <HumanBodyPart position={[0, 0.7, 0]} args={[0.9, 1.2, 0.4]} color="#94a3b8" activeColor="#ef4444" name="Chest" setActivePart={setActivePart} activePart={activePart} />

                    {/* Internal Organs (visible if Bones/transparent mode is tricky, but let's make them hover over Chest) */}
                    {activePart === 'Heart' && (
                        <HumanBodyPart position={[0.2, 0.9, 0.25]} args={[0.15, 32, 32]} color="#ef4444" activeColor="#ef4444" name="Heart" setActivePart={setActivePart} activePart={activePart} geometry="sphere" />
                    )}

                    {/* Abdomen */}
                    <HumanBodyPart position={[0, -0.1, 0]} args={[0.85, 0.4, 0.4]} color="#64748b" activeColor="#ef4444" name="Abdomen" setActivePart={setActivePart} activePart={activePart} />

                    {/* Left Arm */}
                    <HumanBodyPart position={[-0.65, 0.6, 0]} args={[0.2, 1.2, 0.2]} color="#cbd5e1" activeColor="#ef4444" name="LeftArm" setActivePart={setActivePart} activePart={activePart} />

                    {/* Right Arm */}
                    <HumanBodyPart position={[0.65, 0.6, 0]} args={[0.2, 1.2, 0.2]} color="#cbd5e1" activeColor="#ef4444" name="RightArm" setActivePart={setActivePart} activePart={activePart} />

                    {/* Left Leg */}
                    <HumanBodyPart position={[-0.25, -1, 0]} args={[0.25, 1.4, 0.25]} color="#94a3b8" activeColor="#ef4444" name="LeftLeg" setActivePart={setActivePart} activePart={activePart} />

                    {/* Right Leg */}
                    <HumanBodyPart position={[0.25, -1, 0]} args={[0.25, 1.4, 0.25]} color="#94a3b8" activeColor="#ef4444" name="RightLeg" setActivePart={setActivePart} activePart={activePart} />
                </group>

                <OrbitControls
                    enablePan={false}
                    minDistance={2}
                    maxDistance={8}
                    minPolarAngle={Math.PI / 4}
                    maxPolarAngle={Math.PI / 1.5}
                    autoRotate={!activePart}
                    autoRotateSpeed={1}
                />
            </Canvas>
        </div>
    );
}
