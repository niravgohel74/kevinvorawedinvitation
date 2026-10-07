"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bold,
  Italic,
  Palette,
  Type,
  Eye,
  Eraser,
  RotateCcw,
  Sparkles,
  Code,
} from "lucide-react";
import { RichText } from "@/components/ui/RichText";

export interface RichTextEditorFieldProps {
  label: string;
  value?: string | null;
  onChange: (val: string) => void;
  rows?: number;
  placeholder?: string;
  helpText?: string;
  className?: string;
  required?: boolean;
  defaultOriginalValue?: string;
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
  { name: "Royal Navy", hex: "#1B365D" },
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
  { label: "Default Size", value: "" },
  { label: "Small (0.85x)", value: "0.85em" },
  { label: "Normal (1.0x)", value: "1em" },
  { label: "Medium (1.15x)", value: "1.15em" },
  { label: "Large (1.35x)", value: "1.35em" },
  { label: "Display (1.6x)", value: "1.6em" },
  { label: "Giant (2.0x)", value: "2em" },
];

export interface ParsedFieldStyle {
  text: string;
  isBold: boolean;
  isItalic: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  hasMixedHtml: boolean;
}

/**
 * Intelligent parser that extracts clean text and all styling tokens (color, font, size, bold, italic)
 * without nesting duplicate or conflicting HTML tags.
 */
export function parseStyleAndText(html: string): ParsedFieldStyle {
  const raw = html || "";
  let text = raw.trim();
  let isBold = false;
  let isItalic = false;
  let color: string | undefined = undefined;
  let fontFamily: string | undefined = undefined;
  let fontSize: string | undefined = undefined;

  // Detect if there are inner tags that don't encompass the entire string (e.g. "Kevin & <b>Moksha</b>")
  const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
  let iterations = 0;

  while (iterations < 10) {
    iterations++;
    const trimmed = text.trim();

    // Check <b> or <strong>
    const bMatch = trimmed.match(/^<(b|strong)>([\s\S]*)<\/\1>$/i);
    if (bMatch) {
      isBold = true;
      text = bMatch[2];
      continue;
    }

    // Check <i> or <em>
    const iMatch = trimmed.match(/^<(i|em)>([\s\S]*)<\/\1>$/i);
    if (iMatch) {
      isItalic = true;
      text = iMatch[2];
      continue;
    }

    // Check <span style="...">
    const spanMatch = trimmed.match(/^<span\s+style=["']([^"']*)["']>([\s\S]*)<\/span>$/i);
    if (spanMatch) {
      const styleStr = spanMatch[1];
      text = spanMatch[2];

      const colorMatch = styleStr.match(/color:\s*([^;]+)/i);
      if (colorMatch && !color) color = colorMatch[1].trim();

      const fontMatch = styleStr.match(/font-family:\s*([^;]+)/i);
      if (fontMatch && !fontFamily) fontFamily = fontMatch[1].trim();

      const sizeMatch = styleStr.match(/font-size:\s*([^;]+)/i);
      if (sizeMatch && !fontSize) fontSize = sizeMatch[1].trim();

      if (/font-weight:\s*bold/i.test(styleStr)) isBold = true;
      if (/font-style:\s*italic/i.test(styleStr)) isItalic = true;
      continue;
    }

    break;
  }

  // If text still contains other HTML tags, it has mixed inline tags
  const hasMixedHtml = hasHtml && /<[a-z][\s\S]*>/i.test(text);

  return { text, isBold, isItalic, color, fontFamily, fontSize, hasMixedHtml };
}

/**
 * Builds a single, unified, clean HTML element with inline styling.
 * Guaranteed never to produce nested conflicting <span style="color: ..."> tags.
 */
export function buildStyledHtml(
  rawText: string,
  styles: {
    color?: string;
    fontFamily?: string;
    fontSize?: string;
    isBold?: boolean;
    isItalic?: boolean;
  }
): string {
  let result = rawText || "";
  const styleParts: string[] = [];

  if (styles.color) styleParts.push(`color: ${styles.color}`);
  if (styles.fontFamily) styleParts.push(`font-family: ${styles.fontFamily}`);
  if (styles.fontSize) styleParts.push(`font-size: ${styles.fontSize}`);

  if (styleParts.length > 0) {
    result = `<span style="${styleParts.join("; ")}">${result}</span>`;
  }
  if (styles.isItalic) {
    result = `<i>${result}</i>`;
  }
  if (styles.isBold) {
    result = `<b>${result}</b>`;
  }
  return result;
}

