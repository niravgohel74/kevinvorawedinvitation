"use client";
import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Palette,
  Type,
  Eye,
  RotateCcw,
} from "lucide-react";
import { RichText } from "@/components/ui/RichText";

interface RichTextEditorFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  helpText?: string;
  className?: string;
}

const PRESET_COLORS = [
  { name: "Royal Gold", hex: "#9E814D" },
  { name: "Bright Gold", hex: "#D4AF37" },
  { name: "Champagne", hex: "#C9B38C" },
  { name: "Muted Rose", hex: "#B58F8F" },
  { name: "Warm Charcoal", hex: "#202020" },
  { name: "Soft Muted", hex: "#665E55" },
  { name: "Pure White", hex: "#FFFFFF" },
  { name: "Emerald Green", hex: "#2E5A44" },
  { name: "Wine Maroon", hex: "#6E2639" },
];

const FONT_OPTIONS = [
  { label: "Default Font", value: "" },
  { label: "Cormorant (Serif)", value: "'Cormorant Garamond', serif" },
  { label: "Playfair (Royal)", value: "'Playfair Display', serif" },
  { label: "Cinzel (Imperial)", value: "'Cinzel', serif" },
  { label: "Great Vibes (Script)", value: "'Great Vibes', cursive" },
  { label: "Modern (Sans)", value: "'Plus Jakarta Sans', sans-serif" },
];

const FONT_SIZES = [
  { label: "Normal Size", value: "" },
  { label: "Small (0.85x)", value: "0.85em" },
  { label: "Medium (1.15x)", value: "1.15em" },
  { label: "Large (1.35x)", value: "1.35em" },
  { label: "Display (1.6x)", value: "1.6em" },
];

