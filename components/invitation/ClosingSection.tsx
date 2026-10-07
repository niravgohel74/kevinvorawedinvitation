"use client";
import React from "react";
import Link from "next/link";
import { WeddingDetails } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { RichText } from "@/components/ui/RichText";
import { Lock } from "lucide-react";

interface ClosingSectionProps {
  wedding: WeddingDetails;
}

export function ClosingSection({ wedding }: ClosingSectionProps) {
  const formattedDate = React.useMemo(() => {
    try {
      if (!wedding.weddingDate) return "DECEMBER 2026";
      const d = new Date(wedding.weddingDate);
      if (isNaN(d.getTime())) return wedding.weddingDate.toUpperCase();
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).toUpperCase();
    } catch {
      return wedding.weddingDate;
    }
  }, [wedding.weddingDate]);

  return (
    <footer className="relative py-28 sm:py-36 bg-[#161514] text-[#FAF8F5] overflow-hidden text-center">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#C9B38C]/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-6 space-y-6">
        <BotanicalMotif variant="ring" className="w-10 h-10 mx-auto text-[#C9B38C]" />

        <div className="space-y-2">
          <p className="text-[11px] sm:text-xs font-medium tracking-[0.4em] uppercase text-[#C9B38C]">
            Forever &amp; Always
          </p>
          <h2 className="font-editorial-serif text-3xl sm:text-5xl font-light tracking-wide text-white leading-tight">
            And So, Our Next Chapter Begins
          </h2>
        </div>

        <div className="py-2">
          <BotanicalMotif variant="divider" />
        </div>

        <div className="space-y-1">
          <h3 className="font-editorial-serif text-4xl sm:text-5xl text-[#E8DEC8]">
            <RichText content={wedding.groomName} /> &amp; <RichText content={wedding.brideName} />
          </h3>
          <p className="text-xs sm:text-sm tracking-[0.25em] text-[#9E814D] uppercase font-light pt-1">
            {formattedDate} • {wedding.city}
          </p>
        </div>

        <p className="text-sm sm:text-base text-[#BFB5A3] font-light italic max-w-md mx-auto pt-4">
          &ldquo;<RichText content={wedding.closingMessage || "Thank you for being part of our story and blessing our new beginning."} />&rdquo;
        </p>

        {/* Discreet Host Access Link */}
        <div className="pt-16 sm:pt-20 border-t border-[#C9B38C]/15 flex items-center justify-between text-xs text-[#736B63]">
          <p className="text-[11px] tracking-wider text-[#A8A096]">
            Crafted with love for <RichText content={wedding.groomName} /> &amp; <RichText content={wedding.brideName} />
          </p>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase text-[#C9B38C] hover:text-white transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>Private Access</span>
          </Link>
        </div>
      </div>
    </footer>
  );
}
