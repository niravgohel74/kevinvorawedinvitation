"use client";
import React from "react";

interface MotifProps {
  className?: string;
  variant?: "divider" | "corner" | "mandap" | "flourish" | "ring";
}

export function BotanicalMotif({ className = "", variant = "divider" }: MotifProps) {
  if (variant === "flourish") {
    return (
      <svg
        viewBox="0 0 100 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`inline-block ${className}`}
        aria-hidden="true"
      >
        <path
          d="M2 12C20 12 35 4 50 12C65 20 80 12 98 12"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeLinecap="round"
        />
        <circle cx="50" cy="12" r="2.5" fill="currentColor" />
        <circle cx="35" cy="8" r="1.5" fill="currentColor" fillOpacity="0.6" />
        <circle cx="65" cy="16" r="1.5" fill="currentColor" fillOpacity="0.6" />
      </svg>
    );
  }

  if (variant === "corner") {
    return (
      <svg
        viewBox="0 0 60 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M2 58V18C2 9.16344 9.16344 2 18 2H58"
          stroke="currentColor"
          strokeWidth="0.8"
        />
        <path
          d="M10 58V24C10 16.268 16.268 10 24 10H58"
          stroke="currentColor"
          strokeWidth="0.5"
          strokeDasharray="2 3"
        />
        <circle cx="18" cy="18" r="2" fill="currentColor" />
      </svg>
    );
  }

  if (variant === "mandap") {
    return (
      <svg
        viewBox="0 0 140 30"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <path
          d="M5 25L70 5L135 25"
          stroke="currentColor"
          strokeWidth="0.75"
        />
        <path
          d="M20 25L70 11L120 25"
          stroke="currentColor"
          strokeWidth="0.5"
        />
        <circle cx="70" cy="5" r="3" fill="currentColor" />
        <path
          d="M70 1V5"
          stroke="currentColor"
          strokeWidth="0.75"
        />
      </svg>
    );
  }

  if (variant === "ring") {
    return (
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-hidden="true"
      >
        <circle cx="16" cy="20" r="11" stroke="currentColor" strokeWidth="1" />
        <circle cx="24" cy="20" r="11" stroke="currentColor" strokeWidth="1" />
        <circle cx="20" cy="14" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // Default elegant divider
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#C9B38C] to-transparent" />
      <svg
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4 text-[#C9B38C]"
        aria-hidden="true"
      >
        <path
          d="M10 2L12.5 7.5L18 10L12.5 12.5L10 18L7.5 12.5L2 10L7.5 7.5L10 2Z"
          fill="currentColor"
          fillOpacity="0.7"
        />
      </svg>
      <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-[#C9B38C] to-transparent" />
    </div>
  );
}