export function RichTextEditorField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder = "",
  helpText,
  className = "",
}: RichTextEditorFieldProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customHex, setCustomHex] = useState("#9E814D");
  const [showPreview, setShowPreview] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper to wrap currently selected text in HTML tags
  const applyTagToSelection = (openTag: string, closeTag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText.length > 0) {
      const newText =
        value.substring(0, start) +
        openTag +
        selectedText +
        closeTag +
        value.substring(end);
      onChange(newText);

      // Reset selection around the newly wrapped text
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + openTag.length,
          end + openTag.length
        );
      }, 0);
    } else {
      // If nothing selected, append or insert at cursor
      const placeholderText = "styled text";
      const newText =
        value.substring(0, start) +
        openTag +
        placeholderText +
        closeTag +
        value.substring(end);
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + openTag.length,
          start + openTag.length + placeholderText.length
        );
      }, 0);
    }
  };

  const handleBold = () => {
    applyTagToSelection("<b>", "</b>");
  };

  const handleItalic = () => {
    applyTagToSelection("<i>", "</i>");
  };

  const handleColor = (hex: string) => {
    applyTagToSelection(`<span style="color: ${hex}">`, "</span>");
    setShowColorPicker(false);
  };

  const handleFontFamily = (fontFamily: string) => {
    if (!fontFamily) return;
    applyTagToSelection(
      `<span style="font-family: ${fontFamily}">`,
      "</span>"
    );
  };

  const handleFontSize = (fontSize: string) => {
    if (!fontSize) return;
    applyTagToSelection(`<span style="font-size: ${fontSize}">`, "</span>");
  };

  const handleClearFormatting = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText.length > 0) {
      const cleaned = selectedText.replace(/<[^>]*>/g, "");
      const newText =
        value.substring(0, start) + cleaned + value.substring(end);
      onChange(newText);
    } else {
      // If nothing selected, clear all tags in the entire string
      const cleanedAll = value.replace(/<[^>]*>/g, "");
      onChange(cleanedAll);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#5A524A] uppercase tracking-wider block">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-[11px] text-[#9E814D] hover:underline flex items-center gap-1 font-medium"
        >
          <Eye className="w-3 h-3" />
          <span>{showPreview ? "Hide Live Preview" : "Show Live Preview"}</span>
        </button>
      </div>

      {/* Luxury Styling Toolbar */}
      <div className="rounded-xl border border-[#E9E1D5] bg-[#FCFAF6] overflow-hidden focus-within:ring-2 focus-within:ring-[#C9B38C] focus-within:border-transparent transition-all shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 bg-[#F6F2EB] border-b border-[#E9E1D5] text-[#5A524A]">
          {/* Bold */}
          <button
            type="button"
            onClick={handleBold}
            title="Make selection Bold (<b>)"
            className="p-1.5 rounded-md hover:bg-white text-[#202020] transition-colors shadow-2xs border border-transparent hover:border-[#C9B38C]/40"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={handleItalic}
            title="Make selection Italic (<i>)"
            className="p-1.5 rounded-md hover:bg-white text-[#202020] transition-colors shadow-2xs border border-transparent hover:border-[#C9B38C]/40"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-4 bg-[#D9CFBE] mx-0.5" />

          {/* Color Picker Popover Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium hover:bg-white transition-colors border border-transparent hover:border-[#C9B38C]/40 shadow-2xs"
            >
              <Palette className="w-3.5 h-3.5 text-[#9E814D]" />
              <span
                className="w-3 h-3 rounded-full border border-black/10 inline-block shadow-2xs"
                style={{ backgroundColor: customHex }}
              />
              <span className="text-[10px] uppercase font-mono">{customHex}</span>
            </button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1.5 p-3 rounded-xl bg-white border border-[#C9B38C] shadow-xl z-30 w-64 space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E814D]">
                    Choose Text Color
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs"
                  >
                    ✕
                  </button>
                </div>

                {/* Preset Palettes */}
                <div className="grid grid-cols-5 gap-1.5">
                  {PRESET_COLORS.map((col) => (
                    <button
                      key={col.hex}
                      type="button"
                      onClick={() => handleColor(col.hex)}
                      title={col.name}
                      className="w-8 h-8 rounded-lg border border-black/15 shadow-2xs hover:scale-110 transition-transform relative flex items-center justify-center"
                      style={{ backgroundColor: col.hex }}
                    >
                      {customHex.toLowerCase() === col.hex.toLowerCase() && (
                        <span className="w-1.5 h-1.5 rounded-full bg-black/40" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom HEX Code Field + Native Picker */}
                <div className="pt-1.5 border-t border-stone-100 flex items-center gap-2">
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => setCustomHex(e.target.value)}
                    className="w-8 h-8 rounded border border-[#E9E1D5] cursor-pointer p-0 bg-transparent shrink-0"
                  />
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono">
                      #
                    </span>
                    <input
                      type="text"
                      value={customHex.replace("#", "")}
                      onChange={(e) =>
                        setCustomHex("#" + e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6))
                      }
                      placeholder="9E814D"
                      className="w-full pl-6 pr-2 py-1 text-xs font-mono rounded-lg border border-[#E9E1D5] bg-[#FCFAF6] uppercase"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleColor(customHex)}
                    className="px-2.5 py-1 rounded-lg bg-[#9E814D] text-white text-[11px] font-medium hover:bg-[#856C3E] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          <span className="w-[1px] h-4 bg-[#D9CFBE] mx-0.5" />

          {/* Font Family Dropdown */}
          <div className="flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-[#9E814D] shrink-0" />
            <select
              onChange={(e) => {
                handleFontFamily(e.target.value);
                e.target.value = "";
              }}
              className="text-[11px] py-1 px-1.5 rounded-md border border-transparent hover:border-[#C9B38C]/40 bg-transparent hover:bg-white text-[#202020] cursor-pointer focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled>
                Font Style...
              </option>
              {FONT_OPTIONS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Dropdown */}
          <select
            onChange={(e) => {
              handleFontSize(e.target.value);
              e.target.value = "";
            }}
            className="text-[11px] py-1 px-1.5 rounded-md border border-transparent hover:border-[#C9B38C]/40 bg-transparent hover:bg-white text-[#202020] cursor-pointer focus:outline-none"
            defaultValue=""
          >
            <option value="" disabled>
              Size...
            </option>
            {FONT_SIZES.map((s) => (
              <option key={s.label} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <span className="w-[1px] h-4 bg-[#D9CFBE] mx-0.5" />

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={handleClearFormatting}
            title="Clear formatting on selection (or entire field)"
            className="p-1.5 rounded-md hover:bg-white text-stone-500 hover:text-stone-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 text-sm text-[#202020] bg-transparent focus:outline-none resize-y placeholder:text-stone-400 font-sans"
        />
      </div>

      {/* Real-time Visual Formatted Preview */}
      {showPreview && value && (
        <div className="p-3 rounded-xl bg-[#F8F5EF] border border-[#C9B38C]/40 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-[#9E814D] uppercase">
            <span>Live Rendered Preview</span>
            <span className="font-normal text-stone-400 text-[9px] lowercase font-mono">
              supports &lt;b&gt;, &lt;i&gt;, colors, fonts
            </span>
          </div>
          <div className="text-sm leading-relaxed text-[#202020] pt-0.5">
            <RichText content={value} as="div" />
          </div>
        </div>
      )}

      {helpText && <p className="text-[11px] text-[#8C847B]">{helpText}</p>}
    </div>
  );
}
