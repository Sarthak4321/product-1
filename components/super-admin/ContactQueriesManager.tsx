"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MessageSquare,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  Clock3,
  Archive,
  Trash2,
  Edit3,
  X,
  MessageCircle,
  Sparkles,
  UserCheck,
  AlertCircle,
  Save,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface ContactQueryRecord {
  id: string;
  fullName: string;
  instituteName: string;
  location: string;
  phoneNumber: string;
  email: string;
  message: string;
  status: "PENDING" | "CONTACTED" | "RESOLVED" | "ARCHIVED";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SummaryCounts {
  total: number;
  pending: number;
  contacted: number;
  resolved: number;
  archived: number;
}

export function ContactQueriesManager() {
  const { showToast } = useToast();
  const [queries, setQueries] = useState<ContactQueryRecord[]>([]);
  const [summary, setSummary] = useState<SummaryCounts>({
    total: 0,
    pending: 0,
    contacted: 0,
    resolved: 0,
    archived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedQuery, setSelectedQuery] = useState<ContactQueryRecord | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notesEdit, setNotesEdit] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const res = await fetch(`/api/super-admin/contact-queries?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setQueries(data.queries || []);
        if (data.summary) {
          setSummary(data.summary);
        }
      } else {
        showToast("Failed to fetch contact inquiries", "error");
      }
    } catch {
      showToast("Network error fetching inquiries", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueries();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQueries();
  };

  const handleUpdateStatus = async (
    queryId: string,
    newStatus: "PENDING" | "CONTACTED" | "RESOLVED" | "ARCHIVED"
  ) => {
    setUpdatingId(queryId);
    try {
      const res = await fetch("/api/super-admin/contact-queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: queryId, status: newStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        setQueries((prev) =>
          prev.map((q) => (q.id === queryId ? { ...q, status: newStatus } : q))
        );
        if (selectedQuery && selectedQuery.id === queryId) {
          setSelectedQuery({ ...selectedQuery, status: newStatus });
        }
        showToast(`Inquiry status updated to ${newStatus}`, "success");
        // refresh counts in background
        fetchQueries();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Network error updating inquiry status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedQuery) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch("/api/super-admin/contact-queries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedQuery.id, notes: notesEdit }),
      });

      if (res.ok) {
        setSelectedQuery({ ...selectedQuery, notes: notesEdit });
        setQueries((prev) =>
          prev.map((q) => (q.id === selectedQuery.id ? { ...q, notes: notesEdit } : q))
        );
        showToast("Internal notes saved successfully", "success");
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save notes", "error");
      }
    } catch {
      showToast("Network error saving notes", "error");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDelete = async (queryId: string) => {
    if (!confirm("Are you sure you want to permanently delete this inquiry?")) return;

    setUpdatingId(queryId);
    try {
      const res = await fetch(`/api/super-admin/contact-queries?id=${queryId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        showToast("Inquiry deleted successfully", "success");
        setQueries((prev) => prev.filter((q) => q.id !== queryId));
        if (selectedQuery?.id === queryId) {
          setSelectedQuery(null);
        }
        fetchQueries();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to delete inquiry", "error");
      }
    } catch {
      showToast("Network error deleting inquiry", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openInspectModal = (query: ContactQueryRecord) => {
    setSelectedQuery(query);
    setNotesEdit(query.notes || "");
  };

  const getCleanPhone = (phone: string) => {
    return phone.replace(/[^0-9]/g, "");
  };

  const getWhatsAppLink = (query: ContactQueryRecord) => {
    const cleanNum = getCleanPhone(query.phoneNumber);
    const phoneWithCode = cleanNum.startsWith("91") || cleanNum.length > 10 ? cleanNum : `91${cleanNum}`;
    const text = encodeURIComponent(
      `Hello ${query.fullName}, thank you for reaching out to LeadDesk regarding ${query.instituteName}. How can we assist you today?`
    );
    return `https://wa.me/${phoneWithCode}?text=${text}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Response
          </span>
        );
      case "CONTACTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock3 className="w-3 h-3" />
            Contacted
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            Resolved / Onboarded
          </span>
        );
      case "ARCHIVED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <Archive className="w-3 h-3" />
            Archived
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Inquiries */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Inquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{summary.total}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Landing page contact forms</p>
        </div>

        {/* Pending Inquiries */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs bg-gradient-to-br from-amber-50/40 via-white to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pending Action
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4 animate-spin-slow" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{summary.pending}</p>
          <p className="text-[11px] font-semibold text-amber-600 mt-0.5">Requires immediate outreach</p>
        </div>

        {/* Contacted */}
        <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              In Discussion
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">{summary.contacted}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Follow-up in progress</p>
        </div>

        {/* Resolved */}
        <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Resolved
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{summary.resolved}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Successfully closed / converted</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Search and Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, institute, email, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-20 py-2 rounded-xl text-xs border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-all"
            >
              Search
            </button>
          </form>

          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl shrink-0 overflow-x-auto">
            {[
              { label: `All (${summary.total})`, value: "ALL" },
              { label: `Pending (${summary.pending})`, value: "PENDING" },
              { label: `Contacted (${summary.contacted})`, value: "CONTACTED" },
              { label: `Resolved (${summary.resolved})`, value: "RESOLVED" },
              { label: `Archived (${summary.archived})`, value: "ARCHIVED" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === f.value
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}

            <button
              onClick={fetchQueries}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all ml-1"
              title="Refresh Inquiries"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-purple-600" : ""}`} />
            </button>
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3.5 px-5">Lead / Contact</th>
                <th className="py-3.5 px-4">Institute & Location</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Message Snippet</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Received Date</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {queries.map((q) => {
                const isUpdating = updatingId === q.id;
                const formattedDate = new Date(q.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Lead / Contact */}
                    <td className="py-4 px-5">
                      <p className="font-bold text-slate-900 text-sm">{q.fullName}</p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{q.email}</span>
                      </p>
                    </td>

                    {/* Institute & Location */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{q.instituteName}</span>
                      </p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{q.location}</span>
                      </p>
                    </td>

                    {/* Contact Info & Direct Links */}
                    <td className="py-4 px-4">
                      <p className="font-mono font-medium text-slate-800">{q.phoneNumber}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <a
                          href={getWhatsAppLink(q)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold transition-colors"
                          title="Open WhatsApp chat"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>WhatsApp</span>
                        </a>
                        <a
                          href={`tel:${q.phoneNumber}`}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold transition-colors"
                          title="Call phone number"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Call</span>
                        </a>
                      </div>
                    </td>

                    {/* Message Snippet */}
                    <td className="py-4 px-4 max-w-xs">
                      <p className="text-slate-600 line-clamp-2 text-xs leading-relaxed" title={q.message}>
                        {q.message}
                      </p>
                      {q.notes && (
                        <p className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded mt-1 inline-block font-medium">
                          Note: {q.notes}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4 text-center">
                      {getStatusBadge(q.status)}
                    </td>

                    {/* Received Date */}
                    <td className="py-4 px-4 text-center text-slate-400 text-[11px] whitespace-nowrap">
                      {formattedDate}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openInspectModal(q)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors flex items-center gap-1"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>

                        <button
                          disabled={isUpdating}
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete inquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {queries.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 space-y-2">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-semibold text-slate-700">No contact inquiries found</p>
                    <p className="text-xs text-slate-400">
                      When prospective institutes send a message via the landing page form, it will appear here instantly.
                    </p>
                  </td>
                </tr>
              )}

              {loading && queries.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
                    <span>Loading inquiries...</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect & Manage Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  Inquiry Details
                </span>
                <h3 className="font-bold text-slate-900 text-xl">{selectedQuery.fullName}</h3>
                <p className="text-xs text-slate-500">
                  {selectedQuery.instituteName} &bull; {selectedQuery.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQuery(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Status & Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <select
                  value={selectedQuery.status}
                  onChange={(e) =>
                    handleUpdateStatus(
                      selectedQuery.id,
                      e.target.value as "PENDING" | "CONTACTED" | "RESOLVED" | "ARCHIVED"
                    )
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="PENDING">PENDING (Action Required)</option>
                  <option value="CONTACTED">CONTACTED (Follow-up)</option>
                  <option value="RESOLVED">RESOLVED (Onboarded)</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={getWhatsAppLink(selectedQuery)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={`mailto:${selectedQuery.email}?subject=LeadDesk%20Demo%20%26%20Consultation&body=Hello%20${encodeURIComponent(
                    selectedQuery.fullName
                  )},%0D%0A%0D%0AThank you for reaching out to LeadDesk!`}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
              </div>
            </div>

            {/* Contact Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Email Address</p>
                <p className="font-bold text-slate-900 font-mono select-all">{selectedQuery.email}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Phone / WhatsApp</p>
                <p className="font-bold text-slate-900 font-mono select-all">{selectedQuery.phoneNumber}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Institute Name</p>
                <p className="font-bold text-slate-900">{selectedQuery.instituteName}</p>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-0.5">
                <p className="text-slate-400 font-medium">Location</p>
                <p className="font-bold text-slate-900">{selectedQuery.location}</p>
              </div>
            </div>

            {/* Message Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Prospect Message
              </label>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                {selectedQuery.message}
              </div>
            </div>

            {/* Internal Admin Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Internal Super Admin Notes
                </label>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSavingNotes ? "Saving..." : "Save Notes"}</span>
                </button>
              </div>
              <textarea
                rows={3}
                placeholder="Add internal notes about conversation, demo date, quoted pricing..."
                value={notesEdit}
                onChange={(e) => setNotesEdit(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 resize-none"
              />
            </div>

            {/* Timestamps & Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Submitted:{" "}
                {new Date(selectedQuery.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(selectedQuery.id)}
                className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Inquiry</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
