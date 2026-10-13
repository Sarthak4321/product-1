"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Trash2,
  Save,
  RefreshCw,
  Eye,
  Sparkles,
  ArrowUpRight,
  Plus,
  ArrowLeft,
  ArrowRight,
  Info,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface ShowcaseSlide {
  id: string;
  imageUrl: string;
  title?: string;
  createdAt?: string;
}

export function ShowcaseManager() {
  const { showToast } = useToast();
  const [slides, setSlides] = useState<ShowcaseSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [directUrl, setDirectUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/showcase");
      if (res.ok) {
        const data = await res.json();
        setSlides(data.slides || []);
      } else {
        showToast("Failed to load showcase slides", "error");
      }
    } catch {
      showToast("Network error loading showcase slides", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    try {
      const newUploadedSlides: ShowcaseSlide[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);
        formData.append("serviceId", `slide-${Date.now()}-${i}`);

        const res = await fetch("/api/super-admin/showcase/upload", {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newUploadedSlides.push({
            id: `slide-${Date.now()}-${i}`,
            imageUrl: data.url,
            title: file.name.replace(/\.[^/.]+$/, ""),
            createdAt: new Date().toISOString(),
          });
        } else {
          const err = await res.json();
          showToast(err.error || `Failed to upload ${file.name}`, "error");
        }
      }

      if (newUploadedSlides.length > 0) {
        const updated = [...slides, ...newUploadedSlides];
        setSlides(updated);
        showToast(`Uploaded ${newUploadedSlides.length} image(s)! Click Save & Publish to apply.`, "success");
      }
    } catch {
      showToast("Network error during file upload", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleAddDirectUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;

    const newSlide: ShowcaseSlide = {
      id: `slide-${Date.now()}`,
      imageUrl: directUrl.trim(),
      title: `Showcase Image ${slides.length + 1}`,
      createdAt: new Date().toISOString(),
    };

    setSlides([...slides, newSlide]);
    setDirectUrl("");
    showToast("Added image URL to list. Click Save & Publish to apply.", "success");
  };

  const handleDeleteSlide = (id: string) => {
    setSlides(slides.filter((s) => s.id !== id));
    showToast("Slide removed from list. Click Save to apply.", "info");
  };

  const handleMoveSlide = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;

    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setSlides(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/super-admin/showcase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });

      if (res.ok) {
        showToast("Showcase gallery saved live to landing page!", "success");
        await fetchConfig();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to save showcase gallery", "error");
      }
    } catch {
      showToast("Network error saving showcase", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading Showcase Manager...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Action Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
              <Sparkles className="w-3.5 h-3.5" />
              Dynamic Showcase Gallery
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900">
            Landing Page Showcase Images ({slides.length} active)
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
            Upload custom screenshots or illustrations. The landing page carousel will dynamically display and autoscroll across all your uploaded slides.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Landing Page</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
          </a>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Publishing..." : "Save & Publish"}</span>
          </button>
        </div>
      </div>

      {/* Upload Drag & Drop Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/60 rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer group shadow-xs"
      >
        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="image/png, image/jpeg, image/webp, image/svg+xml"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div className="w-12 h-12 rounded-2xl bg-white border border-purple-200 text-purple-600 flex items-center justify-center mx-auto mb-3 shadow-xs group-hover:scale-110 transition-transform">
          {uploading ? (
            <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
          ) : (
            <Upload className="w-6 h-6" />
          )}
        </div>

        <p className="text-sm font-bold text-slate-800">
          {uploading ? "Uploading images..." : "Click or Drag to Upload Showcase Images"}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Supports PNG, JPG, WEBP. You can select multiple images at once.
        </p>
      </div>

      {/* Quick URL Input */}
      <form onSubmit={handleAddDirectUrl} className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Or paste direct image URL (https://...)"
          value={directUrl}
          onChange={(e) => setDirectUrl(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-xl text-xs border border-slate-200 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-mono"
        />
        <button
          type="submit"
          disabled={!directUrl.trim()}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all disabled:opacity-40 flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add URL</span>
        </button>
      </form>

      {/* Dynamic Slides Grid */}
      {slides.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs space-y-2">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No Custom Showcase Images Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Upload images above to build your custom landing page carousel.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-3 relative group hover:border-slate-300 transition-all"
            >
              {/* Image Preview Container */}
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-900 border border-slate-100 flex items-center justify-center">
                <img
                  src={slide.imageUrl}
                  alt={slide.title || `LeadDesk Showcase Slide ${idx + 1}`}
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white font-mono text-[10px] font-bold">
                  #{idx + 1}
                </span>
              </div>

              {/* Slide Controls */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveSlide(idx, "left")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-25 transition-colors"
                    title="Move Left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === slides.length - 1}
                    onClick={() => handleMoveSlide(idx, "right")}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-25 transition-colors"
                    title="Move Right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteSlide(slide.id)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
