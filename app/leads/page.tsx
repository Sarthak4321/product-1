"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Phone,
  Clock,
  Trash2,
  Tag,
  MapPin,
  X,
  Play,
  Plus,
  PhoneCall,
  Check,
  User,
  Settings,
  LogOut,
  Calendar,
  Sparkles,
} from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LeadListSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { parseAndNormalizePhone } from "@/lib/phone";
import { isLeadStale, getStaleLabel } from "@/lib/staleness";
import { formatFollowUp } from "@/lib/followup";
import { useApp } from "@/components/context/AppContext";

const STATUS_TABS = [
  { id: "ALL", label: "All" },
  { id: "NEW", label: "New" },
  { id: "FOLLOW_UP", label: "Follow-up" },
  { id: "INTERESTED", label: "Interested" },
  { id: "CONTACTED", label: "Contacted" },
  { id: "CONVERTED", label: "Converted" },
  { id: "NO_ANSWER", label: "No Answer" },
  { id: "WRONG_NUMBER", label: "Wrong Number" },
  { id: "NOT_INTERESTED", label: "Not Interested" },
];

const PRIMARY_TABS = STATUS_TABS.slice(0, 3);
const SECONDARY_TABS = STATUS_TABS.slice(3);

export default function LeadsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    user,
    userLoading,
    counsellors,
    leads,
    leadsLoading,
    countsMap,
    totalLeads,
    totalPages,
    fetchLeadsCached,
    invalidateLeadsCache,
    refreshCounsellors,
  } = useApp();

  const isLoading = leadsLoading;
  const [isNextLoading, setIsNextLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Checkbox multi-select
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selected Counsellor performance detail & activities
  const [selectedPerformanceCounsellor, setSelectedPerformanceCounsellor] = useState<any | null>(null);
  const [counsellorActivities, setCounsellorActivities] = useState<any[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);

  // Today's Follow-up alerts
  const [todayFollowUps, setTodayFollowUps] = useState<any[]>([]);
  const [isTodayFollowUpsLoading, setIsTodayFollowUpsLoading] = useState(false);
  const [onlyShowCalledLeads, setOnlyShowCalledLeads] = useState(false);

  // Add Lead Modal & Form
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState("");
  const [newLeadPhone, setNewLeadPhone] = useState("");
  const [newLeadClass, setNewLeadClass] = useState("");
  const [newLeadCourse, setNewLeadCourse] = useState("IIT-JEE Advanced");
  const [newLeadPlace, setNewLeadPlace] = useState("");
  const [newLeadNotes, setNewLeadNotes] = useState("");
  const [newLeadAssignedId, setNewLeadAssignedId] = useState("");
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  const isAdmin = Boolean(
    user?.role && ["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(user.role)
  );

  const fetchTodayFollowUps = useCallback(async () => {
    if (!user) return;
    setIsTodayFollowUpsLoading(true);
    try {
      const res = await fetch("/api/leads?status=TODAY_FOLLOW_UP&limit=20&assigned=me");
      if (res.ok) {
        const data = await res.json();
        setTodayFollowUps(data.leads || []);
      }
    } catch (e) {
      console.error("Error fetching today's followups:", e);
    } finally {
      setIsTodayFollowUpsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === "SUPER_ADMIN") {
      router.replace("/super-admin");
    }
  }, [user, router]);

  useEffect(() => {
    fetchTodayFollowUps();
  }, [fetchTodayFollowUps]);

  // Check auth redirect
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    } else if (user && user.role === "COUNSELLOR") {
      setAssignedFilter("me");
    }
  }, [user, userLoading, router]);

  // Fetch leads
  const fetchLeads = useCallback(async (forceFresh = false) => {
    if (!user) return;
    try {
      await fetchLeadsCached({
        page,
        status,
        search,
        assigned: assignedFilter,
      }, forceFresh);
    } catch (e) {
      console.error(e);
      showToast("Could not load leads. Please check connection.", "error");
    }
  }, [user, page, status, search, assignedFilter, fetchLeadsCached, showToast]);

  useEffect(() => {
    if (user) {
      fetchLeads();
    }
  }, [user, fetchLeads]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCounsellorActivities = async (counsellorId: string) => {
    setIsActivitiesLoading(true);
    try {
      const res = await fetch(`/api/counsellors/${counsellorId}/activities`);
      if (res.ok) {
        const data = await res.json();
        setCounsellorActivities(data.activities || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  // Jump to next lead
  const handleStartNextLead = async () => {
    setIsNextLoading(true);
    try {
      const res = await fetch("/api/leads/next");
      const data = await res.json();
      if (data.lead) {
        router.push(`/leads/${data.lead.id}`);
      } else {
        showToast("No pending leads to process right now. Great job!", "info");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to find next lead", "error");
    } finally {
      setIsNextLoading(false);
    }
  };

  // Create lead manually
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadPhone || newLeadPhone.trim().length < 8) {
      showToast("Please enter a valid phone number", "error");
      return;
    }

    setIsCreatingLead(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: newLeadPhone.trim(),
          name: newLeadName.trim() || undefined,
          class: newLeadClass.trim() || undefined,
          place: newLeadPlace.trim() || undefined,
          course: newLeadCourse.trim() || undefined,
          notes: newLeadNotes.trim() || undefined,
          assignedToId: newLeadAssignedId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to create lead", "error");
        setIsCreatingLead(false);
        return;
      }

      showToast("Lead created successfully!", "success");
      setNewLeadPhone("");
      setNewLeadName("");
      setNewLeadClass("");
      setNewLeadPlace("");
      setNewLeadCourse("IIT-JEE Advanced");
      setNewLeadNotes("");
      setNewLeadAssignedId("");
      setShowAddLeadModal(false);

      invalidateLeadsCache();
      fetchLeads(true);
      refreshCounsellors();
    } catch (err) {
      console.error(err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsCreatingLead(false);
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete these ${selectedIds.length} leads completely from the database?`)) return;

    try {
      const res = await fetch("/api/leads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedIds }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Leads deleted successfully", "success");
        setSelectedIds([]);
        invalidateLeadsCache();
        fetchLeads(true);
        refreshCounsellors();
      } else {
        showToast(data.error || "Failed to delete leads", "error");
      }
    } catch {
      showToast("Operation failed", "error");
    }
  };

  const handleBulkReassign = async (counsellorId: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedIds, assignedToId: counsellorId }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Leads reassigned successfully", "success");
        setSelectedIds([]);
        invalidateLeadsCache();
        fetchLeads(true);
        refreshCounsellors();
      } else {
        showToast(data.error || "Failed to reassign leads", "error");
      }
    } catch {
      showToast("Operation failed", "error");
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedIds, status: newStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "Leads status updated", "success");
        setSelectedIds([]);
        invalidateLeadsCache();
        fetchLeads(true);
        refreshCounsellors();
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Operation failed", "error");
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map((l) => l.id));
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans text-slate-900 selection:bg-blue-100 selection:text-blue-900 pb-20 antialiased">
      
      {/* =========================================================================
          1. TOP DARK HEADER BAR & NAVBAR (Matching Primary Dashboard)
      ========================================================================= */}
      <div className="bg-[#0B132B] text-white pt-4 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-10 relative">
        
        {/* Subtle Ambient Background Gradients */}
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

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:text-white hover:bg-white/5 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/leads"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 text-white font-bold shadow-xs transition-colors border border-white/10"
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Leads</span>
              </Link>
              {isAdmin && (
                <>
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
                </>
              )}
            </nav>
          </div>

          {/* Right Controls: Add Lead & Refined Account Capsule */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowAddLeadModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm shadow-blue-600/30 transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Lead</span>
              </button>
            )}

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
                  {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <span className="text-xs font-semibold text-slate-100 hidden sm:inline-block max-w-[130px] truncate">
                  {user?.name || "User"}
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
                          {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-white text-xs truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {user?.email || ""}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-500/20 text-sky-300 font-semibold text-[9px] uppercase tracking-wider">
                          {user?.role ? user.role.replace(/_/g, " ") : "Member"}
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
                      {isAdmin && (
                        <Link
                          href="/admin/settings"
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-white/10 transition-colors font-medium text-xs"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-400" />
                          <span>Workspace Settings</span>
                        </Link>
                      )}
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

        {/* Hero Title & Actions Row */}
        <div className="max-w-7xl mx-auto pt-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Leads Directory
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-sky-300 text-xs font-bold font-mono">
                {totalLeads.toLocaleString()} leads
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              {isAdmin
                ? "Global administrative controls and lead workload scoping."
                : "Manage and follow up on your assigned counsellor leads."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleStartNextLead}
              disabled={isNextLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95 shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isNextLoading ? "Finding Lead..." : "Start Calling Next Lead"}</span>
            </button>
          </div>
        </div>

      </div>

      {/* =========================================================================
          2. FLOATING CONTENT WRAPPER & FILTERS
      ========================================================================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 -mt-10 sm:-mt-12 relative z-20 space-y-6">

        {/* Floating Filter & Search Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Real-time search bar */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search leads by name, phone, course, city..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-hidden transition-all"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Counsellor Scope Selector Dropdown (Admin Only) */}
            {isAdmin && (
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap hidden lg:inline">
                  Assigned
                </span>
                <select
                  value={assignedFilter}
                  onChange={(e) => {
                    setAssignedFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full md:w-48 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                >
                  <option value="all">All Counsellors</option>
                  <option value="unassigned">Unassigned Pool</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Status Tabs Slider */}
          <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
            {PRIMARY_TABS.map((tab) => {
              const count = countsMap[tab.id];
              const isSelected = status === tab.id;
              
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatus(tab.id);
                    setPage(1);
                  }}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-50 border border-slate-200/80 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span>{tab.label}</span>
                  {count !== undefined && count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Dropdown for other status outcomes */}
            <div className="relative inline-flex">
              <select
                value={SECONDARY_TABS.some((t) => t.id === status) ? status : "MORE"}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
                className={`appearance-none shrink-0 inline-flex items-center pl-3.5 pr-8 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer outline-hidden border ${
                  SECONDARY_TABS.some((t) => t.id === status)
                    ? "bg-slate-900 text-white shadow-sm border-slate-900"
                    : "bg-slate-50 border-slate-200/85 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <option value="MORE" disabled={status !== "MORE"}>
                  {SECONDARY_TABS.some((t) => t.id === status)
                    ? `Status: ${STATUS_TABS.find((t) => t.id === status)?.label}`
                    : "More Statuses..."}
                </option>
                {SECONDARY_TABS.map((tab) => {
                  const count = countsMap[tab.id];
                  return (
                    <option key={tab.id} value={tab.id} className="text-slate-800 bg-white">
                      {tab.label} {count !== undefined && count > 0 ? `(${count})` : ""}
                    </option>
                  );
                })}
              </select>
              <div className={`pointer-events-none absolute inset-y-0 right-3 flex items-center ${
                SECONDARY_TABS.some((t) => t.id === status) ? "text-white" : "text-slate-500"
              }`}>
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Follow-up Alert Tray */}
        {!isTodayFollowUpsLoading && todayFollowUps.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Today's Follow-ups ({todayFollowUps.length})</span>
              </h3>
              <button 
                onClick={() => fetchTodayFollowUps()}
                className="text-[11px] text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1.5 transition-colors bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-xl cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {todayFollowUps.map((fLead) => {
                const followUpTime = fLead.followUpAt ? new Date(fLead.followUpAt) : null;
                const isOverdue = followUpTime ? followUpTime.getTime() < Date.now() : false;
                return (
                  <div key={fLead.id} className="bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl p-3 flex flex-col justify-between gap-3 transition-all shadow-xs hover:shadow-sm">
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 truncate">{fLead.name || "Unnamed Student"}</p>
                        {isOverdue && (
                          <span className="bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border border-rose-200 shrink-0">
                            Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 mt-1">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>
                          {followUpTime ? followUpTime.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }) : ""}
                        </span>
                      </div>
                    </div>
                    <Link 
                      href={`/leads/${fLead.id}`}
                      className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold text-[11px] tracking-wide py-2 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Now</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Team Performance Snapshot (Admin Only) */}
        {isAdmin && counsellors.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Team Performance Snapshot</span>
              </h3>
              <span className="text-[11px] font-medium text-slate-400">
                Click a counsellor card to filter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {counsellors.map((c) => {
                const isFilteringThis = assignedFilter === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      const willFilter = !isFilteringThis;
                      setAssignedFilter(willFilter ? c.id : "all");
                      setOnlyShowCalledLeads(willFilter);
                      setSelectedPerformanceCounsellor(willFilter ? c : null);
                      setPage(1);
                      if (willFilter) {
                        fetchCounsellorActivities(c.id);
                      } else {
                        setCounsellorActivities([]);
                      }
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-2.5 cursor-pointer ${
                      isFilteringThis
                        ? "border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-xs"
                        : "border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs ${
                        isFilteringThis ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600 border border-blue-100"
                      }`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {c.name}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Assigned</p>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{c._count?.assignedLeads || 0} leads</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Calls Logged</p>
                        <p className="font-bold text-emerald-600 text-sm mt-0.5">{c._count?.activities || 0}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Counsellor Call Notes Stream (When snapshot selected) */}
        {isAdmin && selectedPerformanceCounsellor && (
          <div className="space-y-4 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyShowCalledLeads}
                  onChange={(e) => setOnlyShowCalledLeads(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span>Show only contacted/called leads (hides NEW status leads)</span>
              </label>

              <button
                onClick={() => {
                  setSelectedPerformanceCounsellor(null);
                  setOnlyShowCalledLeads(false);
                  setAssignedFilter("all");
                }}
                className="text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
              >
                Clear Filter Selection
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call Notes logged by {selectedPerformanceCounsellor.name}</span>
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-bold">
                  {counsellorActivities.length} notes found
                </span>
              </div>

              {isActivitiesLoading ? (
                <p className="text-center text-xs text-slate-500 py-6">Loading call notes stream...</p>
              ) : counsellorActivities.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6">No call notes logged by this counsellor yet.</p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {counsellorActivities.map((act) => (
                    <div key={act.id} className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {act.lead?.name || "Unnamed Student"}
                          </span>
                          <span className="text-slate-400 font-mono">({act.lead?.phone})</span>
                        </div>
                        <span className="text-slate-400">
                          {new Date(act.createdAt).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-start gap-2 text-xs">
                        <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 bg-blue-50 text-blue-700 border border-blue-100 uppercase">
                          {act.response || "Call Note"}
                        </span>
                        <p className="text-slate-700 italic leading-relaxed">
                          {act.notes || "No description provided."}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bulk Action Header Bar (Visible when checkbox selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-blue-600 text-white rounded-2xl shadow-lg animate-in slide-in-from-top-3">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={selectedIds.length === leads.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 bg-white border-white rounded focus:ring-0 cursor-pointer"
              />
              <span className="text-xs font-extrabold uppercase tracking-wide">
                {selectedIds.length} Leads selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isAdmin && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkReassign(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-1.5 px-3 rounded-xl focus:outline-hidden cursor-pointer"
                >
                  <option value="" className="text-slate-900">Reassign Selected To...</option>
                  <option value="unassigned" className="text-slate-900">Remove Assignment</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id} className="text-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold py-1.5 px-3 rounded-xl focus:outline-hidden cursor-pointer"
              >
                <option value="" className="text-slate-900">Change Status To...</option>
                {STATUS_TABS.filter((t) => t.id !== "ALL").map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-900">
                    {t.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 border border-rose-400/30 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        )}

        {/* Lead List Table/Card Grid Layout */}
        {isLoading ? (
          <LeadListSkeleton count={6} />
        ) : leads.length === 0 ? (
          <EmptyState
            title={search ? "No matching leads found" : "No leads found"}
            description={
              search
                ? `No lead matched "${search}". Try adjusting your search query.`
                : "No leads found in this bucket. Create a new lead or import a CSV to get started."
            }
            action={
              isAdmin ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => router.push("/admin/import")}
                >
                  Import CSV Leads
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2.5">
            
            {/* Column Headers */}
            <div className="flex items-center gap-4 px-4 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white/70 rounded-xl border border-slate-200/60">
              <input
                type="checkbox"
                checked={selectedIds.length === leads.length}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
                <span className="sm:col-span-2">Student Lead & Course</span>
                <span className="hidden sm:inline">Assigned Counsellor</span>
                <span className="hidden sm:inline text-right">Lead Status</span>
              </div>
            </div>

            {/* Lead Rows */}
            {(onlyShowCalledLeads ? leads.filter((l) => l.status !== "NEW") : leads).map((lead) => {
              const isChecked = selectedIds.includes(lead.id);
              const parsed = parseAndNormalizePhone(lead.phone);
              const isStale = isLeadStale(lead.status, lead.updatedAt, lead.createdAt);
              const staleLabel = getStaleLabel(lead.updatedAt, lead.createdAt);

              return (
                <div
                  key={lead.id}
                  className={`flex items-center gap-4 bg-white border rounded-2xl p-4 shadow-xs hover:border-blue-300 hover:shadow-md transition-all ${
                    isChecked ? "border-blue-500 ring-2 ring-blue-500/10 bg-blue-50/10" : "border-slate-200/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSelectLead(lead.id)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer shrink-0"
                  />

                  <Link href={`/leads/${lead.id}`} className="flex-1 min-w-0 group">
                    <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-3 sm:gap-4">
                      
                      {/* Student details */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-blue-600 transition-colors truncate">
                            {lead.name || "Unnamed Student"}
                          </h4>
                          {isStale && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider animate-pulse shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {staleLabel}
                            </span>
                          )}
                          <span className="inline-flex sm:hidden">
                            <StatusBadge status={lead.status} size="sm" />
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <p className="text-xs font-mono text-slate-500 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{parsed.display}</span>
                          </p>
                          
                          {lead.status === "FOLLOW_UP" && lead.followUpAt && (() => {
                            const followUpDate = new Date(lead.followUpAt);
                            const isOverdue = followUpDate.getTime() < Date.now();
                            const isToday = followUpDate.toDateString() === new Date().toDateString();
                            
                            let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                            let dotClass = "bg-slate-400";
                            if (isOverdue) {
                              badgeClass = "bg-rose-50 text-rose-700 border-rose-200 shadow-xs animate-pulse";
                              dotClass = "bg-rose-500";
                            } else if (isToday) {
                              badgeClass = "bg-amber-50 text-amber-800 border-amber-200 shadow-2xs";
                              dotClass = "bg-amber-500";
                            }
                            
                            return (
                              <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-extrabold leading-none ${badgeClass}`}>
                                {(isToday || isOverdue) ? (
                                  <span className="relative flex h-1.5 w-1.5">
                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOverdue ? "bg-rose-400" : "bg-amber-400"}`}></span>
                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotClass}`}></span>
                                  </span>
                                ) : (
                                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                                )}
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>
                                  {isOverdue ? "Overdue: " : "Call: "}
                                  {formatFollowUp(lead.followUpAt)}
                                </span>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Badges for place / course / class */}
                        {(lead.class || lead.place || lead.course) && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px] text-slate-500">
                            {lead.course && (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md font-bold">
                                <GraduationCap className="w-3 h-3 text-blue-500" />
                                {lead.course}
                              </span>
                            )}
                            {lead.class && (
                              <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-semibold">
                                Class {lead.class}
                              </span>
                            )}
                            {lead.place && (
                              <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {lead.place}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Assigned Counsellor badge */}
                      <div className="flex items-center gap-2 text-xs text-slate-600 sm:col-span-1">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-slate-200">
                          {lead.assignedTo?.name ? lead.assignedTo.name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <span className={`font-bold truncate ${lead.assignedTo ? "text-slate-800" : "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-[11px]"}`}>
                          {lead.assignedTo?.name || "Unassigned"}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="hidden sm:flex justify-end col-span-1">
                        <StatusBadge status={lead.status} size="sm" />
                      </div>

                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-200 text-xs font-semibold text-slate-500">
            <span>
              Page {page} of {totalPages} ({totalLeads.toLocaleString()} total leads)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}

      </main>

      {/* Manual Add Lead Dialog (Admin Only) */}
      {showAddLeadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <span>Create New Student Lead</span>
              </h3>
              <button
                onClick={() => setShowAddLeadModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Student Name"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
                <Input
                  label="Mobile Number *"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  placeholder="e.g. +91 9988776655"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Course Target
                  </label>
                  <select
                    value={newLeadCourse}
                    onChange={(e) => setNewLeadCourse(e.target.value)}
                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="IIT-JEE Advanced">IIT-JEE Advanced</option>
                    <option value="NEET Medical">NEET Medical</option>
                    <option value="Foundation (9th-10th)">Foundation (9th-10th)</option>
                    <option value="UPSC Foundation">UPSC Foundation</option>
                    <option value="Crash Course">Crash Course</option>
                  </select>
                </div>

                <Input
                  label="Class"
                  value={newLeadClass}
                  onChange={(e) => setNewLeadClass(e.target.value)}
                  placeholder="e.g. Class 12"
                />
              </div>

              <Input
                label="City / Placement Location"
                value={newLeadPlace}
                onChange={(e) => setNewLeadPlace(e.target.value)}
                placeholder="e.g. Kota, Delhi, Mumbai"
              />

              <Input
                label="Initial Notes"
                value={newLeadNotes}
                onChange={(e) => setNewLeadNotes(e.target.value)}
                placeholder="Initial counsellor briefing notes"
              />

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Assign directly to counsellor
                </label>
                <select
                  value={newLeadAssignedId}
                  onChange={(e) => setNewLeadAssignedId(e.target.value)}
                  className="w-full text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Leave in Unassigned Pool</option>
                  {counsellors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowAddLeadModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isCreatingLead}
                >
                  Create Student
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav user={user} />
    </div>
  );
}
