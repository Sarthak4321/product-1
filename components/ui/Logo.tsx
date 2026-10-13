"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | number;
  showWordmark?: boolean;
  subtitle?: string;
  variant?: "dark" | "light" | "color";
}

/**
 * LeadDesk Ultra-Minimal Logo Icon
 * Two clean geometric strokes:
 * 1. The 'L' Foundation (Desk / Platform) in Cobalt Blue
 * 2. The Upward Growth Arrow (Lead / Conversion) in Cyan
 */
export function LogoIcon({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="LeadDesk Logo"
    >
      {/* Minimal Dark Squircle Base */}
      <rect width="32" height="32" rx="8" fill="#0F172A" />

      {/* Bold 'L' Foundation Path */}
      <path
        d="M9.5 8V20.5C9.5 21.8807 10.6193 23 12 23H22.5"
        stroke="#2563EB"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Minimal Ascending Lead Arrow */}
      <path
        d="M17 9.5H23.5V16"
        stroke="#38BDF8"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23.5 9.5L14.5 18.5"
        stroke="#38BDF8"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  className = "",
  size = "md",
  showWordmark = true,
  subtitle = "Institute Operating System",
  variant = "dark",
}: LogoProps) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 26
      : size === "md"
      ? 32
      : size === "lg"
      ? 40
      : 48;

  const isDark = variant === "dark";

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <LogoIcon size={pixelSize} />
      {showWordmark && (
        <div className="flex flex-col">
          <span
            className={`font-black tracking-tight leading-none ${
              pixelSize >= 40 ? "text-xl" : pixelSize >= 32 ? "text-lg" : "text-base"
            } ${isDark ? "text-slate-900" : "text-white"}`}
          >
            LeadDesk
          </span>
          {subtitle && (
            <span
              className={`text-[10px] font-bold tracking-wider uppercase mt-0.5 ${
                isDark ? "text-slate-500" : "text-slate-400"
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
