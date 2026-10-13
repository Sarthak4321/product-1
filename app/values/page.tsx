"use client";

import React, { useState, useEffect } from "react";
import { Zap, ShieldCheck, Database, RefreshCw, BarChart2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function ValuesPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  const coreValues = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Immediate Action & 0ms Latency",
      desc: "Speed drives conversions. LeadDesk prioritizes real-time callback reminders and immediate WhatsApp auto-routing so counsellors contact leads exactly when interest is highest.",
    },
    {
      icon: <Database className="w-5 h-5" />,
      title: "Clean Data & Zero Waste",
      desc: "Raw leads imports can contain duplicates or invalid formats. Our robust CSV parsing engine cleans phone fields, validates country codes, and blocks duplicates to keep call queues healthy.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: "Integrity & Session Auditing",
      desc: "Admissions databases contain sensitive student details. We secure all actions with cryptographic JWT tokens and keep comprehensive logs to monitor modifications transparently.",
    },
    {
      icon: <BarChart2 className="w-5 h-5" />,
      title: "Performance & Visibility",
      desc: "Transparency builds trust. Administrators must always know which counsellors perform best, which campaigns close most leads, and what lead segments need immediate coaching.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe font-sans">
      <Header user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff5a36] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            Our Core Values
          </span>
          <h1 className="text-3xl sm:text-4.5xl font-black text-slate-900 tracking-tight leading-tight">
            Designed for performance. Engineered for integrity.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed">
            LeadDesk is founded on core values that ensure performance, absolute data security, and seamless admissions team collaboration.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {coreValues.map((val, idx) => (
            <div key={idx} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-2xs space-y-4 hover:shadow-sm transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#ff5a36] flex items-center justify-center shadow-xs">
                {val.icon}
              </div>
              <h3 className="text-base font-bold text-slate-900">{val.title}</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {val.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Quality Assurance Banner */}
        <div className="space-y-6 pt-4" id="assurance">
          <div className="bg-gradient-to-r from-[#ff5a36] to-orange-600 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
            <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-white/[0.05] border border-white/[0.08]" />
            <div className="space-y-1.5 text-center sm:text-left relative z-10">
              <span className="inline-flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase">
                <RefreshCw className="w-3 h-3 animate-spin" /> Uptime Guarantee
              </span>
              <h3 className="text-base font-bold">99.99% core engine reliability</h3>
              <p className="text-xs text-orange-100 max-w-md leading-relaxed">
                Admissions databases are backed up and transaction-bound. In-memory frontend sync guarantees zero downtime.
              </p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav user={user} />
    </div>
  );
}
