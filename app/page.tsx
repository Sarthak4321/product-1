"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Check,
  Phone,
  PhoneCall,
  MessageCircle,
  Clock,
  ArrowRight,
  Shield,
  UploadCloud,
  ChevronDown,
  Building,
  Building2,
  User as UserIcon,
  Send,
  CheckCircle2,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  UserCheck,
  CheckSquare,
  TrendingUp,
  BarChart3,
  Layers,
  Sparkles,
  Key,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ServicesAppleCarousel from "@/components/landing/ServicesAppleCarousel";
import OnboardingStepsCarousel from "@/components/landing/OnboardingStepsCarousel";
import FluidAIOrb from "@/components/landing/FluidAIOrb";
import ContactDemoSection from "@/components/landing/ContactDemoSection";
import ScrollReveal from "@/components/landing/ScrollReveal";
import HeroDashboardPreview from "@/components/landing/HeroDashboardPreview";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => { })
      .finally(() => setIsLoading(false));
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const ctaLink = user
    ? user.role === "SUPER_ADMIN"
      ? "/super-admin"
      : "/leads"
    : "/login";
  const ctaText = user ? "Open Dashboard" : "Start Free Trial";
  const ctaHeaderBtn = user ? "Dashboard" : "Start Free Trial";

  return (
    <div className="bg-[#F8FAFC] text-[#0F172A] antialiased selection:bg-blue-100 selection:text-blue-900 min-h-screen flex flex-col justify-between font-sans overflow-x-hidden">

      {/* =========================================================================
          TOP MINIMAL HEADER / NAVBAR
      ========================================================================= */}
      <header className={`w-full border-b sticky top-0 z-50 transition-all duration-200 ${isScrolled ? "bg-white/95 backdrop-blur-md border-[#CBD5E1]/80 shadow-xs" : "bg-white border-[#E2E8F0]"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex flex-col group">
              <span className="font-black text-xl tracking-tight text-[#0F172A] leading-none group-hover:text-blue-600 transition-colors">
                LeadDesk
              </span>
              <span className="text-[10px] text-[#64748B] font-semibold tracking-wider uppercase mt-1">
                Education System
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-slate-600">
              <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
              <a href="#faq" className="hover:text-slate-900 transition-colors">FAQ</a>
              <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {isLoading ? (
              <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-lg" />
            ) : user ? (
              <Link
                href={ctaLink}
                className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] px-3.5 sm:px-4 py-2 rounded-lg transition-colors shadow-sm gap-1.5 min-h-[38px]"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-2.5 sm:px-3.5 py-2 transition-colors hidden sm:inline-block"
                >
                  Sign in
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center text-xs sm:text-sm font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] px-3.5 sm:px-4 py-2 rounded-lg transition-colors shadow-sm min-h-[38px]"
                >
                  Start Free Trial
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#E2E8F0] px-4 pt-3 pb-5 space-y-2 text-sm font-medium text-slate-600 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              FAQ
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2.5 px-3 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              Contact
            </a>
            <div className="pt-3 flex flex-col gap-2 border-t border-slate-100">
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                >
                  Sign In
                </Link>
              )}
              <Link
                href={ctaLink}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-3 rounded-lg bg-[#0F172A] text-white font-semibold text-xs shadow-sm hover:bg-slate-800 transition-colors"
              >
                {ctaHeaderBtn}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECTION 1: HERO (WORKOS ATLAS-INSPIRED CLEAN & REALISTIC)
      ========================================================================= */}
      <section id="hero" className="relative min-h-[calc(100dvh-4rem)] md:min-h-0 flex flex-col justify-between md:justify-center pt-2 pb-6 sm:pt-20 sm:pb-24 md:pt-32 md:pb-32 lg:pt-40 lg:pb-36 overflow-hidden border-b border-[#E2E8F0] bg-white">
        {/* Minimal 3D Fluid AI Glass Orb (Centered behind hero content on both mobile and desktop, fully uncropped) */}
        <div className="absolute top-[49%] md:top-[420px] lg:top-[460px] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[560px] lg:w-[680px] h-[360px] sm:h-[560px] lg:h-[680px] pointer-events-none z-0 flex items-center justify-center opacity-85 select-none">
          <FluidAIOrb size={680} />
        </div>

        {/* Bottom Fade Mask */}
        <div className="absolute bottom-0 inset-x-0 h-20 sm:h-32 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-0" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full flex-1 flex flex-col justify-between md:justify-center">

          {/* Headline & Subtext Group */}
          <div className="w-full max-w-4xl lg:max-w-4xl mx-auto my-20 md:my-0 md:mt-2 md:mb-8 lg:mb-10 flex flex-col items-start sm:items-center justify-center px-2 sm:px-6">
            <h1 className="w-full text-left sm:text-center text-[28px] xs:text-[32px] sm:text-5xl lg:text-6xl font-black tracking-tight text-[#0F172A] leading-[1.2] sm:leading-[1.15]">
              Meet{" "}
              <span className="relative inline-block text-[#2563EB]">
                LeadDesk
                {/* Organic handwritten underline */}
                <svg
                  className="absolute -bottom-1.5 sm:-bottom-2.5 left-0 w-full h-2.5 sm:h-3.5 text-[#2563EB] overflow-visible pointer-events-none"
                  viewBox="0 0 250 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 13.5C48 4.5 145 2.5 247 10C185 15 105 17.5 15 14.5"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              ,<br className="sm:hidden" />{" "}
              <span className="text-[#0F172A]">
                your one stop solution<br className="sm:hidden" /> for coaching.
              </span>
            </h1>

            <p className="w-full text-left sm:text-center text-[15px] xs:text-[16px] sm:text-lg lg:text-xl text-slate-700 leading-relaxed font-medium mt-5 sm:mt-5">
              Run your coaching institute from one powerful platform. Manage leads, automate follow-ups, track attendance, and streamline HR and payroll, all in one place, so your team spends less time on operations and more time driving growth.
            </p>
          </div>

          {/* TIER 3: Bottom Action Buttons */}
          <div className="flex flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto mb-16 sm:mb-10 md:mb-14 lg:mb-16 pb-1 shrink-0">
            <Link
              href={ctaLink}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 sm:px-8 py-3.5 sm:py-4 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white text-sm sm:text-base font-bold transition-all shadow-md hover:shadow-lg active:scale-[0.98] min-h-[48px] whitespace-nowrap"
            >
              <span>{ctaText}</span>
            </Link>
            <a
              href="#contact"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center px-4 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white hover:bg-[#F8FAFC] text-[#334155] border border-[#CBD5E1] text-sm sm:text-base font-bold transition-all shadow-xs hover:shadow-sm active:scale-[0.98] min-h-[48px] whitespace-nowrap"
            >
              <span>Walkthrough</span>
            </a>
          </div>

          {/* Minimal Floating Scroll Indicator */}
          <div
            className={`flex flex-col items-center gap-1 transition-opacity duration-300 pointer-events-none -mt-10 mb-6 md:hidden ${isScrolled ? "opacity-0" : "opacity-70"
              }`}
            aria-hidden="true"
          >
            <div className="w-3.5 h-6 rounded-full border border-slate-300 flex items-start justify-center p-0.5 bg-white/80 shadow-xs">
              <div className="w-1 h-1.5 rounded-full bg-blue-600 animate-bounce" />
            </div>
          </div>

          {/* Realistic SaaS Dashboard Mockup matching image */}
          <div className="hidden md:block">
            <HeroDashboardPreview />
          </div>

        </div>
      </section>

      {/* =========================================================================
          MAIN CONTENT
      ========================================================================= */}
      <main className="flex-grow">

        {/* SECTION 2: THE 3 CORE PILLARS (ULTRA-CLEAN & SPACIOUS) */}
        <section id="features" className="scroll-mt-16 py-14 sm:py-20 lg:py-28 border-b border-[#E2E8F0] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Clean Section Header */}
            <ScrollReveal direction="up" distance={20} duration={600}>
              <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16 lg:mb-20">
                <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-blue-600 bg-blue-50 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full border border-blue-100 inline-block">
                  BUILT FOR CLARITY
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#0F172A] mt-3 sm:mt-4 mb-3 sm:mb-4 leading-tight">
                  Designed for simplicity, speed, and complete control.
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto font-normal">
                  Replace scattered spreadsheets and manual punch registers with three streamlined operational pillars.
                </p>
              </div>
            </ScrollReveal>

            {/* 3 Spacious, High-Clarity Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8 mb-12 sm:mb-16">

              {/* Pillar 1 */}
              <ScrollReveal direction="up" distance={24} duration={650} delay={100}>
                <div className="bg-[#F8FAFC] p-6 sm:p-8 rounded-2xl border border-slate-200/80 hover:border-blue-400/80 transition-all flex flex-col justify-between shadow-2xs h-full">
                  <div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-4 sm:mb-6 shadow-sm">
                      <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-2 sm:mb-3">
                      Zero Lead Leakage
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-5 sm:mb-6">
                      Capture parent enquiries from all portals instantly. Auto-assign to counsellors within 60 seconds with 1-click WhatsApp brochure delivery.
                    </p>
                  </div>
                  <div className="pt-3.5 sm:pt-4 border-t border-slate-200/60 text-xs font-medium text-blue-600 flex items-center gap-1.5">
                    <span>Average response time: &lt; 15 minutes</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Pillar 2 */}
              <ScrollReveal direction="up" distance={24} duration={650} delay={200}>
                <div className="bg-[#F8FAFC] p-6 sm:p-8 rounded-2xl border border-slate-200/80 hover:border-blue-400/80 transition-all flex flex-col justify-between shadow-2xs h-full">
                  <div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#0F172A] text-white flex items-center justify-center mb-4 sm:mb-6 shadow-sm">
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-2 sm:mb-3">
                      Live Staff Attendance
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-5 sm:mb-6">
                      Know exactly who is on duty with daily check-in logs, punctuality tracking, and telecaller work sessions connected directly to lead activity.
                    </p>
                  </div>
                  <div className="pt-3.5 sm:pt-4 border-t border-slate-200/60 text-xs font-medium text-emerald-600 flex items-center gap-1.5">
                    <span>96%+ Daily attendance compliance</span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Pillar 3 */}
              <ScrollReveal direction="up" distance={24} duration={650} delay={300}>
                <div className="bg-[#F8FAFC] p-6 sm:p-8 rounded-2xl border border-slate-200/80 hover:border-blue-400/80 transition-all flex flex-col justify-between shadow-2xs h-full">
                  <div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center mb-4 sm:mb-6 shadow-sm">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] mb-2 sm:mb-3">
                      Automated Payroll &amp; Leaves
                    </h3>
                    <p className="text-xs sm:text-sm text-[#475569] leading-relaxed mb-5 sm:mb-6">
                      One-click leave approvals, transparent salary structures, and automated monthly net pay calculations without spreadsheet disputes.
                    </p>
                  </div>
                  <div className="pt-3.5 sm:pt-4 border-t border-slate-200/60 text-xs font-medium text-slate-700 flex items-center gap-1.5">
                    <span>100% On-time salary disbursement</span>
                  </div>
                </div>
              </ScrollReveal>

            </div>


          </div>
        </section>

        {/* SECTION 3: APPLE-INSPIRED SERVICES CAROUSEL SHOWCASE */}
        <ScrollReveal direction="up" distance={24} duration={700}>
          <ServicesAppleCarousel ctaLink={ctaLink} />
        </ScrollReveal>

        {/* SECTION 6: 2-MINUTE ONBOARDING & 1-DASHBOARD MANAGEMENT */}
        <section id="how-it-works" className="scroll-mt-16 py-14 sm:py-24 border-b border-slate-200 bg-gradient-to-b from-slate-50/60 via-sky-50/25 to-white relative overflow-hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

            {/* Clean Section Header */}
            <ScrollReveal direction="up" distance={20} duration={600}>
              <div className="max-w-3xl mx-auto text-center mb-8 sm:mb-14">
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                  Set up in 2 minutes.{" "}
                  <span className="relative inline-block text-slate-900 whitespace-nowrap">
                    <span className="relative z-10">Run everything</span>
                    <svg
                      className="absolute -bottom-2 sm:-bottom-3 left-0 w-full h-3 sm:h-4 text-[#ff5a36] overflow-visible"
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
                  </span>{" "}
                  on one dashboard.
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto mt-3 sm:mt-4 leading-relaxed font-normal">
                  Zero IT setup. No messy spreadsheets. Everything you need to launch and operate your institute in three simple steps.
                </p>
              </div>
            </ScrollReveal>

            {/* 3-Step Clean Minimal Grid */}
            <ScrollReveal direction="up" distance={24} duration={700} delay={150}>
              <OnboardingStepsCarousel />
            </ScrollReveal>

          </div>
        </section>

        {/* SECTION 7: PRICING (CLEAN & WIDE MINIMAL DESIGN) */}
        <section id="pricing" className="scroll-mt-16 py-16 sm:py-24 lg:py-28 bg-white border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <ScrollReveal direction="up" distance={20} duration={600}>
              <div className="text-center mb-10 sm:mb-16 max-w-3xl mx-auto">
                <h2 className="text-2xl sm:text-4xl lg:text-[46px] font-extrabold text-[#0F172A] tracking-tight leading-tight">
                  Simple &amp; Flexible <span className="text-[#2563EB]">Pricing</span>
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-xl mx-auto mt-2.5 sm:mt-3 font-normal leading-relaxed">
                  Choose the plan that fits your institute&apos;s size and needs. No hidden fees.
                </p>
              </div>
            </ScrollReveal>

            {/* 3 Wide & Spacious Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto">

              {/* Card 1: Starter Trial (Left, Clean White) */}
              <ScrollReveal direction="up" distance={24} duration={650} delay={100}>
                <div className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-[0_10px_35px_rgba(15,23,42,0.05)] border border-slate-200/80 hover:border-blue-200 hover:shadow-lg transition-all duration-300 h-full">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Starter Trial</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5 sm:mb-6">Small centres &amp; single academy</p>

                    <div className="flex items-baseline gap-1 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-slate-100">
                      <span className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] font-mono">₹0</span>
                      <span className="text-xs sm:text-sm text-slate-500 font-normal">/month (1st month free)</span>
                    </div>

                    <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-700 mb-7 sm:mb-9">
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Up to 5 staff accounts</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Student Admissions CRM</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Daily Attendance Tracking</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>1-Click WhatsApp Follow-ups</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Instant Cloud Setup</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href={ctaLink}
                    className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all duration-200 text-center block shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] min-h-[44px] flex items-center justify-center"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </ScrollReveal>

              {/* Card 2: Business Automation (Middle, Featured Deep Navy Brand Card) */}
              <ScrollReveal direction="up" distance={24} duration={650} delay={200}>
                <div className="bg-[#0F172A] rounded-3xl sm:rounded-[32px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between text-white shadow-[0_20px_50px_rgba(15,23,42,0.28)] relative lg:-translate-y-2.5 hover:shadow-2xl transition-all duration-300 border border-slate-800 h-full">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Business Automation</h3>
                      <span className="shrink-0 whitespace-nowrap text-[10px] sm:text-[11px] font-semibold text-sky-200 bg-sky-500/20 backdrop-blur-md px-3 sm:px-3.5 py-1 rounded-full border border-sky-400/30">
                        Most Popular
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-5 sm:mb-6">Full institute operations &amp; networks</p>

                    <div className="flex items-baseline gap-1 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-slate-800">
                      <span className="text-3xl sm:text-5xl font-extrabold text-white font-mono">
                        ₹5,199
                      </span>
                      <span className="text-xs sm:text-sm text-slate-400 font-normal">/month</span>
                    </div>

                    <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-200 mb-7 sm:mb-9">
                      <li className="flex items-center gap-3 font-medium">
                        <Check className="w-4 h-4 text-sky-400 stroke-[2.5] shrink-0" />
                        <span>Everything in CRM included</span>
                      </li>
                      <li className="flex items-center gap-3 font-medium">
                        <Check className="w-4 h-4 text-sky-400 stroke-[2.5] shrink-0" />
                        <span>Complete HR &amp; Staff Operations</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-sky-400 stroke-[2.5] shrink-0" />
                        <span>Biometric Attendance Sync</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-sky-400 stroke-[2.5] shrink-0" />
                        <span>Automated Salary &amp; Payroll</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-sky-400 stroke-[2.5] shrink-0" />
                        <span>Multi-Branch Campus &amp; Org Codes</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-sky-400 stroke-[2.5] shrink-0" />
                        <span>Priority 24/7 Dedicated Support</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href={ctaLink}
                    className="w-full py-3.5 rounded-full bg-white hover:bg-slate-100 text-[#0F172A] text-xs sm:text-sm font-bold shadow-md transition-all duration-200 text-center block hover:scale-[1.02] active:scale-[0.98] min-h-[44px] flex items-center justify-center"
                  >
                    Get Started
                  </Link>
                </div>
              </ScrollReveal>

              {/* Card 3: Admissions CRM (Right, Clean White) */}
              <ScrollReveal direction="up" distance={24} duration={650} delay={300}>
                <div className="bg-white rounded-3xl sm:rounded-[32px] p-6 sm:p-8 lg:p-10 flex flex-col justify-between shadow-[0_10px_35px_rgba(15,23,42,0.05)] border border-slate-200/80 hover:border-blue-200 hover:shadow-lg transition-all duration-300 h-full">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Admissions CRM</h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5 sm:mb-6">Dedicated counselling &amp; calling teams</p>

                    <div className="flex items-baseline gap-1 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-slate-100">
                      <span className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] font-mono">
                        ₹3,999
                      </span>
                      <span className="text-xs sm:text-sm text-slate-500 font-normal">/month</span>
                    </div>

                    <ul className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-slate-700 mb-7 sm:mb-9">
                      <li className="flex items-center gap-3 font-medium">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Unlimited student enquiries</span>
                      </li>
                      <li className="flex items-center gap-3 font-medium">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Counsellor Calling Desk</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Automated Lead Routing</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>WhatsApp Chat &amp; Brochures</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Bulk CSV Student Importer</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-blue-600 stroke-[2.5] shrink-0" />
                        <span>Lead Conversion Analytics</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href={ctaLink}
                    className="w-full py-3.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all duration-200 text-center block shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] min-h-[44px] flex items-center justify-center"
                  >
                    Choose Plan
                  </Link>
                </div>
              </ScrollReveal>

            </div>

          </div>
        </section>

        {/* SECTION 8: FAQ */}
        <section id="faq" className="scroll-mt-16 py-16 sm:py-24 lg:py-28 relative overflow-hidden bg-white border-b border-slate-100">
          {/* Subtle decorative background ambient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-blue-50/50 via-slate-50/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

            <ScrollReveal direction="up" distance={20} duration={600}>
              <div className="text-center mb-10 sm:mb-14">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[42px] font-extrabold tracking-tight text-[#0F172A] mt-2 mb-3 sm:mb-4 leading-tight">
                  Clear answers for institute owners &amp; directors.
                </h2>
                <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
                  Everything you need to know about adopting LeadDesk for your admissions desk, staff tracking, and coaching operations.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" distance={20} duration={650} delay={150}>
              <div className="max-w-3xl mx-auto space-y-3 sm:space-y-3.5">

                {[
                  {
                    id: 0,
                    q: "How does LeadDesk combine Admissions CRM with Staff & Attendance management?",
                    a: "LeadDesk is built as a unified operations system. When you onboard your staff (counsellors, faculty, telecallers), they receive individual role-based logins. Counsellors work from a focused calling desk where their calls, campus visit schedules, and attendance check-in times automatically sync to the director's daily scoreboard without manual reporting."
                  },
                  {
                    id: 1,
                    q: "Can we import our existing student inquiries from Excel or Google Sheets?",
                    a: "Yes. You can drag and drop your existing Excel or CSV files directly into LeadDesk. Our importer automatically cleans erratic phone numbers, identifies duplicates against your existing database, and lets you map columns like course name, parent contact, and lead source in under two minutes."
                  },
                  {
                    id: 2,
                    q: "How do employee logins and Organization Codes work?",
                    a: "Each coaching institute receives a unique Organization Room Code (e.g., APEX-KOTA). When a new staff member or telecaller joins, they simply enter your Org Code and their email/password. They get immediate access strictly to their designated module (e.g. Counsellor Desk or HR Attendance) with complete data isolation."
                  },
                  {
                    id: 3,
                    q: "Can telecallers download or take our student contact database?",
                    a: "No. Strict role-based permissions allow only designated Branch Directors and Super Admins to export lead data to spreadsheets. Telecallers can only view and call the specific records assigned to them inside their queue, protecting your valuable contact assets."
                  },
                  {
                    id: 4,
                    q: "How does payroll and leave calculation operate?",
                    a: "You can configure salary structures with base pay, allowances, and tax deductions. As staff check in daily and request leaves, LeadDesk tracks approved vs unpaid leaves and auto-generates monthly payroll periods with net salary figures, ready for one-click payment verification."
                  },
                  {
                    id: 5,
                    q: "Does LeadDesk support multi-branch coaching institutes & franchise campuses?",
                    a: "Yes. Group directors and owners can manage multiple branches seamlessly from a centralized dashboard. Track branch-by-branch admission conversions, counsellor calling KPIs, staff attendance rates, and fee collections in real time."
                  }
                ].map((item) => {
                  const isOpen = openFaq === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleFaq(item.id)}
                      className={`rounded-2xl transition-all duration-200 cursor-pointer border p-4 sm:p-6 ${isOpen
                        ? "bg-white border-blue-200 shadow-[0_10px_30px_rgba(37,99,235,0.06)] ring-4 ring-blue-500/5"
                        : "bg-slate-50/60 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-xs"
                        }`}
                    >
                      <button
                        type="button"
                        className="w-full flex items-center justify-between text-left gap-3 sm:gap-4"
                      >
                        <span className="text-xs sm:text-base font-bold text-[#0F172A] leading-snug">
                          {item.q}
                        </span>
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${isOpen
                            ? "bg-blue-600 text-white rotate-180 shadow-xs"
                            : "bg-slate-200/70 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-200" />
                        </div>
                      </button>
                      {isOpen && (
                        <div className="pt-3 mt-2 sm:pt-3.5 sm:mt-2.5 border-t border-slate-100 text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </ScrollReveal>

            {/* Subtle assistance card */}
            <ScrollReveal direction="up" distance={16} duration={600} delay={200}>
              <div className="mt-8 sm:mt-12 max-w-3xl mx-auto p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs text-center sm:text-left">
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#0F172A]">Have questions about your specific institute setup?</h4>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Our education operations team is ready to assist you.</p>
                </div>
                <Link
                  href="#contact"
                  className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all duration-200 shadow-sm hover:scale-[1.02] active:scale-[0.98] min-h-[40px] flex items-center justify-center"
                >
                  Talk to our team
                </Link>
              </div>
            </ScrollReveal>

          </div>
        </section>

        {/* SECTION 9: REQUEST A DEMO / CONTACT NOW */}
        <ScrollReveal direction="up" distance={24} duration={700}>
          <ContactDemoSection />
        </ScrollReveal>

      </main>

      {/* =========================================================================
          PROFESSIONAL ENTERPRISE FOOTER
      ========================================================================= */}
      <Footer />

    </div>
  );
}
