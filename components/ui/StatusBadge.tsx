import React from "react";

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "NOT_INTERESTED"
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "CONVERTED"
  | string;

export interface StatusBadgeProps {
  status: LeadStatus;
  size?: "sm" | "md";
  className?: string;
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  NEW: {
    label: "New",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-500",
    border: "border-blue-200",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-500",
    border: "border-slate-200",
  },
  INTERESTED: {
    label: "Interested",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
  },
  FOLLOW_UP: {
    label: "Follow-up",
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  NOT_INTERESTED: {
    label: "Not Interested",
    bg: "bg-zinc-100",
    text: "text-zinc-600",
    dot: "bg-zinc-400",
    border: "border-zinc-200",
  },
  NO_ANSWER: {
    label: "No Answer",
    bg: "bg-rose-50",
    text: "text-rose-700",
    dot: "bg-rose-500",
    border: "border-rose-200",
  },
  WRONG_NUMBER: {
    label: "Wrong Number",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
    border: "border-red-200",
  },
  CONVERTED: {
    label: "Converted",
    bg: "bg-teal-50",
    text: "text-teal-800",
    dot: "bg-teal-600",
    border: "border-teal-200",
  },
};

export function StatusBadge({ status, size = "md", className = "" }: StatusBadgeProps) {
  const upper = (status || "NEW").toUpperCase();
  const config = STATUS_CONFIG[upper] || {
    label: status,
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
    border: "border-slate-200",
  };

  const sizeClasses =
    size === "sm"
      ? "text-[11px] px-2 py-0.5 gap-1.5"
      : "text-xs px-2.5 py-1 gap-1.5 font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
