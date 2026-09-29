"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { WeddingEvent } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { MapPin, Calendar, Clock, Sparkles } from "lucide-react";

interface EventsSectionProps {
  events: WeddingEvent[];
}

function getEventImage(evt: WeddingEvent): string {
  if (evt.image && evt.image.trim()) {
    return evt.image;
  }
  const name = (evt.name || "").toLowerCase();
  if (name.includes("haldi")) return "/images/events/haldi.jpg";
  if (name.includes("mehendi") || name.includes("mehndi")) return "/images/events/mehendi.jpg";
  if (name.includes("sangeet") || name.includes("garba") || name.includes("dance")) return "/images/events/sangeet.jpg";
  if (name.includes("phera") || name.includes("wedding") || name.includes("shaadi") || name.includes("mandap")) return "/images/events/pheras.jpg";
  if (name.includes("reception") || name.includes("dinner")) return "/images/events/reception.jpg";
  return "/images/events/haldi.jpg";
}

export function EventsSection({ events }: EventsSectionProps) {
  const sortedEvents = [...events].sort((a, b) => a.order - b.order);

  return (
    <section id="events" className="relative py-24 sm:py-32 bg-[#F8F5EF] text-[#202020] border-t border-[#E9E1D5]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-16 sm:mb-24">
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Order of Festivities
          </span>
          <h2 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
            The Celebration
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
          <p className="max-w-lg mx-auto text-xs sm:text-sm text-[#736B63] font-light tracking-wide pt-1">
            We warmly invite you to grace each ceremony with your presence, laughter, and blessings.
          </p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
          {sortedEvents.map((evt, idx) => {
            const indexStr = String(idx + 1).padStart(2, "0");
            const eventImg = getEventImage(evt);

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.7, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex flex-col rounded-2xl bg-[#FCFAF6] border border-[#C9B38C]/35 overflow-hidden shadow-[0_10px_30px_-10px_rgba(201,179,140,0.12)] hover:border-[#C9B38C]/70 transition-all duration-500"
              >
                {/* Event Image - Much Bigger, Prominent Aspect Ratio */}
                <div className="relative w-full h-72 sm:h-80 md:h-[22rem] overflow-hidden bg-stone-100">
                  <Image
                    src={eventImg}
                    alt={evt.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    priority={idx < 3}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#202020]/80 via-transparent to-transparent" />
                  
                  {/* Event Index Badge */}
                  <span className="absolute top-4 left-4 font-editorial-serif text-3xl font-light text-white/95 drop-shadow-md">
                    {indexStr}
                  </span>

                  {/* Dress Code Pill on Image */}
                  {evt.dressCode && (
                    <div className="absolute bottom-3 left-4 right-4 flex items-center gap-1.5 text-[11px] text-[#F8F5EF] font-light">
                      <Sparkles className="w-3.5 h-3.5 text-[#E5D3B3] shrink-0" />
                      <span className="truncate">Attire: {evt.dressCode}</span>
                    </div>
                  )}
                </div>

                {/* Content Details */}
                <div className="p-6 sm:p-7 flex flex-col flex-grow justify-between space-y-5">
                  <div className="space-y-3">
                    <h3 className="font-editorial-serif text-2xl sm:text-3xl font-normal text-[#202020]">
                      {evt.name}
                    </h3>

                    {/* Date & Time */}
                    <div className="space-y-1.5 text-xs text-[#736B63]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-[#9E814D] shrink-0" />
                        <span className="font-medium text-[#4A443E]">{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#9E814D] shrink-0" />
                        <span>{evt.time}</span>
                      </div>
                      <div className="flex items-start gap-2 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#9E814D] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-[#202020]">{evt.venue}</p>
                          <p className="text-[11px] text-[#8C847B]">{evt.address}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs sm:text-sm text-[#575048] font-light leading-relaxed pt-2.5 border-t border-[#E9E1D5]/70">
                      {evt.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
