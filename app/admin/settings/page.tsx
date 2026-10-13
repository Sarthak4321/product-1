"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { useApp } from "@/components/context/AppContext";
import { Building2, Save, MapPin, Mail, Phone, Hash, ShieldCheck, Users, Layers, AlertCircle, CheckCircle2 } from "lucide-react";

export default function OrganizationSettingsPage() {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgData, setOrgData] = useState({
    id: "",
    name: "",
    slug: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    zipCode: "",
    status: "ACTIVE",
    createdAt: "",
    userCount: 0,
    leadCount: 0,
  });

  useEffect(() => {
    async function fetchOrg() {
      try {
        const res = await fetch("/api/organization/settings");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load workspace settings");

        const o = data.organization;
        setOrgData({
          id: o.id,
          name: o.name || "",
          slug: o.slug || "",
          email: o.email || "",
          phone: o.phone || "",
          city: o.city || "",
          state: o.state || "",
          zipCode: o.zipCode || "",
          status: o.status || "ACTIVE",
          createdAt: o.createdAt || "",
          userCount: o._count?.users || 0,
          leadCount: o._count?.leads || 0,
        });
      } catch (err: any) {
        setError(err.message || "Failed to fetch workspace details");
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgData({ ...orgData, [e.target.name]: e.target.value });
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgData.name,
          email: orgData.email,
          phone: orgData.phone,
          city: orgData.city,
          state: orgData.state,
          zipCode: orgData.zipCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");

      setSuccess("Organization settings saved successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update workspace settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-20 md:pb-8">
      <Header user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-indigo-600" />
              <span>Workspace & Organization Settings</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your coaching center profile, workspace details, and tenant preferences
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center shadow-xs">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Loading workspace settings...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tenant Slug</p>
                  <p className="text-sm font-bold text-slate-800 truncate max-w-[180px]">{orgData.slug}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Members</p>
                  <p className="text-lg font-bold text-slate-900">{orgData.userCount} Users</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Workspace Leads</p>
                  <p className="text-lg font-bold text-slate-900">{orgData.leadCount} Leads</p>
                </div>
              </div>
            </div>

            {/* Notification Messages */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3 font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-center gap-3 font-medium">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Main Organization Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Organization Profile</h2>
                <p className="text-xs text-slate-500">Update your coaching center's public identity and contact details</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Organization / Coaching Center Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="name"
                      required
                      value={orgData.name}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Workspace Identifier (Slug)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Hash className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      disabled
                      value={orgData.slug}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-mono cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Business Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={orgData.email}
                      onChange={handleChange}
                      placeholder="contact@coaching.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Contact Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="phone"
                      value={orgData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span>Location & Postal Details</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
                    <input
                      type="text"
                      name="city"
                      value={orgData.city}
                      onChange={handleChange}
                      placeholder="New Delhi"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">State</label>
                    <input
                      type="text"
                      name="state"
                      value={orgData.state}
                      onChange={handleChange}
                      placeholder="Delhi"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={orgData.zipCode}
                      onChange={handleChange}
                      placeholder="110001"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Tenant ID: <span className="font-mono text-slate-700">{orgData.id}</span></span>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <BottomNav user={user} />
    </div>
  );
}
