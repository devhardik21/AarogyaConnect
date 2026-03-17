import React from 'react';
import anatomyFront from '../assets/human_anatomy_front.png';

// ─── Body Region (invisible unless active) ──────────────────────────────
function BodyRegion({ d, name, activePart, setActivePart }) {
    const isActive = activePart === name;
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
            onClick={(e) => {
                e.stopPropagation();
                setActivePart(isActive ? null : name);
            }}
        />
    );
}

// ─── Main 2D Realistic Human Model ──────────────────────────────────────
export default function HumanModel3D({ activePart, setActivePart }) {
    return (
        <div
            style={{
                width: '100%',
                height: '45vh',
                background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: '0 0 1.5rem 1.5rem',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.05)'
            }}
        >
            {/* Anatomy Image — fills container vertically */}
            <img
                src={anatomyFront}
                alt="Human Anatomy"
                style={{
                    height: '95%',
                    width: 'auto',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    opacity: 0.95,
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.1)) brightness(1.02)',
                }}
            />

            {/* Interactive SVG Overlay */}
            <svg
                viewBox="0 0 200 420"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%', height: '100%',
                    zIndex: 10,
                }}
            >
                <BodyRegion name="Head" activePart={activePart} setActivePart={setActivePart}
                    d="M100 12 C84 12 73 25 73 40 C73 56 84 68 100 68 C116 68 127 56 127 40 C127 25 116 12 100 12 Z" />
                <BodyRegion name="Neck" activePart={activePart} setActivePart={setActivePart}
                    d="M91 68 L91 82 Q100 88 109 82 L109 68 Q100 65 91 68 Z" />
                <BodyRegion name="Chest" activePart={activePart} setActivePart={setActivePart}
                    d="M62 86 C56 90 52 98 52 112 L52 172 L100 176 L148 172 L148 112 C148 98 144 90 138 86 Z" />
                <BodyRegion name="Abdomen" activePart={activePart} setActivePart={setActivePart}
                    d="M56 172 L56 220 Q100 230 144 220 L144 172 L100 176 Z" />
                <BodyRegion name="Pelvis" activePart={activePart} setActivePart={setActivePart}
                    d="M62 220 L64 248 Q100 258 136 248 L138 220 Q100 230 62 220 Z" />
                <BodyRegion name="LeftArm" activePart={activePart} setActivePart={setActivePart}
                    d="M52 92 C46 95 38 102 35 114 L28 170 C28 178 32 184 38 184 L48 184 L55 136 L57 96 Z" />
                <BodyRegion name="RightArm" activePart={activePart} setActivePart={setActivePart}
                    d="M148 92 C154 95 162 102 165 114 L172 170 C172 178 168 184 162 184 L152 184 L145 136 L143 96 Z" />
                <BodyRegion name="LeftLeg" activePart={activePart} setActivePart={setActivePart}
                    d="M66 248 L60 310 L56 370 C56 378 62 386 72 386 L82 386 L84 310 L86 252 Q76 256 66 248 Z" />
                <BodyRegion name="RightLeg" activePart={activePart} setActivePart={setActivePart}
                    d="M134 248 L140 310 L144 370 C144 378 138 386 128 386 L118 386 L116 310 L114 252 Q124 256 134 248 Z" />
            </svg>

            {/* Float Label */}
            {activePart && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-1.5 rounded-full border border-red-200 shadow-sm flex items-center gap-2"
                    style={{ zIndex: 20 }}
                >
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tight">{activePart}</span>
                </div>
            )}
        </div>
    );
}