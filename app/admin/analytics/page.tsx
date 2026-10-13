"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  GraduationCap,
  UserCheck,
  Briefcase,
  Search,
  User,
  Settings,
  ChevronDown,
  Plus,
  Phone,
  Filter,
  BookOpen,
  Calendar,
  Check,
  LogOut,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

// Format currency in Indian format
function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

// Generate smooth cubic Bézier SVG path
function generateSmoothPath(points: { x: number; y: number }[]): string {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 5;
    const cp1y = p1.y + (p2.y - p0.y) / 5;

    const cp2x = p2.x - (p3.x - p1.x) / 5;
    const cp2y = p2.y - (p3.y - p1.y) / 5;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

// Render dynamic sparkline bars based on actual time buckets
function renderSparklineBars(sparkline: number[] = [], baseColor = "blue") {
  const values = sparkline && sparkline.length ? sparkline : [0, 0, 0, 0, 0, 0];
  const maxVal = Math.max(...values, 1);
  const colorMap: Record<string, string[]> = {
    blue: ["bg-blue-200", "bg-blue-300", "bg-blue-400", "bg-blue-500", "bg-blue-600"],
    emerald: ["bg-emerald-200", "bg-emerald-300", "bg-emerald-400", "bg-emerald-500", "bg-emerald-600"],
    purple: ["bg-purple-200", "bg-purple-300", "bg-purple-400", "bg-purple-500", "bg-purple-600"],
    teal: ["bg-teal-200", "bg-teal-300", "bg-teal-400", "bg-teal-500", "bg-teal-600"],
  };
  const shades = colorMap[baseColor] || colorMap.blue;

  return (
    <div className="flex items-end gap-1 h-12 self-end pb-1">
      {values.map((v, i) => {
        const heightPct = Math.max(Math.round((v / maxVal) * 100), 14);
        const shade = shades[Math.min(i, shades.length - 1)];
        return (
          <div
            key={i}
            className={`w-1.5 rounded-xs transition-all duration-300 ${shade}`}
            style={{ height: `${heightPct}%` }}
            title={`Interval ${i + 1}: ${v}`}
          />
        );
      })}
    </div>
  );
}

// Render dynamic delta comparison badge
function renderDeltaBadge(delta: number | undefined) {
  if (delta === undefined || delta === 0) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
        — Stable
      </span>
    );
  }
  if (delta > 0) {
    return (
      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
        ↗ +{delta}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
      ↘ {delta}%
    </span>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<any | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedRangeKey, setSelectedRangeKey] = useState<"7d" | "14d" | "30d" | "this_month" | "all">("30d");

  // Section-specific filter dropdown states
  const [funnelRange, setFunnelRange] = useState<"7d" | "14d" | "30d" | "this_month" | "all">("30d");
  const [funnelDropdownOpen, setFunnelDropdownOpen] = useState(false);

  const [courseRange, setCourseRange] = useState<"7d" | "14d" | "30d" | "this_month" | "all">("30d");
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);

  const [counsellorRange, setCounsellorRange] = useState<"7d" | "14d" | "30d" | "this_month" | "all">("30d");
  const [counsellorDropdownOpen, setCounsellorDropdownOpen] = useState(false);

  // Add Lead Modal State
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadCourse, setNewLeadCourse] = useState("IIT-JEE Advanced");
  const [newLeadAssignedTo, setNewLeadAssignedTo] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Dynamic Greeting based on current local time
  const [greeting, setGreeting] = useState("Good evening");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good afternoon");
    } else {
      setGreeting("Good evening");
    }
  }, []);

  const userName = user?.name ? user.name.split(" ")[0] : "Admin";

  const getRangeLabel = (key: string): string => {
    switch (key) {
      case "7d": return "Last 7 Days";
      case "14d": return "Last 14 Days";
      case "30d": return "Last 30 Days";
      case "this_month": return "This Month";
      case "all": return "All Time";
      default: return "This Month";
    }
  };

  // Check authentication
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          if (!["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(data.user.role)) {
            showToast("Admin access required", "error");
            router.push("/leads");
          }
        } else {
          router.push("/login");
        }
        setUserLoading(false);
      })
      .catch(() => {
        router.push("/login");
        setUserLoading(false);
      });
  }, [router, showToast]);

  const fetchAnalytics = async (
    rangeKey = selectedRangeKey,
    fRange = funnelRange,
    cRange = courseRange,
    counRange = counsellorRange
  ) => {
    try {
      const res = await fetch(
        `/api/admin/analytics?range=${rangeKey}&funnelRange=${fRange}&courseRange=${cRange}&counsellorRange=${counRange}`
      );
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      showToast("Network error loading analytics", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && ["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      fetchAnalytics(selectedRangeKey, funnelRange, courseRange, counsellorRange);
    }
  }, [user, selectedRangeKey, funnelRange, courseRange, counsellorRange]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadPhone || newLeadPhone.trim().length < 8) {
      showToast("Please enter a valid phone number", "error");
      return;
    }

    try {
      setIsSubmittingLead(true);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newLeadName.trim() || undefined,
          phone: newLeadPhone.trim(),
          course: newLeadCourse,
          assignedToId: newLeadAssignedTo || undefined,
          status: "NEW",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create lead");

      showToast("Lead added successfully", "success");
      setIsAddLeadOpen(false);
      setNewLeadName("");
      setNewLeadPhone("");
      fetchAnalytics(selectedRangeKey);
    } catch (err: any) {
      showToast(err.message || "Failed to create lead", "error");
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const { summary, funnel, dailyTrends, courseDistribution, counsellors, dateRangeLabel } = metrics || {
    summary: {
      totalRevenue: 0,
      currentMonthRevenue: 0,
      salesGrowthRate: 0,
      totalLeads: 0,
      totalConverted: 0,
      totalConversionRate: 0,
      totalCalls: 0,
      recentCalls: 0,
      totalWhatsApp: 0,
      totalNoAnswer: 0,
      noAnswerRate: 0,
      avgTicketSize: 25000,
      leadsDelta: 0,
      callsDelta: 0,
      admissionsDelta: 0,
      revenueDelta: 0,
      leadsSparkline: [0, 0, 0, 0, 0, 0],
      callsSparkline: [0, 0, 0, 0, 0, 0],
      admissionsSparkline: [0, 0, 0, 0, 0, 0],
      revenueSparkline: [0, 0, 0, 0, 0, 0],
    },
    funnel: [],
    dailyTrends: [],
    courseDistribution: [],
    counsellors: [],
    dateRangeLabel: "",
  };

  // Dynamic Donut segments
  const courseSegments = useMemo(() => {
    if (!courseDistribution || !courseDistribution.length) return [];
    const circumference = 251.2; // 2 * pi * 40
    let cumulativeOffset = 0;
    const colors = ["#2563EB", "#9333EA", "#059669", "#D97706", "#0284C7", "#E11D48"];

    return courseDistribution.map((course: any, idx: number) => {
      const pct = course.percentage > 0 ? course.percentage / 100 : (1 / courseDistribution.length);
      const strokeLen = pct * circumference;
      const seg = {
        name: course.name,
        color: colors[idx % colors.length],
        dasharray: `${strokeLen} ${circumference - strokeLen}`,
        dashoffset: -cumulativeOffset,
      };
      cumulativeOffset += strokeLen;
      return seg;
    });
  }, [courseDistribution]);

  // Real Multi-Series Graph Data
  const trendData = dailyTrends && dailyTrends.length > 0 ? dailyTrends : [];
  const svgW = 760;
  const svgH = 220;

  // Calculate dynamic maximum value based on actual database counts
  const chartMax = useMemo(() => {
    if (!trendData.length) return 50;
    const maxValFound = Math.max(
      ...trendData.map((d: any) => Math.max(d.leads || 0, d.calls || 0, d.conversions || 0)),
      10
    );
    return Math.ceil(maxValFound / 10) * 10;
  }, [trendData]);

  const yAxisTicks = useMemo(() => {
    const step = chartMax / 5;
    return [chartMax, Math.round(step * 4), Math.round(step * 3), Math.round(step * 2), Math.round(step), 0];
  }, [chartMax]);

  const leadsPoints = useMemo(() => {
    if (!trendData.length) return [];
    const step = svgW / (trendData.length - 1 || 1);
    return trendData.map((d: any, i: number) => {
      const val = d.leads !== undefined ? d.leads : (d.cumulativeLeads || 0);
      return {
        x: i * step,
        y: svgH - (val / (chartMax || 1)) * (svgH - 40) - 20,
        leads: val,
        calls: d.calls,
        conversions: d.conversions,
        date: d.date,
      };
    });
  }, [trendData, chartMax]);

  const callsPoints = useMemo(() => {
    if (!trendData.length) return [];
    const step = svgW / (trendData.length - 1 || 1);
    return trendData.map((d: any, i: number) => ({
      x: i * step,
      y: svgH - (d.calls / (chartMax || 1)) * (svgH - 40) - 20,
    }));
  }, [trendData, chartMax]);

  const admissionsPoints = useMemo(() => {
    if (!trendData.length) return [];
    const step = svgW / (trendData.length - 1 || 1);
    return trendData.map((d: any, i: number) => ({
      x: i * step,
      y: svgH - (d.conversions / (chartMax || 1)) * (svgH - 40) - 20,
    }));
  }, [trendData, chartMax]);

  const leadsCurve = useMemo(() => generateSmoothPath(leadsPoints), [leadsPoints]);
  const callsCurve = useMemo(() => generateSmoothPath(callsPoints), [callsPoints]);
  const admissionsCurve = useMemo(() => generateSmoothPath(admissionsPoints), [admissionsPoints]);

  const leadsArea = useMemo(() => {
    if (!leadsCurve || !leadsPoints.length) return "";
    const last = leadsPoints[leadsPoints.length - 1];
    return `${leadsCurve} L ${last.x} ${svgH} L 0 ${svgH} Z`;
  }, [leadsCurve, leadsPoints]);

  const activeTooltip =
    hoveredTrendIdx !== null && leadsPoints[hoveredTrendIdx]
      ? leadsPoints[hoveredTrendIdx]
      : null;

  // Filtered counsellors and courses based on search query
  const filteredCounsellors = useMemo(() => {
    if (!searchQuery.trim()) return counsellors;
    const q = searchQuery.toLowerCase();
    return counsellors.filter(
      (c: any) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [counsellors, searchQuery]);

  const filteredCourses = useMemo(() => {
    if (!searchQuery.trim()) return courseDistribution;
    const q = searchQuery.toLowerCase();
    return courseDistribution.filter((c: any) => c.name.toLowerCase().includes(q));
  }, [courseDistribution, searchQuery]);

  // Dynamic date labels for X-axis
  const xAxisLabels = useMemo(() => {
    if (!trendData.length) return [];
    const len = trendData.length;
    return [
      trendData[0]?.date,
      trendData[Math.floor(len * 0.25)]?.date,
      trendData[Math.floor(len * 0.5)]?.date,
      trendData[Math.floor(len * 0.75)]?.date,
      trendData[len - 1]?.date,
    ];
  }, [trendData]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] flex flex-col font-sans">
        <div className="bg-[#0B132B] h-52 w-full animate-pulse" />
        <div className="max-w-7xl w-full mx-auto px-6 -mt-16 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl shadow-sm animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-20 antialiased">
      
      {/* =========================================================================
          1. TOP DARK HEADER BAR & NAVBAR
      ========================================================================= */}
      <div className="bg-[#0B132B] text-white pt-4 pb-28 sm:pb-32 px-4 sm:px-6 lg:px-10 relative">
        
        {/* Subtle Ambient Background Gradients (isolated overflow hidden) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[260px] bg-gradient-to-bl from-blue-600/10 via-sky-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-10 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-2xl" />
        </div>

        {/* Top Navbar */}
        <header className="max-w-7xl mx-auto flex items-center justify-between gap-4 pb-5 border-b border-white/10 relative z-50">
          
          {/* Brand Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group select-none">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm group-hover:bg-blue-500 transition-colors">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white leading-none">
                  LeadDesk
                </span>
                <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase mt-0.5">
                  CRM
                </span>
              </div>
            </Link>

            {/* Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 text-white font-bold shadow-xs transition-colors border border-white/10"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/leads"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Leads</span>
              </Link>
              <Link
                href="/admin/import"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
              >
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Admissions</span>
              </Link>
              <Link
                href="/admin/counsellors"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Counsellors</span>
              </Link>
              <Link
                href="/admin/employees"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>HR & Team</span>
              </Link>
            </nav>
          </div>

          {/* Right Controls: Add Lead & Refined Account Capsule */}
          <div className="flex items-center gap-3">
            
            {/* Quick Add Lead Button */}
            <button
              onClick={() => setIsAddLeadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm shadow-blue-600/30 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Lead</span>
            </button>

            {/* Refined Profile Capsule */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2 py-1 pl-1.5 pr-2.5 rounded-full border transition-all cursor-pointer select-none ${
                  userMenuOpen
                    ? "bg-white/15 border-white/25 shadow-md"
                    : "bg-white/10 hover:bg-white/15 border-white/10 hover:border-white/20"
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <span className="text-xs font-semibold text-slate-100 hidden sm:inline-block max-w-[130px] truncate">
                  {user?.name || "Admin"}
                </span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${userMenuOpen ? "rotate-180 text-white" : ""}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-[#0B132B]/98 backdrop-blur-2xl border border-white/15 text-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-2 text-xs z-50 animate-in fade-in zoom-in-95 origin-top-right">
                    
                    {/* User Info Header */}
                    <div className="px-3 py-2 rounded-xl bg-white/[0.06] mb-1.5 border border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-sm">
                          {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs truncate">
                            {user?.name || "Admin"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {user?.email || "admin@leaddesk.com"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/20 text-sky-300 font-semibold text-[9px] uppercase tracking-wider">
                          {user?.role ? user.role.replace(/_/g, " ") : "Administrator"}
                        </span>
                      </div>
                    </div>

                    {/* Menu Links */}
                    <div className="space-y-0.5">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium text-xs"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        href="/admin/settings"
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium text-xs"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        <span>Workspace Settings</span>
                      </Link>
                    </div>

                    {/* Divider & Logout */}
                    <div className="mt-1.5 pt-1.5 border-t border-white/10">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-2.5 py-1.5 text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-xs"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-400" />
                        <span>Log Out</span>
                      </button>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>
        </header>

        {/* Hero Greeting Row */}
        <div className="max-w-7xl mx-auto pt-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {greeting}, {userName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              Your institute's admissions and revenue overview.
            </p>
          </div>
        </div>

      </div>

      {/* =========================================================================
          2. TOP 4 FLOATING KPI CARDS WITH DYNAMIC SPARKLINE CHARTS
      ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 -mt-14 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          
          {/* KPI 1: TOTAL LEADS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Leads
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {summary.totalLeads}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {renderDeltaBadge(summary.leadsDelta)}
                <span className="text-[10px] text-slate-400 font-medium">vs last 30 days</span>
              </div>
            </div>

            {/* Sparkline Bar Chart (Blue) */}
            {renderSparklineBars(summary.leadsSparkline, "blue")}
          </div>

          {/* KPI 2: CALLS LOGGED */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Phone className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Calls Logged
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {summary.totalCalls}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {renderDeltaBadge(summary.callsDelta)}
                <span className="text-[10px] text-slate-400 font-medium">vs last 30 days</span>
              </div>
            </div>

            {/* Sparkline Bar Chart (Green) */}
            {renderSparklineBars(summary.callsSparkline, "emerald")}
          </div>

          {/* KPI 3: ADMISSIONS */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <GraduationCap className="w-4.5 h-4.5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Admissions
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {summary.totalConverted}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {renderDeltaBadge(summary.admissionsDelta)}
                <span className="text-[10px] text-slate-400 font-medium">vs last 30 days</span>
              </div>
            </div>

            {/* Sparkline Bar Chart (Purple) */}
            {renderSparklineBars(summary.admissionsSparkline, "purple")}
          </div>

          {/* KPI 4: TOTAL REVENUE */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-md transition-all flex items-center justify-between">
            <div className="space-y-2">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-base">
                ₹
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Total Revenue
                </p>
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
                  {formatINR(summary.totalRevenue)}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                {renderDeltaBadge(summary.revenueDelta)}
                <span className="text-[10px] text-slate-400 font-medium">vs last 30 days</span>
              </div>
            </div>

            {/* Sparkline Bar Chart (Teal) */}
            {renderSparklineBars(summary.revenueSparkline, "teal")}
          </div>

        </div>
      </div>

      {/* =========================================================================
          3. MIDDLE ROW: OUTREACH & SALES TREND + ADMISSIONS FUNNEL
      ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLUMNS: OUTREACH & SALES TREND GRAPH */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Outreach & Sales Trend
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Track your lead acquisition, calls and admissions over time.
                  </p>
                </div>
              </div>

              {/* Date Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDateRangeOpen(!dateRangeOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 self-start sm:self-auto transition-colors"
                >
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dateRangeLabel || "27 Sep 2026 - 10 Oct 2026"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {dateRangeOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDateRangeOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95">
                      {[
                        { label: "Last 7 Days", key: "7d" },
                        { label: "Last 14 Days", key: "14d" },
                        { label: "Last 30 Days", key: "30d" },
                        { label: "This Month", key: "this_month" },
                        { label: "All Time", key: "all" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setSelectedRangeKey(item.key as any);
                            setDateRangeOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 font-semibold ${selectedRangeKey === item.key ? "text-blue-600 font-bold bg-blue-50/50" : ""}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Legend indicators */}
            <div className="flex items-center justify-end gap-5 text-xs font-semibold text-slate-600 pt-2 pb-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Leads</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Calls</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Admissions</span>
              </div>
            </div>

            {/* Multi-Line Graph Canvas */}
            <div className="relative w-full h-56 sm:h-64 mt-3 select-none">
              
              {/* Dynamic Y-Axis Labels & Gridlines */}
              <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 font-semibold pointer-events-none pb-5">
                {yAxisTicks.map((tick, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-right font-mono">{tick}</span>
                    <div className={`flex-1 h-px ${i === yAxisTicks.length - 1 ? "bg-slate-200" : "bg-slate-100"}`} />
                  </div>
                ))}
              </div>

              {/* Interactive Tooltip Card */}
              {activeTooltip && (
                <div
                  className="absolute top-0 z-30 pointer-events-none transition-all duration-150 transform -translate-x-1/2 bg-[#0B132B]/95 backdrop-blur-xl border border-white/15 text-white rounded-xl px-3.5 py-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.5)] text-xs select-none"
                  style={{ left: `${Math.max(Math.min((activeTooltip.x / svgW) * 100, 88), 12)}%` }}
                >
                  <p className="font-semibold text-slate-300 text-[10px] pb-1.5 border-b border-white/10 mb-2 flex items-center justify-between gap-4">
                    <span>{activeTooltip.date}</span>
                    <span className="text-[9px] uppercase tracking-wider text-sky-400 font-bold">Daily Activity</span>
                  </p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between gap-5">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs" /> Leads
                      </span>
                      <span className="font-bold text-white font-mono">{activeTooltip.leads}</span>
                    </div>
                    <div className="flex items-center justify-between gap-5">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs" /> Calls
                      </span>
                      <span className="font-bold text-white font-mono">{activeTooltip.calls}</span>
                    </div>
                    <div className="flex items-center justify-between gap-5">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <span className="w-2 h-2 rounded-full bg-purple-400 shadow-xs" /> Admissions
                      </span>
                      <span className="font-bold text-white font-mono">{activeTooltip.conversions}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Graph SVG Lines */}
              <div className="ml-9 h-full">
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="blueGradientFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Vertical Crosshair Guideline on Hover */}
                  {activeTooltip && (
                    <line
                      x1={activeTooltip.x}
                      y1={0}
                      x2={activeTooltip.x}
                      y2={svgH}
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                      strokeOpacity="0.5"
                    />
                  )}

                  {/* Shaded Area under Leads Curve */}
                  {leadsArea && (
                    <path d={leadsArea} fill="url(#blueGradientFill)" />
                  )}

                  {/* 1. Leads Line (Blue) */}
                  {leadsCurve && (
                    <path
                      d={leadsCurve}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* 2. Calls Line (Green) */}
                  {callsCurve && (
                    <path
                      d={callsCurve}
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* 3. Admissions Line (Purple) */}
                  {admissionsCurve && (
                    <path
                      d={admissionsCurve}
                      fill="none"
                      stroke="#8B5CF6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Interactive Full-Height Column Hover Bands */}
                  {leadsPoints.map((pt: any, idx: number) => {
                    const colWidth = svgW / (leadsPoints.length || 1);
                    return (
                      <g
                        key={idx}
                        onMouseEnter={() => setHoveredTrendIdx(idx)}
                        onMouseLeave={() => setHoveredTrendIdx(null)}
                        className="cursor-pointer"
                      >
                        <rect
                          x={pt.x - colWidth / 2}
                          y={0}
                          width={colWidth}
                          height={svgH}
                          fill="transparent"
                        />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={hoveredTrendIdx === idx ? "5.5" : "3.5"}
                          fill={hoveredTrendIdx === idx ? "#2563EB" : "#FFFFFF"}
                          stroke="#2563EB"
                          strokeWidth="2"
                        />
                      </g>
                    );
                  })}
                </svg>

                {/* X-Axis Date Labels */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold pt-2 px-1">
                  {xAxisLabels.map((lbl, idx) => (
                    <span key={idx}>{lbl}</span>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: ADMISSIONS FUNNEL */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Filter className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Admissions Funnel
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Conversion from inquiry to admission
                  </p>
                </div>
              </div>

              {/* Admissions Funnel Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setFunnelDropdownOpen(!funnelDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <span>{getRangeLabel(funnelRange)}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {funnelDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setFunnelDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95">
                      {[
                        { label: "This Month", key: "this_month" },
                        { label: "Last 7 Days", key: "7d" },
                        { label: "Last 14 Days", key: "14d" },
                        { label: "Last 30 Days", key: "30d" },
                        { label: "All Time", key: "all" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setFunnelRange(item.key as any);
                            setFunnelDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold cursor-pointer ${funnelRange === item.key ? "text-blue-600 font-bold bg-blue-50/50" : ""}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Funnel Stages from Real Live Database */}
            <div className="space-y-4 mt-6">
              {funnel.length > 0 ? (
                funnel.map((item: any, idx: number) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        <span className="text-slate-400 font-normal">{idx + 1}</span>
                        <span>{item.stage}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-black">{item.count}</span>
                        <span className="text-slate-400 text-[11px] font-normal">{item.percent}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                        style={{ width: `${Math.max(item.percent, item.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No funnel data available
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          4. BOTTOM ROW: COURSE ATTRIBUTION + COUNSELLOR PERFORMANCE
      ========================================================================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 1 COLUMN: COURSE REVENUE ATTRIBUTION (DONUT CHART) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Course Revenue Attribution
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Revenue generated by each course
                  </p>
                </div>
              </div>

              {/* Course Revenue Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <span>{getRangeLabel(courseRange)}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {courseDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCourseDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95">
                      {[
                        { label: "This Month", key: "this_month" },
                        { label: "Last 7 Days", key: "7d" },
                        { label: "Last 14 Days", key: "14d" },
                        { label: "Last 30 Days", key: "30d" },
                        { label: "All Time", key: "all" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setCourseRange(item.key as any);
                            setCourseDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold cursor-pointer ${courseRange === item.key ? "text-blue-600 font-bold bg-blue-50/50" : ""}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Donut Ring & Real Courses Legend */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-6">
              
              {/* Donut Circle */}
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#F1F5F9"
                    strokeWidth="12"
                  />
                  {courseSegments.length > 0 && (metrics?.summary?.courseTotalRevenue || summary.totalRevenue) > 0 ? (
                    courseSegments.map((seg: any, idx: number) => (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth="12"
                        strokeDasharray={seg.dasharray}
                        strokeDashoffset={seg.dashoffset}
                        className="transition-all duration-700"
                      />
                    ))
                  ) : (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#E2E8F0"
                      strokeWidth="12"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-sm font-black text-slate-900 leading-tight">
                    {formatINR(metrics?.summary?.courseTotalRevenue !== undefined ? metrics.summary.courseTotalRevenue : summary.totalRevenue)}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                    Course Sales
                  </p>
                </div>
              </div>

              {/* Dynamic Real Courses from Database */}
              <div className="flex-1 w-full space-y-3 max-h-48 overflow-y-auto pr-1">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course: any, idx: number) => {
                    const colors = ["bg-blue-600", "bg-purple-600", "bg-emerald-600", "bg-amber-600", "bg-sky-600"];
                    const color = colors[idx % colors.length];
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate">{course.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">
                              {course.totalLeads} inquiries · {course.conversions} enrolled
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <p className="font-extrabold text-slate-900">{formatINR(course.revenue)}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{course.percentage}%</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-4 text-center text-xs text-slate-400">
                    {searchQuery ? "No courses match search." : "No course inquiries recorded"}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT 2 COLUMNS: COUNSELLOR PERFORMANCE TABLE */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                    Counsellor Performance
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Detailed closure rates, calling frequency, and sales revenue generated by each counsellor.
                  </p>
                </div>
              </div>

              {/* Counsellor Filter Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setCounsellorDropdownOpen(!counsellorDropdownOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <span>{getRangeLabel(counsellorRange)}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {counsellorDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setCounsellorDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-1.5 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1 text-xs text-slate-700 z-50 animate-in fade-in zoom-in-95">
                      {[
                        { label: "This Month", key: "this_month" },
                        { label: "Last 7 Days", key: "7d" },
                        { label: "Last 14 Days", key: "14d" },
                        { label: "Last 30 Days", key: "30d" },
                        { label: "All Time", key: "all" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setCounsellorRange(item.key as any);
                            setCounsellorDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 font-semibold cursor-pointer ${counsellorRange === item.key ? "text-blue-600 font-bold bg-blue-50/50" : ""}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Performance Table */}
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-2">#</th>
                    <th className="py-2.5 px-3">Counsellor</th>
                    <th className="py-2.5 px-3 text-center">Assigned Leads</th>
                    <th className="py-2.5 px-3 text-center">Calls (7d / Total)</th>
                    <th className="py-2.5 px-3 text-center">Admissions</th>
                    <th className="py-2.5 px-3 text-center">Revenue</th>
                    <th className="py-2.5 px-3 text-right">Conversion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCounsellors.length > 0 ? (
                    filteredCounsellors.map((c: any, idx: number) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-2 font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                              {c.name ? c.name.charAt(0).toUpperCase() : "G"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{c.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {c.totalLeads}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold">
                          <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                            {c.activityCount}
                          </span>
                          <span className="text-slate-400 ml-1">/ {c.totalCalls}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {c.convertedLeads}
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-slate-900">
                          {formatINR(c.revenue)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-bold text-emerald-600">
                              {c.conversionRate}%
                            </span>
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${Math.min(c.conversionRate, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        {searchQuery ? "No counsellors match search." : "No counsellors assigned yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* =========================================================================
          5. QUICK ADD LEAD MODAL
      ========================================================================= */}
      {isAddLeadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Add New Student Lead</h3>
                  <p className="text-xs text-slate-400">Direct admission inquiry entry</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddLeadOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-slate-700 mb-1.5">Student Full Name</label>
                <input
                  type="text"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5">Target Course / Stream</label>
                <select
                  value={newLeadCourse}
                  onChange={(e) => setNewLeadCourse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                >
                  <option value="IIT-JEE Advanced">IIT-JEE Advanced (₹45,000)</option>
                  <option value="NEET Medical">NEET Medical (₹42,000)</option>
                  <option value="Foundation Class 9-10">Foundation Class 9-10 (₹28,000)</option>
                  <option value="UPSC Civil Services">UPSC Civil Services (₹50,000)</option>
                  <option value="General Coaching">General Coaching (₹20,000)</option>
                </select>
              </div>

              {counsellors.length > 0 && (
                <div>
                  <label className="block text-slate-700 mb-1.5">Assign to Counsellor</label>
                  <select
                    value={newLeadAssignedTo}
                    onChange={(e) => setNewLeadAssignedTo(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-blue-600 focus:bg-white transition-all text-xs"
                  >
                    <option value="">Unassigned (Auto-Queue)</option>
                    {counsellors.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddLeadOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-colors font-bold text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmittingLead ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 stroke-[3]" />}
                  <span>Save Lead</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
