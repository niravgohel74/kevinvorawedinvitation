"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { WeddingDetails } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { RichText } from "@/components/ui/RichText";

interface HeroSectionProps {
  wedding: WeddingDetails;
}

const LOCAL_HERO_IMAGE = "/images/hero-wedding.jpg";

export function HeroSection({ wedding }: HeroSectionProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 160]);
  const opacity = useTransform(scrollY, [0, 450], [1, 0.2]);
  const [heroImageSrc, setHeroImageSrc] = useState(wedding.heroImage || LOCAL_HERO_IMAGE);

  useEffect(() => {
    setHeroImageSrc(wedding.heroImage || LOCAL_HERO_IMAGE);
  }, [wedding.heroImage]);

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#161514] text-[#FAF8F5]">
      {/* Background Image with Parallax */}
      <motion.div style={{ y }} className="absolute inset-0 w-full h-[120%] -top-[10%]">
        <Image
          src={heroImageSrc}
          alt={`${wedding.brideName} and ${wedding.groomName}`}
          fill
          priority
          sizes="100vw"
          onError={() => {
            if (heroImageSrc !== LOCAL_HERO_IMAGE) setHeroImageSrc(LOCAL_HERO_IMAGE);
          }}
          className="scale-105 object-cover object-center brightness-[0.68] contrast-[1.04] saturate-[0.9]"
        />
        {/* Editorial Gradients for Legibility and Luxury Mood */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#161514]/90 via-[#161514]/25 to-[#161514]/55" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#161514]/10 to-[#161514]/65" />
      </motion.div>

      {/* Subtle Grain Overlay */}
      <div className="absolute inset-0 bg-grain opacity-20 pointer-events-none" />

      {/* Floating Gold Sparkle Accents */}
      <div className="absolute top-12 left-8 sm:left-16 pointer-events-none opacity-40">
        <BotanicalMotif variant="flourish" className="w-24 text-[#C9B38C]" />
      </div>
      <div className="absolute bottom-16 right-8 sm:right-16 pointer-events-none opacity-40">
        <BotanicalMotif variant="flourish" className="w-24 text-[#C9B38C] rotate-180" />
      </div>

      {/* Main Content */}
      <motion.div
        style={{ opacity }}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center flex flex-col items-center justify-center space-y-6 sm:space-y-8"
      >
        {/* Hashtag / Sub-badge */}
        {wedding.hashtag && (
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#C9B38C]/35 bg-[#161514]/60 backdrop-blur-md text-[11px] sm:text-xs tracking-[0.25em] text-[#C9B38C] uppercase">
            <span>✧</span> {wedding.hashtag} <span>✧</span>
          </span>
        )}

        <div className="space-y-2">
          <p className="text-[11px] sm:text-xs font-medium tracking-[0.4em] uppercase text-[#D8CFBE]">
            The Wedding Celebration
          </p>
          <div className="py-1">
            <BotanicalMotif variant="mandap" className="w-24 sm:w-32 mx-auto text-[#C9B38C]" />
          </div>
        </div>

        {/* Grand Typography Names - Groom First */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="font-editorial-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-wide text-[#FFFFFF] drop-shadow-md">
            {wedding.groomName}
          </h1>
          <div className="flex items-center justify-center gap-4 text-[#C9B38C] my-2">
            <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent to-[#C9B38C]" />
            <span className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl italic font-light">&</span>
            <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent to-[#C9B38C]" />
          </div>
          <h1 className="font-editorial-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-wide text-[#FFFFFF] drop-shadow-md">
            {wedding.brideName}
          </h1>
        </div>

                {/* Romantic Couple Quote / Line (Fully Editable from Admin) */}
        <div className="pt-2 sm:pt-4 max-w-xl mx-auto space-y-3">
          <p className="font-editorial-serif text-xl sm:text-2xl md:text-3xl italic tracking-wider text-[#E8DEC8]">
            <RichText content={wedding.invitationSubtitle || "Two Stories, One Chapter"} />
          </p>
          <p className="font-serif italic text-sm sm:text-base text-[#D8CFBE]/90 tracking-wide leading-relaxed font-light px-4">
            &ldquo;<RichText content={wedding.heroQuote || "In the quiet rhythm of our laughter and in every shared dream, we found our forever."} />&rdquo;
          </p>
          <div className="flex items-center justify-center gap-3 pt-1">
            <span className="h-[1px] w-8 bg-[#C9B38C]/40" />
            <span className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase text-[#C9B38C] font-medium">
              <RichText content={wedding.heroTagline || "Two Souls • One Heartbeat"} />
            </span>
            <span className="h-[1px] w-8 bg-[#C9B38C]/40" />
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="pt-8 sm:pt-12 flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#D8CFBE] font-light">
            Scroll to Discover
          </span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full border border-[#C9B38C]/60 flex items-start justify-center p-1"
          >
            <div className="w-1 h-2 rounded-full bg-[#C9B38C]" />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
