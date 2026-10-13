"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  ShieldAlert,
  Users,
  KeyRound,
  Sparkles,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { useApp } from "@/components/context/AppContext";
import { useThrottledCallback } from "@/lib/hooks/useThrottle";

export default function CounsellorLoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshUser } = useApp();

  const [orgCode, setOrgCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isUserNotFound, setIsUserNotFound] = useState(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const isSubmittingRef = useRef(false);

  const LOCKOUT_KEY = "crm_counsellor_login_lockout_until";

  useEffect(() => {
    const savedUntil = sessionStorage.getItem(LOCKOUT_KEY);
    if (savedUntil) {
      const until = parseInt(savedUntil, 10);
      const remaining = Math.ceil((until - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutSeconds(remaining);
      } else {
        sessionStorage.removeItem(LOCKOUT_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (lockoutSeconds <= 0) {
      sessionStorage.removeItem(LOCKOUT_KEY);
      return;
    }

    const timer = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          sessionStorage.removeItem(LOCKOUT_KEY);
          setError("");
          setAttemptsRemaining(null);
          setIsUserNotFound(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const formatCountdown = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const performCounsellorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || lockoutSeconds > 0) return;

    setError("");
    setIsUserNotFound(false);

    if (!orgCode.trim()) {
      setError("Please enter your Organization Virtual Room ID (Code).");
      return;
    }
    if (!email.trim() || !password) {
      setError("Please enter both your email address and password.");
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/counsellor-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgCode: orgCode.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404 || data.isUserNotFound) {
          setIsUserNotFound(true);
          setAttemptsRemaining(null);
        } else if (res.status === 429 || data.isLocked) {
          const sec = data.retryAfterSeconds || (data.retryAfterMinutes ? data.retryAfterMinutes * 60 : 180);
          setLockoutSeconds(sec);
          const until = Date.now() + sec * 1000;
          sessionStorage.setItem(LOCKOUT_KEY, until.toString());
          setAttemptsRemaining(0);
          setIsUserNotFound(false);
        } else if (typeof data.attemptsRemaining === "number") {
          setAttemptsRemaining(data.attemptsRemaining);
          setIsUserNotFound(false);
        }

        setError(data.error || "Room login failed. Please verify your Room ID and credentials.");
        showToast(data.error || "Login failed", "error");
        setIsLoading(false);
        isSubmittingRef.current = false;
        return;
      }

      sessionStorage.removeItem(LOCKOUT_KEY);
      await refreshUser();

      showToast(`Welcome back to ${data.organization?.name || "your workspace"}, ${data.user.name}!`, "success");
      router.push("/leads");
      router.refresh();
    } catch {
      setError("Network error. Please check your internet connection.");
      showToast("Network error. Please try again.", "error");
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleCounsellorLogin = useThrottledCallback(performCounsellorLogin, 800, {
    leading: true,
    trailing: false,
  });

  const appName = process.env.NEXT_PUBLIC_APP_NAME || "LeadDesk CRM";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between px-4 py-8 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 mb-2">
            <Users className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Employee Portal Login
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto">
            Unified room portal for Counsellors, Teachers, HR & Staff
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-2xl sm:px-8">
          {/* Portal Switcher Badge (Exactly 2 Options: Admin & Employee) */}
          <div className="mb-6 p-1.5 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 text-xs font-semibold text-slate-600 text-center">
            <Link
              href="/login"
              className="px-3 py-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Admin Login
            </Link>
            <span className="px-3 py-2 bg-white text-emerald-700 rounded-lg shadow-2xs font-bold flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              Employee Login
            </span>
          </div>

          <form onSubmit={handleCounsellorLogin} className="space-y-4">
            {lockoutSeconds > 0 ? (
              <div className="p-4 bg-amber-50 border border-amber-200/80 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                    <Clock className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                    <span>Account Locked Out (5 Invalid Attempts)</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    Locked
                  </span>
                </div>

                <p className="text-xs text-amber-700 leading-relaxed">
                  Room login is temporarily suspended for 3 minutes due to 5 failed password attempts.
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-amber-200/60 text-xs">
                  <span className="font-semibold text-amber-800 flex items-center gap-1.5 text-xs">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    Unlock Countdown:
                  </span>
                  <span className="font-mono font-bold text-amber-900 text-sm">{formatCountdown(lockoutSeconds)}</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm rounded-xl font-medium space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4.5 h-4.5 shrink-0 text-rose-600" />
                    <span>{error}</span>
                  </div>
                  {attemptsRemaining !== null && attemptsRemaining > 0 && !isUserNotFound && (
                    <span className="shrink-0 px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[11px] whitespace-nowrap">
                      {attemptsRemaining} left
                    </span>
                  )}
                </div>

                {isUserNotFound && (
                  <div className="pt-2.5 border-t border-rose-200/80 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-rose-900">
                      No account found in this room.
                    </span>
                    <Link
                      href="/register"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 text-xs shrink-0 shadow-xs"
                    >
                      <span>Register Organization</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            ) : null}

            <div className="mb-8">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Organization Room ID / Code</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  disabled={lockoutSeconds > 0}
                  value={orgCode}
                  onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                  placeholder="Enter Room Code"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono font-bold text-xs tracking-wider uppercase disabled:opacity-50 disabled:bg-slate-100"
                />
              </div>
              <p className="mt-1 text-[11px] text-gray-500">
                Ask your organization admin for your unique 7-character Virtual Room Code.
              </p>
            </div>

            <Input
              label="Counsellor Email"
              type="email"
              required
              disabled={lockoutSeconds > 0}
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="counsellor@centre.com"
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div className="relative space-y-1">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                required
                disabled={lockoutSeconds > 0}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={lockoutSeconds > 0}
                className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600 focus:outline-hidden disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-3 py-3.5 text-sm font-bold shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white border-none disabled:opacity-60 disabled:cursor-not-allowed"
              isLoading={isLoading}
              disabled={lockoutSeconds > 0 || isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              {lockoutSeconds > 0 ? `Locked (${formatCountdown(lockoutSeconds)})` : "Enter Virtual Room Workspace"}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-500">
              Are you an Admin looking to register a new institute?{" "}
              <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Register New Organization
              </Link>
            </p>
          </div>
        </div>

        {/* Isolation Footer Info */}

      </div>
    </div>
  );
}
