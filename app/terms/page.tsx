"use client";

import React, { useState, useEffect } from "react";
import { FileText, ShieldAlert, CheckCircle2, UserCheck, AlertOctagon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function TermsPage() {
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

      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-12 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#ff5a36] bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
            Legal Statement
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-slate-400">
            Last updated: August 18, 2026
          </p>
        </div>

        {/* Terms Body */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 text-slate-600 text-xs sm:text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#ff5a36]" />
              <span>1. Account Registration & Role Assignment</span>
            </h2>
            <p>
              LeadDesk grants workspace access based on system roles: Administrator and Counsellor. Administrators are responsible for secure creation and termination of counsellor accounts. Accounts cannot be shared across multiple team members.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#ff5a36]" />
              <span>2. Acceptable Use of Auto-Outreach</span>
            </h2>
            <p>
              Users agree to log call notes and outcomes accurately. Mass WhatsApp communications dispatched through deep links must follow local telecommunication guidelines. Spamming or sending unauthorized solicitations is strictly prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#ff5a36]" />
              <span>3. Data Storage & Liability</span>
            </h2>
            <p>
              Workspace data (leads and activities) is hosted in secure databases. While we maintain automated transaction rollbacks and database sanitization pipelines, LeadDesk is not liable for data loss arising from compromised credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-[#ff5a36]" />
              <span>4. Service Interruption</span>
            </h2>
            <p>
              We reserve the right to perform scheduled database optimizations and system hot-fixes. Core services switch to local caches to prevent interruption, but temporary delays during sync cycles do not constitute SLA breaches.
            </p>
          </section>
        </div>
      </main>

      <BottomNav user={user} />
    </div>
  );
}
