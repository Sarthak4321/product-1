"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Check, ArrowRight, Clock } from "lucide-react";

interface StepData {
  stepNumber: string;
  time: string;
  tabTitle: string;
  title: string;
  description: string;
  points: string[];
  result: string;
}

export default function OnboardingStepsCarousel() {
  const [activeStep, setActiveStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const steps: StepData[] = [
    {
      stepNumber: "01",
      time: "30 Seconds Setup",
      tabTitle: "Campus Setup",
      title: "Set up your campus workspace in seconds",
      description:
        "Register your coaching academy once. LeadDesk automatically provisions an isolated cloud partition and generates your institute's 6-digit master Org Code.",
      points: [
        "Manage Head Office and all branch campuses under one unified account",
        "Unique 6-digit Org Code generated for 1-tap staff onboarding",
        "Dedicated cloud database active in 30 seconds with automated backups",
      ],
      result: "Your campus workspace is live and ready for staff in under 30 seconds.",
    },
    {
      stepNumber: "02",
      time: "45 Seconds Join",
      tabTitle: "Staff Access",
      title: "1-tap staff access with zero passwords",
      description:
        "Share your 6-digit Org Code with your team. Staff join directly from their phone or PC using mobile OTP with zero password headaches.",
      points: [
        "Share Org Code via WhatsApp or email with counselors, faculty, and managers in 1 click",
        "Instant mobile OTP login — zero passwords, forgotten credentials, or account setup",
        "Counselor calling queues, biometric logs, and branch roles activate automatically",
      ],
      result: "Entire staff onboarded with precise roles in 45 seconds.",
    },
    {
      stepNumber: "03",
      time: "Real-time Live",
      tabTitle: "Executive Control",
      title: "Unified live command over your institute",
      description:
        "Student enquiries, biometric attendance logs, and monthly payroll flow automatically into a single, unified executive dashboard.",
      points: [
        "Live student admissions CRM with real-time lead tracking and follow-up alerts",
        "Biometric punch logs automatically calculate teacher attendance and monthly payroll",
        "Switch between branch campuses in 1 click to monitor fee collections and staff presence",
      ],
      result: "Complete real-time clarity over leads, staff, and revenue on one screen.",
    },
  ];

  const current = steps[activeStep];

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection("prev");
    setActiveStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDirection("next");
    setActiveStep((prev) => (prev + 1) % steps.length);
  };

  const handleStepClick = (idx: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (idx === activeStep) return;
    setDirection(idx > activeStep ? "next" : "prev");
    setActiveStep(idx);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Refined Under-Card positions and transforms per step
  const underCardStyles = [
    "-bottom-4 sm:-bottom-8 -left-2 sm:-left-10 w-[96%] sm:w-2/3 h-4/5 -rotate-2 sm:-rotate-3 from-sky-400 via-blue-500 to-indigo-500 shadow-[0_20px_50px_rgba(56,189,248,0.35)]",
    "-bottom-4 sm:-bottom-9 left-2 sm:left-1/4 w-[96%] sm:w-2/3 h-4/5 rotate-1 sm:rotate-2 from-blue-500 via-sky-400 to-indigo-600 shadow-[0_20px_50px_rgba(59,130,246,0.35)]",
    "-bottom-4 sm:-bottom-8 right-1 sm:right-10 w-[96%] sm:w-2/3 h-4/5 -rotate-1 sm:-rotate-2 from-indigo-500 via-blue-500 to-sky-400 shadow-[0_20px_50px_rgba(99,102,241,0.35)]",
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto py-4 sm:py-8 select-none">
      {/* The LB* Frosted Glass Card Composition */}
      <div className="relative">
        
        {/* Layer 1: Dynamic Morphing Liquid Under-Card */}
        <div
          aria-hidden="true"
          className={`absolute rounded-3xl sm:rounded-[38px] bg-gradient-to-tr opacity-90 blur-[1px] transition-all duration-700 pointer-events-none ${underCardStyles[activeStep]}`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        />

        {/* Ambient Glowing Orbs */}
        <div
          aria-hidden="true"
          className="absolute -top-12 -right-8 w-60 sm:w-80 h-60 sm:h-80 rounded-full bg-gradient-to-br from-cyan-300/60 to-sky-400/30 blur-3xl opacity-60 pointer-events-none transition-all duration-1000 ease-out"
        />
        <div
          aria-hidden="true"
          className="absolute -top-16 -left-8 w-56 sm:w-72 h-56 sm:h-72 rounded-full bg-gradient-to-tr from-blue-400/40 to-indigo-300/30 blur-3xl opacity-50 pointer-events-none transition-all duration-1000 ease-out"
        />

        {/* Layer 2: The LB* Frosted Glass Card */}
        <div
          className="relative z-10 overflow-hidden rounded-3xl sm:rounded-[40px] p-5 sm:p-10 lg:p-14
            bg-white/[0.55] sm:bg-white/[0.48]
            backdrop-blur-[42px]
            border border-white/80
            shadow-[inset_0_1.5px_2px_rgba(255,255,255,0.95),inset_0_-2px_4px_rgba(255,255,255,0.4),0_30px_70px_-15px_rgba(15,23,42,0.12)]
            transition-all duration-500"
        >
          {/* Top Hairline Specular Reflection */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95" />

          {/* Frosted Glass Refraction Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/10 opacity-70" />

          {/* Top Header & Interactive Step Progress */}
          <div className="relative z-20 flex flex-wrap items-center justify-between gap-2.5 pb-4 sm:pb-6 mb-5 sm:mb-6 border-b border-slate-900/10">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-slate-800 uppercase bg-white/80 border border-white/95 px-2.5 sm:px-3.5 py-1 rounded-full shadow-2xs backdrop-blur-md">
                STEP {current.stepNumber}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-600 bg-white/60 px-2.5 sm:px-3 py-1 rounded-full backdrop-blur-md">
                {current.time}
              </span>
            </div>

            {/* Interactive Step Indicator Dots (1-Click Jump) */}
            <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-full bg-white/65 backdrop-blur-md border border-white/90 shadow-2xs">
              {steps.map((_, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleStepClick(idx, e)}
                    aria-label={`Go to Step ${idx + 1}`}
                    className={`relative h-2 rounded-full cursor-pointer transition-all duration-500 ease-out ${
                      isActive
                        ? "w-6 sm:w-8 bg-slate-900 shadow-xs"
                        : "w-2 bg-slate-400/50 hover:bg-slate-700 hover:w-3"
                    }`}
                    style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                  />
                );
              })}
            </div>
          </div>

          {/* Animated Card Body Content (Directional Slide & Fade) */}
          <div
            key={activeStep}
            className={`relative z-20 transition-all duration-400 ease-out ${
              direction === "next"
                ? "animate-in fade-in slide-in-from-right-4 duration-400"
                : "animate-in fade-in slide-in-from-left-4 duration-400"
            }`}
          >
            {/* Main Title & Description */}
            <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-8">
              <h3 className="text-xl sm:text-3xl lg:text-[38px] font-extrabold text-slate-950 tracking-tight leading-[1.2] sm:leading-[1.15]">
                {current.title}
              </h3>
              <p className="text-sm sm:text-base lg:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                {current.description}
              </p>
            </div>

            {/* 3 Staggered Key Points */}
            <div className="py-4 sm:py-6 border-y border-slate-900/10 space-y-2.5 sm:space-y-3.5 mb-5 sm:mb-8">
              {current.points.map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 sm:gap-3.5 text-xs sm:text-base text-slate-800"
                >
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/90 border border-white text-sky-700 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="leading-relaxed font-medium text-slate-800">{point}</span>
                </div>
              ))}
            </div>

            {/* Bottom Result Bar & Navigation Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 pt-1 sm:pt-2">
              <p className="text-xs sm:text-sm text-slate-800 leading-snug">
                <span className="font-bold text-slate-950">Result: </span>
                {current.result}
              </p>
              
              <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto justify-between sm:justify-end shrink-0 relative z-30 pt-1 sm:pt-0">
                {activeStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous Step"
                    className="inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/85 hover:bg-white text-slate-700 hover:text-slate-950 border border-white/95 shadow-sm transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold shadow-md transition-all duration-200 cursor-pointer hover:shadow-lg active:scale-95 min-h-[38px] sm:min-h-[42px] flex-1 sm:flex-initial"
                >
                  <span>{activeStep === steps.length - 1 ? "Start Over" : "Next Step"}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




