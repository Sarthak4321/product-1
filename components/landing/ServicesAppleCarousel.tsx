"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface ShowcaseSlide {
  id: string;
  imageUrl: string;
  title?: string;
}

export interface ServicesAppleCarouselProps {
  ctaLink?: string;
}

export default function ServicesAppleCarousel({ ctaLink = "/signup" }: ServicesAppleCarouselProps) {
  const [slides, setSlides] = useState<ShowcaseSlide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Fetch dynamic showcase configuration updated from Super Admin Dashboard
  useEffect(() => {
    fetch("/api/showcase")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.slides)) {
          setSlides(data.slides);
        }
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, []);

  // Auto-scroll left-to-right every 4 seconds when slides exist
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  const handlePrev = () => {
    if (slides.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    if (slides.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % slides.length);
  };

  const activeSlide = slides[activeIndex];

  return (
    <section id="services-suite" className="scroll-mt-16 py-12 sm:py-20 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Responsive Heading with Handwritten Underline */}
        <div className="max-w-4xl mx-auto text-center mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            All your campus operations in{" "}
            <span className="relative inline-block text-slate-900 whitespace-nowrap">
              <span className="relative z-10">one place</span>
              <svg
                className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-2.5 sm:h-4 text-[#ff5a36] overflow-visible"
                viewBox="0 0 250 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M3 13.5C45.5 5.5 140 2.5 247 12.5C215 15.5 125 16.5 85 17.5"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            .
          </h2>
        </div>

        {/* Apple-Style Full-Width Clean Showcase Canvas */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="relative w-full rounded-2xl sm:rounded-[36px] overflow-hidden border border-slate-200/90 shadow-lg bg-slate-950"
        >
          {/* Circular Navigation Arrows (Shown when more than 1 slide) */}
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Slide"
                className="absolute left-2.5 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 border border-white/90 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Slide"
                className="absolute right-2.5 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-white/90 hover:bg-white backdrop-blur-md text-slate-800 border border-white/90 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          {/* Full Direct Image Canvas */}
          <div className="relative w-full aspect-[4/3] xs:aspect-[16/10] sm:aspect-[16/9] overflow-hidden flex items-center justify-center">
            {slides.length > 0 && activeSlide ? (
              <img
                src={activeSlide.imageUrl}
                alt={activeSlide.title ? `${activeSlide.title} - LeadDesk System Interface` : `LeadDesk Coaching Institute Platform Showcase Slide ${activeIndex + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center transition-all duration-700"
              />
            ) : (
              /* Fallback Display when no images uploaded yet */
              <div className="p-6 sm:p-16 text-center space-y-3 sm:space-y-4 bg-slate-900 text-white w-full h-full flex flex-col items-center justify-center">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-white/10 text-white flex items-center justify-center mx-auto backdrop-blur-md">
                  <Sparkles className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-bold">Dynamic Institute Command Center</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                    Manage student admissions, biometric attendance, staff operations, and director audits seamlessly.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Pagination Dots Overlay */}
            {slides.length > 1 && (
              <div className="absolute bottom-3.5 sm:bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20">
                {slides.map((_, idx) => {
                  const isSelected = activeIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      aria-label={`Go to slide ${idx + 1}`}
                      className={`transition-all duration-300 rounded-full cursor-pointer ${
                        isSelected
                          ? "w-5 sm:w-7 h-1.5 sm:h-2 bg-white shadow-xs"
                          : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
