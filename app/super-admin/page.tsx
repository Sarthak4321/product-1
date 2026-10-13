"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  PhoneCall,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Ban,
  CheckCircle2,
  BarChart3,
  X,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  Image as ImageIcon,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useToast } from "@/components/ui/Toast";
import { ShowcaseManager } from "@/components/super-admin/ShowcaseManager";
import { ContactQueriesManager } from "@/components/super-admin/ContactQueriesManager";

interface OrganizationRecord {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  zipCode: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  adminName: string;
  adminEmail: string;
  userCount: number;
  leadCount: number;
  activityCount: number;
}

interface SuperAdminSummary {
  totalOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  totalPlatformLeads: number;
  totalPlatformUsers: number;
  totalSystemErrors: number;
  totalContactQueries?: number;
  pendingContactQueries?: number;
}

export default function SuperAdminDashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<any | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [organizations, setOrganizations] = useState<OrganizationRecord[]>([]);
  const [summary, setSummary] = useState<SuperAdminSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const [inspectOrg, setInspectOrg] = useState<OrganizationRecord | null>(null);
  const [currentTab, setCurrentTab] = useState<"overview" | "inquiries" | "showcase">("overview");

  // Auth verification
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
          if (data.user.role !== "SUPER_ADMIN") {
            showToast("Access Denied: Super Admin privileges required", "error");
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

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
        setSummary(data.summary || null);
      } else {
        showToast("Failed to fetch platform data", "error");
      }
    } catch {
      showToast("Network error fetching super admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Handle status toggle
  const handleToggleStatus = async (org: OrganizationRecord) => {
    const nextStatus = org.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    setActionLoadingId(org.id);

    try {
      const res = await fetch("/api/super-admin/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: org.id,
          status: nextStatus,
        }),
      });

      if (res.ok) {
        showToast(`Workspace '${org.name}' status updated to ${nextStatus}`, "success");
        await loadData();
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to update workspace status", "error");
      }
    } catch {
      showToast("Network error updating status", "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter organizations list
  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.adminEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      org.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || org.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (userLoading || (loading && !summary)) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-safe font-sans">
        <Header user={user} />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-6 animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-slate-200 rounded-2xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-200 rounded-2xl" />
        </main>
        <BottomNav user={user} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col pb-safe font-sans text-slate-800">
      <Header user={user} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                Super Admin Governance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Platform Overview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Monitor registered coaching centres, platform usage stats, and workspace governance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs flex items-center gap-1.5"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-purple-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <a
              href="/register"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#ff5a36] text-white hover:bg-[#e04d2c] transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>New Coaching Centre</span>
            </a>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setCurrentTab("overview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTab === "overview"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Workspaces & Governance</span>
          </button>

          <button
            onClick={() => setCurrentTab("inquiries")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap relative ${
              currentTab === "inquiries"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Inquiries & Contact Queries</span>
            {Boolean(summary?.pendingContactQueries && summary.pendingContactQueries > 0) && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                currentTab === "inquiries" ? "bg-white text-purple-700" : "bg-amber-500 text-white animate-pulse"
              }`}>
                {summary?.pendingContactQueries} new
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab("showcase")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              currentTab === "showcase"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Landing Page Showcase</span>
          </button>
        </div>

        {currentTab === "showcase" ? (
          <ShowcaseManager />
        ) : currentTab === "inquiries" ? (
          <ContactQueriesManager />
        ) : (
          <>
            {/* Executive KPI Stats Grid */}
            {summary && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Card 1: Workspaces */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Coaching Centres
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">{summary.totalOrganizations}</p>
                    <p className="text-[11px] font-medium text-emerald-600 mt-0.5">
                      {summary.activeOrganizations} active · {summary.suspendedOrganizations} suspended
                    </p>
                  </div>
                </div>

                {/* Card 2: Contact Inquiries */}
                <div
                  onClick={() => setCurrentTab("inquiries")}
                  className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-xs flex flex-col justify-between h-32 hover:border-purple-400 cursor-pointer transition-all hover:shadow-md bg-gradient-to-br from-purple-50/30 via-white to-white group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                      Inquiries
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-purple-900">
                      {summary.totalContactQueries ?? 0}
                    </p>
                    <p className="text-[11px] font-semibold text-amber-600 mt-0.5 flex items-center justify-between">
                      <span>{summary.pendingContactQueries ?? 0} pending response</span>
                      <span className="text-purple-600 font-bold group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                    </p>
                  </div>
                </div>

                {/* Card 3: Platform Leads */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Platform Leads
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <PhoneCall className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">
                      {summary.totalPlatformLeads.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Across all registered institutes
                    </p>
                  </div>
                </div>

                {/* Card 4: Total Users */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Total Users
                    </span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-slate-900">
                      {summary.totalPlatformUsers.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Counsellors & Institute Admins
                    </p>
                  </div>
                </div>

                {/* Card 5: System Health */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between h-32 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      System Errors
                    </span>
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        summary.totalSystemErrors > 0
                          ? "bg-amber-50 text-amber-600"
                          : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p
                      className={`text-2xl font-black ${
                        summary.totalSystemErrors > 0 ? "text-amber-600" : "text-slate-900"
                      }`}
                    >
                      {summary.totalSystemErrors}
                    </p>
                    <a
                      href="/super-admin/logs"
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-0.5 inline-flex items-center gap-1"
                    >
                      <span>View System Logs</span>
                      <span className="text-xs">&rarr;</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

        {/* Directory Card & Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header Controls: Search & Tabs */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by institute name, email, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              />
            </div>

            {/* Status Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All ({organizations.length})
              </button>
              <button
                onClick={() => setStatusFilter("ACTIVE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "ACTIVE"
                    ? "bg-white text-emerald-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Active ({organizations.filter((o) => o.status === "ACTIVE").length})
              </button>
              <button
                onClick={() => setStatusFilter("SUSPENDED")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === "SUSPENDED"
                    ? "bg-white text-amber-700 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Suspended ({organizations.filter((o) => o.status === "SUSPENDED").length})
              </button>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3.5 px-5">Coaching Centre</th>
                  <th className="py-3.5 px-4">Admin Contact</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4 text-center">Users</th>
                  <th className="py-3.5 px-4 text-center">Leads</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrganizations.map((org) => {
                  const isSuspended = org.status === "SUSPENDED";
                  const isUpdating = actionLoadingId === org.id;

                  return (
                    <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Coaching Centre Name & Slug */}
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 text-sm leading-tight">{org.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          slug: <code className="font-mono text-slate-500 bg-slate-100 px-1 py-0.5 rounded">{org.slug}</code>
                        </p>
                      </td>

                      {/* Admin Contact */}
                      <td className="py-4 px-4">
                        <p className="font-semibold text-slate-800">{org.adminName}</p>
                        <p className="text-[11px] text-slate-400">{org.adminEmail}</p>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 text-slate-600">
                        {org.city !== "N/A" || org.state !== "N/A" ? (
                          <span className="font-medium text-slate-700">
                            {org.city !== "N/A" ? org.city : ""}
                            {org.city !== "N/A" && org.state !== "N/A" ? ", " : ""}
                            {org.state !== "N/A" ? org.state : ""}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Users Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs bg-indigo-50 text-indigo-700">
                          {org.userCount}
                        </span>
                      </td>

                      {/* Leads Count */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full font-bold text-xs bg-slate-100 text-slate-700">
                          {org.leadCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            isSuspended
                              ? "bg-amber-50 text-amber-700 border border-amber-200/80"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSuspended ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          {org.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectOrg(org)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center gap-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>

                          <button
                            disabled={isUpdating}
                            onClick={() => handleToggleStatus(org)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              isSuspended
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-amber-500 text-white hover:bg-amber-600"
                            } ${isUpdating ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {isUpdating ? "..." : isSuspended ? "Activate" : "Suspend"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrganizations.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                      No coaching centres found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
      </main>

      {/* Inspect Organization Modal */}
      {inspectOrg && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  Workspace Details
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{inspectOrg.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectOrg(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Workspace Slug</p>
                <p className="font-bold text-slate-900 font-mono">{inspectOrg.slug}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Status</p>
                <p
                  className={`font-bold uppercase ${
                    inspectOrg.status === "SUSPENDED" ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {inspectOrg.status}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Admin Name</p>
                <p className="font-bold text-slate-900">{inspectOrg.adminName}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Admin Email</p>
                <p className="font-bold text-slate-900 truncate">{inspectOrg.adminEmail}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Total Users</p>
                <p className="font-bold text-indigo-600 text-sm">{inspectOrg.userCount}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Total Leads</p>
                <p className="font-bold text-emerald-600 text-sm">{inspectOrg.leadCount}</p>
              </div>
            </div>

            {/* Quick Inspection Action Links */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Direct Context Inspection
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/admin/analytics?orgId=${inspectOrg.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>Inspect Analytics</span>
                </a>

                <a
                  href={`/leads?orgId=${inspectOrg.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 transition-colors text-center flex items-center justify-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Inspect Leads</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav user={user} />
    </div>
  );
}
