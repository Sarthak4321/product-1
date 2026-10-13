"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  Shield,
  Mail,
  Lock,
  User,
  Trash2,
  UserMinus,
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  X,
  RefreshCw,
  FolderPlus,
  Layers,
  Copy,
  Building2,
  KeyRound,
  Check,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { SessionUser } from "@/lib/auth";
import { isLeadStale, getStaleLabel } from "@/lib/staleness";

import { useApp } from "@/components/context/AppContext";

export default function AdminCounsellorsPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const {
    user,
    userLoading,
    counsellors,
    counsellorsLoading,
    refreshCounsellors,
    invalidateLeadsCache,
  } = useApp();

  const isLoading = counsellorsLoading;

  // Add Counsellor Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("COUNSELLOR");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const orgRoomCode = user?.organization?.code || user?.organization?.slug || user?.organizationId || "";

  const handleCopyRoomCode = () => {
    if (!orgRoomCode) return;
    navigator.clipboard.writeText(orgRoomCode);
    setCopiedCode(true);
    showToast(`Copied Virtual Room Code: ${orgRoomCode}`, "success");
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Active / Selected Counsellor for Leads Management
  const [selectedCounsellor, setSelectedCounsellor] = useState<any | null>(null);
  const [counsellorLeads, setCounsellorLeads] = useState<any[]>([]);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);

  // Inline forms for selected counsellor
  const [showManualLeadForm, setShowManualLeadForm] = useState(false);
  const [manualLeadName, setManualLeadName] = useState("");
  const [manualLeadPhone, setManualLeadPhone] = useState("");
  const [manualLeadClass, setManualLeadClass] = useState("");
  const [manualLeadCourse, setManualLeadCourse] = useState("");
  const [manualLeadNotes, setManualLeadNotes] = useState("");
  const [isCreatingLead, setIsCreatingLead] = useState(false);

  // Unassigned Leads Assignment
  const [showUnassignedLeadsPanel, setShowUnassignedLeadsPanel] = useState(false);
  const [unassignedLeads, setUnassignedLeads] = useState<any[]>([]);
  const [unassignedSearchQuery, setUnassignedSearchQuery] = useState("");
  const [selectedUnassignedIds, setSelectedUnassignedIds] = useState<string[]>([]);
  const [isUnassignedLoading, setIsUnassignedLoading] = useState(false);

  // Check auth redirect & fetch fresh counsellors list on mount
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/login");
    } else if (user && !["ADMIN", "ORG_ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      showToast("Admin access required", "error");
      router.push("/leads");
    } else if (user) {
      refreshCounsellors();
    }
  }, [user, userLoading, router, showToast, refreshCounsellors]);

  const handleCreateCounsellor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/counsellors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to create counsellor", "error");
        setIsSubmitting(false);
        return;
      }

      showToast(`Created counsellor ${data.counsellor.name}!`, "success");
      setName("");
      setEmail("");
      setPassword("");
      setShowAddForm(false);
      refreshCounsellors();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCounsellor = async () => {
    if (!selectedCounsellor) return;

    const confirmMsg = `Are you sure you want to terminate counsellor "${selectedCounsellor.name}"? All assigned leads will be returned to the unassigned leads pool, and the counsellor account will be permanently deleted.`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/counsellors/${selectedCounsellor.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to terminate counsellor", "error");
        setIsDeleting(false);
        return;
      }

      showToast(data.message || `Counsellor ${selectedCounsellor.name} terminated successfully!`, "success");
      setSelectedCounsellor(null);
      invalidateLeadsCache();
      refreshCounsellors();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Leads operations
  const handleSelectCounsellor = async (counsellor: any) => {
    setSelectedCounsellor(counsellor);
    setSelectedLeadIds([]);
    setShowManualLeadForm(false);
    setShowUnassignedLeadsPanel(false);
    fetchCounsellorLeads(counsellor.id);
  };

  const fetchCounsellorLeads = async (counsellorId: string) => {
    setIsLeadsLoading(true);
    try {
      const res = await fetch(`/api/counsellors/${counsellorId}/leads`);
      if (!res.ok) throw new Error("Failed to load leads");
      const data = await res.json();
      setCounsellorLeads(data.leads || []);
    } catch {
      showToast("Error loading counsellor leads", "error");
    } finally {
      setIsLeadsLoading(false);
    }
  };

  const fetchUnassignedLeads = async () => {
    setIsUnassignedLoading(true);
    try {
      const res = await fetch("/api/leads?assigned=unassigned&limit=100");
      if (!res.ok) throw new Error("Failed to load unassigned leads");
      const data = await res.json();
      setUnassignedLeads(data.leads || []);
    } catch {
      showToast("Error loading unassigned leads", "error");
    } finally {
      setIsUnassignedLoading(false);
    }
  };

  const handleCreateManualLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounsellor) return;

    setIsCreatingLead(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualLeadName,
          phone: manualLeadPhone,
          class: manualLeadClass,
          course: manualLeadCourse,
          notes: manualLeadNotes,
          assignedToId: selectedCounsellor.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to create lead", "error");
        setIsCreatingLead(false);
        return;
      }

      showToast("Lead added and assigned successfully!", "success");
      setManualLeadName("");
      setManualLeadPhone("");
      setManualLeadClass("");
      setManualLeadCourse("");
      setManualLeadNotes("");
      setShowManualLeadForm(false);
      
      // Refresh data
      fetchCounsellorLeads(selectedCounsellor.id);
      invalidateLeadsCache();
      refreshCounsellors();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsCreatingLead(false);
    }
  };

  const handleBulkAction = async (action: "DELETE" | "UNASSIGN") => {
    if (selectedLeadIds.length === 0 || !selectedCounsellor) return;

    const confirmMsg =
      action === "DELETE"
        ? `Are you sure you want to completely delete these ${selectedLeadIds.length} leads from the database?`
        : `Are you sure you want to unassign these ${selectedLeadIds.length} leads? they will return to the unassigned leads pool.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/counsellors/${selectedCounsellor.id}/leads`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedLeadIds, action }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to execute bulk action", "error");
        return;
      }

      showToast(data.message || "Bulk operation completed!", "success");
      setSelectedLeadIds([]);
      fetchCounsellorLeads(selectedCounsellor.id);
      invalidateLeadsCache();
      refreshCounsellors();
    } catch {
      showToast("Operation failed. Try again.", "error");
    }
  };

  const handleAssignUnassignedLeads = async () => {
    if (selectedUnassignedIds.length === 0 || !selectedCounsellor) return;

    try {
      const res = await fetch(`/api/counsellors/${selectedCounsellor.id}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: selectedUnassignedIds }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to assign leads", "error");
        return;
      }

      showToast(`Assigned ${selectedUnassignedIds.length} leads successfully!`, "success");
      setSelectedUnassignedIds([]);
      setShowUnassignedLeadsPanel(false);
      fetchCounsellorLeads(selectedCounsellor.id);
      invalidateLeadsCache();
      refreshCounsellors();
    } catch {
      showToast("Assignment failed. Try again.", "error");
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAllLeads = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const filteredLeads = counsellorLeads.filter((l) => {
    const q = searchQuery.toLowerCase();
    return (
      (l.name || "").toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q) ||
      (l.course || "").toLowerCase().includes(q)
    );
  });

  const filteredUnassigned = unassignedLeads.filter((l) => {
    const q = unassignedSearchQuery.toLowerCase();
    return (
      (l.name || "").toLowerCase().includes(q) ||
      l.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe font-sans">
      <Header user={user} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Counsellor Team
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage counsellor accounts, assign leads, and monitor performance
            </p>
          </div>
        </div>

        {/* Organization Virtual Room Code Banner */}
        {user?.organization && (
          <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-indigo-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-700/80 text-indigo-200 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <Building2 className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-md">
                    Virtual Organization Room
                  </span>
                  <span className="text-xs font-semibold text-indigo-200">
                    {user.organization.name}
                  </span>
                </div>
                <p className="text-xs text-indigo-200 mt-1 flex flex-wrap items-center gap-1.5">
                  <span>Share Virtual Room Code with Counsellors:</span>
                  <span className="font-mono font-bold text-white tracking-widest text-sm bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-indigo-500/40">
                    {orgRoomCode}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyRoomCode}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 self-start sm:self-center"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCode ? "Copied Code!" : "Copy Room Code"}</span>
            </button>
          </div>
        )}

        {/* Layout grid: Left Counsellor Cards, Right Details Panel */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          
          {/* Left Cards List (2/5 size) */}
          <div className={`md:col-span-2 space-y-3 ${selectedCounsellor ? "hidden md:block" : "block"}`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Counsellors ({counsellors.length})
            </h3>
            
            {isLoading ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <p className="text-sm text-slate-500">Loading counsellor team...</p>
              </div>
            ) : counsellors.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">No counsellors created yet</p>
              </div>
            ) : (
              counsellors.map((c) => {
                const isSelected = selectedCounsellor?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCounsellor(c)}
                    className={`w-full text-left bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs flex items-center justify-between gap-4 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-colors ${
                        isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700"
                      }`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{c.name}</h4>
                        <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{c.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div className="hidden sm:block">
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Leads</p>
                        <p className="text-sm font-bold text-slate-900">
                          {c._count?.assignedLeads || 0}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${
                        isSelected ? "rotate-90 text-blue-600" : ""
                      }`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right details / leads management panel (3/5 size) */}
          <div className={`md:col-span-3 ${selectedCounsellor ? "block" : "hidden md:block"}`}>
            {selectedCounsellor ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6 animate-in fade-in">
                
                {/* Counsellor details header */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-blue-50 text-blue-700 uppercase">
                      Workspace details
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">
                      {selectedCounsellor.name}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      <span>{selectedCounsellor.email}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={handleDeleteCounsellor}
                      isLoading={isDeleting}
                    >
                      Terminate
                    </Button>
                    <button
                      onClick={() => setSelectedCounsellor(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Counsellor Workspace Actions */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setShowManualLeadForm(!showManualLeadForm);
                      setShowUnassignedLeadsPanel(false);
                    }}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      showManualLeadForm
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create & Assign Lead</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUnassignedLeadsPanel(!showUnassignedLeadsPanel);
                      setShowManualLeadForm(false);
                      if (!showUnassignedLeadsPanel) fetchUnassignedLeads();
                    }}
                    className={`flex items-center justify-center gap-2 p-3 border rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      showUnassignedLeadsPanel
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <FolderPlus className="w-4 h-4" />
                    <span>Assign From Pool</span>
                  </button>
                </div>

                {/* Manual Lead Creation Form */}
                {showManualLeadForm && (
                  <form
                    onSubmit={handleCreateManualLead}
                    className="bg-slate-50/50 rounded-xl border border-slate-200/80 p-4 space-y-3.5 animate-in slide-in-from-top-2"
                  >
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Add Lead Directly to {selectedCounsellor.name}
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Student Name"
                        value={manualLeadName}
                        onChange={(e) => setManualLeadName(e.target.value)}
                        placeholder="Student name"
                      />
                      <Input
                        label="Mobile Number *"
                        value={manualLeadPhone}
                        onChange={(e) => setManualLeadPhone(e.target.value)}
                        placeholder="e.g. +91 9988776655"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Course / Class Target"
                        value={manualLeadCourse}
                        onChange={(e) => setManualLeadCourse(e.target.value)}
                        placeholder="e.g. JEE Main, Neet"
                      />
                      <Input
                        label="Source / City"
                        value={manualLeadClass}
                        onChange={(e) => setManualLeadClass(e.target.value)}
                        placeholder="e.g. Kota, Delhi"
                      />
                    </div>

                    <Input
                      label="Initial Notes"
                      value={manualLeadNotes}
                      onChange={(e) => setManualLeadNotes(e.target.value)}
                      placeholder="Special requirements, callback preferences"
                    />

                    <div className="pt-1 flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowManualLeadForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        isLoading={isCreatingLead}
                      >
                        Create & Assign
                      </Button>
                    </div>
                  </form>
                )}

                {/* Unassigned Leads Pooling Selector */}
                {showUnassignedLeadsPanel && (
                  <div className="bg-slate-50/50 rounded-xl border border-slate-200/80 p-4 space-y-4 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Select leads from Unassigned Pool
                      </h4>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                        {unassignedLeads.length} unassigned
                      </span>
                    </div>

                    {/* Unassigned Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search unassigned leads..."
                        value={unassignedSearchQuery}
                        onChange={(e) => setUnassignedSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg bg-white divide-y divide-slate-100">
                      {isUnassignedLoading ? (
                        <p className="p-4 text-center text-xs text-slate-500">Loading unassigned leads...</p>
                      ) : filteredUnassigned.length === 0 ? (
                        <p className="p-4 text-center text-xs text-slate-500">No unassigned leads found</p>
                      ) : (
                        filteredUnassigned.map((l) => {
                          const isChecked = selectedUnassignedIds.includes(l.id);
                          return (
                            <label
                              key={l.id}
                              className="flex items-center justify-between p-3 hover:bg-slate-50/80 cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    setSelectedUnassignedIds((prev) =>
                                      prev.includes(l.id)
                                        ? prev.filter((id) => id !== l.id)
                                        : [...prev, l.id]
                                    );
                                  }}
                                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                  <p className="text-xs font-semibold text-slate-800">
                                    {l.name || "Unnamed Student"}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">{l.phone}</p>
                                </div>
                              </div>
                              {l.course && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                                  {l.course}
                                </span>
                              )}
                            </label>
                          );
                        })
                      )}
                    </div>

                    {selectedUnassignedIds.length > 0 && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-semibold text-slate-500">
                          {selectedUnassignedIds.length} leads selected
                        </span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedUnassignedIds([])}
                          >
                            Clear
                          </Button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            onClick={handleAssignUnassignedLeads}
                          >
                            Assign Selected
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Assigned Leads Table & Search */}
                <div className="space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Assigned Leads ({counsellorLeads.length})</span>
                    </h3>

                    {/* Search inside assigned */}
                    <div className="relative max-w-xs w-full">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search assigned leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-1 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Bulk action bar */}
                  {selectedLeadIds.length > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl animate-in slide-in-from-bottom-2">
                      <span className="text-xs font-semibold text-blue-800">
                        {selectedLeadIds.length} leads selected
                      </span>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleBulkAction("UNASSIGN")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <UserMinus className="w-3.5 h-3.5 text-slate-500" />
                          <span>Unassign</span>
                        </button>

                        <button
                          onClick={() => handleBulkAction("DELETE")}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Delete Completely</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Leads List */}
                  <div className="max-h-96 overflow-y-auto border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100">
                    {isLeadsLoading ? (
                      <p className="p-8 text-center text-sm text-slate-500">Loading leads...</p>
                    ) : filteredLeads.length === 0 ? (
                      <p className="p-8 text-center text-sm text-slate-500">No leads assigned to this counsellor</p>
                    ) : (
                      <>
                        {/* Header checkbox */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                          <input
                            type="checkbox"
                            checked={selectedLeadIds.length === filteredLeads.length}
                            onChange={toggleSelectAllLeads}
                            className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500 cursor-pointer"
                          />
                          <span>Select All Leads</span>
                        </div>

                        {filteredLeads.map((l) => {
                          const isChecked = selectedLeadIds.includes(l.id);
                          return (
                            <div
                              key={l.id}
                              className={`flex items-center justify-between p-3.5 hover:bg-slate-50/40 transition-colors ${
                                isChecked ? "bg-blue-50/10" : ""
                              }`}
                            >
                              <div className="flex items-center gap-3.5">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSelectLead(l.id)}
                                  className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded-sm focus:ring-blue-500 cursor-pointer"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-bold text-slate-800">
                                      {l.name || "Unnamed Student"}
                                    </p>
                                    {(() => {
                                      const isStale = isLeadStale(l.status, l.updatedAt, l.createdAt);
                                      const label = getStaleLabel(l.updatedAt, l.createdAt);
                                      return isStale ? (
                                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider animate-pulse shrink-0">
                                          <span className="w-1 h-1 rounded-full bg-amber-500" />
                                          {label}
                                        </span>
                                      ) : null;
                                    })()}
                                  </div>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{l.phone}</p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase ${
                                  l.status === "NEW"
                                    ? "bg-blue-50 text-blue-700"
                                    : l.status === "CONVERTED"
                                    ? "bg-emerald-50 text-emerald-700"
                                    : l.status === "INTERESTED"
                                    ? "bg-violet-50 text-violet-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}>
                                  {l.status}
                                </span>
                                {l.course && (
                                  <p className="text-[10px] text-slate-400 mt-1">{l.course}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center justify-center h-full min-h-[400px] border border-dashed border-slate-300 rounded-2xl bg-slate-50/30 p-8 text-center">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700">No Counsellor Selected</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Click on any counsellor on the left to view and manage their assigned leads pool, assign new leads, or clear database records.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      <BottomNav user={user} />
    </div>
  );
}
