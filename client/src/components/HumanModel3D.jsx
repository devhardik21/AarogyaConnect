import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';

function HumanBodyPart({ position, args, color, activeColor, name, setActivePart, activePart, geometry = 'box', rotation = [0, 0, 0] }) {
    const mesh = useRef();
    const isActive = activePart === name;
    const isBonesMode = activePart === 'Bones';

    return (
        <mesh
            ref={mesh}
            position={position}
            rotation={rotation}
            onClick={(e) => {
                e.stopPropagation();
                setActivePart(isActive ? null : name);
            }}
        >
            {geometry === 'box' && <boxGeometry args={args} />}
            {geometry === 'sphere' && <sphereGeometry args={args} />}
            {geometry === 'cylinder' && <cylinderGeometry args={args} />}
            {geometry === 'lathe' && <cylinderGeometry args={args} />}

            <meshStandardMaterial
                color={isActive ? activeColor : (isBonesMode ? '#ffffff' : color)}
                emissive={isActive ? activeColor : (isBonesMode ? '#cbd5e1' : '#1e293b')}
                emissiveIntensity={isActive ? 0.8 : 0.1}
                transparent
                opacity={isBonesMode ? 0.3 : 0.9}
                roughness={0.1}
                metalness={0.2}
            />

            {/* Anatomical Hotspot indicator if active */}
            {isActive && (
                <group position={[0, 0, 0.2]}>
                    <mesh>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshBasicMaterial color="#ef4444" />
                    </mesh>
                    <mesh scale={[1.5, 1.5, 1.5]}>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshBasicMaterial color="#ef4444" transparent opacity={0.3} />
                    </mesh>
                </group>
            )}

            {isActive && (
                <Html distanceFactor={10} position={[0, 0.5, 0]} center>
                    <div className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-full shadow-lg whitespace-nowrap animate-pulse font-bold pointer-events-none border border-white/20 backdrop-blur-sm">
                        {name}
                    </div>
                </Html>
            )}
        </mesh>
    );
}

export default function HumanModel3D({ activePart, setActivePart }) {
    return (
        <div className="w-full h-[45vh] bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] relative rounded-b-[40px] overflow-hidden shadow-inner border-b border-white">
            {/* Glassy overlay background element */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent)] pointer-events-none" />

            <Canvas camera={{ position: [0, 1.2, 5], fov: 40 }} shadows>
                <ambientLight intensity={0.4} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <pointLight position={[-10, 5, 5]} intensity={0.5} color="#4ade80" />
                <spotLight position={[0, 5, 0]} intensity={0.8} angle={0.5} penumbra={1} castShadow />

                <group position={[0, -0.5, 0]}>
                    {/* Grid/Floor Circle for perspective */}
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
                        <ringGeometry args={[1.2, 1.25, 64]} />
                        <meshBasicMaterial color="#cbd5e1" transparent opacity={0.3} />
                    </mesh>

                    {/* Head - more oval */}
                    <HumanBodyPart position={[0, 2.3, 0]} args={[0.3, 0.38, 0.28, 32]} color="#94a3b8" activeColor="#ef4444" name="Head" setActivePart={setActivePart} activePart={activePart} geometry="sphere" />

                    {/* Neck - tapered */}
                    <HumanBodyPart position={[0, 1.95, 0]} args={[0.12, 0.15, 0.3, 32]} color="#cbd5e1" activeColor="#ef4444" name="Neck" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />

                    {/* Torso - V-shape muscular look */}
                    <group position={[0, 1.2, 0]}>
                        {/* Upper Chest/Shoulders */}
                        <HumanBodyPart position={[0, 0.4, 0]} args={[0.45, 0.35, 0.6, 32, 1, false, 0, Math.PI * 2]} color="#64748b" activeColor="#ef4444" name="Chest" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" rotation={[0, 0, Math.PI / 2]} />
                        {/* Middle Torso */}
                        <HumanBodyPart position={[0, 0, 0]} args={[0.35, 0.42, 0.8, 32]} color="#475569" activeColor="#ef4444" name="Abdomen" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />
                    </group>

                    {/* Arms - Tapered cylinders */}
                    {/* Left Arm */}
                    <group position={[-0.6, 1.5, 0]}>
                        <HumanBodyPart position={[0, -0.3, 0]} args={[0.1, 0.12, 0.8, 32]} color="#94a3b8" activeColor="#ef4444" name="LeftArm" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />
                    </group>

                    {/* Right Arm */}
                    <group position={[0.6, 1.5, 0]}>
                        <HumanBodyPart position={[0, -0.3, 0]} args={[0.1, 0.12, 0.8, 32]} color="#94a3b8" activeColor="#ef4444" name="RightArm" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />
                    </group>

                    {/* Legs - Strong muscular look */}
                    {/* Left Leg */}
                    <group position={[-0.25, 0.4, 0]}>
                        {/* Upper Leg */}
                        <HumanBodyPart position={[0, -0.4, 0]} args={[0.1, 0.18, 0.9, 32]} color="#64748b" activeColor="#ef4444" name="LeftLeg" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />
                        {/* Lower Leg */}
                        <HumanBodyPart position={[0, -1.2, 0]} args={[0.08, 0.12, 0.8, 32]} color="#94a3b8" activeColor="#ef4444" name="LeftLeg" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />
                    </group>

                    {/* Right Leg */}
                    <group position={[0.25, 0.4, 0]}>
                        {/* Upper Leg */}
                        <HumanBodyPart position={[0, -0.4, 0]} args={[0.1, 0.18, 0.9, 32]} color="#64748b" activeColor="#ef4444" name="RightLeg" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />
                        {/* Lower Leg */}
                        <HumanBodyPart position={[0, -1.2, 0]} args={[0.08, 0.12, 0.8, 32]} color="#94a3b8" activeColor="#ef4444" name="RightLeg" setActivePart={setActivePart} activePart={activePart} geometry="cylinder" />
                    </group>
                </group>

                <OrbitControls
                    enablePan={false}
                    minDistance={3}
                    maxDistance={7}
                    minPolarAngle={Math.PI / 6}
                    maxPolarAngle={Math.PI / 1.5}
                    autoRotate={!activePart}
                    autoRotateSpeed={0.5}
                    enableDamping
                    dampingFactor={0.05}
                />
            </Canvas>

            {/* Bottom Controls Indicator */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 bg-white/40 backdrop-blur-md rounded-full border border-white/50 shadow-sm pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider">3D Interaction Active</span>
            </div>
        </div>
    );
}
