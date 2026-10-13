"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function ContactDemoSection() {
  const [formData, setFormData] = useState({
    fullName: "",
    instituteName: "",
    location: "",
    email: "",
    phoneNumber: "",
    message: "",
    agreeToPolicy: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.agreeToPolicy) {
      setErrorMessage("Please agree to our privacy policy to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          instituteName: formData.instituteName,
          location: formData.location,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          message: formData.message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message. Please try again.");
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitSuccess(false);
    setErrorMessage(null);
    setFormData({
      fullName: "",
      instituteName: "",
      location: "",
      email: "",
      phoneNumber: "",
      message: "",
      agreeToPolicy: true,
    });
  };

  return (
    <section id="contact" className="scroll-mt-16 py-14 sm:py-24 bg-gradient-to-b from-[#F2F6FD] via-[#EBF2FC] to-[#F2F6FD] text-slate-900 relative overflow-hidden flex items-center justify-center border-y border-slate-200/70">
      
      {/* Subtle ambient light reflections to enrich the subtle tint */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[550px] bg-gradient-to-tr from-blue-300/20 via-sky-200/25 to-indigo-200/20 rounded-full blur-[110px] pointer-events-none" />
      <div className="absolute -top-12 left-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 right-1/4 w-80 h-80 bg-indigo-300/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        {/* =========================================================================
            CENTERED CRISP WHITE CARD (Pops cleanly against the subtle tinted backdrop)
        ========================================================================= */}
        <div className="bg-white rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-10 lg:p-12 shadow-[0_20px_60px_-15px_rgba(15,23,42,0.08),0_1px_3px_rgba(0,0,0,0.03)] border border-white/90 transition-shadow duration-300 hover:shadow-[0_25px_70px_-15px_rgba(15,23,42,0.12)]">
          <div>
            {/* Overline Badge */}
            <span className="text-xs sm:text-sm font-bold text-[#FF6433] tracking-wide block mb-1">
              Get in Touch
            </span>

            {/* Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-[40px] font-extrabold text-slate-900 tracking-tight leading-[1.2] mb-2 sm:mb-3">
              Let&apos;s Chat, Reach Out to Us
            </h2>

            {/* Subtitle */}
            <p className="text-xs sm:text-base text-slate-500 leading-relaxed font-normal mb-6 sm:mb-8">
              Have questions or feedback? We&apos;re here to help. Send us a message, and our team will respond within 24 hours.
            </p>

            {submitSuccess ? (
              /* Success State */
              <div className="py-8 sm:py-12 text-center space-y-4 sm:space-y-5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Message Sent Successfully!</h3>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Thank you for reaching out, <strong className="text-slate-800">{formData.fullName || "there"}</strong>. We have received your inquiry for <span className="text-blue-600 font-semibold">{formData.instituteName || "your institute"}</span> and our team will connect with you shortly.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={handleReset}
                    className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              /* Main Form */
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                
                {/* Row 1: Full Name & Institute Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      Institute Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Institute / Academy name"
                      value={formData.instituteName}
                      onChange={(e) => setFormData({ ...formData, instituteName: e.target.value })}
                      className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:border-slate-300"
                    />
                  </div>
                </div>

                {/* Row 2: Location & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      Location / City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City, State (e.g. Pune)"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">
                      Phone / WhatsApp Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="Phone or WhatsApp number"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:border-slate-300"
                    />
                  </div>
                </div>

                {/* Row 3: Email Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="Official or work email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:border-slate-300"
                  />
                </div>

                {/* Row 4: Message Textarea */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 sm:mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Leave us a message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#F8FAFC] border border-slate-200/70 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all hover:border-slate-300 resize-none"
                  ></textarea>
                </div>

                {/* Row 5: Privacy Policy Agreement Checkbox */}
                <div className="flex items-center gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    id="policy-agree"
                    checked={formData.agreeToPolicy}
                    onChange={(e) => setFormData({ ...formData, agreeToPolicy: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <label htmlFor="policy-agree" className="text-xs sm:text-sm text-slate-600 cursor-pointer select-none">
                    I agree to our friendly{" "}
                    <Link href="/privacy" className="underline hover:text-slate-900 font-medium">
                      privacy policy
                    </Link>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 sm:py-4 px-6 rounded-xl sm:rounded-2xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-lg shadow-slate-900/10 hover:shadow-xl active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 min-h-[44px]"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending message...</span>
                      </div>
                    ) : (
                      <span>Send Message</span>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
