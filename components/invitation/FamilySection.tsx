"use client";
import React from "react";
import { FamilyInfo } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { RichText } from "@/components/ui/RichText";

interface FamilySectionProps {
  family: FamilyInfo;
}

export function FamilySection({ family }: FamilySectionProps) {
  return (
    <section className="relative py-24 sm:py-32 bg-[#F8F5EF] text-[#202020] border-t border-[#E9E1D5]">
      <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
        {/* Section Heading */}
        <div className="space-y-3">
          <p className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Elders & Heritage
          </p>
          <h2 className="font-editorial-serif text-3xl sm:text-4xl md:text-5xl font-normal tracking-wide text-[#202020]">
            With The Blessings Of
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
        </div>

        {/* Both Families Display - Groom Family First */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 max-w-2xl mx-auto pt-4">
          {/* Groom Family */}
          <div className="p-8 rounded-2xl bg-[#FCFAF6] border border-[#C9B38C]/35 space-y-3 shadow-sm">
            <h3 className="font-editorial-serif text-2xl sm:text-3xl text-[#202020]">
              <RichText content={family.groomFamilyTitle || "The Groom's Family"} />
            </h3>
            <p className="text-xs sm:text-sm text-[#736B63] font-light leading-relaxed">
              <RichText content={family.groomParents} />
            </p>
          </div>

          {/* Bride Family */}
          <div className="p-8 rounded-2xl bg-[#FCFAF6] border border-[#C9B38C]/35 space-y-3 shadow-sm">
            <h3 className="font-editorial-serif text-2xl sm:text-3xl text-[#202020]">
              <RichText content={family.brideFamilyTitle || "The Bride's Family"} />
            </h3>
            <p className="text-xs sm:text-sm text-[#736B63] font-light leading-relaxed">
              <RichText content={family.brideParents} />
            </p>
          </div>
        </div>

        {/* Blessings Note */}
        {family.blessingQuote && (
          <p className="max-w-xl mx-auto font-editorial-serif text-base sm:text-lg italic text-[#665E55] pt-4">
            &ldquo;<RichText content={family.blessingQuote} />&rdquo;
          </p>
        )}
      </div>
    </section>
  );
}
