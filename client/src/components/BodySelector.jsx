import { useState } from 'react';
import { motion } from 'framer-motion';
// import anatomyFront from '../assets/human_anatomy_front.png';
// import anatomyBack from '../assets/human_anatomy_back.png';
import anatomyFront from '../assets/human_anatomy_front.png';
import anatomyBack from '../assets/human_anatomy_back.png';

// ─── Body part definitions ────────────────────────────────────────────────
const BODY_PARTS_FRONT = [
    { id: 'head', label: 'Head', zones: ['Forehead', 'Eyes', 'Ear', 'Jaw', 'Nose'] },
    { id: 'neck', label: 'Neck', zones: ['Throat', 'Left Neck', 'Right Neck'] },
    { id: 'chest', label: 'Chest', zones: ['Left Chest', 'Right Chest', 'Ribs', 'Sternum'] },
    { id: 'abdomen', label: 'Abdomen', zones: ['Upper Abdomen', 'Lower Abdomen', 'Left Side', 'Right Side'] },
    { id: 'pelvis', label: 'Pelvis', zones: ['Groin', 'Hip Left', 'Hip Right'] },
    { id: 'leftArm', label: 'Left Arm', zones: ['Shoulder', 'Upper Arm', 'Elbow', 'Wrist', 'Hand'] },
    { id: 'rightArm', label: 'Right Arm', zones: ['Shoulder', 'Upper Arm', 'Elbow', 'Wrist', 'Hand'] },
    { id: 'leftLeg', label: 'Left Leg', zones: ['Thigh', 'Knee', 'Shin', 'Ankle', 'Foot'] },
    { id: 'rightLeg', label: 'Right Leg', zones: ['Thigh', 'Knee', 'Shin', 'Ankle', 'Foot'] },
];

const BODY_PARTS_BACK = [
    { id: 'head', label: 'Head (Back)', zones: ['Scalp', 'Nape', 'Occiput'] },
    { id: 'upperBack', label: 'Upper Back', zones: ['Left Shoulder Blade', 'Right Shoulder Blade', 'Upper Spine'] },
    { id: 'midBack', label: 'Mid Back', zones: ['Mid Spine', 'Left Mid', 'Right Mid'] },
    { id: 'lowerBack', label: 'Lower Back', zones: ['Lumbar', 'Left Lower', 'Right Lower'] },
    { id: 'gluteal', label: 'Gluteal', zones: ['Left Glute', 'Right Glute', 'Tailbone'] },
    { id: 'leftArm', label: 'Left Arm', zones: ['Shoulder', 'Tricep', 'Elbow', 'Wrist'] },
    { id: 'rightArm', label: 'Right Arm', zones: ['Shoulder', 'Tricep', 'Elbow', 'Wrist'] },
    { id: 'leftLeg', label: 'Left Leg (Back)', zones: ['Hamstring', 'Knee Back', 'Calf', 'Heel'] },
    { id: 'rightLeg', label: 'Right Leg (Back)', zones: ['Hamstring', 'Knee Back', 'Calf', 'Heel'] },
];

