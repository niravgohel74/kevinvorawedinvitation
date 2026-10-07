"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { VenueInfo } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { MapPin, Navigation, Plane, Hotel } from "lucide-react";
import { RichText } from "@/components/ui/RichText";

interface VenueSectionProps {
  venue: VenueInfo;
}

export function VenueSection({ venue }: VenueSectionProps) {
  return (
    <section id="venue" className="relative py-24 sm:py-32 bg-[#F8F5EF] text-[#202020] border-t border-[#E9E1D5] overflow-hidden">
      <div className="max-w-5xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-16 sm:mb-20">
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Destination & Destination
          </span>
          <h2 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
            The Venue
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
        </div>

        {/* Large Editorial Venue Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl overflow-hidden border border-[#C9B38C]/40 shadow-xl bg-[#FCFAF6]"
        >
          {/* Main Hero Image */}
          <div className="relative w-full h-80 sm:h-96 md:h-[460px] overflow-hidden">
            <Image
              src={venue.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1600&auto=format&fit=crop"}
              alt={venue.name}
              fill
              sizes="(max-width: 1024px) 100vw, 1000px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#202020]/90 via-[#202020]/30 to-transparent" />

            {/* Overlay Info on Image */}
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10 text-white space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] uppercase tracking-widest text-[#E5D3B3] font-medium">
                Royal Heritage Destination
              </span>
              <h3 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl font-light">
                <RichText content={venue.name} />
              </h3>
              <p className="text-xs sm:text-sm text-white/80 font-light flex items-center gap-1.5 pt-1">
                <MapPin className="w-4 h-4 text-[#C9B38C] shrink-0" />
                <span><RichText content={venue.address} />, <RichText content={venue.cityState} /></span>
              </p>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 sm:p-10 space-y-8">
            <p className="text-sm sm:text-base text-[#575048] font-light leading-relaxed">
              <RichText content={venue.description} />
            </p>

            {/* Travel / Stay cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {venue.airportInfo && (
                <div className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#C9B38C]/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9E814D] uppercase tracking-wider">
                    <Plane className="w-4 h-4" />
                    <span>Travel & Transfers</span>
                  </div>
                  <p className="text-xs text-[#665E55] leading-relaxed font-light">
                    <RichText content={venue.airportInfo} />
                  </p>
                </div>
              )}

              {venue.accommodations && (
                <div className="p-5 rounded-2xl bg-[#F8F5EF] border border-[#C9B38C]/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#9E814D] uppercase tracking-wider">
                    <Hotel className="w-4 h-4" />
                    <span>Guest Accommodations</span>
                  </div>
                  <p className="text-xs text-[#665E55] leading-relaxed font-light">
                    <RichText content={venue.accommodations} />
                  </p>
                </div>
              )}
            </div>

            {/* Directions Button */}
            {venue.mapsUrl && (
              <div className="pt-4 flex justify-center">
                <a
                  href={venue.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-[#202020] text-[#FCFAF6] text-xs sm:text-sm tracking-[0.2em] uppercase font-medium shadow-md hover:bg-[#38332E] hover:border-[#C9B38C] border border-transparent transition-all duration-300"
                >
                  <Navigation className="w-4 h-4 text-[#C9B38C]" />
                  <span>Get Directions on Google Maps</span>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
