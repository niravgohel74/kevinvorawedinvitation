"use client";
import React from "react";
import { motion } from "framer-motion";
import { TimelineItem } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { Clock } from "lucide-react";
import { RichText } from "@/components/ui/RichText";

interface TimelineSectionProps {
  timeline: TimelineItem[];
}

export function TimelineSection({ timeline }: TimelineSectionProps) {
  const sortedItems = [...timeline].sort((a, b) => a.order - b.order);

  return (
    <section id="timeline" className="relative py-24 sm:py-32 bg-[#FFFCF7] text-[#202020] border-t border-[#E9E1D5]">
      <div className="max-w-3xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-16 sm:mb-20">
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Wedding Day Schedule
          </span>
          <h2 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
            The Day Itinerary
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
          <p className="text-xs sm:text-sm text-[#736B63] font-light">
            A guide to each sacred moment of our wedding day.
          </p>
        </div>

        {/* Vertical Timeline List */}
        <div className="relative pl-6 sm:pl-8 border-l border-[#C9B38C]/40 space-y-10 sm:space-y-12 ml-4 sm:ml-12">
          {sortedItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative group"
            >
              {/* Timeline Marker Dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1 w-4 h-4 rounded-full border-2 border-[#C9B38C] bg-[#FFFCF7] group-hover:bg-[#C9B38C] transition-colors shadow-sm flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#9E814D]" />
              </div>

              {/* Content Card */}
              <div className="p-5 sm:p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9B38C]/30 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#9E814D] uppercase">
                  <Clock className="w-3.5 h-3.5" />
                  <span><RichText content={item.time} /></span>
                </div>
                <h3 className="font-editorial-serif text-xl sm:text-2xl text-[#202020]">
                  <RichText content={item.title} />
                </h3>
                {item.description && (
                  <p className="text-xs sm:text-sm text-[#665E55] font-light leading-relaxed">
                    <RichText content={item.description} />
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
