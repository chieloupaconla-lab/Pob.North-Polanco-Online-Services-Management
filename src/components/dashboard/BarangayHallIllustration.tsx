import React from "react";

interface BarangayHallIllustrationProps {
  className?: string;
}

export default function BarangayHallIllustration({
  className = "w-full h-full",
}: BarangayHallIllustrationProps) {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 400 180"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-right object-cover opacity-90"
        preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EDE9FE" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#DDD6FE" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6D3FE7" />
            <stop offset="100%" stopColor="#4C1D95" />
          </linearGradient>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F3F4F6" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D3FE7" />
          </linearGradient>
        </defs>

        {/* Soft Background Sky */}
        <rect width="400" height="180" fill="url(#skyGrad)" />

        {/* Distant Clouds */}
        <ellipse cx="80" cy="35" rx="30" ry="12" fill="#FFFFFF" opacity="0.6" />
        <ellipse cx="105" cy="30" rx="20" ry="10" fill="#FFFFFF" opacity="0.6" />
        <ellipse cx="280" cy="25" rx="40" ry="14" fill="#FFFFFF" opacity="0.5" />

        {/* Trees in Background */}
        <path d="M40 180 C40 130 65 110 85 110 C105 110 130 130 130 180 Z" fill="#10B981" opacity="0.2" />
        <path d="M290 180 C290 120 320 100 345 100 C370 100 400 120 400 180 Z" fill="#059669" opacity="0.25" />

        {/* Main Barangay Hall Building Structure */}
        {/* Base Foundation */}
        <rect x="120" y="150" width="220" height="30" fill="#E5E7EB" />
        <rect x="110" y="172" width="240" height="8" fill="#D1D5DB" />

        {/* Main Columns / Walls */}
        <rect x="130" y="80" width="200" height="70" fill="url(#wallGrad)" rx="2" stroke="#E5E7EB" />

        {/* Entrance Portico / Pillars */}
        <rect x="180" y="95" width="100" height="55" fill="#F9FAFB" />
        <rect x="188" y="100" width="10" height="50" fill="#E5E7EB" />
        <rect x="210" y="100" width="10" height="50" fill="#E5E7EB" />
        <rect x="240" y="100" width="10" height="50" fill="#E5E7EB" />
        <rect x="262" y="100" width="10" height="50" fill="#E5E7EB" />

        {/* Main Roof */}
        <polygon points="110,80 230,45 350,80" fill="url(#roofGrad)" />
        <polygon points="120,80 230,48 340,80" fill="#7C3AED" opacity="0.3" />

        {/* Portico Triangular Pediment */}
        <polygon points="170,95 230,70 290,95" fill="url(#accentGrad)" />

        {/* Seal Emblem on Pediment */}
        <circle cx="230" cy="84" r="6" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="1" />

        {/* Signboard */}
        <rect x="160" y="102" width="140" height="12" fill="#1E1B4B" rx="3" />
        <text x="230" y="110" fill="#FFFFFF" fontSize="6.5" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
          BARANGAY POBLACION NORTH
        </text>

        {/* Glass Windows */}
        <rect x="142" y="110" width="24" height="28" rx="2" fill="#93C5FD" opacity="0.8" />
        <line x1="154" y1="110" x2="154" y2="138" stroke="#FFFFFF" strokeWidth="1" />
        <line x1="142" y1="124" x2="166" y2="124" stroke="#FFFFFF" strokeWidth="1" />

        <rect x="294" y="110" width="24" height="28" rx="2" fill="#93C5FD" opacity="0.8" />
        <line x1="306" y1="110" x2="306" y2="138" stroke="#FFFFFF" strokeWidth="1" />
        <line x1="294" y1="124" x2="318" y2="124" stroke="#FFFFFF" strokeWidth="1" />

        {/* Main Double Doors */}
        <rect x="216" y="122" width="28" height="28" fill="#4B5563" rx="1" />
        <rect x="218" y="124" width="11" height="26" fill="#6B7280" />
        <rect x="231" y="124" width="11" height="26" fill="#6B7280" />
        <circle cx="227" cy="137" r="1" fill="#F59E0B" />
        <circle cx="233" cy="137" r="1" fill="#F59E0B" />

        {/* Flag Pole with Philippine Flag */}
        <line x1="100" y1="40" x2="100" y2="175" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="100" cy="39" r="2" fill="#F59E0B" />

        {/* Flag SVG Group */}
        <g transform="translate(100, 42)">
          {/* Blue Top */}
          <rect x="0" y="0" width="28" height="8" fill="#1D4ED8" />
          {/* Red Bottom */}
          <rect x="0" y="8" width="28" height="8" fill="#DC2626" />
          {/* White Triangle */}
          <polygon points="0,0 12,8 0,16" fill="#FFFFFF" />
          {/* Yellow Sun */}
          <circle cx="4" cy="8" r="2" fill="#F59E0B" />
        </g>

        {/* Front Garden Grass & Flowers */}
        <ellipse cx="230" cy="170" rx="120" ry="8" fill="#34D399" opacity="0.7" />
        <circle cx="150" cy="168" r="2.5" fill="#F43F5E" />
        <circle cx="158" cy="170" r="2" fill="#FBBF24" />
        <circle cx="310" cy="168" r="2.5" fill="#A855F7" />
        <circle cx="318" cy="170" r="2" fill="#3B82F6" />
      </svg>
    </div>
  );
}
