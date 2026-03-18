import { useState, useRef, forwardRef } from 'react';
import { motion } from 'framer-motion';
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

// SVG path data for each region (front + back share same paths for arms/legs)
const FRONT_PATHS = {
    head: "M100 12 C84 12 73 25 73 40 C73 56 84 68 100 68 C116 68 127 56 127 40 C127 25 116 12 100 12 Z",
    neck: "M91 68 L91 82 Q100 88 109 82 L109 68 Q100 65 91 68 Z",
    chest: "M62 86 C56 90 52 98 52 112 L52 172 L100 176 L148 172 L148 112 C148 98 144 90 138 86 Z",
    abdomen: "M56 172 L56 220 Q100 230 144 220 L144 172 L100 176 Z",
    pelvis: "M62 220 L64 248 Q100 258 136 248 L138 220 Q100 230 62 220 Z",
    leftArm: "M52 92 C46 95 38 102 35 114 L28 170 C28 178 32 184 38 184 L48 184 L55 136 L57 96 Z",
    rightArm: "M148 92 C154 95 162 102 165 114 L172 170 C172 178 168 184 162 184 L152 184 L145 136 L143 96 Z",
    leftLeg: "M66 248 L60 310 L56 370 C56 378 62 386 72 386 L82 386 L84 310 L86 252 Q76 256 66 248 Z",
    rightLeg: "M134 248 L140 310 L144 370 C144 378 138 386 128 386 L118 386 L116 310 L114 252 Q124 256 134 248 Z",
};

const BACK_PATHS = {
    head: "M100 12 C84 12 73 25 73 40 C73 56 84 68 100 68 C116 68 127 56 127 40 C127 25 116 12 100 12 Z",
    upperBack: "M62 86 C56 90 52 98 52 138 L148 138 L148 98 C144 90 138 86 138 86 Z",
    midBack: "M52 138 L52 182 L148 182 L148 138 Z",
    lowerBack: "M56 182 L56 220 Q100 230 144 220 L144 182 Z",
    gluteal: "M62 220 L64 250 Q100 262 136 250 L138 220 Q100 230 62 220 Z",
    leftArm: "M52 92 C46 95 38 102 35 114 L28 170 C28 178 32 184 38 184 L48 184 L55 136 L57 96 Z",
    rightArm: "M148 92 C154 95 162 102 165 114 L172 170 C172 178 168 184 162 184 L152 184 L145 136 L143 96 Z",
    leftLeg: "M66 250 L60 310 L56 370 C56 378 62 386 72 386 L82 386 L84 310 L86 254 Q76 258 66 250 Z",
    rightLeg: "M134 250 L140 310 L144 370 C144 378 138 386 128 386 L118 386 L116 310 L114 254 Q124 258 134 250 Z",
};

// ─── Clickable region (multi-select aware) ────────────────────────────────
function Region({ d, name, selectedParts, onToggle }) {
    const isActive = selectedParts.includes(name);
    return (
        <path
            d={d}
            fill={isActive ? 'rgba(239,68,68,0.25)' : 'transparent'}
            stroke={isActive ? '#ef4444' : 'transparent'}
            strokeWidth={isActive ? 2 : 0}
            style={{
                cursor: 'pointer',
                filter: isActive ? 'drop-shadow(0 0 8px rgba(239,68,68,0.6))' : 'none',
                transition: 'all 0.2s ease',
            }}
            onClick={(e) => { e.stopPropagation(); onToggle(name); }}
        />
    );
}

// ─── Body views (forward-ref for capture) ─────────────────────────────────
const FrontBody = forwardRef(function FrontBody({ selectedParts, onToggle }, ref) {
    return (
        <div ref={ref} className="relative" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)' }}>
            <img
                src={anatomyFront} alt="Body Front"
                style={{ height: '100%', width: 'auto', objectFit: 'contain', pointerEvents: 'none', opacity: 0.95, filter: 'brightness(1.05) contrast(1.02)' }}
            />
            <svg viewBox="0 0 200 420" preserveAspectRatio="xMidYMid meet"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
                {Object.entries(FRONT_PATHS).map(([id, d]) => (
                    <Region key={id} name={id} d={d} selectedParts={selectedParts} onToggle={onToggle} />
                ))}
            </svg>
        </div>
    );
});

const BackBody = forwardRef(function BackBody({ selectedParts, onToggle }, ref) {
    return (
        <div ref={ref} className="relative" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%)' }}>
            <img
                src={anatomyBack} alt="Body Back"
                style={{ height: '100%', width: 'auto', objectFit: 'contain', pointerEvents: 'none', opacity: 0.95, filter: 'brightness(1.05) contrast(1.02)' }}
            />
            <svg viewBox="0 0 200 420" preserveAspectRatio="xMidYMid meet"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10 }}>
                {Object.entries(BACK_PATHS).map(([id, d]) => (
                    <Region key={id} name={id} d={d} selectedParts={selectedParts} onToggle={onToggle} />
                ))}
            </svg>
        </div>
    );
});

