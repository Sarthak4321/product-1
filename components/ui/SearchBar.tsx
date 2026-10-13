"use client";

import React, { useState, useEffect } from "react";
import { Search, X } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search phone number or name...",
  className = "",
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal value if prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounce notification to parent
  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [internalValue, onChange, value]);

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full min-h-[44px] pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-2xs transition-all"
      />
      {internalValue && (
        <button
          type="button"
          onClick={() => {
            setInternalValue("");
            onChange("");
          }}
          className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 active:bg-slate-100 min-h-[28px] min-w-[28px] flex items-center justify-center"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
