"use client";
import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { GalleryItem } from "@/types/wedding";
import { BotanicalMotif } from "@/components/ui/BotanicalMotif";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";

interface GallerySectionProps {
  gallery: GalleryItem[];
}

export function GallerySection({ gallery }: GallerySectionProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const sortedGallery = [...gallery].sort((a, b) => a.order - b.order);

  const categories = [
    { label: "All Memories", value: "all" },
    { label: "Ceremony", value: "ceremony" },
    { label: "Pre-Wedding", value: "pre-wedding" },
    { label: "Details", value: "details" },
    { label: "Candid", value: "candid" },
  ];

  const filteredItems = activeCategory === "all"
    ? sortedGallery
    : sortedGallery.filter((item) => item.category?.toLowerCase() === activeCategory.toLowerCase());

  const handleNext = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx + 1) % filteredItems.length);
  };

  const handlePrev = () => {
    if (selectedIdx === null) return;
    setSelectedIdx((selectedIdx - 1 + filteredItems.length) % filteredItems.length);
  };

  const currentItem = selectedIdx !== null ? filteredItems[selectedIdx] : null;

  return (
    <section id="gallery" className="relative py-24 sm:py-32 bg-[#FFFCF7] text-[#202020] border-t border-[#E9E1D5]">
      <div className="max-w-6xl mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center space-y-3 mb-12 sm:mb-16">
          <span className="text-[11px] sm:text-xs font-medium tracking-[0.35em] text-[#9E814D] uppercase">
            Visual Memories
          </span>
          <h2 className="font-editorial-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-wide text-[#202020]">
            The Gallery
          </h2>
          <div className="pt-2">
            <BotanicalMotif variant="divider" />
          </div>
          <p className="text-xs sm:text-sm text-[#736B63] font-light">
            Glimpses of love, laughter, and tender beginnings.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setActiveCategory(cat.value)}
              className={`px-4 py-1.5 rounded-full text-xs tracking-wider transition-all duration-300 ${
                activeCategory === cat.value
                  ? "bg-[#202020] text-[#FCFAF6] shadow-sm"
                  : "bg-[#F8F5EF] text-[#736B63] hover:text-[#202020] border border-[#E9E1D5]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Asymmetric Editorial Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map((item, idx) => {
            // Asymmetric height spans based on aspect
            const isTall = item.aspect === "portrait" || idx % 4 === 1;
            const heightClass = isTall ? "h-96 sm:h-[430px]" : "h-72 sm:h-80";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.6, delay: idx * 0.08 }}
                onClick={() => setSelectedIdx(idx)}
                className={`group relative rounded-2xl overflow-hidden cursor-pointer bg-[#F8F5EF] border border-[#C9B38C]/30 shadow-md ${heightClass}`}
              >
                <Image
                  src={item.url}
                  alt={item.caption || "Wedding gallery photo"}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                
                {/* Subtle vignette & caption overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5 text-white">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-editorial-serif tracking-wide text-[#E5D3B3]">
                      {item.caption || "Cherished moment"}
                    </p>
                    <Maximize2 className="w-4 h-4 text-[#C9B38C]" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-8"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setSelectedIdx(null)}
              className="absolute top-6 right-6 z-50 p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Close image lightbox"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Navigation Buttons */}
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Lightbox Image Container */}
            <div className="relative max-w-4xl max-h-[85vh] w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={currentItem.url}
                  alt={currentItem.caption || "Expanded photo"}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>

              {/* Caption & Counter */}
              <div className="mt-4 text-center text-white space-y-1">
                <p className="font-editorial-serif text-lg sm:text-xl text-[#E5D3B3]">
                  {currentItem.caption}
                </p>
                <p className="text-xs text-white/50 tracking-widest uppercase">
                  {selectedIdx !== null ? selectedIdx + 1 : 1} of {filteredItems.length}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