// ─── Main Component ───────────────────────────────────────────────────────
// selectedParts: string[]  (array of selected region IDs)
// selectedZones: { [partId]: string[] }  (map of zones per part)
export default function BodySelector({ selectedParts, setSelectedParts, selectedZones, setSelectedZones, captureRef }) {
    const [view, setView] = useState('front');
    const frontRef = useRef(null);
    const backRef = useRef(null);

    // Expose the active view's ref to parent for html-to-image capture
    const activeRef = view === 'front' ? frontRef : backRef;
    if (captureRef) captureRef.current = activeRef.current;

    const bodyParts = view === 'front' ? BODY_PARTS_FRONT : BODY_PARTS_BACK;

    const handleTogglePart = (id) => {
        setSelectedParts(prev => {
            if (prev.includes(id)) {
                // Remove part and its zones
                const next = prev.filter(p => p !== id);
                setSelectedZones(z => { const copy = { ...z }; delete copy[id]; return copy; });
                return next;
            }
            return [...prev, id];
        });
    };

    const handleToggleZone = (partId, zone) => {
        setSelectedZones(prev => {
            const partZones = prev[partId] || [];
            const hasZone = partZones.includes(zone);
            return {
                ...prev,
                [partId]: hasZone ? partZones.filter(z => z !== zone) : [...partZones, zone]
            };
        });
    };

    const clearAll = () => {
        setSelectedParts([]);
        setSelectedZones({});
    };

    // All selected parts visible in current view
    const visiblePartIds = bodyParts.map(p => p.id);
    const visibleSelected = selectedParts.filter(id => visiblePartIds.includes(id));
    const totalSelected = selectedParts.length;

    return (
        <div className="flex flex-col gap-4">
            {/* Toggle + clear */}
            <div className="flex items-center justify-between">
                <div className="flex gap-1 p-1 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                    {['front', 'back'].map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all capitalize
                                ${view === v ? 'bg-white shadow-md text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {v === 'front' ? 'Front' : 'Back'}
                        </button>
                    ))}
                </div>
                {totalSelected > 0 && (
                    <button onClick={clearAll}
                        className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors px-3 py-1.5 bg-red-50 rounded-xl border border-red-100">
                        Clear all ({totalSelected})
                    </button>
                )}
            </div>

            {/* Body Display */}
            <div style={{ width: '100%', height: '400px', borderRadius: '1.5rem', overflow: 'hidden', position: 'relative', border: '1px solid #f1f5f9' }}>
                <motion.div key={view} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }} style={{ width: '100%', height: '100%' }}>
                    {view === 'front'
                        ? <FrontBody ref={frontRef} selectedParts={selectedParts} onToggle={handleTogglePart} />
                        : <BackBody ref={backRef} selectedParts={selectedParts} onToggle={handleTogglePart} />
                    }
                </motion.div>
            </div>

            {/* Hint */}
            {totalSelected === 0 && (
                <p className="text-center text-xs text-green-600/60 font-medium animate-pulse">
                    Tap body areas where you have symptoms (select multiple)
                </p>
            )}

            {/* Selected parts summary badges */}
            {totalSelected > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 justify-center">
                    {selectedParts.map(partId => {
                        const allParts = [...BODY_PARTS_FRONT, ...BODY_PARTS_BACK];
                        const part = allParts.find(p => p.id === partId);
                        return (
                            <span key={partId}
                                className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                📍 {part?.label || partId}
                                <button onClick={() => handleTogglePart(partId)} className="ml-1 text-red-400 hover:text-red-700 font-black">✕</button>
                            </span>
                        );
                    })}
                </motion.div>
            )}

            {/* Zone picker — shows zones for all visible selected parts */}
            {visibleSelected.length > 0 && (
                <div className="space-y-3">
                    {visibleSelected.map(partId => {
                        const part = bodyParts.find(p => p.id === partId);
                        if (!part) return null;
                        const partZones = selectedZones[partId] || [];
                        return (
                            <motion.div key={partId} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}>
                                <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2 pl-1">
                                    {part.label} — specific area
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {part.zones.map(z => (
                                        <button
                                            key={z}
                                            onClick={() => handleToggleZone(partId, z)}
                                            className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all ${partZones.includes(z)
                                                ? 'bg-green-500 border-green-500 text-white shadow-lg scale-105'
                                                : 'bg-white border-gray-100 text-gray-600 hover:border-green-200 hover:shadow-sm'}`}
                                        >
                                            {z}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}