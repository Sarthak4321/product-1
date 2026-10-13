"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListFilter, UploadCloud, Users, User, Bug } from "lucide-react";
import { SessionUser } from "@/lib/auth";

interface BottomNavProps {
  user: SessionUser | null;
}

export function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname();

  if (!user) return null;

  const isAdmin = user.role === "ADMIN";

  const navItems = [
    {
      label: "Leads",
      href: "/leads",
      icon: ListFilter,
      active: pathname === "/leads" || (pathname.startsWith("/leads/") && !pathname.includes("/admin")),
    },
    ...(isAdmin
      ? [
          {
            label: "Import",
            href: "/admin/import",
            icon: UploadCloud,
            active: pathname === "/admin/import",
          },
          {
            label: "Team",
            href: "/admin/counsellors",
            icon: Users,
            active: pathname === "/admin/counsellors",
          },
          {
            label: "Errors",
            href: "/admin/logs",
            icon: Bug,
            active: pathname === "/admin/logs",
          },
        ]
      : []),
    {
      label: "Profile",
      href: "/profile",
      icon: User,
      active: pathname === "/profile",
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <nav className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-[64px] min-h-[48px] rounded-xl transition-all ${
                item.active
                  ? "text-blue-600 font-semibold"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${item.active ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              <span className="text-[11px] leading-none">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