// ─── Clickable region (invisible unless active) ──────────────────────────
function Region({ d, name, selected, onSelect }) {
    const isActive = selected === name;
    return (
        <path
            d={d}
            fill={isActive ? 'rgba(239,68,68,0.2)' : 'transparent'}
            stroke={isActive ? '#ef4444' : 'transparent'}
            strokeWidth={isActive ? 1.5 : 0}
            style={{
                cursor: 'pointer',
                filter: isActive ? 'drop-shadow(0 0 6px rgba(239,68,68,0.5))' : 'none',
                transition: 'all 0.25s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(isActive ? null : name); }}
        />
    );
}

// ─── Front view ───────────────────────────────────────────────────────────
function FrontBody({ selected, onSelect }) {
    return (
        <div className="relative" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
                src={anatomyFront}
                alt="Body Front"
                style={{
                    height: '100%', width: 'auto', objectFit: 'contain',
                    pointerEvents: 'none', opacity: 0.95,
                    filter: 'brightness(1.05) contrast(1.02)',
                }}
            />
            {/* SVG overlay — matches the image layout */}
            <svg
                viewBox="0 0 200 420"
                preserveAspectRatio="xMidYMid meet"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
            >
                <Region name="head" selected={selected} onSelect={onSelect}
                    d="M100 12 C84 12 73 25 73 40 C73 56 84 68 100 68 C116 68 127 56 127 40 C127 25 116 12 100 12 Z" />
                <Region name="neck" selected={selected} onSelect={onSelect}
                    d="M91 68 L91 82 Q100 88 109 82 L109 68 Q100 65 91 68 Z" />
                <Region name="chest" selected={selected} onSelect={onSelect}
                    d="M62 86 C56 90 52 98 52 112 L52 172 L100 176 L148 172 L148 112 C148 98 144 90 138 86 Z" />
                <Region name="abdomen" selected={selected} onSelect={onSelect}
                    d="M56 172 L56 220 Q100 230 144 220 L144 172 L100 176 Z" />
                <Region name="pelvis" selected={selected} onSelect={onSelect}
                    d="M62 220 L64 248 Q100 258 136 248 L138 220 Q100 230 62 220 Z" />
                <Region name="leftArm" selected={selected} onSelect={onSelect}
                    d="M52 92 C46 95 38 102 35 114 L28 170 C28 178 32 184 38 184 L48 184 L55 136 L57 96 Z" />
                <Region name="rightArm" selected={selected} onSelect={onSelect}
                    d="M148 92 C154 95 162 102 165 114 L172 170 C172 178 168 184 162 184 L152 184 L145 136 L143 96 Z" />
                <Region name="leftLeg" selected={selected} onSelect={onSelect}
                    d="M66 248 L60 310 L56 370 C56 378 62 386 72 386 L82 386 L84 310 L86 252 Q76 256 66 248 Z" />
                <Region name="rightLeg" selected={selected} onSelect={onSelect}
                    d="M134 248 L140 310 L144 370 C144 378 138 386 128 386 L118 386 L116 310 L114 252 Q124 256 134 248 Z" />
            </svg>
        </div>
    );
}

// ─── Back view ────────────────────────────────────────────────────────────
function BackBody({ selected, onSelect }) {
    return (
        <div className="relative" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
                src={anatomyBack}
                alt="Body Back"
                style={{
                    height: '100%', width: 'auto', objectFit: 'contain',
                    pointerEvents: 'none', opacity: 0.95,
                    filter: 'brightness(1.05) contrast(1.02)',
                }}
            />
            <svg
                viewBox="0 0 200 420"
                preserveAspectRatio="xMidYMid meet"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}
            >
                <Region name="head" selected={selected} onSelect={onSelect}
                    d="M100 12 C84 12 73 25 73 40 C73 56 84 68 100 68 C116 68 127 56 127 40 C127 25 116 12 100 12 Z" />
                <Region name="upperBack" selected={selected} onSelect={onSelect}
                    d="M62 86 C56 90 52 98 52 138 L148 138 L148 98 C144 90 138 86 138 86 Z" />
                <Region name="midBack" selected={selected} onSelect={onSelect}
                    d="M52 138 L52 182 L148 182 L148 138 Z" />
                <Region name="lowerBack" selected={selected} onSelect={onSelect}
                    d="M56 182 L56 220 Q100 230 144 220 L144 182 Z" />
                <Region name="gluteal" selected={selected} onSelect={onSelect}
                    d="M62 220 L64 250 Q100 262 136 250 L138 220 Q100 230 62 220 Z" />
                <Region name="leftArm" selected={selected} onSelect={onSelect}
                    d="M52 92 C46 95 38 102 35 114 L28 170 C28 178 32 184 38 184 L48 184 L55 136 L57 96 Z" />
                <Region name="rightArm" selected={selected} onSelect={onSelect}
                    d="M148 92 C154 95 162 102 165 114 L172 170 C172 178 168 184 162 184 L152 184 L145 136 L143 96 Z" />
                <Region name="leftLeg" selected={selected} onSelect={onSelect}
                    d="M66 250 L60 310 L56 370 C56 378 62 386 72 386 L82 386 L84 310 L86 254 Q76 258 66 250 Z" />
                <Region name="rightLeg" selected={selected} onSelect={onSelect}
                    d="M134 250 L140 310 L144 370 C144 378 138 386 128 386 L118 386 L116 310 L114 254 Q124 258 134 250 Z" />
            </svg>
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────
export default function BodySelector({ selectedPart, setSelectedPart, bodyZone, setBodyZone }) {
    const [view, setView] = useState('front');

    const bodyParts = view === 'front' ? BODY_PARTS_FRONT : BODY_PARTS_BACK;
    const partData = bodyParts.find(p => p.id === selectedPart);

    const handleSelect = (id) => {
        setSelectedPart(id);
        setBodyZone(null);
    };

    return (
        <div className="flex flex-col gap-4">
            {/* Toggle */}
            <div className="flex justify-center gap-1 p-1 bg-gray-50 rounded-2xl self-center border border-gray-100 shadow-sm">
                {['front', 'back'].map(v => (
                    <button
                        key={v}
                        onClick={() => { setView(v); setSelectedPart(null); setBodyZone(null); }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize
                            ${view === v
                                ? 'bg-white shadow-md text-green-600'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {v === 'front' ? 'Front' : 'Back'}
                    </button>
                ))}
            </div>

            {/* Body Display — image fills container */}
            <div
                style={{
                    width: '100%',
                    height: '420px',
                    background: 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)',
                    borderRadius: '1.5rem',
                    overflow: 'hidden',
                    position: 'relative',
                    border: '1px solid #f1f5f9',
                }}
            >
                <motion.div
                    key={view}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ width: '100%', height: '100%' }}
                >
                    {view === 'front'
                        ? <FrontBody selected={selectedPart} onSelect={handleSelect} />
                        : <BackBody selected={selectedPart} onSelect={handleSelect} />
                    }
                </motion.div>
            </div>

            {/* Hints & labels */}
            {!selectedPart && (
                <p className="text-center text-xs text-green-600/60 font-medium animate-pulse">
                    Tap the body area where you have symptoms
                </p>
            )}

            {selectedPart && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-sm font-bold text-gray-800"
                >
                    Selected: <span className="text-green-600">{partData?.label}</span>
                </motion.p>
            )}

            {/* Zone chips */}
            {partData && (
                <motion.div
                    key={selectedPart}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-wrap gap-2 justify-center"
                >
                    {partData.zones.map(z => (
                        <button
                            key={z}
                            onClick={() => setBodyZone(z)}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold border transition-all ${bodyZone === z
                                ? 'bg-green-500 border-green-500 text-white shadow-lg scale-105'
                                : 'bg-white border-gray-100 text-gray-600 hover:border-green-200 hover:shadow-sm'
                                }`}
                        >
                            {z}
                        </button>
                    ))}
                </motion.div>
            )}
        </div>
    );
}