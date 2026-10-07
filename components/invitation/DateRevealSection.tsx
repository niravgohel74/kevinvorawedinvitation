"use client";

import React, { useCallback, useMemo, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Calendar, Clock, MapPin } from "lucide-react";
import confetti from "canvas-confetti";
import { WeddingDetails } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { GanpatiLineArt } from "@/components/ui/GanpatiLineArt";
import { RichText } from "@/components/ui/RichText";

interface DateRevealSectionProps {
  wedding: WeddingDetails;
  className?: string;
}

const DEFAULT_WEDDING_DATE = "2026-12-18";
const DEFAULT_WEDDING_TIME = "04:30 PM";

function getWeddingDate(dateValue?: string, timeValue?: string) {
  const dateMatch = (dateValue || DEFAULT_WEDDING_DATE).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = (timeValue || DEFAULT_WEDDING_TIME).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

  if (!dateMatch) return new Date(2026, 11, 18, 16, 30);

  const [, year, month, day] = dateMatch;
  let hours = timeMatch ? Number(timeMatch[1]) : 16;
  const minutes = timeMatch ? Number(timeMatch[2]) : 30;
  const meridiem = timeMatch?.[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day), hours, minutes);
  return Number.isNaN(parsedDate.getTime()) ? new Date(2026, 11, 18, 16, 30) : parsedDate;
}

