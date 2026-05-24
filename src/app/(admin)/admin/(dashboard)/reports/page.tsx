"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { AdminBadge } from "@/components/admin/AdminBadge";
import Link from "next/link";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import { toast } from "@/store/useToastStore";

interface ReportItem {
  id: string;
  targetId: string | null;
  targetType: "Post" | "Comment" | "User" | "Community";
  reason: string;
  status: "pending" | "resolved" | "rejected";
  contentPreview: string;
  isContentDeleted: boolean;
  reporter?: { name: string; username: string };
  author?: { name: string; username: string };
  createdAt: string;
}

const typeColors: Record<string, { bg: string; border: string; text: string; accent: string }> = {
  Post:      { bg: "bg-[#f97316]/5",  border: "border-l-[#f97316]", text: "text-[#f97316]",  accent: "bg-[#f97316]/10"  },
  Comment:   { bg: "bg-[#14b8a6]/5",  border: "border-l-[#14b8a6]", text: "text-[#14b8a6]",  accent: "bg-[#14b8a6]/10"  },
  User:      { bg: "bg-[#60a5fa]/5",  border: "border-l-[#60a5fa]", text: "text-[#60a5fa]",  accent: "bg-[#60a5fa]/10"  },
  Community: { bg: "bg-[#a78bfa]/5",  border: "border-l-[#a78bfa]", text: "text-[#a78bfa]",  accent: "bg-[#a78bfa]/10"  },
};

