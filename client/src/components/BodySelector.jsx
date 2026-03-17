import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';

// Body zone definitions per clickable body region
const BODY_PARTS = [
    { id: 'head', label: 'Head', zones: ['Forehead', 'Eyes', 'Ear', 'Jaw'] },
    { id: 'chest', label: 'Chest', zones: ['Left Chest', 'Right Chest', 'Ribs', 'Sternum'] },
    { id: 'abdomen', label: 'Abdomen', zones: ['Upper Abdomen', 'Lower Abdomen', 'Left Side', 'Right Side'] },
    { id: 'leftArm', label: 'Left Arm', zones: ['Shoulder', 'Elbow', 'Wrist', 'Hand'] },
    { id: 'rightArm', label: 'Right Arm', zones: ['Shoulder', 'Elbow', 'Wrist', 'Hand'] },
    { id: 'leg', label: 'Legs', zones: ['Upper Leg', 'Lower Leg', 'Bone', 'Knee'] },
    { id: 'back', label: 'Back', zones: ['Upper Back', 'Lower Back', 'Spine', 'Neck'] },
];

// Simple schematic human figure using SVG-like 3D primitives
function BodyMesh({ partId, active, onClick, color }) {
    const isActive = active === partId;
    return (
        <mesh onClick={e => { e.stopPropagation(); onClick(partId); }} castShadow>
            <meshStandardMaterial
                color={isActive ? '#ef4444' : color}
                emissive={isActive ? '#ef4444' : '#000000'}
                emissiveIntensity={isActive ? 0.5 : 0}
                roughness={0.4}
            />
        </mesh>
    );
}

// A simple schematic human figure
function HumanFigure({ selectedPart, onSelect }) {
    const c = { normal: '#94a3b8', selected: '#ef4444', emissive: '#1e293b' };

    const Part = ({ pid, position, args, geo = 'box', rotation = [0, 0, 0] }) => {
        const isActive = selectedPart === pid;
        return (
            <mesh
                position={position}
                rotation={rotation}
                onClick={e => { e.stopPropagation(); onSelect(pid); }}
            >
                {geo === 'sphere' && <sphereGeometry args={args} />}
                {geo === 'box' && <boxGeometry args={args} />}
                {geo === 'cylinder' && <cylinderGeometry args={args} />}
                <meshStandardMaterial
                    color={isActive ? c.selected : c.normal}
                    emissive={isActive ? c.selected : c.emissive}
                    emissiveIntensity={isActive ? 0.6 : 0.1}
                    roughness={0.2}
                    metalness={0.2}
                    transparent
                    opacity={0.9}
                />

                {isActive && (
                    <group position={[0, 0, 0.2]}>
                        <mesh>
                            <sphereGeometry args={[0.08, 16, 16]} />
                            <meshBasicMaterial color="#ef4444" />
                        </mesh>
                    </group>
                )}
            </mesh>
        );
    };

    return (
        <group position={[0, -0.2, 0]} scale={1.1}>
            {/* Head */}
            <Part pid="head" position={[0, 2.3, 0]} args={[0.3, 0.38, 0.28, 32]} geo="sphere" />

            {/* Neck */}
            <Part pid="neck" position={[0, 1.95, 0]} args={[0.12, 0.15, 0.3, 32]} geo="cylinder" />

            {/* Torso */}
            <group position={[0, 1.2, 0]}>
                <Part pid="chest" position={[0, 0.4, 0]} args={[0.45, 0.35, 0.6, 32]} geo="cylinder" rotation={[0, 0, Math.PI / 2]} />
                <Part pid="abdomen" position={[0, 0, 0]} args={[0.35, 0.42, 0.8, 32]} geo="cylinder" />
            </group>

            {/* Arms */}
            <Part pid="leftArm" position={[-0.6, 1.2, 0]} args={[0.1, 0.12, 0.8, 32]} geo="cylinder" />
            <Part pid="rightArm" position={[0.6, 1.2, 0]} args={[0.1, 0.12, 0.8, 32]} geo="cylinder" />

            {/* Legs */}
            <group position={[-0.25, 0.4, 0]}>
                <Part pid="leg" position={[0, -0.4, 0]} args={[0.1, 0.18, 0.9, 32]} geo="cylinder" />
                <Part pid="leg" position={[0, -1.2, 0]} args={[0.08, 0.12, 0.8, 32]} geo="cylinder" />
            </group>
            <group position={[0.25, 0.4, 0]}>
                <Part pid="leg" position={[0, -0.4, 0]} args={[0.1, 0.18, 0.9, 32]} geo="cylinder" />
                <Part pid="leg" position={[0, -1.2, 0]} args={[0.08, 0.12, 0.8, 32]} geo="cylinder" />
            </group>
        </group>
    );
}

export default function BodySelector({ selectedPart, setSelectedPart, bodyZone, setBodyZone }) {
    const partData = BODY_PARTS.find(p => p.id === selectedPart);

    return (
        <div className="flex flex-col gap-4">
            {/* 3D Canvas */}
            <div className="w-full h-64 bg-gradient-to-b from-gray-50 to-gray-100 rounded-3xl overflow-hidden card-shadow">
                <Canvas camera={{ position: [0, 1.2, 5.5], fov: 42 }}>
                    <ambientLight intensity={0.8} />
                    <directionalLight position={[5, 8, 4]} intensity={1.2} castShadow />
                    <directionalLight position={[-5, 2, -4]} intensity={0.4} color="#a7f3d0" />
                    <HumanFigure selectedPart={selectedPart} onSelect={setSelectedPart} />
                    <OrbitControls
                        enablePan={false}
                        minDistance={3}
                        maxDistance={9}
                        minPolarAngle={Math.PI / 5}
                        maxPolarAngle={Math.PI / 1.6}
                        autoRotate={!selectedPart}
                        autoRotateSpeed={0.8}
                    />
                </Canvas>
            </div>

            {/* Body part label */}
            {selectedPart && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm text-gray-500"
                >
                    Selected: <strong className="text-gray-800">{partData?.label}</strong>
                </motion.p>
            )}

            {/* Zone picker chips */}
            {partData && (
                <motion.div
                    key={selectedPart}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2 justify-center"
                >
                    {partData.zones.map(z => (
                        <button
                            key={z}
                            onClick={() => setBodyZone(z)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${bodyZone === z
                                ? 'bg-green-500 border-green-500 text-white green-shadow'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-green-300'
                                }`}
                        >
                            {z}
                        </button>
                    ))}
                </motion.div>
            )}

            {!selectedPart && (
                <p className="text-center text-sm text-gray-400 animate-pulse">
                    👆 Tap the body area where you have pain
                </p>
            )}
        </div>
    );
}
