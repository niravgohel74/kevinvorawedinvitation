"use client";
import React from "react";

interface WaxSealProps {
  monogram?: string;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function WaxSeal({
  monogram = "M & A",
  onClick,
  size = "md",
  className = "",
}: WaxSealProps) {
  const sizeMap = {
    sm: "w-14 h-14 text-xs",
    md: "w-20 h-20 text-sm",
    lg: "w-28 h-28 text-base",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Wax seal button"
      className={`group relative flex items-center justify-center rounded-full transition-transform duration-500 ease-out hover:scale-105 active:scale-95 focus:outline-none ${sizeMap[size]} ${className}`}
    >
      {/* Outer organic wax ridge */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#8C3A3A] via-[#6B2020] to-[#450F0F] shadow-[0_8px_25px_rgba(107,32,32,0.45)] ring-2 ring-[#C9B38C]/30" />

      {/* Wax drip irregular contour highlight */}
      <div className="absolute inset-[3px] rounded-full border border-[#D4AF37]/30 bg-gradient-to-tl from-[#5A1818] via-[#7B2424] to-[#993A3A]" />

      {/* Inner embossed stamp circle */}
      <div className="relative flex h-4/5 w-4/5 items-center justify-center rounded-full border border-[#C9B38C]/40 bg-[#521414] shadow-inner">
        {/* Monogram or Icon */}
        <span className="font-editorial-serif tracking-widest text-[#E9D8B4] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-semibold select-none group-hover:text-white transition-colors">
          {monogram}
        </span>
      </div>

      {/* Gold leaf sparkle accents */}
      <span className="absolute top-1 right-2 w-1.5 h-1.5 rounded-full bg-[#E9D8B4] opacity-75 blur-[0.5px]" />
      <span className="absolute bottom-2 left-3 w-1 h-1 rounded-full bg-[#C9B38C] opacity-60" />
    </button>
  );
}
