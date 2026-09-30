"use client";
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { WeddingDetails } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { motion, useInView } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import confetti from "canvas-confetti";

interface DateRevealSectionProps {
  wedding: WeddingDetails;
  className?: string;
}

export function DateRevealSection({ wedding, className = "" }: DateRevealSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isInView = useInView(containerRef, { once: false, margin: "-120px" });

  const [isManuallyToggled, setIsManuallyToggled] = useState<boolean | null>(null);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  // Scroll or user toggled reveal
  const isRevealed = isManuallyToggled !== null ? isManuallyToggled : isInView;

  // Extract wedding date parts
  const dateInfo = useMemo(() => {
    try {
      const d = wedding.weddingDate ? new Date(wedding.weddingDate) : new Date("2026-12-18");
      const dayNum = String(d.getDate()).padStart(2, "0");
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      const monthName = d.toLocaleDateString("en-US", { month: "long" }).toUpperCase();
      const yearNum = String(d.getFullYear());
      const weekday = d.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

      return {
        day: isNaN(d.getTime()) ? "18" : dayNum,
        month: isNaN(d.getTime()) ? "DECEMBER" : monthName,
        monthNum: isNaN(d.getTime()) ? "12" : monthNum,
        year: isNaN(d.getTime()) ? "2026" : yearNum,
        weekday: isNaN(d.getTime()) ? "FRIDAY" : weekday,
      };
    } catch {
      return {
        day: "18",
        month: "DECEMBER",
        monthNum: "12",
        year: "2026",
        weekday: "FRIDAY",
      };
    }
  }, [wedding.weddingDate]);

  // Elegant golden petal celebration
  const triggerCelebration = useCallback(() => {
    try {
      // Golden luxury particles
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.65 },
        colors: ["#D4AF37", "#C9B38C", "#FFF3D6", "#9E814D", "#B38B3F"],
        disableForReducedMotion: true,
      });
      // Warm romantic rose petal particles
      confetti({
        particleCount: 25,
        spread: 90,
        origin: { y: 0.62 },
        colors: ["#C53030", "#9B2C2C", "#E53E3E"],
        disableForReducedMotion: true,
      });
    } catch {}
  }, []);

  // Automatic celebration when scrolled into view
  useEffect(() => {
    if (isRevealed && !hasCelebrated) {
      setHasCelebrated(true);
      triggerCelebration();
    }
    if (!isRevealed) {
      setHasCelebrated(false);
    }
  }, [isRevealed, hasCelebrated, triggerCelebration]);

  const toggleReveal = () => {
    setIsManuallyToggled(!isRevealed);
    if (!isRevealed) {
      triggerCelebration();
    }
  };

  // Google Calendar link
  const googleCalendarUrl = useMemo(() => {
    const title = encodeURIComponent(`Wedding: ${wedding.groomName} & ${wedding.brideName}`);
    const details = encodeURIComponent(
      `Celebrating the wedding of ${wedding.groomName} & ${wedding.brideName} at ${wedding.location}, ${wedding.city}.`
    );
    const location = encodeURIComponent(`${wedding.location}, ${wedding.city}`);
    const dates = "20261218T110000Z/20261218T180000Z";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }, [wedding]);

  return (
    <section
      ref={containerRef}
      className={`relative min-h-[90vh] py-24 sm:py-32 flex items-center justify-center overflow-hidden bg-[#151413] text-[#FAF8F5] ${className}`}
    >
      {/* Background Ambient Lighting & Palace Architecture Depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#28231D] via-[#171615] to-[#0E0D0C] opacity-95" />
      <div className="absolute inset-0 bg-grain opacity-25 pointer-events-none" />

      {/* Floating Golden Aura Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#C9B38C]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#C53030]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Outer Royal Jharokha / Mandap Frame */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">
        {/* Section Header Flourish */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="space-y-3 mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-1.5 rounded-full border border-[#C9B38C]/40 bg-[#1D1B18]/80 backdrop-blur-md shadow-inner">
            <span className="text-[#D4AF37] text-xs">✦</span>
            <span className="text-[11px] sm:text-xs font-semibold tracking-[0.35em] text-[#E5D7B7] uppercase">
              Shubh Vivah &bull; The Royal Union
            </span>
            <span className="text-[#D4AF37] text-xs">✦</span>
          </div>

          <h2 className="font-editorial-serif text-4xl sm:text-6xl md:text-7xl font-normal tracking-wide text-[#FFFFFF] drop-shadow-lg">
            Save Our Date
          </h2>

          <div className="py-2 flex items-center justify-center">
            <BotanicalMotif variant="mandap" className="w-28 sm:w-36 text-[#C9B38C]" />
          </div>

          <p className="max-w-xl mx-auto text-xs sm:text-sm font-serif italic text-[#CFC5B2] leading-relaxed">
            &ldquo;Two lives, two hearts, joined together in friendship, united forever in love. We warmly invite you to celebrate our union in the royal city of Udaipur.&rdquo;
          </p>
        </motion.div>

        {/* --- ROYAL PALACE DATE CARD (UNVEILS ON SCROLL) --- */}
        <div className="relative w-full max-w-3xl flex flex-col items-center">
          {/* Main Royal Card Chamber */}
          <div
            onClick={toggleReveal}
            className="relative w-full rounded-3xl bg-[#1B1917]/90 border border-[#C9B38C]/45 p-6 sm:p-10 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl overflow-hidden cursor-pointer group select-none"
            title="Scroll or click to unveil"
          >
            {/* Subtle Inner Gold Hairline Trim */}
            <div className="absolute inset-2 sm:inset-3 rounded-2xl border border-[#C9B38C]/25 pointer-events-none" />

            {/* Corner Botanical Motifs */}
            <BotanicalMotif variant="corner" className="absolute top-4 left-4 w-6 h-6 text-[#C9B38C]/60 pointer-events-none" />
            <BotanicalMotif variant="corner" className="absolute top-4 right-4 w-6 h-6 text-[#C9B38C]/60 -scale-x-100 pointer-events-none" />
            <BotanicalMotif variant="corner" className="absolute bottom-4 left-4 w-6 h-6 text-[#C9B38C]/60 -scale-y-100 pointer-events-none" />
            <BotanicalMotif variant="corner" className="absolute bottom-4 right-4 w-6 h-6 text-[#C9B38C]/60 -scale-x-100 -scale-y-100 pointer-events-none" />

            {/* Royal Palace Jharokha Cusped Arch Backdrop (Replaces astrology ring) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
              <svg
                viewBox="0 0 500 350"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full max-w-2xl text-[#C9B38C]"
              >
                {/* Traditional Rajput Palace Cusped Arch Outline */}
                <path
                  d="M 50 350 V 170 C 50 120 70 80 110 80 C 135 80 160 95 180 85 C 205 75 220 50 250 20 C 280 50 295 75 320 85 C 340 95 365 80 390 80 C 430 80 450 120 450 170 V 350"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="4 4"
                />
                <path
                  d="M 70 350 V 180 C 70 135 88 100 122 100 C 145 100 168 112 185 104 C 208 94 222 72 250 45 C 278 72 292 94 315 104 C 332 112 355 100 378 100 C 412 100 430 135 430 180 V 350"
                  stroke="currentColor"
                  strokeWidth="0.8"
                />
                {/* Center Pinnacle / Kalash */}
                <path d="M 250 8 L 254 18 L 246 18 Z" fill="currentColor" />
                <circle cx="250" cy="6" r="2.5" fill="currentColor" />
              </svg>
            </div>

            {/* --- REVEALED CONTENT: ROYAL WEDDING DATE TRIPTYCH --- */}
            <div className="relative z-10 flex flex-col items-center justify-center space-y-7 sm:space-y-9">
              {/* Top Flourish Badge */}
              <div className="flex items-center gap-2 text-[#C9B38C]">
                <span className="h-[1px] w-8 bg-[#C9B38C]/40" />
                <span className="text-[10px] tracking-[0.3em] uppercase text-[#E5D7B7] font-medium">
                  Udaipur, Rajasthan
                </span>
                <span className="h-[1px] w-8 bg-[#C9B38C]/40" />
              </div>

              {/* 3 Royal Floating Pillars of Date */}
              <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-4 items-center justify-center">
                {/* 1. Day of Celebration */}
                <motion.div
                  initial={false}
                  animate={
                    isRevealed
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 30, scale: 0.85 }
                  }
                  transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#231F1B]/90 border border-[#C9B38C]/35 shadow-md group-hover:border-[#D4AF37]/60 transition-colors"
                >
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] text-[#C9B38C] uppercase mb-1">
                    Day
                  </span>
                  <p className="font-editorial-serif text-2xl sm:text-3xl font-light text-[#FFFFFF] tracking-wider">
                    {dateInfo.weekday}
                  </p>
                  <span className="text-[10px] text-[#A69B89] tracking-widest uppercase mt-1">
                    Wedding Day
                  </span>
                </motion.div>

                {/* 2. Grand Centerpiece: Royal Medallion Date (18) */}
                <motion.div
                  initial={false}
                  animate={
                    isRevealed
                      ? { opacity: 1, scale: 1, y: 0 }
                      : { opacity: 0, scale: 0.6, y: 40 }
                  }
                  transition={{ duration: 1.1, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="relative flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-[#312B23] via-[#24201B] to-[#1A1815] border-2 border-[#D4AF37] shadow-[0_12px_45px_rgba(212,175,55,0.3)] sm:scale-110 z-20 group-hover:shadow-[0_16px_55px_rgba(212,175,55,0.45)] transition-all"
                >
                  {/* Subtle radiating golden glow */}
                  <div className="absolute inset-0 rounded-3xl bg-[#D4AF37]/12 blur-xl pointer-events-none" />

                  <span className="relative z-10 text-[10px] font-semibold tracking-[0.4em] text-[#E8D099] uppercase">
                    The Date
                  </span>

                  <h3 className="relative z-10 font-editorial-serif text-6xl sm:text-7xl md:text-8xl font-normal text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] via-[#FFF3D6] to-[#D4AF37] tracking-tighter my-1 drop-shadow-md">
                    {dateInfo.day}
                  </h3>

                  <div className="relative z-10 flex items-center gap-2 text-[#C9B38C]">
                    <span className="h-[1px] w-6 bg-[#C9B38C]/50" />
                    <span className="text-xs text-[#D4AF37]">✦</span>
                    <span className="h-[1px] w-6 bg-[#C9B38C]/50" />
                  </div>
                </motion.div>

                {/* 3. Month & Year (December 2026) */}
                <motion.div
                  initial={false}
                  animate={
                    isRevealed
                      ? { opacity: 1, y: 0, scale: 1 }
                      : { opacity: 0, y: 30, scale: 0.85 }
                  }
                  transition={{ duration: 0.9, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#231F1B]/90 border border-[#C9B38C]/35 shadow-md group-hover:border-[#D4AF37]/60 transition-colors"
                >
                  <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.3em] text-[#C9B38C] uppercase mb-1">
                    Month &bull; Year
                  </span>
                  <p className="font-editorial-serif text-xl sm:text-2xl font-light text-[#FFFFFF] tracking-wider">
                    {dateInfo.month}
                  </p>
                  <span className="text-xs sm:text-sm font-editorial-serif text-[#D4AF37] tracking-widest mt-1">
                    {dateInfo.year}
                  </span>
                </motion.div>
              </div>

              {/* Ceremony Muhurat & Royal Venue Summary */}
              <motion.div
                initial={false}
                animate={
                  isRevealed
                    ? { opacity: 1, y: 0 }
                    : { opacity: 0, y: 25 }
                }
                transition={{ duration: 0.8, delay: 0.5 }}
                className="w-full max-w-xl mx-auto pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3.5"
              >
                <div className="p-4 rounded-xl bg-[#211E1B]/95 border border-[#C9B38C]/35 flex items-center gap-3.5 text-left shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-[#2D2822] border border-[#C9B38C]/50 flex items-center justify-center flex-shrink-0 text-[#D4AF37]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold tracking-widest uppercase text-[#C9B38C]">
                      Ceremony Muhurat
                    </span>
                    <p className="font-editorial-serif text-sm font-medium text-[#FFFFFF]">
                      {wedding.weddingTime || "04:30 PM"}
                    </p>
                    <span className="text-[10px] text-[#A69B89]">Pheras & Wedding Rituals</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#211E1B]/95 border border-[#C9B38C]/35 flex items-center gap-3.5 text-left shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-[#2D2822] border border-[#C9B38C]/50 flex items-center justify-center flex-shrink-0 text-[#D4AF37]">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-semibold tracking-widest uppercase text-[#C9B38C]">
                      Royal Venue
                    </span>
                    <p className="font-editorial-serif text-sm font-medium text-[#FFFFFF] truncate">
                      {wedding.location || "The Leela Palace"}
                    </p>
                    <span className="text-[10px] text-[#A69B89]">{wedding.city || "Lake Pichola, Udaipur"}</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* --- THE VEILING CURTAIN: ORNATE GOLDEN PALACE DOORS THAT PART ON SCROLL --- */}
            {/* Left Royal Door Wing */}
            <motion.div
              initial={false}
              animate={
                isRevealed
                  ? { x: "-102%", opacity: 0 }
                  : { x: "0%", opacity: 1 }
              }
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-0 top-0 w-1/2 h-full z-30 overflow-hidden pointer-events-none bg-gradient-to-r from-[#201D1A] via-[#2A251E] to-[#362E24] border-r border-[#D4AF37]/50 shadow-2xl flex flex-col items-center justify-center"
            >
              {/* Palace Lattice Texture */}
              <div className="absolute inset-0 bg-grain opacity-40" />
              <div className="absolute inset-3 border border-[#D4AF37]/30 rounded-xl" />
              <div className="relative z-10 flex flex-col items-center space-y-2 text-[#E5D7B7]">
                <BotanicalMotif variant="mandap" className="w-16 text-[#D4AF37]/60" />
                <span className="text-[11px] font-editorial-serif tracking-[0.4em] uppercase text-[#D4AF37]">
                  The Royal Union
                </span>
              </div>
            </motion.div>

            {/* Right Royal Door Wing */}
            <motion.div
              initial={false}
              animate={
                isRevealed
                  ? { x: "102%", opacity: 0 }
                  : { x: "0%", opacity: 1 }
              }
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-0 w-1/2 h-full z-30 overflow-hidden pointer-events-none bg-gradient-to-l from-[#201D1A] via-[#2A251E] to-[#362E24] border-l border-[#D4AF37]/50 shadow-2xl flex flex-col items-center justify-center"
            >
              {/* Palace Lattice Texture */}
              <div className="absolute inset-0 bg-grain opacity-40" />
              <div className="absolute inset-3 border border-[#D4AF37]/30 rounded-xl" />
              <div className="relative z-10 flex flex-col items-center space-y-2 text-[#E5D7B7]">
                <BotanicalMotif variant="mandap" className="w-16 text-[#D4AF37]/60" />
                <span className="text-[11px] font-editorial-serif tracking-[0.4em] uppercase text-[#D4AF37]">
                  Save Our Date
                </span>
              </div>
            </motion.div>

            {/* Center Royal Medallion / Wax Stamp (lifts & rotates away on scroll) */}
            <motion.div
              initial={false}
              animate={
                isRevealed
                  ? { scale: 0, opacity: 0, rotate: 45 }
                  : { scale: 1, opacity: 1, rotate: 0 }
              }
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#9E782F] via-[#F0D99D] to-[#8C6520] p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] pointer-events-none"
            >
              <div className="w-full h-full rounded-full border border-white/60 bg-[#1F1C18] flex flex-col items-center justify-center text-[#E5D7B7]">
                <span className="text-base text-[#D4AF37]">✦</span>
                <span className="text-[8px] font-bold tracking-[0.3em] uppercase mt-1 text-[#F0D99D]">
                  Unveil
                </span>
                <span className="text-[7px] text-[#A69B89] tracking-wider mt-0.5">
                  Scroll Down
                </span>
              </div>
            </motion.div>
          </div>

          {/* Interactive Action: Add to Calendar */}
          <div className="mt-8 flex items-center justify-center">
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#D4AF37] via-[#E2C17C] to-[#B38B3F] text-[#151413] hover:brightness-110 text-xs font-semibold tracking-wider uppercase transition-all duration-300 shadow-lg hover:scale-105 active:scale-95"
            >
              <Calendar className="w-4 h-4 text-[#151413]" />
              <span>Add to Calendar</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
