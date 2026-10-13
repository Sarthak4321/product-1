"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Shield,
  Building,
  LogOut,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  PhoneCall,
  Users,
  Terminal,
  PlusCircle,
  Briefcase,
  KeyRound,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/components/context/AppContext";

export default function ProfilePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshUser } = useApp();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setIsLoading(false));
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await refreshUser();
      showToast("Logged out successfully", "info");
      router.push("/login");
      router.refresh();
    } catch {
      showToast("Failed to logout", "error");
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-safe font-sans">
        <Header user={null} />
        <main className="flex-1 max-w-xl mx-auto w-full p-4 pt-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs animate-pulse h-96" />
        </main>
      </div>
    );
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const isOrgAdmin = user.role === "ORG_ADMIN" || user.role === "ADMIN";
  const isCounsellor = user.role === "COUNSELLOR";

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active User";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col pb-safe font-sans">
      <Header user={user} />

      <main className="flex-1 max-w-xl w-full mx-auto px-4 pt-6 pb-24 md:pb-8 space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Banner Accent */}
          <div className="h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 relative">
            <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
          </div>

          {/* Avatar & Profile Identity */}
          <div className="px-6 pb-6 text-center relative">
            <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md -mt-10 mx-auto flex items-center justify-center border-2 border-white relative z-10">
              <div className="w-full h-full bg-slate-100 text-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl tracking-wider">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {user.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-mono inline-flex items-center justify-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {user.email}
              </p>

              <div className="pt-2 flex items-center justify-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                    isSuperAdmin
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : isOrgAdmin
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>
                    {isSuperAdmin
                      ? "Platform Super Admin"
                      : isOrgAdmin
                      ? "Institute Administrator"
                      : "Counsellor"}
                  </span>
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Verified</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace / Organization Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Workspace & Governance
                </h2>
                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {isSuperAdmin
                    ? "Global SaaS Governance"
                    : user.organization?.name || "Institute Workspace"}
                </p>
              </div>
            </div>
            {!isSuperAdmin && user.organization?.slug && (
              <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                slug: {user.organization.slug}
              </span>
            )}
          </div>

          {/* Role-Specific Stats or Quick Controls */}
          {isSuperAdmin ? (
            <div className="space-y-3 pt-1">
              <p className="text-xs text-slate-500">
                You hold master control permissions over all registered coaching centre tenant workspaces, error logs, and system configuration.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/super-admin")}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors text-left group"
                >
                  <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                    Coaching Centres
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/super-admin/logs")}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors text-left group"
                >
                  <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                    System Error Logs
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/register")}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors text-left group"
                >
                  <span className="text-xs font-medium text-slate-700 group-hover:text-blue-600">
                    Register SaaS
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Assigned Leads</span>
                </div>
                <p className="text-xl font-bold text-slate-900">
                  {user._count?.assignedLeads || 0}
                </p>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-1">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Calls Logged</span>
                </div>
                <p className="text-xl font-bold text-emerald-700">
                  {user._count?.activities || 0}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Account Details & Meta Grid */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
            Account Specifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Member Since
              </span>
              <span className="font-semibold text-slate-800">{formattedDate}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                Account Role
              </span>
              <span className="font-mono font-semibold text-slate-800">{user.role}</span>
            </div>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleLogout}
            className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors shadow-xs"
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out of Account
          </Button>
        </div>
      </main>

      <BottomNav user={user} />
    </div>
  );
}

