"use client";

import React, { useState } from "react";
import Link from "next/link";

type FeedbackType = "bug" | "feature" | "privacy" | "conduct" | "general" | "";

const categories: { value: FeedbackType; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
  {
    value: "bug",
    label: "Bug Report",
    color: "text-spicy-paprika border-spicy-paprika/30 bg-spicy-paprika/5",
    desc: "Something is broken or not working as expected",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    value: "feature",
    label: "Feature Request",
    color: "text-stormy-teal border-stormy-teal/30 bg-stormy-teal/5",
    desc: "Suggest a new feature or improvement",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    value: "conduct",
    label: "Code of Conduct",
    color: "text-vivid-tangerine border-vivid-tangerine/30 bg-vivid-tangerine/5",
    desc: "Report a violation or harassment incident",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
  },
  {
    value: "privacy",
    label: "Privacy Request",
    color: "text-orange border-orange/30 bg-orange/5",
    desc: "Data deletion, access request, or privacy concern",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
  },
  {
    value: "general",
    label: "General Feedback",
    color: "text-dust-grey border-(--card-border) bg-(--card-background)",
    desc: "Any other comments, praise, or suggestions",
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

export default function FeedbackClient() {
  const [selectedType, setSelectedType] = useState<FeedbackType>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedType) newErrors.type = "Please select a feedback type.";
    if (!name.trim()) newErrors.name = "Your name is required.";
    if (!email.trim()) newErrors.email = "Your email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email address.";
    if (!subject.trim()) newErrors.subject = "Please add a brief subject.";
    if (!message.trim() || message.trim().length < 20) newErrors.message = "Message must be at least 20 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY || "8b656dc6-6c35-4427-bcfc-30d319a20a1f",
          name: name,
          email: email,
          subject: `[Chai Charcha Feedback: ${selectedType.toUpperCase()}] ${subject}`,
          message: message,
          from_name: "Chai Charcha Feedback Portal",
          category: selectedType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.message || "Something went wrong. Please try again later.");
      }
    } catch {
      setSubmitError("Failed to send feedback. Please check your internet connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground) items-center justify-center min-h-[60vh] px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stormy-teal/10 border border-stormy-teal/20 mb-6">
            <svg className="w-10 h-10 text-stormy-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-(--foreground) mb-3">Message Received!</h2>
          <p className="text-sm text-(--text-secondary) leading-relaxed mb-8">
            Thank you for reaching out. We have received your{" "}
            <span className="font-semibold text-(--foreground)">{categories.find((c) => c.value === selectedType)?.label}</span>{" "}
            and will review it within 2–3 business days.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-spicy-paprika px-6 py-3 text-sm font-bold text-floral-white shadow-lg hover:bg-spicy-paprika-600 transition-all hover:scale-105 active:scale-95"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground)">
      <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-dust-grey mb-8">
          <Link href="/" className="hover:text-spicy-paprika transition-colors">Home</Link>
          <span>/</span>
          <span className="text-(--foreground) font-semibold">Feedback Portal</span>
        </nav>

        {/* Hero */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange/10 border border-orange/20 mb-5">
            <svg className="w-8 h-8 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-(--foreground) mb-4">
            Feedback Portal
          </h1>
          <p className="text-base text-(--text-secondary) max-w-xl mx-auto leading-relaxed">
            We read every message. Whether it&apos;s a bug, a suggestion, a privacy request, or just a friendly hello — we are listening.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-bold text-(--foreground) mb-3">
              What&apos;s this about? <span className="text-spicy-paprika">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => { setSelectedType(cat.value); setErrors((e) => ({ ...e, type: "" })); }}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all text-left cursor-pointer ${
                    selectedType === cat.value
                      ? cat.color + " ring-2 ring-current/30 scale-[1.01]"
                      : "border-(--card-border) bg-(--card-background) hover:border-orange/30 text-(--text-secondary)"
                  }`}
                >
                  <span className={`shrink-0 mt-0.5 ${selectedType === cat.value ? "" : "text-dust-grey"}`}>{cat.icon}</span>
                  <span>
                    <span className="block text-xs font-bold">{cat.label}</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">{cat.desc}</span>
                  </span>
                </button>
              ))}
            </div>
            {errors.type && <p className="text-xs text-spicy-paprika mt-2">{errors.type}</p>}
          </div>

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fb-name" className="block text-sm font-bold text-(--foreground) mb-2">
                Your Name <span className="text-spicy-paprika">*</span>
              </label>
              <input
                id="fb-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Akash Singh"
                className={`w-full rounded-2xl border px-4 py-3 text-sm bg-(--input-bg)/20 text-(--foreground) placeholder-dust-grey/60 outline-none transition-all focus:ring-2 focus:ring-orange/30 ${
                  errors.name ? "border-spicy-paprika/50" : "border-(--input-border)/60 focus:border-orange/50"
                }`}
              />
              {errors.name && <p className="text-xs text-spicy-paprika mt-1.5">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="fb-email" className="block text-sm font-bold text-(--foreground) mb-2">
                Email Address <span className="text-spicy-paprika">*</span>
              </label>
              <input
                id="fb-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="akash@example.com"
                className={`w-full rounded-2xl border px-4 py-3 text-sm bg-(--input-bg)/20 text-(--foreground) placeholder-dust-grey/60 outline-none transition-all focus:ring-2 focus:ring-orange/30 ${
                  errors.email ? "border-spicy-paprika/50" : "border-(--input-border)/60 focus:border-orange/50"
                }`}
              />
              {errors.email && <p className="text-xs text-spicy-paprika mt-1.5">{errors.email}</p>}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="fb-subject" className="block text-sm font-bold text-(--foreground) mb-2">
              Subject <span className="text-spicy-paprika">*</span>
            </label>
            <input
              id="fb-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your message..."
              className={`w-full rounded-2xl border px-4 py-3 text-sm bg-(--input-bg)/20 text-(--foreground) placeholder-dust-grey/60 outline-none transition-all focus:ring-2 focus:ring-orange/30 ${
                errors.subject ? "border-spicy-paprika/50" : "border-(--input-border)/60 focus:border-orange/50"
              }`}
            />
            {errors.subject && <p className="text-xs text-spicy-paprika mt-1.5">{errors.subject}</p>}
          </div>

          {/* Message */}
          <div>
            <label htmlFor="fb-message" className="block text-sm font-bold text-(--foreground) mb-2">
              Message <span className="text-spicy-paprika">*</span>
              <span className="font-normal text-dust-grey ml-2">({message.length} / 2000 chars)</span>
            </label>
            <textarea
              id="fb-message"
              rows={7}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe your feedback in detail. The more context, the better we can help..."
              className={`w-full rounded-2xl border px-4 py-3 text-sm bg-(--input-bg)/20 text-(--foreground) placeholder-dust-grey/60 outline-none transition-all focus:ring-2 focus:ring-orange/30 resize-none ${
                errors.message ? "border-spicy-paprika/50" : "border-(--input-border)/60 focus:border-orange/50"
              }`}
            />
            {errors.message && <p className="text-xs text-spicy-paprika mt-1.5">{errors.message}</p>}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-4 bg-spicy-paprika/10 border border-spicy-paprika/20 rounded-2xl flex items-start gap-3 text-spicy-paprika">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-semibold leading-relaxed">{submitError}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto self-start flex items-center gap-2 rounded-full bg-spicy-paprika px-8 py-3.5 text-sm font-bold text-floral-white shadow-xl shadow-spicy-paprika/20 hover:bg-spicy-paprika-600 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Feedback
              </>
            )}
          </button>

        </form>

        {/* Response time note */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-(--card-border) bg-(--card-background) p-4">
          <svg className="w-5 h-5 text-orange shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-(--text-secondary) leading-relaxed">
            <span className="font-bold text-(--foreground)">Response Time:</span> We aim to respond to all feedback within 2–3 business days. For urgent conduct violations, we will respond within 24 hours. Privacy-related requests will be handled in accordance with applicable data protection laws.
          </p>
        </div>

      </div>
    </div>
  );
}