export function RichTextEditorField({
  label,
  value,
  onChange,
  rows = 3,
  placeholder = "",
  helpText,
  className = "",
  required = false,
  defaultOriginalValue,
}: RichTextEditorFieldProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customHex, setCustomHex] = useState("#9E814D");
  const [showPreview, setShowPreview] = useState(true);
  const [rawHtmlMode, setRawHtmlMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const colorPickerContainerRef = useRef<HTMLDivElement | null>(null);

  // Parse current value for styles & text
  const parsed = useMemo(() => parseStyleAndText(value || ""), [value]);

  const hasFormatting =
    parsed.isBold ||
    parsed.isItalic ||
    Boolean(parsed.color) ||
    Boolean(parsed.fontFamily) ||
    Boolean(parsed.fontSize) ||
    parsed.hasMixedHtml;

  const canResetToDefault =
    defaultOriginalValue !== undefined && value !== defaultOriginalValue;

  // Auto-dismiss color picker on click outside
  useEffect(() => {
    if (!showColorPicker) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerContainerRef.current &&
        !colorPickerContainerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  // Keep custom hex input in sync with active color
  useEffect(() => {
    if (parsed.color && parsed.color.startsWith("#")) {
      setCustomHex(parsed.color.toUpperCase());
    }
  }, [parsed.color]);

  // Unified style updater: replaces previous styles cleanly without nesting
  const applyStyleUpdate = (updates: {
    color?: string | null;
    fontFamily?: string | null;
    fontSize?: string | null;
    toggleBold?: boolean;
    toggleItalic?: boolean;
    clearFormatting?: boolean;
  }) => {
    const currentVal = value || "";

    if (updates.clearFormatting) {
      const stripped = currentVal.replace(/<[^>]*>/g, "");
      onChange(stripped);
      return;
    }

    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? 0;
    const end = textarea?.selectionEnd ?? 0;
    const hasSelection = end > start && end <= currentVal.length;

    if (hasSelection && rawHtmlMode) {
      // If user selected text in raw HTML mode, wrap or update selection
      const snippet = currentVal.substring(start, end);
      const snippetParsed = parseStyleAndText(snippet);
      const nextStyles = {
        color:
          updates.color !== undefined
            ? (updates.color ?? undefined)
            : snippetParsed.color,
        fontFamily:
          updates.fontFamily !== undefined
            ? (updates.fontFamily ?? undefined)
            : snippetParsed.fontFamily,
        fontSize:
          updates.fontSize !== undefined
            ? (updates.fontSize ?? undefined)
            : snippetParsed.fontSize,
        isBold: updates.toggleBold
          ? !snippetParsed.isBold
          : snippetParsed.isBold,
        isItalic: updates.toggleItalic
          ? !snippetParsed.isItalic
          : snippetParsed.isItalic,
      };
      const updatedSnippet = buildStyledHtml(snippetParsed.text, nextStyles);
      const newFull =
        currentVal.substring(0, start) +
        updatedSnippet +
        currentVal.substring(end);
      onChange(newFull);
    } else {
      // Apply style to the entire field cleanly
      const nextStyles = {
        color:
          updates.color !== undefined
            ? (updates.color ?? undefined)
            : parsed.color,
        fontFamily:
          updates.fontFamily !== undefined
            ? (updates.fontFamily ?? undefined)
            : parsed.fontFamily,
        fontSize:
          updates.fontSize !== undefined
            ? (updates.fontSize ?? undefined)
            : parsed.fontSize,
        isBold: updates.toggleBold ? !parsed.isBold : parsed.isBold,
        isItalic: updates.toggleItalic ? !parsed.isItalic : parsed.isItalic,
      };

      const baseText = parsed.text || placeholder || "";
      const newFull = buildStyledHtml(baseText, nextStyles);
      onChange(newFull);
    }
  };

  // Text change handler
  const handleTextChange = (newText: string) => {
    if (rawHtmlMode || parsed.hasMixedHtml) {
      // Direct raw HTML editing
      onChange(newText);
    } else {
      // Keep active styles preserved over newly typed clean text
      const newHtml = buildStyledHtml(newText, {
        color: parsed.color,
        fontFamily: parsed.fontFamily,
        fontSize: parsed.fontSize,
        isBold: parsed.isBold,
        isItalic: parsed.isItalic,
      });
      onChange(newHtml);
    }
  };

  const handleResetToDefault = () => {
    if (defaultOriginalValue !== undefined) {
      onChange(defaultOriginalValue);
    } else {
      const cleaned = (value || "").replace(/<[^>]*>/g, "");
      onChange(cleaned);
    }
  };

  // Content to display in the editable textarea/input
  const displayValue =
    rawHtmlMode || parsed.hasMixedHtml ? value || "" : parsed.text;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Controls Header */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-semibold text-[#5A524A] uppercase tracking-wider flex items-center gap-1.5 truncate">
          <span className="truncate">{label}</span>
          {required && <span className="text-red-500 shrink-0">*</span>}
          {hasFormatting && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-medium bg-[#9E814D]/10 text-[#9E814D] border border-[#9E814D]/25 shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              Styled
            </span>
          )}
        </label>

        <div className="flex items-center gap-2 shrink-0">
          {canResetToDefault && (
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Reset this field back to original default value"
              className="text-[11px] text-[#A66D38] hover:text-[#804E1E] flex items-center gap-1 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setRawHtmlMode(!rawHtmlMode)}
            className={`text-[11px] flex items-center gap-1 font-medium transition-colors ${
              rawHtmlMode
                ? "text-blue-600 underline font-semibold"
                : "text-stone-500 hover:text-stone-800"
            }`}
            title={rawHtmlMode ? "Switch to standard text view" : "Switch to raw HTML tags view"}
          >
            <Code className="w-3 h-3" />
            <span className="hidden sm:inline">{rawHtmlMode ? "HTML View" : "Text"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="text-[11px] text-[#9E814D] hover:underline flex items-center gap-1 font-medium"
            title={showPreview ? "Hide live rendered preview" : "Show live rendered preview"}
          >
            <Eye className="w-3 h-3" />
            <span>{showPreview ? "Hide" : "Preview"}</span>
          </button>
        </div>
      </div>

      {/* Luxury Styling Toolbar & Input Container */}
      <div
        className={`rounded-xl border border-[#E9E1D5] bg-[#FCFAF6] focus-within:ring-2 focus-within:ring-[#C9B38C] focus-within:border-transparent transition-all shadow-2xs relative ${
          showColorPicker ? "z-30" : "z-0"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1 px-2.5 py-1.5 bg-[#F6F2EB] border-b border-[#E9E1D5] text-[#5A524A] rounded-t-[11px]">
          {/* Bold */}
          <button
            type="button"
            onClick={() => applyStyleUpdate({ toggleBold: true })}
            title={parsed.isBold ? "Remove Bold (<b>)" : "Apply Bold (<b>)"}
            className={`p-1 rounded-md transition-colors border ${
              parsed.isBold
                ? "bg-[#C9B38C]/35 text-[#5A3F15] border-[#C9B38C] font-bold shadow-2xs"
                : "hover:bg-white text-[#202020] border-transparent hover:border-[#C9B38C]/40"
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => applyStyleUpdate({ toggleItalic: true })}
            title={parsed.isItalic ? "Remove Italic (<i>)" : "Apply Italic (<i>)"}
            className={`p-1 rounded-md transition-colors border ${
              parsed.isItalic
                ? "bg-[#C9B38C]/35 text-[#5A3F15] border-[#C9B38C] font-bold shadow-2xs"
                : "hover:bg-white text-[#202020] border-transparent hover:border-[#C9B38C]/40"
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <span className="w-[1px] h-3.5 bg-[#D9CFBE] mx-0.5" />

          {/* Color Picker Popover Toggle */}
          <div className="relative" ref={colorPickerContainerRef}>
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${
                showColorPicker
                  ? "bg-white border-[#C9B38C] text-[#202020] shadow-2xs"
                  : "hover:bg-white border-transparent hover:border-[#C9B38C]/40 text-[#5A524A]"
              }`}
              title="Choose text color palette"
            >
              <Palette className="w-3.5 h-3.5 text-[#9E814D]" />
              <span
                className="w-3 h-3 rounded-full border border-black/20 inline-block shadow-2xs shrink-0"
                style={{ backgroundColor: parsed.color || customHex }}
              />
              <span className="text-[10px] uppercase font-mono hidden md:inline">
                {parsed.color || customHex}
              </span>
            </button>

            {/* Complete Floating Color Picker Popover */}
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1.5 p-3 rounded-xl bg-white border border-[#C9B38C] shadow-2xl z-50 w-72 max-w-[calc(100vw-2.5rem)] space-y-2.5 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E814D] flex items-center gap-1">
                    <Palette className="w-3 h-3" />
                    Choose Text Color
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowColorPicker(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs px-1.5 py-0.5 rounded hover:bg-stone-100 transition-colors"
                    title="Close color picker"
                  >
                    ✕
                  </button>
                </div>

                {/* Preset Palettes (10 Luxury Colors in 2 Rows) */}
                <div>
                  <span className="text-[9px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                    Preset Wedding Palette
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PRESET_COLORS.map((col) => {
                      const isCurrentActive =
                        (parsed.color || customHex).toLowerCase() ===
                        col.hex.toLowerCase();
                      return (
                        <button
                          key={col.hex}
                          type="button"
                          onClick={() => {
                            setCustomHex(col.hex);
                            applyStyleUpdate({ color: col.hex });
                            setShowColorPicker(false);
                          }}
                          title={`${col.name} (${col.hex})`}
                          className={`h-7 rounded-lg border shadow-2xs transition-all relative flex items-center justify-center ${
                            isCurrentActive
                              ? "border-[#9E814D] ring-2 ring-[#9E814D]/40 scale-105"
                              : "border-black/15 hover:scale-110"
                          }`}
                          style={{ backgroundColor: col.hex }}
                        >
                          {isCurrentActive && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                col.hex.toUpperCase() === "#FFFFFF"
                                  ? "bg-black"
                                  : "bg-white"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom HEX Code Field + Native Color Wheel Picker */}
                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  <span className="text-[9px] font-semibold text-stone-500 uppercase tracking-wider block">
                    Custom Hex / Wheel
                  </span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customHex.startsWith("#") ? customHex : `#${customHex}`}
                      onChange={(e) => setCustomHex(e.target.value.toUpperCase())}
                      className="w-8 h-8 rounded-lg border border-[#E9E1D5] cursor-pointer p-0.5 bg-white shrink-0 shadow-2xs"
                      title="Open visual color wheel"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-mono select-none">
                        #
                      </span>
                      <input
                        type="text"
                        value={customHex.replace("#", "")}
                        onChange={(e) =>
                          setCustomHex(
                            "#" +
                              e.target.value
                                .replace(/[^0-9a-fA-F]/g, "")
                                .slice(0, 6)
                                .toUpperCase()
                          )
                        }
                        placeholder="9E814D"
                        maxLength={6}
                        className="w-full pl-6 pr-2 py-1 text-xs font-mono rounded-lg border border-[#E9E1D5] bg-[#FCFAF6] uppercase text-[#202020] focus:outline-none focus:ring-1 focus:ring-[#9E814D]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        applyStyleUpdate({ color: customHex });
                        setShowColorPicker(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#9E814D] hover:bg-[#856C3E] text-white text-[11px] font-medium transition-colors shadow-2xs shrink-0"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <span className="w-[1px] h-3.5 bg-[#D9CFBE] mx-0.5" />

          {/* Font Family Dropdown */}
          <div className="flex items-center gap-0.5">
            <Type className="w-3.5 h-3.5 text-[#9E814D] shrink-0 hidden sm:inline" />
            <select
              value={parsed.fontFamily || ""}
              onChange={(e) => {
                applyStyleUpdate({ fontFamily: e.target.value || null });
              }}
              className="text-[11px] py-0.5 px-1 rounded-md border border-transparent hover:border-[#C9B38C]/40 bg-transparent hover:bg-white text-[#202020] cursor-pointer focus:outline-none max-w-[95px] sm:max-w-none"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.label} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Dropdown */}
          <select
            value={parsed.fontSize || ""}
            onChange={(e) => {
              applyStyleUpdate({ fontSize: e.target.value || null });
            }}
            className="text-[11px] py-0.5 px-1 rounded-md border border-transparent hover:border-[#C9B38C]/40 bg-transparent hover:bg-white text-[#202020] cursor-pointer focus:outline-none"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.label} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <span className="w-[1px] h-3.5 bg-[#D9CFBE] mx-0.5" />

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => applyStyleUpdate({ clearFormatting: true })}
            title="Remove styling tags and restore plain text"
            className="flex items-center gap-1 p-1 rounded-md hover:bg-white text-stone-500 hover:text-stone-800 transition-colors text-[11px]"
          >
            <Eraser className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden lg:inline text-[10px]">Clear Tags</span>
          </button>
        </div>

        {/* Input / Textarea */}
        {rows === 1 ? (
          <textarea
            ref={textareaRef}
            rows={1}
            value={displayValue}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
              }
            }}
            placeholder={placeholder}
            className="w-full px-3.5 py-2 text-sm text-[#202020] bg-transparent focus:outline-none resize-none placeholder:text-stone-400 font-sans rounded-b-[11px]"
            style={{ height: "40px" }}
          />
        ) : (
          <textarea
            ref={textareaRef}
            rows={rows}
            value={displayValue}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 text-sm text-[#202020] bg-transparent focus:outline-none resize-y placeholder:text-stone-400 font-sans rounded-b-[11px]"
          />
        )}
      </div>

      {/* Real-time Visual Formatted Preview */}
      {showPreview && (hasFormatting || (value && rows > 1)) && (
        <div className="p-2.5 rounded-xl bg-[#F8F5EF] border border-[#C9B38C]/35 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider text-[#9E814D] uppercase">
            <span>Live Rendered Result</span>
            {hasFormatting && (
              <span className="font-normal text-stone-400 text-[9px] lowercase font-mono">
                HTML tags active
              </span>
            )}
          </div>
          <div className="text-sm leading-relaxed text-[#202020]">
            <RichText content={value || ""} as="div" />
          </div>
        </div>
      )}

      {helpText && <p className="text-[11px] text-[#8C847B]">{helpText}</p>}
    </div>
  );
}
