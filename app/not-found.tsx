"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-between font-sans antialiased selection:bg-blue-100 selection:text-blue-900 relative overflow-hidden">
      
      {/* 1. Clean Top Header with Brand Logo */}
      <header className="px-6 sm:px-12 md:px-20 py-8 z-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs group-hover:bg-blue-700 transition-colors">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-slate-900">
            LeadDesk
          </span>
        </Link>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 px-6 sm:px-12 md:px-20 py-10 sm:py-16 z-10 flex flex-col justify-center max-w-4xl relative">
        <div className="max-w-xl text-left space-y-5">
          
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">
            Oh no, page not found!
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-500 font-medium max-w-md leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link
              href="/"
              className="px-6 py-3.5 rounded-2xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-extrabold text-xs sm:text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Go to Home Page</span>
            </Link>

            <button
              onClick={() => router.back()}
              className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>

        </div>
      </main>

      {/* 3. Giant Typographic "404" Watermark in Background */}
      <div className="absolute -bottom-6 sm:-bottom-12 md:-bottom-20 left-0 right-0 pointer-events-none select-none z-0 overflow-hidden flex items-end justify-center">
        <div className="w-full flex items-center justify-center">
          <svg
            viewBox="0 0 1000 320"
            className="w-full max-w-[1400px] h-auto text-[#EAECEF] fill-current select-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <text
              x="50%"
              y="300"
              textAnchor="middle"
              fontSize="380"
              fontWeight="900"
              fontFamily="system-ui, -apple-system, sans-serif"
              letterSpacing="-20"
              className="fill-[#EAECEF]"
            >
              404
            </text>
          </svg>
        </div>
      </div>

    </div>
  );
}