function formatCalendarStamp(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function PalaceLineArt() {
  return (
    <svg
      viewBox="0 0 620 760"
      fill="none"
      className="h-full w-full"
      aria-hidden="true"
      preserveAspectRatio="xMidYMax slice"
    >
      <path
        d="M70 760V294c0-94 52-168 124-168 37 0 70 18 96 48 5-75 11-110 20-145 9 35 15 70 20 145 26-30 59-48 96-48 72 0 124 74 124 168v466"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M98 760V306c0-78 42-139 102-139 45 0 83 35 110 89 27-54 65-89 110-89 60 0 102 61 102 139v454"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeDasharray="5 7"
      />
      <path d="M36 696h548M52 716h516M68 736h484" stroke="currentColor" strokeWidth="0.7" />
      <circle cx="310" cy="24" r="4" fill="currentColor" />
      <path d="m310 2 8 15h-16l8-15Z" fill="currentColor" />
    </svg>
  );
}

export function DateRevealSection({ wedding, className = "" }: DateRevealSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-90px" });
  const prefersReducedMotion = useReducedMotion();
  const dateDetails = useMemo(() => {
    const date = getWeddingDate(wedding.weddingDate, wedding.weddingTime);

    return {
      date,
      day: String(date.getDate()).padStart(2, "0"),
      month: date.toLocaleDateString("en-US", { month: "long" }),
      weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
      year: String(date.getFullYear()),
      fullDate: date.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };
  }, [wedding.weddingDate, wedding.weddingTime]);

  const triggerCelebration = useCallback(() => {
    if (prefersReducedMotion) return;

    try {
      const shared = {
        spread: 72,
        startVelocity: 24,
        gravity: 0.75,
        scalar: 0.82,
        disableForReducedMotion: true,
      };

      confetti({
        ...shared,
        particleCount: 42,
        origin: { x: 0.42, y: 0.62 },
        colors: ["#C9A86A", "#F3E4C5", "#7A2933"],
      });
      confetti({
        ...shared,
        particleCount: 32,
        origin: { x: 0.58, y: 0.62 },
        colors: ["#B58F8F", "#EAD8CC", "#D3B474"],
      });
    } catch {
      // The invitation remains fully usable if the canvas API is unavailable.
    }
  }, [prefersReducedMotion]);

  const googleCalendarUrl = useMemo(() => {
    const start = dateDetails.date;
    const end = new Date(start.getTime() + 5 * 60 * 60 * 1000);
    const venue = [wedding.location, wedding.city].filter(Boolean).join(", ");
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${wedding.groomName} & ${wedding.brideName} — Wedding Celebration`,
      dates: `${formatCalendarStamp(start)}/${formatCalendarStamp(end)}`,
      details: `Join us as we celebrate the wedding of ${wedding.groomName} and ${wedding.brideName}.`,
      location: venue,
      ctz: "Asia/Kolkata",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }, [dateDetails.date, wedding.brideName, wedding.city, wedding.groomName, wedding.location]);

  const motionInitial = prefersReducedMotion ? false : { opacity: 0, y: 28 };

  return (
    <section
      ref={sectionRef}
      id="save-date"
      className={`relative isolate overflow-hidden bg-[#F4EEE5] py-24 text-[#27221E] sm:py-32 ${className}`}
    >
      <div className="absolute inset-0 -z-30 bg-[radial-gradient(circle_at_12%_18%,rgba(181,143,143,0.17),transparent_28%),radial-gradient(circle_at_88%_78%,rgba(201,179,140,0.22),transparent_30%),linear-gradient(135deg,#F8F4ED_0%,#F1E8DC_100%)]" />
      <div className="absolute inset-0 -z-20 bg-grain opacity-70" />
      <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9B38C] to-transparent" />
      <div className="absolute -left-24 top-1/3 -z-10 h-72 w-72 rounded-full border border-[#B58F8F]/20" />
      <div className="absolute -right-32 bottom-12 -z-10 h-96 w-96 rounded-full border border-[#C9B38C]/25" />

      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <motion.header
          initial={motionInitial}
          animate={isInView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto mb-12 max-w-2xl text-center sm:mb-16"
        >
          <div className="mb-5 flex items-center justify-center gap-3 text-[#9E814D]">
            <span className="h-px w-8 bg-[#C9B38C]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.38em] sm:text-xs">
              Our forever begins
            </span>
            <span className="h-px w-8 bg-[#C9B38C]" />
          </div>
          <h2 className="font-editorial-serif text-5xl font-light leading-none tracking-[-0.02em] text-[#342923] sm:text-6xl md:text-7xl">
            Save the Date
          </h2>
          <BotanicalMotif variant="divider" className="mt-5 text-[#B4925A]" />
          <p className="mx-auto mt-5 max-w-xl text-sm font-light leading-7 text-[#746A61] sm:text-[15px]">
            With the blessings of our families, we invite you to join us in the city of lakes for a celebration of love, tradition, and togetherness.
          </p>
        </motion.header>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 40, scale: 0.985 }}
          animate={isInView ? { opacity: 1, y: 0, scale: 1 } : undefined}
          transition={{ duration: 0.95, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2rem] border border-[#BFA16F]/45 bg-[#FCFAF6] shadow-[0_30px_90px_-32px_rgba(74,50,37,0.38)] sm:rounded-[2.75rem]"
        >
          <div className="pointer-events-none absolute inset-3 z-20 rounded-[1.4rem] border border-[#C9B38C]/25 sm:inset-4 sm:rounded-[2rem]" />
          <BotanicalMotif variant="corner" className="pointer-events-none absolute left-6 top-6 z-30 h-8 w-8 text-[#E6CC96]/70" />
          <BotanicalMotif variant="corner" className="pointer-events-none absolute right-6 top-6 z-30 h-8 w-8 -scale-x-100 text-[#B4925A]/50" />
          <BotanicalMotif variant="corner" className="pointer-events-none absolute bottom-6 right-6 z-30 h-8 w-8 -scale-x-100 -scale-y-100 text-[#B4925A]/50" />

          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative flex min-h-[570px] flex-col items-center overflow-hidden bg-[#5C222C] px-8 py-14 text-center text-[#FFF8EC] sm:min-h-[640px] sm:px-12 sm:py-16 lg:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(228,195,132,0.14),transparent_46%),linear-gradient(180deg,rgba(255,255,255,0.025),transparent)]" />
              <div className="absolute inset-x-0 bottom-0 top-4 text-[#E3C483]/18">
                <PalaceLineArt />
              </div>
              <div className="absolute inset-0 bg-grain opacity-20" />

              <div className="relative z-10 flex h-full w-full flex-1 flex-col items-center">
                <GanpatiLineArt className="h-12 w-12 text-[#E1C17F] sm:h-14 sm:w-14" />
                <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.42em] text-[#EBD7AD] sm:text-[10px]">
                  Shree Ganeshay Namah
                </p>

                <button
                  type="button"
                  onClick={triggerCelebration}
                  aria-label={`Celebrate our wedding date, ${dateDetails.fullDate}`}
                  className="group relative my-9 flex w-full max-w-[300px] flex-1 flex-col items-center justify-center rounded-t-[9rem] border border-[#E1C17F]/45 bg-[#431820]/45 px-5 pb-8 pt-12 outline-none transition-all duration-500 hover:-translate-y-1 hover:border-[#F0D79F]/75 hover:bg-[#431820]/65 focus-visible:ring-2 focus-visible:ring-[#F0D79F] focus-visible:ring-offset-4 focus-visible:ring-offset-[#5C222C] sm:my-10"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-[0.48em] text-[#E5CB96]">
                    {dateDetails.month}
                  </span>
                  <span className="font-editorial-serif text-[7.5rem] font-light leading-[0.82] tracking-[-0.08em] text-[#FFF9EF] transition-transform duration-500 group-hover:scale-[1.03] sm:text-[9rem]">
                    {dateDetails.day}
                  </span>
                  <span className="mt-5 flex w-full items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#E5CB96]">
                    <span className="h-px flex-1 bg-[#DAB96F]/50" />
                    {dateDetails.weekday}
                    <span className="h-px flex-1 bg-[#DAB96F]/50" />
                  </span>
                  <span className="mt-3 font-editorial-serif text-2xl tracking-[0.25em] text-[#FFF2D8]">
                    {dateDetails.year}
                  </span>
                </button>

                <p className="font-editorial-serif text-3xl font-light tracking-wide text-[#FFF9EF] sm:text-4xl">
                  <RichText content={wedding.groomName} />
                  <span className="mx-3 italic text-[#E1C17F]">&</span>
                  <RichText content={wedding.brideName} />
                </p>
              </div>
            </div>

            <div className="relative flex flex-col justify-center px-7 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(201,179,140,0.13),transparent_36%)]" />

              <div className="relative z-10">
                <p className="text-[10px] font-semibold uppercase tracking-[0.36em] text-[#9E814D]">
                  A royal celebration awaits
                </p>
                <h3 className="mt-5 max-w-md font-editorial-serif text-4xl font-light leading-[1.08] text-[#342923] sm:text-5xl">
                  Meet us where the palace lights kiss the lake.
                </h3>
                <p className="mt-6 max-w-lg text-sm font-light leading-7 text-[#736B63]">
                  Come witness our sacred vows and stay for an evening filled with music, laughter, and memories we will carry forever.
                </p>

                <div className="my-8 h-px w-full bg-gradient-to-r from-[#C9B38C]/70 via-[#C9B38C]/25 to-transparent" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[#C9B38C]/35 bg-[#F7F1E8]/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B4925A]/65">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#C9B38C]/45 bg-[#FFFDF9] text-[#8F7043]">
                      <Calendar className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#9E814D]">Wedding day</p>
                    <p className="mt-1 font-editorial-serif text-xl text-[#342923]">{dateDetails.fullDate}</p>
                  </div>

                  <div className="rounded-2xl border border-[#C9B38C]/35 bg-[#F7F1E8]/70 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#B4925A]/65">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#C9B38C]/45 bg-[#FFFDF9] text-[#8F7043]">
                      <Clock className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#9E814D]">Ceremony muhurat</p>
                    <p className="mt-1 font-editorial-serif text-xl text-[#342923]">
                      {wedding.weddingTime || DEFAULT_WEDDING_TIME} onwards
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-4 rounded-2xl border border-[#C9B38C]/35 bg-[#F7F1E8]/70 p-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#C9B38C]/45 bg-[#FFFDF9] text-[#8F7043]">
                    <MapPin className="h-4 w-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.26em] text-[#9E814D]">The venue</p>
                    <p className="mt-1 font-editorial-serif text-xl text-[#342923]">
                      {wedding.location || "The Leela Palace"}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#7C7269]">{wedding.city || "Udaipur, Rajasthan"}</p>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={triggerCelebration}
                    className="inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-2 rounded-full bg-[#5C222C] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FFF9EF] shadow-[0_10px_24px_-12px_rgba(92,34,44,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#6B2934] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8F7043] focus-visible:ring-offset-2"
                  >
                    <Calendar className="h-4 w-4 text-[#E3C483]" strokeWidth={1.7} />
                    Add to Google
                  </a>
                </div>

                {wedding.hashtag && (
                  <p className="mt-7 text-center font-editorial-serif text-lg italic tracking-wide text-[#9A7D51]">
                    {wedding.hashtag}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0 }}
          animate={isInView ? { opacity: 1 } : undefined}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-7 text-center text-[10px] uppercase tracking-[0.28em] text-[#8E8075]"
        >
          Tap the date for a little celebration
        </motion.p>
      </div>
    </section>
  );
}
