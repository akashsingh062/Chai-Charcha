"use client";

import React, { useState } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";

interface ReportModalProps {
  isOpen: boolean;
  targetId: string;
  targetType: "Post" | "Comment" | "User" | "Community";
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  targetId,
  targetType,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState("");
  const [predefinedReason, setPredefinedReason] = useState("Spam or advertising");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    "Spam or advertising",
    "Harassment, hate speech, or abuse",
    "Inappropriate or adult content",
    "Misinformation or fake news",
    "Other (please describe below)"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = predefinedReason.startsWith("Other") 
      ? reason.trim() 
      : predefinedReason;

    if (!finalReason) {
      toast.warning("Please provide a reason for the report.");
      return;
    }

    try {
      setLoading(true);
      await axiosInstance.post("/api/reports", {
        targetId,
        targetType,
        reason: finalReason,
      });
      toast.success(`${targetType} reported successfully.`);
      if (onSuccess) onSuccess();
      onClose();
      // Reset state
      setReason("");
      setPredefinedReason("Spam or advertising");
    } catch (err: unknown) {
      console.error(err);
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      toast.error(errorMsg || "Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-6 shadow-2xl backdrop-blur-md pointer-events-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5 mb-4">
          <h3 className="text-sm font-extrabold text-(--foreground) uppercase tracking-wider">
            Report {targetType}
          </h3>
          <button
            onClick={onClose}
            className="text-dust-grey hover:text-(--foreground) transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content/Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
              Select a Reason
            </label>
            <select
              value={predefinedReason}
              onChange={(e) => setPredefinedReason(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-ink-black/40 border border-stormy-teal/20 rounded-xl text-xs text-(--foreground) focus:outline-none focus:border-vivid-tangerine cursor-pointer"
            >
              {reasons.map((r) => (
                <option key={r} value={r} className="bg-ink-black text-(--foreground)">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {predefinedReason.startsWith("Other") && (
            <div>
              <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
                Describe the Violation
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please describe why this content violates community guidelines..."
                rows={4}
                className="w-full px-3.5 py-2.5 bg-ink-black/40 border border-stormy-teal/20 rounded-xl text-xs text-(--foreground) focus:outline-none focus:border-vivid-tangerine placeholder-dust-grey/50 resize-none"
                required
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 border-t border-(--divider-color) pt-4 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-xs font-semibold text-(--foreground) hover:bg-(--btn-secondary-hover-bg) transition-colors cursor-pointer"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 rounded-xl bg-spicy-paprika hover:bg-spicy-paprika-600 px-5 py-2.5 text-xs font-bold text-floral-white shadow-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && (
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
