"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, Key, Eye, FileText, Lock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last updated: August 18, 2026
          </p>
        </div>

        {/* Policy Body */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-2xs space-y-6 text-slate-600 text-xs sm:text-sm leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#ff5a36]" />
              <span>1. Information We Collect</span>
            </h2>
            <p>
              We collect contact information of student prospects (names, phones, classes, locations, courses) as entered manually or uploaded via CSV templates by registered workspace administrators.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#ff5a36]" />
              <span>2. Security & Session Protocols</span>
            </h2>
            <p>
              Student lead details are secured using cryptography. Counsellor sessions are wrapped in JSON Web Tokens (JWT) stored securely. All write actions (updates, notes, calls) generate audit records to guarantee transparency.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#ff5a36]" />
              <span>3. Data Access & Sharing</span>
            </h2>
            <p>
              LeadDesk does not lease or sell student prospect data to third parties. Access to the workspace data is strictly restricted to authenticated team members holding valid system tokens.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#ff5a36]" />
              <span>4. Changes to Policy</span>
            </h2>
            <p>
              We reserves the right to modify this statement to comply with data safety frameworks. Updates will be highlighted on this page with modified timestamps.
            </p>
          </section>
        </div>

        {/* Support Callout */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-6 shadow-2xs flex items-start gap-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <ShieldAlert className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs sm:text-sm font-bold text-amber-900">Data Subject Rights</h4>
            <p className="text-[11px] sm:text-xs text-amber-700 leading-relaxed">
              If a student prospect requests details erasure or updates, administrators can use lead delete/edit tools inside the CRM dashboard. For system support, contact your organization's system administrator.
            </p>
          </div>
        </div>
      </main>

      <BottomNav user={user} />
    </div>
  );
}
