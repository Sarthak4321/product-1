"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PhoneCall, Users, Award, ShieldCheck, Mail, MapPin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function AboutPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe font-sans">
      <Header user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff5a36] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            About LeadDesk
          </span>
          <h1 className="text-3xl sm:text-4.5xl font-black text-slate-900 tracking-tight leading-tight">
            Empowering admissions teams with intelligent automation.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            LeadDesk is a purpose-built CRM platform designed to streamline student outreach, minimize response delays, and maximize enrollment conversions for educational institutions.
          </p>
        </div>

        {/* Our Story / Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff5a36] flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              We build client-first workflow orchestration systems that remove administrative friction. By automating repetitive callback logistics and message deliveries, we let educational advisors focus on high-impact conversations with students.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff5a36] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Our History</h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Founded in 2024, LeadDesk emerged to address the severe lead leakage in coaching centers. Starting as a simple callback tracker, we have scaled to service millions of student inquiries with robust, latency-free automation tools.
            </p>
          </div>
        </div>

        {/* Team Section */}
        <div className="space-y-6 pt-4" id="careers">
          <h2 className="text-xl font-bold text-slate-900 text-center flex items-center justify-center gap-2">
            <Users className="w-5 h-5 text-[#ff5a36]" />
            <span>Join Our Mission</span>
          </h2>
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-white/[0.03] border border-white/[0.05]" />
            <div className="space-y-2 text-center md:text-left relative z-10">
              <h3 className="text-base font-bold">Interested in building CRM tech?</h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                We are constantly looking for talented systems developers and product designers. Check our career portal for openings.
              </p>
            </div>
            <Link
              href="/about"
              onClick={(e) => { e.preventDefault(); alert("System operations contact will be routed through the organization portal."); }}
              className="px-5 py-2.5 bg-white text-slate-900 hover:bg-yellow-300 font-bold text-xs rounded-full transition-all shrink-0 shadow-sm active:scale-95"
            >
              Contact Support
            </Link>
          </div>
        </div>

        {/* Contact info */}
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-[#ff5a36]" />
            <span>Authorized Organization Workspace Platform</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>All systems active</span>
          </div>
        </div>
      </main>

      <BottomNav user={user} />
    </div>
  );
}
