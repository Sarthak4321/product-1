import React from "react";
import Link from "next/link";
import { ChevronRight, Calendar, MapPin, GraduationCap, Phone } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { parseAndNormalizePhone } from "@/lib/phone";
import { isLeadStale, getStaleLabel } from "@/lib/staleness";

export interface LeadCardData {
  id: string;
  phone: string;
  name?: string | null;
  class?: string | null;
  place?: string | null;
  course?: string | null;
  status: string;
  followUpAt?: string | Date | null;
  assignedTo?: { id: string; name: string } | null;
  createdAt: string | Date;
  updatedAt?: string | Date | null;
}

interface LeadCardProps {
  lead: LeadCardData;
}

export function LeadCard({ lead }: LeadCardProps) {
  const parsed = parseAndNormalizePhone(lead.phone);
  const isFollowUp = lead.status === "FOLLOW_UP";
  const followUpDate = lead.followUpAt ? new Date(lead.followUpAt) : null;
  const isOverdue = followUpDate && followUpDate.getTime() < Date.now();

  // Lead staleness calculation using centralized helpers
  const isStale = isLeadStale(lead.status, lead.updatedAt, lead.createdAt);
  const staleLabel = getStaleLabel(lead.updatedAt, lead.createdAt);

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block group bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all active:scale-[0.99] p-4 relative"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left main info */}
        <div className="space-y-1.5 min-w-0 flex-1">
          {/* Name or Phone headline */}
          <div className="flex items-center gap-2 flex-wrap">
            {lead.name ? (
              <h3 className="font-semibold text-slate-900 text-base leading-tight truncate">
                {lead.name}
              </h3>
            ) : (
              <h3 className="font-semibold text-slate-900 text-base tracking-tight font-mono">
                {parsed.display}
              </h3>
            )}
            <StatusBadge status={lead.status} size="sm" />
            {isStale && (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {staleLabel}
              </span>
            )}
          </div>

          {/* Subtitle phone if name exists */}
          {lead.name && (
            <p className="text-sm font-mono text-slate-500 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{parsed.display}</span>
            </p>
          )}

          {/* Metadata Chips (Class, Place, Course) */}
          {(lead.class || lead.place || lead.course) && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-slate-600 pt-0.5">
              {lead.class && (
                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-medium">
                  <GraduationCap className="w-3 h-3 text-slate-500" />
                  Class {lead.class}
                </span>
              )}
              {lead.place && (
                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  {lead.place}
                </span>
              )}
              {lead.course && (
                <span className="text-blue-600 font-medium truncate max-w-[180px]">
                  {lead.course}
                </span>
              )}
            </div>
          )}

          {/* Follow-up banner */}
          {isFollowUp && followUpDate && (
            <div
              className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md mt-1 ${
                isOverdue
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {isOverdue ? "Overdue: " : "Follow-up: "}
                {followUpDate.toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Right arrow CTA */}
        <div className="flex items-center text-slate-400 group-hover:text-blue-600 transition-colors shrink-0 self-center">
          <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline mr-1">
            Open
          </span>
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
