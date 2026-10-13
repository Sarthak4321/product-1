"use client";

import React from "react";
import Link from "next/link";
import {
  Globe,
  Mail,
  Phone,
  MessageCircle,
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200/80 bg-[#F8FAFC] text-slate-600 text-xs antialiased font-sans">



      {/* =========================================================================
          MAIN FOOTER NAVIGATION
      ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-7 sm:gap-8 lg:gap-10 mb-10 sm:mb-14">

          {/* Column 1: Brand & Elevator Pitch (4 cols on desktop) */}
          <div className="col-span-2 md:col-span-4 space-y-3.5 sm:space-y-4">
            <Link href="/" className="flex flex-col group">
              <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                LeadDesk
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                Institute Operating System
              </span>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              The unified admissions CRM, staff management, and operational operating system purpose-built for coaching academies, tuition networks, and test-prep franchises.
            </p>

            {/* Quick Contact & Direct Channel */}
            <div className="pt-1 sm:pt-2 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <a href="tel:+916295623945" className="hover:text-blue-600 text-slate-600 transition-colors">
                  +91 6295623945
                </a>
              </div>
            </div>

            {/* Social / WhatsApp badge */}
            <div className="pt-1 sm:pt-2">
              <a
                href="https://wa.me/919999999999?text=Hi%20LeadDesk%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold transition-all shadow-2xs min-h-[36px]"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Instant WhatsApp Desk</span>
              </a>
            </div>
          </div>

          {/* Column 2: Platform Modules (2 cols) */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3.5 sm:mb-4 flex items-center gap-1.5">
              <span>Platform</span>
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs text-slate-600 font-medium">
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Admissions CRM</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Telecaller Workflows</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Biometric Attendance</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Salary &amp; Payroll Engine</a></li>
              <li><a href="#services-suite" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Platform Suite</a></li>
              <li><a href="#how-it-works" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Instant Setup</a></li>
            </ul>
          </div>

          {/* Column 3: Solutions by Vertical (2 cols) */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3.5 sm:mb-4">
              Institutes
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs text-slate-600 font-medium">
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">IIT-JEE &amp; NEET</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">UPSC Prep</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Foundation &amp; Olympiad</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Franchises</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Study Abroad</a></li>
              <li><a href="#features" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Commerce Coaching</a></li>
            </ul>
          </div>

          {/* Column 4: Legal & Compliance (2 cols - Crucial Legal Footing) */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3.5 sm:mb-4">
              Legal &amp; Trust
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs text-slate-600 font-medium">
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors py-0.5 inline-block">
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors py-0.5 inline-block">
                  <span>Terms of Service</span>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors py-0.5 inline-block">
                  Student Data Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors py-0.5 inline-block">
                  Anti-Spam Rules
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-blue-600 transition-colors py-0.5 inline-block">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-blue-600 transition-colors py-0.5 inline-block">
                  Cookie Settings
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 5: Company & Portals (2 cols) */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3.5 sm:mb-4">
              Portals &amp; Access
            </h4>
            <ul className="space-y-2 sm:space-y-2.5 text-xs text-slate-600 font-medium">
              <li><Link href="/login" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Admin Login</Link></li>
              <li><Link href="/employee-login" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Staff Portal</Link></li>
              <li><Link href="/super-admin" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Super Admin</Link></li>
              <li><Link href="/about" className="hover:text-blue-600 transition-colors py-0.5 inline-block">About Us</Link></li>
              <li><Link href="/values" className="hover:text-blue-600 transition-colors py-0.5 inline-block">Our Values</Link></li>
              <li><a href="#contact" className="hover:text-blue-600 transition-colors font-semibold text-blue-600 py-0.5 inline-block">Schedule Demo</a></li>
            </ul>
          </div>

        </div>

        {/* =========================================================================
            DATA PRIVACY & OWNERSHIP DISCLAIMER
        ========================================================================= */}
        <div className="pt-6 sm:pt-8 pb-5 sm:pb-6 border-t border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
          <p>
            <strong>Data Ownership &amp; Privacy Disclaimer:</strong> LeadDesk is an educational admissions management and coaching operations software platform. All student enquiry records, parent contact numbers, telecalling disposition notes, and staff records entered into customer workspaces remain the exclusive and confidential proprietary property of the respective coaching institute. LeadDesk does not sell, share, broker, or commercialize customer lead assets under any circumstances.
          </p>
        </div>

        {/* =========================================================================
            BOTTOM SUB-FOOTER: COPYRIGHT & REGIONAL SELECTOR
        ========================================================================= */}
        <div className="pt-5 sm:pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3.5 sm:gap-4 text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span>&copy; {currentYear} LeadDesk. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3.5 sm:gap-6 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>India (INR ₹)</span>
            </span>
            <Link href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
            <a href="#contact" className="hover:text-slate-900 transition-colors">Contact Support</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
