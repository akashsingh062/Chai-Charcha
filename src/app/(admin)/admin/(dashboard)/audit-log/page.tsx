"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import Link from "next/link";

interface AuditLogItem {
  id: string;
  admin?: {
    name: string;
    username: string;
    email: string;
  };
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown>;
  createdAt: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  // Inspector state
  const [inspectedLog, setInspectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/audit-log", {
        params: {
          page,
          limit: 15,
          action,
          targetType,
        },
      });
      setLogs(res.data.auditLogs || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalLogs(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  }, [page, action, targetType]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLogs();
  }, [fetchLogs]);

  const columns = [
    {
      key: "action",
      label: "Action",
      render: (row: AuditLogItem) => (
        <span className="font-extrabold text-floral-white uppercase tracking-wider">
          {row.action.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "admin",
      label: "Admin User",
      render: (row: AuditLogItem) => (
        <div className="min-w-0">
          <span className="font-bold text-floral-white block truncate">
            {row.admin?.name || "System / Script"}
          </span>
          <span className="text-3xs text-dust-grey/60 block truncate">
            {row.admin?.username ? (
              <Link
                href={`/admin/users?search=${row.admin.username}`}
                className="text-stormy-teal hover:text-vivid-tangerine hover:underline font-bold"
              >
                @{row.admin.username}
              </Link>
            ) : (
              "system"
            )}
          </span>
        </div>
      ),
    },
    {
      key: "target",
      label: "Target Entity",
      render: (row: AuditLogItem) => (
        <div className="min-w-0">
          <span className="text-2xs font-bold text-stormy-teal block">
            {row.targetType}
          </span>
          {row.targetId && (
            <span className="font-mono text-4xs text-dust-grey/50 block truncate">
              ID: {row.targetId}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Timestamp",
      render: (row: AuditLogItem) => (
        <span className="text-2xs font-semibold text-dust-grey/80">
          {new Date(row.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Details",
      render: (row: AuditLogItem) => (
        <button
          onClick={() => setInspectedLog(row)}
          className="px-2.5 py-1 rounded bg-stormy-teal/10 hover:bg-stormy-teal/20 text-stormy-teal border border-stormy-teal/20 text-3xs font-bold uppercase transition-all cursor-pointer"
        >
          Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">Audit Log</h1>
        <p className="text-[11px] text-white/30 mt-1">
          <span className="font-semibold text-white/50">{totalLogs.toLocaleString()}</span> historical admin actions
        </p>
      </div>

      {/* Filters bar */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 flex items-center gap-3 flex-wrap">
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white/60 focus:outline-none focus:border-[#f97316]/40 transition-all"
          >
            <option value="">All Actions</option>
            <option value="ban_user">Ban User</option>
            <option value="unban_user">Unban User</option>
            <option value="update_user">Update User</option>
            <option value="delete_user">Delete User</option>
            <option value="update_post">Update Post</option>
            <option value="soft_delete_post">Soft Delete Post</option>
            <option value="restore_post">Restore Post</option>
            <option value="delete_post">Delete Post</option>
            <option value="update_comment">Update Comment</option>
            <option value="delete_comment">Delete Comment</option>
            <option value="update_community">Update Community</option>
            <option value="delete_community">Delete Community</option>
            <option value="resolve_report">Resolve Report</option>
            <option value="reject_report">Reject Report</option>
            <option value="broadcast_notification">Broadcast Announcement</option>
          </select>
          <select
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white/60 focus:outline-none focus:border-[#f97316]/40 transition-all"
          >
            <option value="">All Entities</option>
            <option value="User">Users</option>
            <option value="Post">Posts</option>
            <option value="Comment">Comments</option>
            <option value="Community">Communities</option>
            <option value="Report">Reports</option>
            <option value="Notification">Notifications</option>
          </select>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        pagination={{ page, limit: 15, total: totalLogs, totalPages }}
        onPageChange={setPage}
        emptyMessage="No security audit log entries found"
      />

      {/* Log Details Inspector Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#111318] p-6 shadow-2xl overflow-hidden">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#14b8a6]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-white">Audit Entry Details</h3>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-white/25">ID: {inspectedLog.id}</span>
                <button
                  onClick={() => setInspectedLog(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1">Action</span>
                  <span className="text-xs font-bold text-white uppercase">{inspectedLog.action}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1">Admin</span>
                  <span className="text-xs text-white">{inspectedLog.admin?.name || "System"} (@{inspectedLog.admin?.username || "system"})</span>
                </div>
              </div>
              <div>
                <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-2">Metadata Payload</span>
                <pre className="p-4 bg-black/40 border border-white/[0.06] rounded-xl font-mono text-[11px] text-green-400 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(inspectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
