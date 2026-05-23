"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface ReportItem {
  id: string;
  targetId: string | null;
  targetType: "Post" | "Comment";
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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [modAction, setModAction] = useState<"delete_content" | "keep_content" | "reject">("keep_content");

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
    fetchReports();
  }, [fetchReports]);

  const handleActionClick = (report: ReportItem, action: "delete_content" | "keep_content" | "reject") => {
    setSelectedReport(report);
    setModAction(action);
    setConfirmModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedReport) return;
    try {
      const nextStatus = modAction === "reject" ? "rejected" : "resolved";
      await axiosInstance.put(`/api/admin/reports/${selectedReport.id}`, {
        status: nextStatus,
        action: modAction,
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
            Author: @{row.author?.username || "deleted"}
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
            Reporter: @{row.reporter?.username || "deleted"}
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
                onClick={() => handleActionClick(row, "delete_content")}
                className="px-2 py-1 rounded bg-spicy-paprika text-floral-white text-3xs font-black uppercase shadow-xs hover:bg-spicy-paprika/80 cursor-pointer"
              >
                Delete Content
              </button>
              <button
                onClick={() => handleActionClick(row, "keep_content")}
                className="px-2 py-1 rounded bg-green-600 text-floral-white text-3xs font-black uppercase shadow-xs hover:bg-green-600/80 cursor-pointer"
              >
                Keep Content
              </button>
              <button
                onClick={() => handleActionClick(row, "reject")}
                className="px-2 py-1 rounded bg-white/5 border border-stormy-teal/20 text-dust-grey hover:text-floral-white text-3xs font-bold uppercase transition-all cursor-pointer"
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

      {/* Action Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        title={
          modAction === "delete_content"
            ? "Delete Reported Content"
            : modAction === "keep_content"
            ? "Approve Content & Dismiss Reports"
            : "Reject Report"
        }
        message={
          modAction === "delete_content"
            ? `Are you sure you want to resolve this report by hard-deleting the reported ${selectedReport?.targetType.toLowerCase()}? This will also auto-resolve any other pending reports for this exact content.`
            : modAction === "keep_content"
            ? `Are you sure you want to dismiss the reports for this content and mark them as resolved? The content will remain active on the platform.`
            : `Are you sure you want to reject this report? This marks the report as rejected without making any changes to the content.`
        }
        confirmText={
          modAction === "delete_content"
            ? "Hard Delete Content"
            : modAction === "keep_content"
            ? "Dismiss & Resolve"
            : "Reject Report"
        }
        onConfirm={handleConfirmAction}
        onCancel={() => {
          setConfirmModalOpen(false);
          setSelectedReport(null);
        }}
        isDanger={modAction === "delete_content"}
      />
    </div>
  );
}
