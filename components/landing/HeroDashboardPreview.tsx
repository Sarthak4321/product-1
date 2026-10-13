"use client";

import React from "react";
import {
  Search,
  Bell,
  ChevronDown,
  LayoutDashboard,
  Users,
  PhoneCall,
  GraduationCap,
  Calendar,
  Wallet,
  BarChart3,
  User,
  ArrowUp,
  Receipt,
  Phone,
} from "lucide-react";

export default function HeroDashboardPreview() {
  return (
    <div className="relative max-w-5xl mx-auto select-none">
      {/* Decorative ambient background accents matching reference image */}
      <div className="absolute -top-10 -left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative pointer arrow on top right */}
      <div className="hidden lg:block absolute -top-4 -right-2 text-blue-500/80 z-20 pointer-events-none transform -rotate-12 animate-pulse">
        <svg
          className="w-8 h-8 fill-blue-500 text-blue-600 drop-shadow-sm"
          viewBox="0 0 24 24"
        >
          <path d="M3 3l7 18 3-7 7-3L3 3z" />
        </svg>
      </div>

      {/* Dotted decorative rings */}
      <div className="hidden md:block absolute -top-8 -left-8 w-24 h-24 rounded-full border-2 border-dashed border-blue-200/60 pointer-events-none" />
      <div className="hidden md:block absolute -bottom-6 -right-6 w-28 h-28 rounded-full border-2 border-dashed border-blue-200/50 pointer-events-none" />

      {/* Outer Dashboard Card Container */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-[0_20px_50px_rgba(37,99,235,0.08),0_4px_12px_rgba(15,23,42,0.04)] overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 sm:gap-6 bg-white">
          {/* Logo */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-base sm:text-lg font-black tracking-tight text-[#0F172A]">
              Lead<span className="text-[#2563EB]">Desk</span>
            </span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden sm:flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#F8FAFC] border border-slate-200/70 text-slate-400 text-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search students, leads, or batches...</span>
          </div>

          {/* Right Profile & Notifications */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {/* Notification Bell */}
            <div className="relative p-2 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-slate-600">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-2.5 pl-2 sm:pl-3 border-l border-slate-100">
              <div className="w-8 h-8 rounded-full bg-purple-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                S
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight">Sarthak Roy</div>
                <div className="text-[10px] text-slate-400 font-medium">Admin</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Dashboard Body (Sidebar + Content Canvas) */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          
          {/* Left Sidebar */}
          <div className="hidden md:flex md:col-span-3 lg:col-span-2.5 p-4 border-r border-slate-100 bg-white flex-col justify-between">
            <div className="space-y-1">
              {/* 1. Dashboard (Active Pill) */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#2563EB] text-white font-semibold text-xs shadow-xs cursor-pointer">
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </div>

              {/* 2. Leads */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Leads</span>
              </div>

              {/* 3. Call Center */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer">
                <PhoneCall className="w-3.5 h-3.5 text-slate-500" />
                <span>Call Center</span>
              </div>

              {/* 4. Students */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer">
                <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                <span>Students</span>
              </div>

              {/* 5. Batches */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Batches</span>
              </div>

              {/* 6. Fees */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer">
                <Wallet className="w-3.5 h-3.5 text-slate-500" />
                <span>Fees</span>
              </div>

              {/* 7. Analytics */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer">
                <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Analytics</span>
              </div>
            </div>
          </div>

          {/* Right Main Dashboard Canvas */}
          <div className="md:col-span-9 lg:col-span-9.5 p-4 sm:p-5 bg-[#F8FAFC] space-y-4">
            
            {/* Dashboard Title & Filter Header */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">Dashboard</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                  Here&apos;s what&apos;s happening at your institute today.
                </p>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                <span>This Month</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>

            {/* 4 Top Metric Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Card 1: Total Leads */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Total Leads</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">1,248</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                    <span>12%</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Calls Made */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Calls Made</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Phone className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">856</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                    <span>18%</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Admissions */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Admissions</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">142</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-600">
                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                    <span>24%</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Fees Collected */}
              <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Fees Collected</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight font-mono">₹4,28,000</div>
                  <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-500">
                    <ArrowUp className="w-3 h-3 stroke-[3]" />
                    <span>20%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row: Leads by Source + Recent Activities Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              
              {/* Left: Leads by Source Donut Chart Card */}
              <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] mb-2">Leads by Source</h4>
                
                <div className="flex items-center justify-around gap-3 py-1">
                  {/* SVG Multi-color Donut Chart */}
                  <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                      {/* Background circle track */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#F1F5F9"
                        strokeWidth="5"
                      />
                      {/* Segment 1: Website 38% (Blue) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#2563EB"
                        strokeWidth="5"
                        strokeDasharray="33.4 88"
                        strokeDashoffset="0"
                      />
                      {/* Segment 2: Walk-in 25% (Green) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#10B981"
                        strokeWidth="5"
                        strokeDasharray="22 88"
                        strokeDashoffset="-33.4"
                      />
                      {/* Segment 3: Referral 18% (Yellow/Amber) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#F59E0B"
                        strokeWidth="5"
                        strokeDasharray="15.8 88"
                        strokeDashoffset="-55.4"
                      />
                      {/* Segment 4: Social Media 19% (Orange) */}
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="transparent"
                        stroke="#F97316"
                        strokeWidth="5"
                        strokeDasharray="16.8 88"
                        strokeDashoffset="-71.2"
                      />
                    </svg>
                  </div>

                  {/* Legend list */}
                  <div className="space-y-1.5 text-[11px] sm:text-xs flex-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                        <span>Website</span>
                      </span>
                      <span className="font-bold text-slate-800">38%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <span>Walk-in</span>
                      </span>
                      <span className="font-bold text-slate-800">25%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        <span>Referral</span>
                      </span>
                      <span className="font-bold text-slate-800">18%</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-[#F97316]" />
                        <span>Social Media</span>
                      </span>
                      <span className="font-bold text-slate-800">12%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Recent Activities List Card */}
              <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs sm:text-sm font-bold text-[#0F172A]">Recent Activities</h4>
                  <button className="text-[11px] text-blue-600 font-semibold hover:underline">
                    View All →
                  </button>
                </div>

                <div className="space-y-2.5">
                  {/* Activity 1: New lead added */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[11px] sm:text-xs">New lead added</div>
                        <div className="text-[10px] text-slate-400">Rohan Sharma</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">2m ago</span>
                  </div>

                  {/* Activity 2: Call completed */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Call completed</div>
                        <div className="text-[10px] text-slate-400">Priya Verma</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">15m ago</span>
                  </div>

                  {/* Activity 3: Fee payment received */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-[11px] sm:text-xs">Fee payment received</div>
                        <div className="text-[10px] text-slate-400">₹12,000 - Class 11 Batch</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium">1h ago</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
