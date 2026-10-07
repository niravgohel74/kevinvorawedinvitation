"use client";
import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { StoryItem, CoupleInfo } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { RichText } from "@/components/ui/RichText";

interface StorySectionProps {
  story: StoryItem[];
  couple: CoupleInfo;
}

export function StorySection({ story, couple }: StorySectionProps) {
  const sortedStory = [...story].sort((a, b) => a.order - b.order);

  return (
    <section id="story" className="relative py-24 sm:py-32 bg-[#FFFCF7] text-[#202020] overflow-hidden">
      {/* Decorative Background Floral Details */}
      <div className="absolute top-1/4 -right-16 w-64 h-64 rounded-full bg-[#C9B38C]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-16 w-64 h-64 rounded-full bg-[#B58F8F]/5 blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-16 sm:mb-24">
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            How Forever Began
          </span>
          <h2 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
            Our Story
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
          {couple.quote && (
            <p className="max-w-xl mx-auto font-editorial-serif text-lg sm:text-xl italic text-[#736B63] pt-3">
              &ldquo;<RichText content={couple.quote} />&rdquo;
            </p>
          )}
        </div>

        {/* Story Milestones Timeline */}
        <div className="relative">
          {/* Vertical central connector line (desktop) */}
          <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-[1px] -translate-x-1/2 bg-gradient-to-b from-[#C9B38C]/20 via-[#C9B38C]/60 to-[#C9B38C]/20" />

          <div className="space-y-16 sm:space-y-24">
            {sortedStory.map((item, index) => {
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 ${
                    isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Central Node on Desktop */}
                  <div className="hidden md:flex absolute left-1/2 top-10 -translate-x-1/2 items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-[#C9B38C] bg-[#FFFCF7] flex items-center justify-center shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-[#9E814D]" />
                    </div>
                  </div>

                  {/* Story Image / Photo */}
                  <div className="w-full md:w-1/2 flex justify-center">
                    {item.image ? (
                      <div className="relative w-full max-w-sm aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-[#C9B38C]/30 group">
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full max-w-sm aspect-[4/3] rounded-2xl bg-[#F8F5EF] border border-[#C9B38C]/30 flex items-center justify-center p-6 text-center">
                        <BotanicalMotif variant="ring" className="w-12 h-12 text-[#C9B38C]" />
                      </div>
                    )}
                  </div>

                  {/* Story Narrative Text */}
                  <div className={`w-full md:w-1/2 text-center ${isEven ? "md:text-right" : "md:text-left"}`}>
                    <span className="inline-block px-3 py-1 rounded-full bg-[#F8F5EF] border border-[#C9B38C]/30 text-xs font-semibold tracking-widest text-[#9E814D] mb-3">
                      {item.year}
                    </span>
                    <h3 className="font-editorial-serif text-2xl sm:text-3xl font-normal text-[#202020] mb-3">
                      <RichText content={item.title} />
                    </h3>
                    <p className="text-sm sm:text-base text-[#575048] leading-relaxed font-light">
                      <RichText content={item.description} />
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Couple Mini Profile Cards - Groom First */}
        {(couple.bridePhoto || couple.groomPhoto) && (
          <div className="mt-28 sm:mt-36 pt-16 border-t border-[#E9E1D5]">
            <div className="text-center space-y-2 mb-12">
              <span className="text-[11px] font-medium tracking-[0.35em] text-[#9E814D] uppercase">
                The Groom &amp; Bride
              </span>
              <h3 className="font-editorial-serif text-3xl sm:text-4xl text-[#202020]">
                Meet The Couple
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 max-w-3xl mx-auto">
              {/* Groom */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9B38C]/30 shadow-sm">
                <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-[#C9B38C] mb-5 shadow-md">
                  <Image
                    src={couple.groomPhoto}
                    alt={couple.groomName.replace(/<[^>]*>/g, "")}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </div>
                <h4 className="font-editorial-serif text-2xl text-[#202020]"><RichText content={couple.groomName} /></h4>
                {couple.groomTitle && (
                  <p className="text-xs text-[#9E814D] tracking-wider uppercase font-medium mt-1 mb-3">
                    <RichText content={couple.groomTitle} />
                  </p>
                )}
                <p className="text-xs sm:text-sm text-[#665E55] font-light leading-relaxed">
                  <RichText content={couple.groomBio} />
                </p>
              </div>

              {/* Bride */}
              <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#F8F5EF] border border-[#C9B38C]/30 shadow-sm">
                <div className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-[#C9B38C] mb-5 shadow-md">
                  <Image
                    src={couple.bridePhoto}
                    alt={couple.brideName.replace(/<[^>]*>/g, "")}
                    fill
                    sizes="150px"
                    className="object-cover"
                  />
                </div>
                <h4 className="font-editorial-serif text-2xl text-[#202020]"><RichText content={couple.brideName} /></h4>
                {couple.brideTitle && (
                  <p className="text-xs text-[#9E814D] tracking-wider uppercase font-medium mt-1 mb-3">
                    <RichText content={couple.brideTitle} />
                  </p>
                )}
                <p className="text-xs sm:text-sm text-[#665E55] font-light leading-relaxed">
                  <RichText content={couple.brideBio} />
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
