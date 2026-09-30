import React from "react";

interface GanpatiLineArtProps {
  className?: string;
  size?: number;
}

export function GanpatiLineArt({ className = "w-12 h-12 text-[#9E814D]", size = 52 }: GanpatiLineArtProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block ${className}`}
      aria-label="Lord Ganesha Motif"
    >
      {/* Auspicious Red Kumkum / Tilak Dot */}
      <circle cx="50" cy="30" r="2" fill="#A83224" />

      {/* Sacred Crown (Mukut) & Kalash pinnacle */}
      <circle cx="50" cy="10" r="1.75" fill="currentColor" />
      <path
        d="M50 12V17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Crown arch layers */}
      <path
        d="M45 18C47 16 53 16 55 18"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M42 22C46 19.5 54 19.5 58 22"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M38 26C44 23 56 23 62 26"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />

      {/* Forehead Tilak (Trishul/Namam design) */}
      <path
        d="M50 26V37"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M45 28C47 32 50 34 50 34C50 34 53 32 55 28"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Left Ear - Majestic royal curve */}
      <path
        d="M40 26C28 26 18 31 16 43C14 55 25 61 34 58C37 57 40 52 41 47"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Left Ear Line */}
      <path
        d="M23 42C22 48 27 52 32 51"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="1.5 2.5"
      />

      {/* Right Ear - Symmetrical flourish */}
      <path
        d="M60 26C72 26 82 31 84 43C86 55 75 61 66 58C63 57 60 52 59 47"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Right Ear Line */}
      <path
        d="M77 42C78 48 73 52 68 51"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeDasharray="1.5 2.5"
      />

      {/* Meditative Divine Eyes */}
      <path
        d="M38 39C40 41 43 41 45 39"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M55 39C57 41 60 41 62 39"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Tusks: Right Tusk (Ekdanta) and Left broken tusk */}
      <path
        d="M58 49H66L58 53"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M42 49H37"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* Central Sweeping Divine Trunk (Sond) */}
      <path
        d="M48 42C49 50 48 60 44 68C41 75 43 83 49 86C56 89 64 85 65 77C66 70 59 66 54 69C50 71 52 76 56 77C58 77.5 60 76 60 74"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Trunk Bell / Ornament Rings */}
      <path
        d="M44 61C47 62 50 61 52 59"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
      <path
        d="M42 66C45 67 48 66 50 64"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* Modak (Divine Sweet) blessing */}
      <circle cx="69" cy="72" r="2.8" fill="currentColor" fillOpacity="0.9" />
      <circle cx="69" cy="67.5" r="1.2" fill="#D4AF37" />
    </svg>
  );
}
