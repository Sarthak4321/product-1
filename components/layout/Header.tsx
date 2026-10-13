"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { PhoneCall, LogOut, User as UserIcon, UploadCloud, Users, ListFilter } from "lucide-react";
import { SessionUser } from "@/lib/auth";
import { useApp } from "@/components/context/AppContext";

interface HeaderProps {
  user: SessionUser | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { refreshUser } = useApp();

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

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href={user?.role === "SUPER_ADMIN" ? "/super-admin" : ["ADMIN", "ORG_ADMIN"].includes(user?.role || "") ? "/admin" : "/leads"} className="font-extrabold text-slate-900 text-xl tracking-tight hover:text-blue-600 transition-colors">
            LeadDesk
          </Link>

          {/* Desktop Nav links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {user.role === "SUPER_ADMIN" ? (
                <>
                  <Link
                    href="/super-admin"
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${pathname === "/super-admin"
                      ? "bg-purple-100 text-purple-900"
                      : "text-purple-700 hover:text-purple-900 hover:bg-purple-50"
                      }`}
                  >
                    Coaching Centres
                  </Link>
                  <Link
                    href="/super-admin/logs"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/super-admin/logs"
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    Error Logs
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    Register Workspace
                  </Link>
                </>
              ) : (
                <>
                  {(user.role === "ADMIN" || user.role === "ORG_ADMIN") && (
                    <Link
                      href="/admin"
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin" || pathname === "/admin/analytics"
                        ? "bg-slate-100 text-slate-900 font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                        }`}
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/leads"
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/leads" || (pathname.startsWith("/leads/") && !pathname.startsWith("/admin"))
                      ? "bg-slate-100 text-slate-900 font-bold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                  >
                    Leads
                  </Link>
                  {(user.role === "ADMIN" || user.role === "ORG_ADMIN") && (
                    <>
                      <Link
                        href="/admin/import"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin/import"
                          ? "bg-slate-100 text-slate-900 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                      >
                        Import CSV
                      </Link>
                      <Link
                        href="/admin/counsellors"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin/counsellors"
                          ? "bg-slate-100 text-slate-900 font-bold"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                      >
                        Counsellors
                      </Link>
                      <Link
                        href="/admin/employees"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname.startsWith("/admin/employees")
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                      >
                        Employees
                      </Link>
                      <Link
                        href="/admin/settings"
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === "/admin/settings"
                          ? "bg-slate-100 text-slate-900"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                          }`}
                      >
                        Settings
                      </Link>
                    </>
                  )}
                </>
              )}
            </nav>
          )}
        </div>

        {/* User profile & actions */}
        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-medium text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.name}</p>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{user.role}</p>
              </div>
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5"
          >
            Login
          </Link>
        )}
      </div>
    </header>
  );
}
