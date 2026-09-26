import React from "react";

interface BarangaySealLogoProps {
  className?: string;
  size?: number;
}

export default function BarangaySealLogo({
  className = "w-10 h-10",
  size = 40,
}: BarangaySealLogoProps) {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-xs"
      >
        {/* Outer Ring */}
        <circle cx="50" cy="50" r="48" fill="#5B21B6" stroke="#C084FC" strokeWidth="2.5" />
        
        {/* Inner Ring with Gold Accent */}
        <circle cx="50" cy="50" r="42" fill="#6D3FE7" stroke="#FBBF24" strokeWidth="1.5" strokeDasharray="3 1.5" />
        
        {/* Center Shield Container */}
        <circle cx="50" cy="50" r="35" fill="#1E1B4B" />

        {/* Sun Rays Background */}
        <path
          d="M50 18 L50 25 M50 75 L50 82 M18 50 L25 50 M75 50 L82 50 M27 27 L32 32 M68 68 L73 73 M27 73 L32 68 M68 32 L73 27"
          stroke="#F59E0B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Central Shield */}
        <path
          d="M36 34 C36 34 50 30 50 30 C50 30 64 34 64 34 V52 C64 62 50 70 50 70 C50 70 36 62 36 52 V34 Z"
          fill="#312E81"
          stroke="#F59E0B"
          strokeWidth="1.5"
        />

        {/* Philippine Colors Division on Shield */}
        <path d="M37 35 H63 V48 H37 Z" fill="#1D4ED8" opacity="0.6" />
        <path d="M37 48 H63 V61 C63 61 50 68 50 68 C50 68 37 61 37 61 V48 Z" fill="#DC2626" opacity="0.6" />

        {/* Barangay Hall Silhouette */}
        <path
          d="M42 56 V46 L50 41 L58 46 V56 H42 Z"
          fill="#FFFFFF"
        />
        <rect x="47" y="50" width="6" height="6" fill="#F59E0B" />
        <path d="M50 37 V41" stroke="#F59E0B" strokeWidth="1.5" />
        <circle cx="50" cy="36" r="1.5" fill="#EF4444" />

        {/* Rice Stalks / Laurel Accents */}
        <path
          d="M26 50 C26 62 34 72 45 74 M74 50 C74 62 66 72 55 74"
          stroke="#34D399"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* 3 Stars representing Luzon, Visayas, Mindanao */}
        <polygon points="50,22 51.5,25 55,25 52,27 53,30 50,28 47,30 48,27 45,25 48.5,25" fill="#FBBF24" />
        <polygon points="23,45 24,47 26,47 24.5,48.5 25,50.5 23,49 21,50.5 21.5,48.5 20,47 22,47" fill="#FBBF24" />
        <polygon points="77,45 78,47 80,47 78.5,48.5 79,50.5 77,49 75,50.5 75.5,48.5 74,47 76,47" fill="#FBBF24" />
      </svg>
    </div>
  );
}
