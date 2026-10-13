"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bug,
  Search,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  RefreshCw,
  Plus,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { SearchBar } from "@/components/ui/SearchBar";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

export default function SuperAdminLogsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [user, setUser] = useState<any | null>(null);
  const [errors, setErrors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Search & Pagination
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Selected Error Modal
  const [selectedError, setSelectedError] = useState<any | null>(null);

  // Auth verification strictly as SUPER_ADMIN
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          if (data.user.role !== "SUPER_ADMIN") {
            showToast("Access Denied: Super Admin privileges required", "error");
            router.push("/leads");
            return;
          }
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router, showToast]);

  // Fetch platform error logs
  const fetchErrorLogs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
      });

      const res = await fetch(`/api/super-admin/logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load platform system errors");

      const data = await res.json();
      setErrors(data.errors || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (e) {
      console.error(e);
      showToast("Error loading platform system error logs", "error");
    } finally {
      setIsLoading(false);
    }
  }, [user, page, search, showToast]);

  useEffect(() => {
    if (user) {
      fetchErrorLogs();
    }
  }, [user, fetchErrorLogs]);

  // Trigger platform test error
  const handleTriggerTestError = async () => {
    setIsTestLoading(true);
    try {
      const res = await fetch("/api/super-admin/logs", { method: "POST" });
      if (res.ok) {
        showToast("Logged sample platform exception successfully!", "success");
        fetchErrorLogs();
      } else {
        showToast("Failed to trigger platform test error", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe font-sans">
      <Header user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        {/* Page Title & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                Super Admin Governance
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2 mt-1">
              <Bug className="w-6 h-6 text-rose-600" />
              <span>Platform System Error Logs</span>
              <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                {total}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Platform-wide Sentry exceptions, API trace logs, and system error events across all tenants.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleTriggerTestError}
            isLoading={isTestLoading}
            leftIcon={<Plus className="w-4 h-4 text-rose-600" />}
            className="border-rose-200 text-rose-700 hover:bg-rose-50 w-full sm:w-auto shadow-2xs"
          >
            Trigger Platform Test Error
          </Button>
        </div>

        {/* Search */}
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search platform errors by message, stack trace, or context..."
        />

        {/* Error List */}
        {isLoading ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin text-slate-400 mx-auto" />
            <p className="text-xs text-slate-500 font-medium">Loading platform system error logs...</p>
          </div>
        ) : errors.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <ShieldAlert className="w-8 h-8 text-emerald-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No System Errors Captured</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your platform is running smoothly with 0 error exceptions logged. Tap &quot;Trigger Platform Test Error&quot; above to log a sample exception.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {errors.map((err) => {
              const date = new Date(err.createdAt);
              return (
                <div
                  key={err.id}
                  onClick={() => setSelectedError(err)}
                  className="bg-white hover:bg-rose-50/40 border border-slate-200 hover:border-rose-300 rounded-2xl p-4 shadow-2xs transition-all cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                        {err.level || "ERROR"}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 font-medium">
                      {date.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-sm font-bold text-slate-900 leading-snug">
                    {err.message}
                  </p>

                  {err.stack && (
                    <p className="text-xs font-mono text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100 truncate">
                      {err.stack.split("\n")[0]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({total} total errors)
            </span>
            <div className="flex items-center gap-1.5">
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

      {/* Selected Error Detail Modal */}
      {selectedError && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">System Exception Details</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedError(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400 font-medium">Log Level</p>
                  <p className="font-bold text-rose-700">{selectedError.level}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">Timestamp</p>
                  <p className="font-bold text-slate-900">
                    {new Date(selectedError.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium">Error Message</p>
                <p className="font-bold text-rose-700 text-base mt-0.5">{selectedError.message}</p>
              </div>

              {selectedError.stack && (
                <div>
                  <p className="text-slate-400 font-medium mb-1">Stack Trace</p>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded-xl text-[11px] overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {selectedError.stack}
                  </pre>
                </div>
              )}

              {selectedError.context && (
                <div>
                  <p className="text-slate-400 font-medium mb-1">Context Payload</p>
                  <pre className="bg-slate-100 text-slate-800 p-2.5 rounded-xl text-xs overflow-x-auto font-mono">
                    {selectedError.context}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav user={user} />
    </div>
  );
}
