"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  ArrowLeft,
  MessageCircle,
  Save,
  CheckCircle2,
  Clock,
  Calendar,
  User,
  GraduationCap,
  MapPin,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Edit3,
  Check,
  PhoneForwarded,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { parseAndNormalizePhone } from "@/lib/phone";
import { generateWhatsAppMessage, buildWhatsAppUrl, WHATSAPP_TEMPLATES } from "@/lib/whatsapp";
import { SessionUser } from "@/lib/auth";

const CALL_RESPONSES = [
  { id: "Interested", label: "Interested", color: "hover:border-emerald-500 active:bg-emerald-50" },
  { id: "Follow-up", label: "Follow-up", color: "hover:border-amber-500 active:bg-amber-50" },
  { id: "Not Interested", label: "Not Interested", color: "hover:border-zinc-500 active:bg-zinc-50" },
  { id: "No Answer", label: "No Answer", color: "hover:border-rose-500 active:bg-rose-50" },
  { id: "Wrong Number", label: "Wrong Number", color: "hover:border-red-500 active:bg-red-50" },
  { id: "Converted", label: "Converted", color: "hover:border-teal-500 active:bg-teal-50" },
];

export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const leadId = params.id as string;
  const { showToast } = useToast();

  const [user, setUser] = useState<SessionUser | null>(null);
  const [lead, setLead] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isNextLoading, setIsNextLoading] = useState(false);

  // Post-Call Form State
  const [name, setName] = useState("");
  const [leadClass, setLeadClass] = useState("");
  const [place, setPlace] = useState("");
  const [course, setCourse] = useState("");
  const [callResponse, setCallResponse] = useState("");
  const [notes, setNotes] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("17:00");

  // Post-Save WhatsApp Modal State
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppText, setWhatsAppText] = useState("");
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("general");

  // Check auth
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  // Fetch lead details
  const fetchLead = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`);
      if (!res.ok) {
        if (res.status === 404) {
          showToast("Lead not found", "error");
          router.push("/leads");
          return;
        }
        throw new Error("Failed to load lead");
      }

      const data = await res.json();
      const l = data.lead;
      setLead(l);

      // Populate form
      setName(l.name || "");
      setLeadClass(l.class || "");
      setPlace(l.place || "");
      setCourse(l.course || "");
      setNotes(l.notes || "");

      // If follow up date exists
      if (l.followUpAt) {
        const d = new Date(l.followUpAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        setFollowUpDate(`${yyyy}-${mm}-${dd}`);
        setFollowUpTime(`${hh}:${min}`);
      } else {
        // Default tomorrow
        const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
        const dd = String(tomorrow.getDate()).padStart(2, "0");
        setFollowUpDate(`${yyyy}-${mm}-${dd}`);
      }
    } catch (e) {
      console.error(e);
      showToast("Error loading lead details", "error");
    } finally {
      setIsLoading(false);
    }
  }, [leadId, router, showToast]);

  useEffect(() => {
    if (leadId) {
      fetchLead();
    }
  }, [leadId, fetchLead]);

  // Save Post-Call Details
  const handleSave = async (andOpenWhatsApp: boolean = false) => {
    setIsSaving(true);
    try {
      let combinedFollowUp: string | null = null;
      if (callResponse === "Follow-up" && followUpDate) {
        combinedFollowUp = new Date(`${followUpDate}T${followUpTime || "17:00"}:00`).toISOString();
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || null,
          class: leadClass || null,
          place: place.trim() || null,
          course: course.trim() || null,
          callResponse: callResponse || undefined,
          notes: notes.trim() || null,
          followUpAt: combinedFollowUp,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to save lead", "error");
        setIsSaving(false);
        return;
      }

      setLead(data.lead);
      showToast("Lead updated successfully!", "success");

      // Reset selected template to default general
      setSelectedTemplateId("general");
      // Generate WhatsApp message preview
      const generatedMsg = generateWhatsAppMessage(undefined, {
        phone: lead.phone,
        name: name.trim() || null,
        class: leadClass || null,
        place: place.trim() || null,
        course: course.trim() || null,
      });
      setWhatsAppText(generatedMsg);
      setShowWhatsAppModal(true);
    } catch {
      showToast("Network error while saving. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger WhatsApp Deep Link
  const handleOpenWhatsApp = async () => {
    if (!lead) return;
    try {
      // 1. Record activity in CRM
      await fetch(`/api/leads/${leadId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: whatsAppText }),
      });

      // 2. Build deep link and launch
      const url = buildWhatsAppUrl(lead.phone, whatsAppText);
      window.open(url, "_blank", "noopener,noreferrer");

      showToast("Opened WhatsApp deep link", "success");
    } catch {
      showToast("Failed to open WhatsApp", "error");
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const chosen = WHATSAPP_TEMPLATES.find((t) => t.id === templateId);
    if (chosen && lead) {
      const generatedMsg = generateWhatsAppMessage(chosen.template, {
        phone: lead.phone,
        name: name.trim() || null,
        class: leadClass || null,
        place: place.trim() || null,
        course: course.trim() || null,
      });
      setWhatsAppText(generatedMsg);
    }
  };

  // Jump to Next Lead
  const handleNextLead = async () => {
    setIsNextLoading(true);
    try {
      const res = await fetch(`/api/leads/next?excludeId=${leadId}`);
      const data = await res.json();
      if (data.lead) {
        router.push(`/leads/${data.lead.id}`);
      } else {
        showToast("No more pending leads! Returning to lead list.", "info");
        router.push("/leads");
      }
    } catch {
      showToast("Could not find next lead", "error");
      router.push("/leads");
    } finally {
      setIsNextLoading(false);
    }
  };

  if (isLoading || !lead) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pb-safe">
        <Header user={user} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-4 animate-pulse">
          <div className="h-6 w-24 bg-slate-200 rounded" />
          <div className="h-16 w-full bg-slate-200 rounded-2xl" />
          <div className="h-48 w-full bg-white rounded-2xl border border-slate-200" />
        </main>
        <BottomNav user={user} />
      </div>
    );
  }

  const parsedPhone = parseAndNormalizePhone(lead.phone);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-safe">
      <Header user={user} />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 pt-4 pb-20 md:pb-6 space-y-4">
        {/* Navigation & Status Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Leads</span>
          </Link>
          <StatusBadge status={lead.status} size="md" />
        </div>

        {/* Hero Call Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs text-center space-y-4">
          <div className="space-y-1">
            {lead.name && (
              <h2 className="text-xl font-bold text-slate-900">{lead.name}</h2>
            )}
            <p className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-slate-900">
              {parsedPhone.display}
            </p>
            {(lead.class || lead.place || lead.course) && (
              <p className="text-xs text-slate-500">
                {[lead.class ? `Class ${lead.class}` : null, lead.place, lead.course]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>

          {/* Large Thumb CALL Button */}
          <div className="pt-1">
            <a
              href={parsedPhone.tel}
              className="w-full min-h-[56px] px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-md active:scale-[0.98] transition-all"
            >
              <Phone className="w-6 h-6 fill-current animate-bounce shrink-0" />
              <span>CALL NOW</span>
            </a>
            <p className="text-[11px] text-slate-400 mt-2">
              Opens standard phone dialer via <code className="font-mono">{parsedPhone.tel}</code>
            </p>
          </div>
        </div>

        {/* Post-Call Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Post-Call Details</h2>
            <p className="text-xs text-slate-500">
              Enter student details and call response captured during the conversation
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Student Name */}
            <Input
              label="Student Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Das"
              leftIcon={<User className="w-4 h-4" />}
            />

            {/* Grid for Class and Place */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Class / Grade"
                value={leadClass}
                onChange={(e) => setLeadClass(e.target.value)}
                placeholder="e.g. Class 12, Drop-out, College"
                leftIcon={<GraduationCap className="w-4 h-4" />}
              />

              <Input
                label="City / Place"
                value={place}
                onChange={(e) => setPlace(e.target.value)}
                placeholder="e.g. Durgapur"
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>

            {/* Target Course */}
            <Input
              label="Interested Course / Program"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g. JEE Main, NEET, Foundation..."
              leftIcon={<BookOpen className="w-4 h-4" />}
            />

            {/* Call Response Radio Pills */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                Call Outcome / Response <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CALL_RESPONSES.map((resp) => {
                  const isSelected = callResponse === resp.id;
                  return (
                    <button
                      key={resp.id}
                      type="button"
                      onClick={() => setCallResponse(resp.id)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold min-h-[44px] flex items-center justify-center gap-1.5 transition-all text-center ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : `bg-slate-50 border-slate-200 text-slate-700 ${resp.color}`
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      <span>{resp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conditional Follow-up Date/Time */}
            {callResponse === "Follow-up" && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Schedule Follow-up Date & Time</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 text-sm bg-white border border-amber-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <Textarea
              label="Call Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Discussed evening batch, asked for syllabus & fee structure. Call back tomorrow."
              rows={3}
            />

            {/* Save & Continue Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => handleSave()}
                isLoading={isSaving}
                leftIcon={<Save className="w-5 h-5" />}
                className="w-full shadow-md"
              >
                SAVE & CONTINUE
              </Button>
            </div>
          </div>
        </div>

        {/* Activity Timeline */}
        {lead.activities && lead.activities.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Interaction History ({lead.activities.length})</span>
            </h2>

            <div className="space-y-3 pt-1">
              {lead.activities.map((act: any) => {
                const date = new Date(act.createdAt);
                return (
                  <div
                    key={act.id}
                    className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span>{act.user?.name || "Counsellor"}</span>
                      <span>
                        {date.toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {act.response && (
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5 pt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <span>Outcome: {act.response}</span>
                      </div>
                    )}
                    {act.notes && (
                      <p className="text-slate-600 bg-white p-2 rounded-lg border border-slate-100 mt-1 whitespace-pre-wrap">
                        {act.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Post-Save WhatsApp Drawer / Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Send WhatsApp Message</h3>
                  <p className="text-xs text-slate-500 font-mono">To: {parsedPhone.display}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingMessage(!isEditingMessage)}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline p-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingMessage ? "Done Editing" : "Edit Text"}</span>
              </button>
            </div>

            {/* Template Selector Dropdown */}
            {!isEditingMessage && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Template
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
                >
                  {WHATSAPP_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Message Preview or Textarea */}
            {isEditingMessage ? (
              <Textarea
                value={whatsAppText}
                onChange={(e) => setWhatsAppText(e.target.value)}
                rows={6}
                className="font-sans text-sm"
              />
            ) : (
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200/80 text-slate-800 text-xs sm:text-sm whitespace-pre-wrap font-sans leading-relaxed">
                {whatsAppText}
              </div>
            )}

            <p className="text-[11px] text-slate-400 leading-tight">
              Tapping &quot;Open WhatsApp&quot; will launch WhatsApp with this message. The counsellor confirms and sends inside WhatsApp.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>OPEN WHATSAPP</span>
              </button>

              <button
                type="button"
                onClick={handleNextLead}
                disabled={isNextLoading}
                className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                <span>NEXT LEAD</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              >
                Stay on this lead
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav user={user} />
    </div>
  );
}
