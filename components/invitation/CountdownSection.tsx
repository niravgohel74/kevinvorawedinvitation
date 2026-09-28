"use client";
import React, { useState, useEffect } from "react";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";

interface CountdownSectionProps {
  weddingDate: string; // e.g. "2026-12-18"
  weddingTime?: string; // e.g. "04:30 PM"
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function CountdownSection({ weddingDate, weddingTime = "04:30 PM" }: CountdownSectionProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isPast: false,
  });
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);

    const calculateTime = () => {
      // Parse date & time
      let targetTime: number;
      try {
        const fullDateTimeStr = `${weddingDate} ${weddingTime}`;
        const parsed = new Date(fullDateTimeStr).getTime();
        targetTime = isNaN(parsed) ? new Date(weddingDate).getTime() : parsed;
      } catch {
        targetTime = new Date(weddingDate).getTime();
      }

      const now = new Date().getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [weddingDate, weddingTime]);

  const padZero = (num: number) => String(num).padStart(2, "0");

  return (
    <section className="relative py-20 sm:py-28 bg-[#F8F5EF] text-[#202020] border-y border-[#E9E1D5]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Header */}
        <div className="space-y-2 mb-10 sm:mb-14">
          <p className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Counting Down
          </p>
          <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-[#202020]">
            Until We Say &ldquo;I Do&rdquo;
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
        </div>

        {/* Counter Display */}
        {!isClient ? (
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#C9B38C] border-t-transparent animate-spin" />
          </div>
        ) : timeLeft.isPast ? (
          <div className="py-8 px-6 max-w-lg mx-auto rounded-2xl bg-[#FCFAF6] border border-[#C9B38C]/40 shadow-sm space-y-3">
            <BotanicalMotif variant="ring" className="w-10 h-10 mx-auto text-[#C9B38C]" />
            <h3 className="font-editorial-serif text-3xl sm:text-4xl text-[#202020]">
              The Day Has Arrived
            </h3>
            <p className="text-sm text-[#736B63] font-light tracking-wide">
              We are so grateful to share our celebration with everyone we love.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {/* Days */}
            <div className="relative rounded-2xl bg-[#FCFAF6] p-6 sm:p-8 border border-[#C9B38C]/35 shadow-[0_8px_20px_-6px_rgba(201,179,140,0.12)]">
              <span className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-light text-[#202020] block">
                {timeLeft.days}
              </span>
              <span className="text-[10px] sm:text-xs tracking-[0.25em] text-[#9E814D] uppercase font-medium mt-2 block">
                Days
              </span>
            </div>

            {/* Hours */}
            <div className="relative rounded-2xl bg-[#FCFAF6] p-6 sm:p-8 border border-[#C9B38C]/35 shadow-[0_8px_20px_-6px_rgba(201,179,140,0.12)]">
              <span className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-light text-[#202020] block">
                {padZero(timeLeft.hours)}
              </span>
              <span className="text-[10px] sm:text-xs tracking-[0.25em] text-[#9E814D] uppercase font-medium mt-2 block">
                Hours
              </span>
            </div>

            {/* Minutes */}
            <div className="relative rounded-2xl bg-[#FCFAF6] p-6 sm:p-8 border border-[#C9B38C]/35 shadow-[0_8px_20px_-6px_rgba(201,179,140,0.12)]">
              <span className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-light text-[#202020] block">
                {padZero(timeLeft.minutes)}
              </span>
              <span className="text-[10px] sm:text-xs tracking-[0.25em] text-[#9E814D] uppercase font-medium mt-2 block">
                Minutes
              </span>
            </div>

            {/* Seconds */}
            <div className="relative rounded-2xl bg-[#FCFAF6] p-6 sm:p-8 border border-[#C9B38C]/35 shadow-[0_8px_20px_-6px_rgba(201,179,140,0.12)]">
              <span className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-light text-[#9E814D] block">
                {padZero(timeLeft.seconds)}
              </span>
              <span className="text-[10px] sm:text-xs tracking-[0.25em] text-[#9E814D] uppercase font-medium mt-2 block">
                Seconds
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
