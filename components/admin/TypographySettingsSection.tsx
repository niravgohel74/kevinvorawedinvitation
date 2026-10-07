"use client";
import React from "react";
import { TextStyling } from "@/types/wedding";
import { Type, Palette, Sparkles, Sliders, Check } from "lucide-react";

interface TypographySettingsSectionProps {
  styling: TextStyling;
  onChange: (updated: TextStyling) => void;
  groomName: string;
  brideName: string;
  onGlobalResetStyling?: () => void;
}

const HEADING_FONTS = [
  {
    id: "editorial-serif",
    name: "Cormorant Garamond",
    subtitle: "Editorial Luxury Serif",
    cssFamily: "'Cormorant Garamond', Georgia, serif",
    sample: "Kevin & Moksha",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    subtitle: "Classic Regal Serif",
    cssFamily: "'Playfair Display', Georgia, serif",
    sample: "Kevin & Moksha",
  },
  {
    id: "cinzel",
    name: "Cinzel",
    subtitle: "Imperial Heritage Roman",
    cssFamily: "'Cinzel', Georgia, serif",
    sample: "KEVIN & MOKSHA",
  },
  {
    id: "great-vibes",
    name: "Great Vibes",
    subtitle: "Romantic Calligraphy Script",
    cssFamily: "'Great Vibes', cursive",
    sample: "Kevin & Moksha",
  },
  {
    id: "inter",
    name: "Plus Jakarta Sans",
    subtitle: "Modern Minimalist Clean",
    cssFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    sample: "Kevin & Moksha",
  },
];

const QUICK_COLORS = [
  { label: "Deep Charcoal", hex: "#202020" },
  { label: "Royal Gold", hex: "#9E814D" },
  { label: "Champagne", hex: "#C9B38C" },
  { label: "Warm Beige", hex: "#7A5C28" },
  { label: "Muted Rose", hex: "#B58F8F" },
  { label: "Soft Muted", hex: "#665E55" },
  { label: "Pure White", hex: "#FFFFFF" },
  { label: "Emerald", hex: "#1F4E38" },
  { label: "Maroon", hex: "#5C1D2E" },
];

