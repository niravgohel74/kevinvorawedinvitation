"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WeddingDetails } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { GanpatiLineArt } from "@/components/ui/GanpatiLineArt";
import { WaxSeal } from "@/components/ui/WaxSeal";
import { RichText } from "@/components/ui/RichText";
import confetti from "canvas-confetti";

interface EnvelopeIntroProps {
  wedding: WeddingDetails;
  onOpen: () => void;
  onToggleMusic?: () => void;
  isMusicPlaying?: boolean;
}

export function EnvelopeIntro({
  wedding,
  onOpen,
  onToggleMusic,
  isMusicPlaying,
}: EnvelopeIntroProps) {
  const [isOpenTriggered, setIsOpenTriggered] = useState(false);

  const getMonogram = () => {
    const gClean = (wedding.groomName || "K").replace(/<[^>]*>/g, "").trim();
    const bClean = (wedding.brideName || "V").replace(/<[^>]*>/g, "").trim();
    const g = gClean ? gClean[0] : "K";
    const b = bClean ? bClean[0] : "V";
    return `${g} & ${b}`;
  };

  const handleOpenClick = () => {
    if (isOpenTriggered) return;
    setIsOpenTriggered(true);

    // Subtle luxury golden confetti
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.65 },
        colors: ["#C9B38C", "#D4AF37", "#E9E1D5", "#B58F8F"],
        disableForReducedMotion: true,
      });
    } catch {
      // fallback
    }

    // Immediately trigger open callback so user gesture starts music smoothly
    onOpen();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        animate={isOpenTriggered ? { opacity: 0, scale: 1.05 } : { opacity: 1, scale: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#181818] p-4 sm:p-6"
      >
        {/* Ambient atmospheric backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#2A2622] via-[#1A1816] to-[#0E0D0C] opacity-95" />
        
        {/* Subtle background grain */}
        <div className="absolute inset-0 bg-grain opacity-25 pointer-events-none" />

        {/* Floating subtle ambient particles / glowing orbs */}
        <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-[#C9B38C]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 rounded-full bg-[#B58F8F]/5 blur-3xl pointer-events-none" />

        {/* Central Luxury Envelope Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative w-full max-w-lg md:max-w-xl rounded-2xl bg-[#FCFAF6] p-7 sm:p-12 text-center text-[#202020] shadow-[0_25px_70px_rgba(0,0,0,0.65)] ring-1 ring-[#C9B38C]/40 border border-[#C9B38C]/30"
        >
          {/* Ornate Corner Accents */}
          <BotanicalMotif variant="corner" className="absolute top-4 left-4 w-7 h-7 text-[#C9B38C]/70" />
          <BotanicalMotif variant="corner" className="absolute top-4 right-4 w-7 h-7 text-[#C9B38C]/70 -scale-x-100" />
          <BotanicalMotif variant="corner" className="absolute bottom-4 left-4 w-7 h-7 text-[#C9B38C]/70 -scale-y-100" />
          <BotanicalMotif variant="corner" className="absolute bottom-4 right-4 w-7 h-7 text-[#C9B38C]/70 -scale-x-100 -scale-y-100" />

          {/* Inner subtle gold hairline border */}
          <div className="absolute inset-3 sm:inset-4 rounded-xl border border-[#C9B38C]/25 pointer-events-none" />

          {/* Invitation Header Top Flourish with Ganpati Line Art */}
          <div className="relative z-10 flex flex-col items-center space-y-2">
            <GanpatiLineArt className="w-12 h-12 text-[#9E814D] mb-1 drop-shadow-sm" />
            <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
              Shree Ganeshay Namah
            </span>
            <div className="pt-1">
              <BotanicalMotif variant="divider" />
            </div>
            
            <p className="text-[10px] sm:text-[11px] font-medium tracking-[0.3em] text-[#736B63] uppercase pt-2">
              THE WEDDING INVITATION OF
            </p>
          </div>

          {/* Couple Names - Groom First */}
          <div className="relative z-10 my-6 sm:my-8 space-y-1">
            <h1 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
              <RichText content={wedding.groomName} />
            </h1>
            <div className="flex items-center justify-center gap-3 text-[#C9B38C]">
              <span className="h-[1px] w-8 bg-[#C9B38C]/50" />
              <span className="font-editorial-serif text-2xl sm:text-3xl italic font-light">&</span>
              <span className="h-[1px] w-8 bg-[#C9B38C]/50" />
            </div>
            <h1 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
              <RichText content={wedding.brideName} />
            </h1>
          </div>

          {/* Subtle Decorative Divider */}
          <div className="my-6 sm:my-8 flex justify-center">
            <BotanicalMotif variant="flourish" className="w-28 text-[#C9B38C]" />
          </div>

          {/* Interactive Wax Seal / Open Button */}
          <div className="relative z-10 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center group cursor-pointer" onClick={handleOpenClick}>
              <div className="animate-gentle-pulse">
                <WaxSeal monogram={getMonogram()} size="md" />
              </div>
              
              <button
                type="button"
                onClick={handleOpenClick}
                className="mt-4 px-8 py-3 rounded-full border border-[#C9B38C] bg-[#202020] text-[#FCFAF6] text-xs sm:text-sm tracking-[0.25em] uppercase font-medium shadow-md hover:bg-[#342F2A] hover:border-[#D4AF37] transition-all duration-300 transform group-hover:translate-y-[-1px]"
              >
                {isOpenTriggered ? "Opening Invitation..." : "Open Invitation"}
              </button>
            </div>

            <p className="text-[11px] text-[#8C847B] tracking-wider italic">
              Tap seal or button to unseal our celebration
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
