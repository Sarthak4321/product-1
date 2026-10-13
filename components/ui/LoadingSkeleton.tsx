import React from "react";

export function LeadCardSkeleton() {
  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 bg-slate-200 rounded-md" />
        <div className="h-6 w-20 bg-slate-100 rounded-full" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-28 bg-slate-150 rounded" />
        <div className="h-4 w-20 bg-slate-150 rounded" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="h-3 w-24 bg-slate-100 rounded" />
        <div className="h-8 w-18 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export function LeadListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <LeadCardSkeleton key={i} />
      ))}
    </div>
  );
}