export default function ModerationQueuePage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [ignoreModalOpen, setIgnoreModalOpen] = useState(false);
  const [selectedReportForIgnore, setSelectedReportForIgnore] = useState<ReportItem | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedReportIdForDelete, setSelectedReportIdForDelete] = useState<string | null>(null);
  const [ignoreAllModalOpen, setIgnoreAllModalOpen] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/reports", {
        params: { page, limit: 10, status, targetType: targetType || undefined },
      });
      setReports(res.data.reports || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalReports(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load reports", err);
    } finally {
      setLoading(false);
    }
  }, [page, status, targetType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReports();
  }, [fetchReports]);

  const handleConfirmAction = async (payload: { action: string; warningMessage: string; durationHours?: number }) => {
    if (!selectedReport) return;
    const targetId = selectedReport.id;
    try {
      const nextStatus = payload.action === "reject" ? "rejected" : "resolved";
      setReports((prev) => prev.filter((r) => r.id !== targetId));
      setTotalReports((prev) => Math.max(0, prev - 1));
      await axiosInstance.put(`/api/admin/reports/${targetId}`, {
        status: nextStatus, action: payload.action, warningMessage: payload.warningMessage, durationHours: payload.durationHours,
      });
      window.dispatchEvent(new Event("reportsUpdated"));
      fetchReports();
    } catch (err: unknown) {
      fetchReports();
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
        : "";
      toast.error(errorMsg || "Failed to submit moderation decision");
    }
  };

  const handleConfirmIgnore = async () => {
    if (!selectedReportForIgnore) return;
    const targetId = selectedReportForIgnore.id;
    try {
      setReports((prev) => prev.filter((r) => r.id !== targetId));
      setTotalReports((prev) => Math.max(0, prev - 1));
      setIgnoreModalOpen(false);
      setSelectedReportForIgnore(null);
      await axiosInstance.put(`/api/admin/reports/${targetId}`, { status: "rejected", action: "keep_content" });
      window.dispatchEvent(new Event("reportsUpdated"));
      fetchReports();
    } catch (err: unknown) {
      fetchReports();
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
        : "";
      toast.error(errorMsg || "Failed to ignore report");
    }
  };

  const handleConfirmIgnoreAll = async () => {
    try {
      const pendingCount = reports.filter((r) => r.status === "pending").length;
      setReports((prev) => prev.filter((r) => r.status !== "pending"));
      setTotalReports((prev) => Math.max(0, prev - pendingCount));
      setIgnoreAllModalOpen(false);
      await axiosInstance.put("/api/admin/reports", { action: "ignore_all_pending" });
      window.dispatchEvent(new Event("reportsUpdated"));
      fetchReports();
    } catch (err: unknown) {
      fetchReports();
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
        : "";
      toast.error(errorMsg || "Failed to ignore all pending reports");
    }
  };

  const handleConfirmDeleteRecord = async () => {
    if (!selectedReportIdForDelete) return;
    const targetId = selectedReportIdForDelete;
    try {
      setReports((prev) => prev.filter((r) => r.id !== targetId));
      setTotalReports((prev) => Math.max(0, prev - 1));
      setDeleteModalOpen(false);
      setSelectedReportIdForDelete(null);
      await axiosInstance.delete(`/api/admin/reports/${targetId}`);
      window.dispatchEvent(new Event("reportsUpdated"));
      fetchReports();
    } catch (err: unknown) {
      fetchReports();
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
        : "";
      toast.error(errorMsg || "Failed to delete report record");
    }
  };

  const statusTabs = [
    { label: "Pending", value: "pending", color: "text-orange-400", activeBg: "bg-orange-500", dot: "bg-orange-500" },
    { label: "Resolved", value: "resolved", color: "text-green-400", activeBg: "bg-green-500", dot: "bg-green-500" },
    { label: "Rejected", value: "rejected", color: "text-slate-400", activeBg: "bg-slate-500", dot: "bg-slate-500" },
  ];

  const typeFilters = [
    { label: "All", value: "" },
    { label: "Posts", value: "Post" },
    { label: "Comments", value: "Comment" },
    { label: "Users", value: "User" },
    { label: "Communities", value: "Community" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Moderation Queue</h1>
          <p className="text-[11px] text-white/30 mt-1">
            <span className="font-semibold text-white/50">{totalReports}</span> reports · Review community reports and enforce guidelines
          </p>
        </div>
        {status === "pending" && reports.some((r) => r.status === "pending") && (
          <button
            onClick={() => setIgnoreAllModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/4 border border-white/8 text-white/50 hover:text-orange-400 hover:border-orange-500/30 hover:bg-orange-500/6 text-xs font-semibold transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Dismiss All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/7 bg-[#111318] p-4 space-y-3">
        {/* Status tabs */}
        <div className="flex items-center gap-1 p-1 bg-white/3 rounded-xl w-fit">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
                ${status === tab.value
                  ? `${tab.activeBg} text-white shadow-sm`
                  : "text-white/40 hover:text-white/70"
                }
              `}
            >
              {status === tab.value && <span className={`w-1.5 h-1.5 rounded-full bg-white/60`} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Type filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider mr-1">Type:</span>
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setTargetType(f.value); setPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer
                ${targetType === f.value
                  ? "bg-[#14b8a6]/10 border border-[#14b8a6]/30 text-[#14b8a6]"
                  : "bg-white/3 border border-white/6 text-white/35 hover:text-white/60"
                }
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Report Cards */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/4 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-white/7 bg-[#111318] p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/4 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xs text-white/30">
            {status === "pending" ? "Moderation queue is clear! 🎉" : "No reports found."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reports.map((report) => {
            const colors = typeColors[report.targetType] ?? typeColors.Post;
            return (
              <div
                key={report.id}
                className={`rounded-2xl border border-white/7 border-l-2 ${colors.border} ${colors.bg} p-4 flex items-start justify-between gap-4 hover:border-white/12 transition-all group`}
              >
                {/* Content */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${colors.accent} ${colors.text} border-current/20`}>
                      {report.targetType}
                    </span>
                    <AdminBadge type={report.status} />
                    <span className="text-[9px] text-white/25 ml-auto">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-white/80 leading-relaxed line-clamp-2">
                    {report.contentPreview}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-white/30 flex-wrap">
                    <span>
                      Author:{" "}
                      {report.author?.username ? (
                        <Link href={`/admin/users?search=${report.author.username}`} className="text-[#14b8a6] hover:text-[#2dd4bf] font-medium transition-colors">
                          @{report.author.username}
                        </Link>
                      ) : "deleted"}
                    </span>
                    <span className="text-white/10">·</span>
                    <span>
                      Reporter:{" "}
                      {report.reporter?.username ? (
                        <Link href={`/admin/users?search=${report.reporter.username}`} className="text-white/50 hover:text-white/80 font-medium transition-colors">
                          @{report.reporter.username}
                        </Link>
                      ) : "deleted"}
                    </span>
                    <span className="text-white/10">·</span>
                    <span className="italic">&ldquo;{report.reason}&rdquo;</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {report.status === "pending" ? (
                    <>
                      <button
                        onClick={() => { setSelectedReport(report); setActionModalOpen(true); }}
                        className="px-3 py-1.5 rounded-lg bg-[#f97316] hover:bg-[#ea6a05] text-white text-[11px] font-semibold transition-all cursor-pointer shadow-sm shadow-[#f97316]/20"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => { setSelectedReportForIgnore(report); setIgnoreModalOpen(true); }}
                        className="px-3 py-1.5 rounded-lg bg-white/4 border border-white/8 text-white/40 hover:text-white/70 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        Ignore
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { setSelectedReportIdForDelete(report.id); setDeleteModalOpen(true); }}
                      className="px-3 py-1.5 rounded-lg bg-red-500/6 border border-red-500/20 text-red-400 hover:bg-red-500/12 text-[11px] font-semibold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-1">
          <span className="text-[10px] text-white/25">{totalReports} total · Page {page} of {totalPages}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/6 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pg = page <= 3 ? i + 1 : page + i - 2;
              if (pg < 1 || pg > totalPages) return null;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all cursor-pointer
                    ${page === pg ? "bg-[#f97316] text-white" : "text-white/40 hover:text-white hover:bg-white/6"}
                  `}
                >
                  {pg}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/6 disabled:opacity-25 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Moderation Action Modal */}
      <ModerationActionModal
        key={selectedReport?.id || "none"}
        isOpen={actionModalOpen}
        report={selectedReport}
        onClose={() => { setActionModalOpen(false); setSelectedReport(null); }}
        onConfirm={handleConfirmAction}
      />

      <ConfirmModal
        isOpen={ignoreModalOpen}
        title="Ignore Report"
        message="Are you sure you want to ignore this report? The content will be kept and the report marked as rejected."
        confirmText="Ignore Report"
        onConfirm={handleConfirmIgnore}
        onCancel={() => { setIgnoreModalOpen(false); setSelectedReportForIgnore(null); }}
        isDanger={false}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Report Record"
        message="Are you sure you want to permanently remove this report record from the moderation history?"
        confirmText="Delete Record"
        onConfirm={handleConfirmDeleteRecord}
        onCancel={() => { setDeleteModalOpen(false); setSelectedReportIdForDelete(null); }}
        isDanger={true}
      />

      <ConfirmModal
        isOpen={ignoreAllModalOpen}
        title="Dismiss All Pending"
        message="This will reject all pending reports and clear the queue. This action cannot be undone."
        confirmText="Dismiss All"
        onConfirm={handleConfirmIgnoreAll}
        onCancel={() => setIgnoreAllModalOpen(false)}
        isDanger={true}
      />
    </div>
  );
}

// ─── Moderation Action Modal ───────────────────────────────────────────────────

interface ModerationActionModalProps {
  isOpen: boolean;
  report: ReportItem | null;
  onClose: () => void;
  onConfirm: (payload: { action: string; warningMessage: string; durationHours?: number }) => Promise<void>;
}

const ModerationActionModal: React.FC<ModerationActionModalProps> = ({ isOpen, report, onClose, onConfirm }) => {
  const [action, setAction] = useState<string>(() => {
    if (!report) return "";
    return report.targetType === "Post" || report.targetType === "Comment" ? "delete_content" : "warn";
  });
  const [warningMessage, setWarningMessage] = useState(() => {
    if (!report) return "";
    return report.targetType === "Post" || report.targetType === "Comment"
      ? `Your ${report.targetType.toLowerCase()} was removed for violating community guidelines. Reason: ${report.reason}`
      : `You are receiving a warning regarding community guidelines. Reason: ${report.reason}`;
  });
  const [durationHours, setDurationHours] = useState<number>(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleActionChange = (newAction: string) => {
    setAction(newAction);
    if (!report) return;
    if (report.targetType === "Post" || report.targetType === "Comment") {
      if (newAction === "delete_content") setWarningMessage(`Your ${report.targetType.toLowerCase()} was removed for violating community guidelines. Reason: ${report.reason}`);
      else if (newAction === "keep_content") setWarningMessage("");
    } else {
      const targetLabel = report.targetType === "User" ? "account" : "community";
      if (newAction === "warn") setWarningMessage(`You are receiving a warning regarding community guidelines. Reason: ${report.reason}`);
      else if (newAction === "ban_temporary") setWarningMessage(`Your ${targetLabel} has been temporarily suspended for ${durationHours / 24} days for violating community guidelines. Reason: ${report.reason}`);
      else if (newAction === "ban_permanent") setWarningMessage(`Your ${targetLabel} has been permanently banned for violating community guidelines. Reason: ${report.reason}`);
      else if (newAction === "keep_content") setWarningMessage("");
    }
  };

  const handleDurationChange = (hours: number) => {
    setDurationHours(hours);
    if (!report) return;
    const targetLabel = report.targetType === "User" ? "account" : "community";
    if (action === "ban_temporary") setWarningMessage(`Your ${targetLabel} has been temporarily suspended for ${hours / 24} days for violating community guidelines. Reason: ${report.reason}`);
  };

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm({ action, warningMessage, durationHours: action === "ban_temporary" ? durationHours : undefined });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPostOrComment = report.targetType === "Post" || report.targetType === "Comment";
  const colors = typeColors[report.targetType] ?? typeColors.Post;

  const actionOptions = isPostOrComment ? [
    { value: "delete_content", label: "Delete Content & Warn", icon: "🗑️", color: "border-red-500/40 bg-red-500/10 text-red-300" },
    { value: "keep_content", label: "Keep Content (Dismiss)", icon: "✅", color: "border-green-500/40 bg-green-500/10 text-green-300" },
  ] : [
    { value: "warn", label: "Send Warning Only", icon: "⚠️", color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300" },
    { value: "ban_temporary", label: "Temporary Ban", icon: "⏸️", color: "border-orange-500/40 bg-orange-500/10 text-orange-300" },
    { value: "ban_permanent", label: "Permanent Ban", icon: "🚫", color: "border-red-500/40 bg-red-500/10 text-red-300" },
    { value: "keep_content", label: "Dismiss Report", icon: "✅", color: "border-green-500/40 bg-green-500/10 text-green-300" },
  ];

  const submitBtnColor = action === "keep_content"
    ? "bg-green-500 hover:bg-green-600 shadow-green-500/20"
    : action === "delete_content" || action === "ban_permanent"
    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
    : "bg-[#f97316] hover:bg-[#ea6a05] shadow-[#f97316]/20";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/8 bg-[#111318] p-6 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Glow blobs */}
        <div className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15 ${colors.accent}`} />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#14b8a6]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${colors.accent} ${colors.text} border-current/20`}>
              {report.targetType}
            </span>
            <h3 className="text-sm font-bold text-white">Resolve Report</h3>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/6 transition-all cursor-pointer">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Content Preview */}
          <div className="p-3.5 bg-white/3 border border-white/6 rounded-xl">
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-1.5">Report Reason</p>
            <p className="text-[11px] text-white/50 italic">&ldquo;{report.reason}&rdquo;</p>
            <div className="mt-2 pt-2 border-t border-white/6">
              <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-1.5">Content Preview</p>
              <p className="text-xs text-white/70 leading-relaxed line-clamp-3">{report.contentPreview}</p>
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-2">Select Action</p>
            <div className="grid grid-cols-2 gap-2">
              {actionOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleActionChange(opt.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold text-left transition-all cursor-pointer
                    ${action === opt.value ? opt.color : "border-white/7 bg-white/2 text-white/40 hover:border-white/12 hover:text-white/60"}
                  `}
                >
                  <span>{opt.icon}</span>
                  <span className="leading-tight">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Duration (temp ban only) */}
          {action === "ban_temporary" && (
            <div>
              <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-2">Ban Duration</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[{ label: "1 Day", hours: 24 }, { label: "3 Days", hours: 72 }, { label: "7 Days", hours: 168 }, { label: "30 Days", hours: 720 }].map((dur) => (
                  <button
                    key={dur.hours}
                    type="button"
                    onClick={() => handleDurationChange(dur.hours)}
                    className={`py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border text-center
                      ${durationHours === dur.hours
                        ? "border-[#f97316]/40 bg-[#f97316]/10 text-[#f97316]"
                        : "border-white/7 bg-white/2 text-white/35 hover:border-white/12"
                      }
                    `}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message */}
          {action !== "keep_content" && (
            <div>
              <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider mb-1.5">Warning Message to User</p>
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Type a message to send to the user..."
                className="w-full min-h-[80px] px-3.5 py-3 bg-white/4 border border-white/8 rounded-xl text-xs text-white/70 focus:outline-none focus:border-[#f97316]/40 placeholder-white/20 leading-relaxed transition-all resize-none"
                required
              />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/6">
            <button type="button" onClick={onClose} disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/6 transition-all cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer flex items-center gap-1.5 ${submitBtnColor}`}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : "Submit Decision"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