export function TypographySettingsSection({
  styling,
  onChange,
  groomName,
  brideName,
  onGlobalResetStyling,
}: TypographySettingsSectionProps) {
  const currentStyling: TextStyling = {
    headingFont: styling?.headingFont || "editorial-serif",
    bodyFont: styling?.bodyFont || "sans",
    fontSizeScale: styling?.fontSizeScale || "normal",
    headingColor: styling?.headingColor || "#202020",
    accentColor: styling?.accentColor || "#9E814D",
    bodyColor: styling?.bodyColor || "#665E55",
    isBoldHeading: Boolean(styling?.isBoldHeading),
    isItalicHeading: Boolean(styling?.isItalicHeading),
  };

  const update = (partial: Partial<TextStyling>) => {
    onChange({ ...currentStyling, ...partial });
  };

  const selectedFontObj =
    HEADING_FONTS.find((f) => f.id === currentStyling.headingFont) ||
    HEADING_FONTS[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner with Global Reset Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#F8F5EF] via-[#FAF8F5] to-[#F5EFE6] border border-[#C9B38C]/40 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white border border-[#C9B38C]/50 flex items-center justify-center shadow-xs text-[#9E814D]">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-editorial-serif text-xl sm:text-2xl text-[#202020] font-medium">
              Global Typography &amp; Color Theme
            </h3>
            <p className="text-xs text-[#736B63] mt-0.5">
              Customize invitation fonts, sizes, and color palettes with instant live sync.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() =>
              onChange({
                headingFont: "editorial-serif",
                bodyFont: "sans",
                fontSizeScale: "normal",
                headingColor: "#202020",
                accentColor: "#9E814D",
                bodyColor: "#665E55",
                isBoldHeading: false,
                isItalicHeading: false,
              })
            }
            className="text-xs px-3.5 py-1.5 rounded-lg border border-[#C9B38C]/60 text-[#7A5C28] hover:bg-white transition-colors shadow-2xs font-medium"
          >
            Reset Theme Colors
          </button>

          {onGlobalResetStyling && (
            <button
              type="button"
              onClick={onGlobalResetStyling}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-stone-800 text-white hover:bg-black transition-colors shadow-2xs font-medium flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Reset All Text Styles Globally</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Heading Font Selection Grid */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-[#9E814D]" />
          <span>Primary Invitation Heading Font</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {HEADING_FONTS.map((font) => {
            const isSelected = currentStyling.headingFont === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => update({ headingFont: font.id })}
                className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between h-28 relative ${
                  isSelected
                    ? "bg-white border-[#9E814D] ring-2 ring-[#C9B38C]/30 shadow-sm"
                    : "bg-[#FCFAF6] border-[#E9E1D5] hover:border-[#C9B38C]/70 hover:bg-white"
                }`}
              >
                {isSelected && (
                  <span className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#9E814D] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
                <div>
                  <span className="text-xs font-medium text-[#202020] block">
                    {font.name}
                  </span>
                  <span className="text-[10px] text-[#8C847B]">
                    {font.subtitle}
                  </span>
                </div>
                <div
                  className="text-lg text-[#9E814D] truncate pt-1"
                  style={{ fontFamily: font.cssFamily }}
                >
                  {groomName || "Kevin"} &amp; {brideName || "Moksha"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Heading Size Scale & Styling Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#FCFAF6] border border-[#E9E1D5]">
        {/* Font Size Scale */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#9E814D]" />
            <span>Title Size Scale</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "normal", label: "Standard" },
              { id: "large", label: "Large (+15%)" },
              { id: "extra-large", label: "Regal (+30%)" },
            ].map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => update({ fontSizeScale: size.id as any })}
                className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                  currentStyling.fontSizeScale === size.id
                    ? "bg-[#9E814D] text-white border-[#9E814D] shadow-xs"
                    : "bg-white text-[#5A524A] border-[#E9E1D5] hover:border-[#C9B38C]"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bold & Italic Accents */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#9E814D]" />
            <span>Heading Style Modifier</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => update({ isBoldHeading: !currentStyling.isBoldHeading })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                currentStyling.isBoldHeading
                  ? "bg-[#9E814D] text-white border-[#9E814D] shadow-xs"
                  : "bg-white text-[#5A524A] border-[#E9E1D5] hover:border-[#C9B38C]"
              }`}
            >
              <span className="font-bold">Bold Titles</span>
              {currentStyling.isBoldHeading && <Check className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => update({ isItalicHeading: !currentStyling.isItalicHeading })}
              className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                currentStyling.isItalicHeading
                  ? "bg-[#9E814D] text-white border-[#9E814D] shadow-xs"
                  : "bg-white text-[#5A524A] border-[#E9E1D5] hover:border-[#C9B38C]"
              }`}
            >
              <span className="italic">Italic Titles</span>
              {currentStyling.isItalicHeading && <Check className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Color Pickers with Hex Code inputs */}
      <div className="space-y-3">
        <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider block flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#9E814D]" />
          <span>Color Palette (Color Picker &amp; Hex Code)</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* A. Primary Heading Color */}
          <div className="p-4 rounded-xl bg-white border border-[#E9E1D5] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#202020]">
                Headings Color
              </span>
              <span
                className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-2xs"
                style={{ backgroundColor: currentStyling.headingColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentStyling.headingColor}
                onChange={(e) => update({ headingColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-[#E9E1D5] cursor-pointer p-0 bg-transparent shrink-0"
              />
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                  #
                </span>
                <input
                  type="text"
                  value={currentStyling.headingColor.replace("#", "")}
                  onChange={(e) =>
                    update({
                      headingColor:
                        "#" +
                        e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6),
                    })
                  }
                  className="w-full pl-6 pr-2 py-1.5 text-xs font-mono rounded-lg border border-[#E9E1D5] bg-[#FCFAF6] uppercase"
                  placeholder="202020"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_COLORS.slice(0, 5).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => update({ headingColor: c.hex })}
                  className="w-5 h-5 rounded-md border border-black/15 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* B. Royal Accent / Gold Color */}
          <div className="p-4 rounded-xl bg-white border border-[#E9E1D5] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#202020]">
                Royal Accent &amp; Gold
              </span>
              <span
                className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-2xs"
                style={{ backgroundColor: currentStyling.accentColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentStyling.accentColor}
                onChange={(e) => update({ accentColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-[#E9E1D5] cursor-pointer p-0 bg-transparent shrink-0"
              />
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                  #
                </span>
                <input
                  type="text"
                  value={currentStyling.accentColor.replace("#", "")}
                  onChange={(e) =>
                    update({
                      accentColor:
                        "#" +
                        e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6),
                    })
                  }
                  className="w-full pl-6 pr-2 py-1.5 text-xs font-mono rounded-lg border border-[#E9E1D5] bg-[#FCFAF6] uppercase"
                  placeholder="9E814D"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_COLORS.slice(1, 6).map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => update({ accentColor: c.hex })}
                  className="w-5 h-5 rounded-md border border-black/15 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          {/* C. Body & Paragraph Text Color */}
          <div className="p-4 rounded-xl bg-white border border-[#E9E1D5] space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#202020]">
                Body &amp; Descriptions
              </span>
              <span
                className="w-4 h-4 rounded-full border border-black/10 inline-block shadow-2xs"
                style={{ backgroundColor: currentStyling.bodyColor }}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentStyling.bodyColor}
                onChange={(e) => update({ bodyColor: e.target.value })}
                className="w-9 h-9 rounded-lg border border-[#E9E1D5] cursor-pointer p-0 bg-transparent shrink-0"
              />
              <div className="relative flex-1">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                  #
                </span>
                <input
                  type="text"
                  value={currentStyling.bodyColor.replace("#", "")}
                  onChange={(e) =>
                    update({
                      bodyColor:
                        "#" +
                        e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6),
                    })
                  }
                  className="w-full pl-6 pr-2 py-1.5 text-xs font-mono rounded-lg border border-[#E9E1D5] bg-[#FCFAF6] uppercase"
                  placeholder="665E55"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {QUICK_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => update({ bodyColor: c.hex })}
                  className="w-5 h-5 rounded-md border border-black/15 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Visual Theme Showcase Card */}
      <div className="p-6 rounded-2xl bg-[#FCFAF6] border border-[#C9B38C]/40 space-y-3 shadow-sm">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9E814D] block">
          Live Theme Preview Card
        </span>
        <div className="p-5 rounded-xl bg-[#F8F5EF] border border-[#E9E1D5] space-y-2 text-center">
          <span
            className="text-[11px] font-medium tracking-[0.3em] uppercase block"
            style={{ color: currentStyling.accentColor }}
          >
            The Wedding Celebration
          </span>
          <h2
            className="text-3xl sm:text-4xl"
            style={{
              fontFamily: selectedFontObj.cssFamily,
              color: currentStyling.headingColor,
              fontWeight: currentStyling.isBoldHeading ? "bold" : "normal",
              fontStyle: currentStyling.isItalicHeading ? "italic" : "normal",
            }}
          >
            {groomName || "Kevin"} &amp; {brideName || "Moksha"}
          </h2>
          <p
            className="text-xs sm:text-sm max-w-md mx-auto pt-1 italic font-light leading-relaxed"
            style={{ color: currentStyling.bodyColor }}
          >
            &ldquo;In the quiet rhythm of our laughter and in every shared dream, we found our forever.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}
