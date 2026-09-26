import React from "react";

interface CommunityIllustrationProps {
  className?: string;
}

export default function CommunityIllustration({
  className = "w-full h-full",
}: CommunityIllustrationProps) {
  return (
    <div className={`relative overflow-hidden pointer-events-none select-none ${className}`}>
      <svg
        viewBox="0 0 260 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="ctaBuilding" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D3FE7" />
          </linearGradient>
          <linearGradient id="ctaBuilding2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>

        {/* Ground */}
        <ellipse cx="130" cy="124" rx="118" ry="10" fill="#6D3FE7" opacity="0.08" />

        {/* Back Building Left */}
        <rect x="18" y="54" width="46" height="66" rx="3" fill="url(#ctaBuilding2)" opacity="0.55" />
        <rect x="26" y="62" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />
        <rect x="41" y="62" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />
        <rect x="26" y="80" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />
        <rect x="41" y="80" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />
        <rect x="34" y="100" width="14" height="20" rx="1.5" fill="#FFFFFF" opacity="0.85" />

        {/* Back Building Right */}
        <rect x="196" y="66" width="46" height="54" rx="3" fill="url(#ctaBuilding2)" opacity="0.55" />
        <rect x="204" y="74" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />
        <rect x="219" y="74" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />
        <rect x="204" y="92" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />
        <rect x="219" y="92" width="9" height="9" rx="1.5" fill="#FFFFFF" opacity="0.7" />

        {/* Barangay Hall Center */}
        <rect x="86" y="60" width="88" height="60" rx="4" fill="url(#ctaBuilding)" />
        <polygon points="78,60 130,34 182,60" fill="#4C1D95" />
        <polygon points="86,60 130,39 174,60" fill="#7C3AED" opacity="0.55" />
        <rect x="108" y="76" width="44" height="14" rx="2" fill="#1E1B4B" />
        <rect x="118" y="98" width="24" height="22" rx="1.5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="137" cy="109" r="1.5" fill="#6D3FE7" />
        <rect x="94" y="82" width="8" height="12" rx="1.5" fill="#FFFFFF" opacity="0.75" />
        <rect x="158" y="82" width="8" height="12" rx="1.5" fill="#FFFFFF" opacity="0.75" />
        <circle cx="130" cy="52" r="4" fill="#FBBF24" />
        <line x1="130" y1="34" x2="130" y2="26" stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round" />

        {/* People - Left Figure */}
        <circle cx="66" cy="96" r="7" fill="#F59E0B" />
        <path d="M56 126 C56 112 60 106 66 106 C72 106 76 112 76 126 Z" fill="#E96B73" />

        {/* People - Right Figure */}
        <circle cx="192" cy="96" r="7" fill="#FBBF24" />
        <path d="M182 126 C182 112 186 106 192 106 C198 106 202 112 202 126 Z" fill="#35B978" />

        {/* People - Center Figure */}
        <circle cx="130" cy="104" r="6.5" fill="#FCD34D" />
        <path d="M121 130 C121 118 125 113 130 113 C135 113 139 118 139 130 Z" fill="#4D8FEA" />

        {/* Small plants */}
        <circle cx="50" cy="120" r="4" fill="#35B978" opacity="0.7" />
        <circle cx="212" cy="120" r="4" fill="#35B978" opacity="0.7" />
        <circle cx="162" cy="122" r="3" fill="#35B978" opacity="0.6" />
        <circle cx="100" cy="122" r="3" fill="#35B978" opacity="0.6" />
      </svg>
    </div>
  );
}
