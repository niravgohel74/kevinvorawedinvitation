"use client";
import React, { useState, useEffect } from "react";
import { Menu, X, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { RichText } from "@/components/ui/RichText";

interface NavProps {
  groomName?: string;
  brideName?: string;
}

export function FloatingNav({ groomName = "K", brideName = "V" }: NavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 150);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cleanGroom = (groomName || "K").replace(/<[^>]*>/g, "").trim();
  const cleanBride = (brideName || "V").replace(/<[^>]*>/g, "").trim();
  const initials = `${cleanGroom[0] || "K"} & ${cleanBride[0] || "V"}`;

  const navLinks = [
    { label: "Story", href: "#story" },
    { label: "Celebration", href: "#events" },
    { label: "Timeline", href: "#timeline" },
    { label: "Venue", href: "#venue" },
    { label: "Gallery", href: "#gallery" },
    { label: "RSVP", href: "#rsvp" },
    { label: "Wishes", href: "#wishes" },
  ];

  const scrollTo = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      {/* Floating Desktop Bar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: scrolled ? 0 : -80, opacity: scrolled ? 1 : 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-5 left-1/2 -translate-x-1/2 z-40 hidden md:flex items-center gap-6 px-6 py-2.5 rounded-full bg-[#1A1816]/85 backdrop-blur-md border border-[#C9B38C]/30 text-white shadow-xl text-xs tracking-[0.2em] uppercase font-light"
      >
        <span className="font-editorial-serif text-sm text-[#C9B38C] font-semibold pr-2 border-r border-[#C9B38C]/30">
          {initials}
        </span>

        {navLinks.map((link) => (
          <button
            key={link.href}
            onClick={() => scrollTo(link.href)}
            className="text-[#D8CFBE] hover:text-[#C9B38C] transition-colors"
          >
            {link.label}
          </button>
        ))}

        <button
          onClick={() => scrollTo("#rsvp")}
          className="ml-2 px-4 py-1.5 rounded-full bg-[#C9B38C] text-[#1A1816] font-medium tracking-widest text-[11px] hover:bg-[#E5D3B3] transition-colors"
        >
          RSVP
        </button>
      </motion.nav>

      {/* Floating Mobile Trigger */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle navigation menu"
          className="w-13 h-13 p-3.5 rounded-full bg-[#1A1816] text-[#C9B38C] border border-[#C9B38C]/40 shadow-2xl flex items-center justify-center active:scale-95 transition-transform"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-22 right-6 z-40 md:hidden w-64 rounded-3xl bg-[#1A1816]/95 backdrop-blur-xl border border-[#C9B38C]/40 p-6 shadow-2xl text-white space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#C9B38C]/20">
              <span className="font-editorial-serif text-lg text-[#C9B38C]">
                <RichText content={groomName} /> &amp; <RichText content={brideName} />
              </span>
              <Heart className="w-4 h-4 text-[#B58F8F]" />
            </div>

            <div className="flex flex-col space-y-3">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollTo(link.href)}
                  className="text-left text-xs uppercase tracking-[0.2em] text-[#D8CFBE] hover:text-[#C9B38C] py-1 transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
