"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import Link from "next/link";

interface ReportItem {
  id: string;
  targetId: string | null;
  targetType: "Post" | "Comment" | "User" | "Community";
  reason: string;
  status: "pending" | "resolved" | "rejected";
  contentPreview: string;
  isContentDeleted: boolean;
  reporter?: {
    name: string;
    username: string;
  };
  author?: {
    name: string;
    username: string;
  };
  createdAt: string;
}

export default function ModerationQueuePage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("pending");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);

  // Modal actions
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/reports", {
        params: {
          page,
          limit: 15,
          status,
          targetType: targetType || undefined,
        },
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

  const handleActionClick = (report: ReportItem) => {
    setSelectedReport(report);
    setActionModalOpen(true);
  };

  const handleConfirmAction = async (payload: { action: string; warningMessage: string; durationHours?: number }) => {
    if (!selectedReport) return;
    try {
      const nextStatus = payload.action === "reject" ? "rejected" : "resolved";
      await axiosInstance.put(`/api/admin/reports/${selectedReport.id}`, {
        status: nextStatus,
        action: payload.action,
        warningMessage: payload.warningMessage,
        durationHours: payload.durationHours,
      });
      fetchReports();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      alert(errorMsg || "Failed to submit moderation decision");
    }
  };

  const handleIgnoreClick = async (report: ReportItem) => {
    if (!confirm("Are you sure you want to ignore this report? It will be marked as rejected.")) return;
    try {
      await axiosInstance.put(`/api/admin/reports/${report.id}`, {
        status: "rejected",
        action: "keep_content",
      });
      fetchReports();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      alert(errorMsg || "Failed to ignore report");
    }
  };

  const handleDeleteRecord = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report record?")) return;
    try {
      const res = await axiosInstance.delete(`/api/admin/reports/${reportId}`);
      if (res.status === 200) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        setTotalReports((prev) => prev - 1);
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      alert(errorMsg || "Failed to delete report record");
    }
  };

  const columns = [
    {
      key: "target",
      label: "Reported Content",
      render: (row: ReportItem) => (
        <div className="min-w-0 max-w-sm">
          <span className="text-3xs uppercase font-extrabold tracking-widest text-stormy-teal block mb-1">
            {row.targetType} Content
          </span>
          <p className="font-bold text-floral-white leading-relaxed line-clamp-2">
            {row.contentPreview}
          </p>
          <span className="text-4xs text-dust-grey/50 uppercase tracking-wider block mt-1">
            Author:{" "}
            {row.author?.username ? (
              <Link
                href={`/admin/users?search=${row.author.username}`}
                className="text-stormy-teal hover:text-vivid-tangerine hover:underline font-bold"
              >
                @{row.author.username}
              </Link>
            ) : (
              "deleted"
            )}
          </span>
        </div>
      ),
    },
    {
      key: "reason",
      label: "Reason for Report",
      render: (row: ReportItem) => (
        <div className="min-w-0 max-w-xs">
          <p className="text-xs text-dust-grey font-medium leading-relaxed italic">
            &ldquo;{row.reason}&rdquo;
          </p>
          <span className="text-4xs text-dust-grey/50 uppercase tracking-wider block mt-1">
            Reporter:{" "}
            {row.reporter?.username ? (
              <Link
                href={`/admin/users?search=${row.reporter.username}`}
                className="text-stormy-teal hover:text-vivid-tangerine hover:underline font-bold"
              >
                @{row.reporter.username}
              </Link>
            ) : (
              "deleted"
            )}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: ReportItem) => (
        <AdminBadge type={row.status} />
      ),
    },
    {
      key: "createdAt",
      label: "Report Date",
      render: (row: ReportItem) => (
        <span className="text-2xs font-semibold text-dust-grey/80">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: ReportItem) => (
        <div className="flex items-center gap-2">
          {row.status === "pending" ? (
            <>
              <button
                onClick={() => handleActionClick(row)}
                className="px-2.5 py-1 rounded bg-orange hover:bg-orange/80 text-ink-black text-3xs font-black uppercase shadow-xs cursor-pointer transition-all"
              >
                Resolve
              </button>
              <button
                onClick={() => handleIgnoreClick(row)}
                className="px-2.5 py-1 rounded bg-white/5 border border-stormy-teal/20 text-dust-grey hover:text-floral-white text-3xs font-bold uppercase transition-all cursor-pointer"
              >
                Ignore
              </button>
            </>
          ) : (
            <button
              onClick={() => handleDeleteRecord(row.id)}
              className="px-2 py-1 rounded bg-white/5 border border-spicy-paprika/20 text-spicy-paprika hover:text-floral-white text-3xs font-bold uppercase transition-all cursor-pointer"
            >
              Clear Log
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-floral-white tracking-tight uppercase">
          Moderation Queue
        </h1>
        <p className="text-xs text-dust-grey font-bold uppercase tracking-wider mt-1">
          Review community reports and enforce guidelines ({totalReports} total)
        </p>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-stormy-teal/10 bg-ink-black/30 rounded-2xl">
        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Status
          </label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
          >
            <option value="pending">Pending Review</option>
            <option value="resolved">Resolved Reports</option>
            <option value="rejected">Rejected Reports</option>
          </select>
        </div>

        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Target Type
          </label>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
          >
            <option value="">All Types</option>
            <option value="Post">Posts</option>
            <option value="Comment">Comments</option>
            <option value="User">Users</option>
            <option value="Community">Communities</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={reports}
        isLoading={loading}
        pagination={{ page, limit: 15, total: totalReports, totalPages }}
        onPageChange={setPage}
        emptyMessage="Moderation queue is clean! No reports found."
      />

      {/* Moderation Action Modal */}
      <ModerationActionModal
        isOpen={actionModalOpen}
        report={selectedReport}
        onClose={() => {
          setActionModalOpen(false);
          setSelectedReport(null);
        }}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}

interface ModerationActionModalProps {
  isOpen: boolean;
  report: ReportItem | null;
  onClose: () => void;
  onConfirm: (payload: { action: string; warningMessage: string; durationHours?: number }) => Promise<void>;
}

const ModerationActionModal: React.FC<ModerationActionModalProps> = ({
  isOpen,
  report,
  onClose,
  onConfirm,
}) => {
  const [action, setAction] = useState<string>("");
  const [warningMessage, setWarningMessage] = useState("");
  const [durationHours, setDurationHours] = useState<number>(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default action and warning message when report changes
  useEffect(() => {
    if (report) {
      if (report.targetType === "Post" || report.targetType === "Comment") {
        setAction("delete_content");
        setWarningMessage(
          `Your ${report.targetType.toLowerCase()} was removed for violating community guidelines. Reason: ${report.reason}`
        );
      } else {
        setAction("warn");
        setWarningMessage(
          `You are receiving a warning regarding community guidelines. Reason: ${report.reason}`
        );
      }
      setDurationHours(24);
    }
  }, [report]);

  // Update default warning message when action changes
  const handleActionChange = (newAction: string) => {
    setAction(newAction);
    if (!report) return;

    if (report.targetType === "Post" || report.targetType === "Comment") {
      if (newAction === "delete_content") {
        setWarningMessage(
          `Your ${report.targetType.toLowerCase()} was removed for violating community guidelines. Reason: ${report.reason}`
        );
      } else if (newAction === "keep_content") {
        setWarningMessage(""); // No warning if keeping content
      }
    } else {
      const targetLabel = report.targetType === "User" ? "account" : "community";
      if (newAction === "warn") {
        setWarningMessage(
          `You are receiving a warning regarding community guidelines. Reason: ${report.reason}`
        );
      } else if (newAction === "ban_temporary") {
        setWarningMessage(
          `Your ${targetLabel} has been temporarily suspended for ${durationHours / 24} days for violating community guidelines. Reason: ${report.reason}`
        );
      } else if (newAction === "ban_permanent") {
        setWarningMessage(
          `Your ${targetLabel} has been permanently banned for violating community guidelines. Reason: ${report.reason}`
        );
      } else if (newAction === "keep_content") {
        setWarningMessage("");
      }
    }
  };

  // Update warning message when duration changes
  const handleDurationChange = (hours: number) => {
    setDurationHours(hours);
    if (!report) return;
    const targetLabel = report.targetType === "User" ? "account" : "community";
    if (action === "ban_temporary") {
      setWarningMessage(
        `Your ${targetLabel} has been temporarily suspended for ${hours / 24} days for violating community guidelines. Reason: ${report.reason}`
      );
    }
  };

  if (!isOpen || !report) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm({
        action,
        warningMessage,
        durationHours: action === "ban_temporary" ? durationHours : undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPostOrComment = report.targetType === "Post" || report.targetType === "Comment";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg rounded-3xl border border-stormy-teal/20 bg-ink-black p-7 shadow-2xl backdrop-blur-md pointer-events-auto overflow-hidden relative">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-spicy-paprika/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 border-b border-stormy-teal/10 pb-4 mb-5">
          <div className={`p-2.5 rounded-2xl shrink-0 ${isPostOrComment ? 'bg-spicy-paprika/10 text-spicy-paprika border border-spicy-paprika/20' : 'bg-orange/10 text-orange border border-orange/20'}`}>
            {isPostOrComment ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-floral-white uppercase tracking-wider">
              Resolve Reported {report.targetType}
            </h3>
            <p className="text-3xs text-dust-grey/70 uppercase tracking-widest font-extrabold mt-0.5">
              Reason: &ldquo;{report.reason}&rdquo;
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Content Preview */}
          <div className="p-4 bg-ink-black/40 border border-stormy-teal/10 rounded-2xl">
            <span className="text-4xs uppercase tracking-widest font-black text-stormy-teal block mb-1">
              Content Preview
            </span>
            <p className="text-xs text-dust-grey leading-relaxed line-clamp-3 italic">
              {report.contentPreview}
            </p>
          </div>

          {/* Action Choice */}
          <div>
            <label className="text-3xs uppercase tracking-widest font-extrabold text-stormy-teal block mb-2">
              Select Moderation Action
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {isPostOrComment ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleActionChange("delete_content")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      action === "delete_content"
                        ? "border-spicy-paprika bg-spicy-paprika/10 text-floral-white"
                        : "border-stormy-teal/10 bg-white/3 text-dust-grey hover:border-stormy-teal/30"
                    }`}
                  >
                    <span>Delete Content & Warn User</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${action === "delete_content" ? 'bg-spicy-paprika' : 'bg-transparent border border-dust-grey'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionChange("keep_content")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      action === "keep_content"
                        ? "border-green-600 bg-green-600/10 text-floral-white"
                        : "border-stormy-teal/10 bg-white/3 text-dust-grey hover:border-stormy-teal/30"
                    }`}
                  >
                    <span>Keep Content (Dismiss)</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${action === "keep_content" ? 'bg-green-600' : 'bg-transparent border border-dust-grey'}`} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleActionChange("warn")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      action === "warn"
                        ? "border-orange bg-orange/10 text-floral-white"
                        : "border-stormy-teal/10 bg-white/3 text-dust-grey hover:border-stormy-teal/30"
                    }`}
                  >
                    <span>Send Warning Only</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${action === "warn" ? 'bg-orange' : 'bg-transparent border border-dust-grey'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionChange("ban_temporary")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      action === "ban_temporary"
                        ? "border-orange/80 bg-orange/5 text-floral-white"
                        : "border-stormy-teal/10 bg-white/3 text-dust-grey hover:border-stormy-teal/30"
                    }`}
                  >
                    <span>Temporary Ban</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${action === "ban_temporary" ? 'bg-orange' : 'bg-transparent border border-dust-grey'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionChange("ban_permanent")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      action === "ban_permanent"
                        ? "border-spicy-paprika bg-spicy-paprika/10 text-floral-white"
                        : "border-stormy-teal/10 bg-white/3 text-dust-grey hover:border-stormy-teal/30"
                    }`}
                  >
                    <span>Permanent Ban</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${action === "ban_permanent" ? 'bg-spicy-paprika' : 'bg-transparent border border-dust-grey'}`} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleActionChange("keep_content")}
                    className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      action === "keep_content"
                        ? "border-green-600 bg-green-600/10 text-floral-white"
                        : "border-stormy-teal/10 bg-white/3 text-dust-grey hover:border-stormy-teal/30"
                    }`}
                  >
                    <span>Keep Content (Dismiss)</span>
                    <span className={`w-2.5 h-2.5 rounded-full ${action === "keep_content" ? 'bg-green-600' : 'bg-transparent border border-dust-grey'}`} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Temp Ban Expiration duration selector */}
          {action === "ban_temporary" && (
            <div className="animate-fade-in">
              <label className="text-3xs uppercase tracking-widest font-extrabold text-stormy-teal block mb-2">
                Ban Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: "1 Day", hours: 24 },
                  { label: "3 Days", hours: 72 },
                  { label: "7 Days", hours: 168 },
                  { label: "30 Days", hours: 720 },
                ].map((dur) => (
                  <button
                    key={dur.hours}
                    type="button"
                    onClick={() => handleDurationChange(dur.hours)}
                    className={`py-2 px-1 rounded-xl text-3xs uppercase font-extrabold border text-center transition-all cursor-pointer ${
                      durationHours === dur.hours
                        ? "border-vivid-tangerine bg-vivid-tangerine/10 text-floral-white"
                        : "border-stormy-teal/10 bg-white/3 text-dust-grey hover:border-stormy-teal/20"
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warning Message text field */}
          {action !== "keep_content" && (
            <div className="animate-fade-in">
              <label className="text-3xs uppercase tracking-widest font-extrabold text-stormy-teal block mb-1.5">
                Warning Message (Sent to User)
              </label>
              <textarea
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                placeholder="Type a warning explanation to the user..."
                className="w-full min-h-[90px] px-3.5 py-3 bg-ink-black border border-stormy-teal/20 rounded-2xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine placeholder:text-dust-grey/30 leading-relaxed"
                required
              />
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-stormy-teal/10 pt-5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-bold text-dust-grey hover:bg-white/5 cursor-pointer transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-floral-white shadow-md cursor-pointer transition-all flex items-center gap-1.5 ${
                action === "keep_content"
                  ? "bg-green-600 hover:bg-green-600/80"
                  : action === "delete_content" || action === "ban_permanent"
                  ? "bg-spicy-paprika hover:bg-spicy-paprika/80"
                  : "bg-orange hover:bg-orange/80"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-1.5 h-3.5 w-3.5 text-floral-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Submit Decision</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
