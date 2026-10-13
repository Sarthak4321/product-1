"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { SessionUser } from "@/lib/auth";

interface AppContextType {
  user: SessionUser | null;
  userLoading: boolean;
  counsellors: any[];
  counsellorsLoading: boolean;
  leads: any[];
  leadsLoading: boolean;
  countsMap: Record<string, number>;
  totalLeads: number;
  totalPages: number;
  dueFollowUpsCount: number;
  refreshUser: () => Promise<SessionUser | null>;
  refreshCounsellors: () => Promise<void>;
  fetchLeadsCached: (filters: {
    page: number;
    status: string;
    search: string;
    assigned: string;
  }, forceFresh?: boolean) => Promise<{
    leads: any[];
    total: number;
    totalPages: number;
    countsMap: Record<string, number>;
    dueFollowUpsCount?: number;
  }>;
  invalidateLeadsCache: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [counsellors, setCounsellors] = useState<any[]>([]);
  const [counsellorsLoading, setCounsellorsLoading] = useState(false);

  // Leads caching structure
  const [leads, setLeads] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [countsMap, setCountsMap] = useState<Record<string, number>>({});
  const [totalLeads, setTotalLeads] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [dueFollowUpsCount, setDueFollowUpsCount] = useState(0);

  // Simple in-memory cache key: value mapping
  const [leadsCache, setLeadsCache] = useState<Record<string, {
    leads: any[];
    total: number;
    totalPages: number;
    countsMap: Record<string, number>;
    dueFollowUpsCount: number;
    timestamp: number;
  }>>({});

  // 1. Fetch User Session
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
        setUserLoading(false);
        return data.user;
      }
    } catch (e) {
      console.error("Auth context error:", e);
    }
    setUser(null);
    setUserLoading(false);
    return null;
  }, []);

  // Fetch once on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // 2. Fetch Counsellors List
  const refreshCounsellors = useCallback(async () => {
    // Only load if authorized (Admins or Counsellors)
    setCounsellorsLoading(true);
    try {
      const res = await fetch("/api/counsellors");
      if (res.ok) {
        const data = await res.json();
        setCounsellors(data.counsellors || []);
      }
    } catch (e) {
      console.error("Counsellors context error:", e);
    } finally {
      setCounsellorsLoading(false);
    }
  }, []);

  // Fetch counsellors once user session is loaded
  useEffect(() => {
    if (user && ["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      refreshCounsellors();
    }
  }, [user, refreshCounsellors]);

  // 3. Fetch Leads list with Cache checking (Stale-While-Revalidate pattern)
  const fetchLeadsCached = useCallback(async (filters: {
    page: number;
    status: string;
    search: string;
    assigned: string;
  }, forceFresh = false) => {
    const cacheKey = `${filters.page}_${filters.status}_${filters.search.trim().toLowerCase()}_${filters.assigned}`;
    const cachedEntry = leadsCache[cacheKey];
    
    // Cache TTL check: 30 seconds
    const CACHE_TTL = 30000;
    const isCacheValid = cachedEntry && (Date.now() - cachedEntry.timestamp < CACHE_TTL);

    if (isCacheValid && !forceFresh) {
      // Return cached results instantly
      setLeads(cachedEntry.leads);
      setTotalLeads(cachedEntry.total);
      setTotalPages(cachedEntry.totalPages);
      setCountsMap(cachedEntry.countsMap);
      setDueFollowUpsCount(cachedEntry.dueFollowUpsCount || 0);
      return cachedEntry;
    }

    // Otherwise load from server
    setLeadsLoading(true);
    try {
      const params = new URLSearchParams({
        page: filters.page.toString(),
        limit: "20",
        status: filters.status,
        search: filters.search,
        assigned: filters.assigned,
      });

      const res = await fetch(`/api/leads?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const payload = {
          leads: data.leads || [],
          total: data.pagination?.total || 0,
          totalPages: data.pagination?.totalPages || 1,
          countsMap: data.pagination?.countsMap || {},
          dueFollowUpsCount: data.pagination?.dueFollowUpsCount || 0,
          timestamp: Date.now(),
        };

        // Cache the result
        setLeadsCache((prev) => ({
          ...prev,
          [cacheKey]: payload,
        }));

        setLeads(payload.leads);
        setTotalLeads(payload.total);
        setTotalPages(payload.totalPages);
        setCountsMap(payload.countsMap);
        setDueFollowUpsCount(payload.dueFollowUpsCount);

        return payload;
      }
      throw new Error("Failed response");
    } catch (e) {
      console.error("Leads context error:", e);
      return {
        leads: [],
        total: 0,
        totalPages: 1,
        countsMap: {},
      };
    } finally {
      setLeadsLoading(false);
    }
  }, [leadsCache]);

  // Invalidate cache when modifications occur
  const invalidateLeadsCache = useCallback(() => {
    setLeadsCache({});
  }, []);

  return (
    <AppContext.Provider
      value={{
        user,
        userLoading,
        counsellors,
        counsellorsLoading,
        leads,
        leadsLoading,
        countsMap,
        totalLeads,
        totalPages,
        dueFollowUpsCount,
        refreshUser,
        refreshCounsellors,
        fetchLeadsCached,
        invalidateLeadsCache,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppContextProvider");
  }
  return context;
}
