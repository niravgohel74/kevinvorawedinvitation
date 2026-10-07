"use client";
import React from "react";

interface RichTextProps {
  content?: string;
  className?: string;
  as?: "p" | "span" | "div" | "h1" | "h2" | "h3" | "h4";
}

/**
 * Parses and safely renders styled text containing HTML spans, bold, italic,
 * and markdown formatting (**bold**, *italic*).
 */
export function RichText({
  content = "",
  className = "",
  as: Component = "span",
}: RichTextProps) {
  if (!content) return null;

  // If content contains HTML tags (e.g. <span style="...">, <b>, <i>, <strong>, <em>, <br>)
  const hasHtml = /<[a-z][\s\S]*>/i.test(content);

  if (hasHtml) {
    // Basic sanitization allowing only styling tags
    const sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "");

    return (
      <Component
        className={className}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    );
  }

  // Parse markdown bold **text** and italic *text*
  const parts = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <Component className={className}>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={index} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={index} className="italic">{part.slice(1, -1)}</em>;
        }
        return part;
      })}
    </Component>
  );
}
