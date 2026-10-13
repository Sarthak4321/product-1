"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Users,
  UploadCloud,
  UserCheck,
  Briefcase,
  Settings,
  LogOut,
  Check,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { useApp } from "@/components/context/AppContext";

interface AdminSidebarProps {
  user: SessionUser | null;
}

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { refreshUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await refreshUser();
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      active: pathname === "/admin/analytics",
    },
    {
      name: "Leads Database",
      href: "/leads",
      icon: Users,
      active: pathname === "/leads" || pathname.startsWith("/leads/"),
    },
    {
      name: "Import CSV",
      href: "/admin/import",
      icon: UploadCloud,
      active: pathname === "/admin/import",
    },
    {
      name: "Counsellors",
      href: "/admin/counsellors",
      icon: UserCheck,
      active: pathname === "/admin/counsellors",
    },
    {
      name: "Employees & HR",
      href: "/admin/employees",
      icon: Briefcase,
      active: pathname.startsWith("/admin/employees"),
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      active: pathname === "/admin/settings",
    },
  ];

  return (
    <>
      {/* Mobile Top App Bar */}
      <div className="lg:hidden sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">
            LeadDesk
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm flex">
          <div className="w-64 bg-white/90 backdrop-blur-2xl h-full p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 border-r border-white/40">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                  <span className="font-extrabold text-slate-900 text-lg tracking-tight">
                    LeadDesk
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        item.active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* User Profile */}
            {user && (
              <div className="pt-4 border-t border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">{user.role}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white/60"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Desktop Left Sidebar with Liquid Glass Aesthetics */}
      <aside className="hidden lg:flex w-60 xl:w-64 bg-white/70 backdrop-blur-2xl border-r border-white/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)] shrink-0 flex-col justify-between p-5 sticky top-0 h-screen z-30 select-none">
        
        {/* Top: Logo & Navigation */}
        <div className="space-y-8">
          
          {/* Brand Logo */}
          <Link href="/admin/analytics" className="flex items-center gap-3 group px-1">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Check className="w-4.5 h-4.5 stroke-[3]" />
            </div>
            <div>
              <span className="font-black text-slate-900 text-lg tracking-tight block leading-none">
                LeadDesk
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block mt-1">
                Workspace OS
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400/90 px-3 pb-1">
              Workspace
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 ${
                    item.active
                      ? "bg-slate-900 text-white shadow-md shadow-slate-900/10 font-black scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:shadow-2xs"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? "text-sky-400" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Card & Logout with Frosted Glass styling */}
        {user ? (
          <div className="pt-4 border-t border-slate-200/50">
            <div className="p-2.5 rounded-2xl bg-white/60 border border-white/80 shadow-2xs backdrop-blur-md flex items-center justify-between gap-2">
              <Link href="/profile" className="flex items-center gap-2.5 min-w-0 group">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs group-hover:bg-blue-600 transition-colors">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider truncate">
                    {user.role}
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50/80 rounded-lg transition-colors shrink-0"
                title="Log out"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : null}

      </aside>
    </>
  );
}
