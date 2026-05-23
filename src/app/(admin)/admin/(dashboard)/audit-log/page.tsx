"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";

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
            @{row.admin?.username || "system"}
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
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-floral-white tracking-tight uppercase">
          Security Audit Log
        </h1>
        <p className="text-xs text-dust-grey font-bold uppercase tracking-wider mt-1">
          Historical log of administrative actions ({totalLogs} entries)
        </p>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border border-stormy-teal/10 bg-ink-black/30 rounded-2xl">
        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Action Type
          </label>
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
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
        </div>

        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Target Entity
          </label>
          <select
            value={targetType}
            onChange={(e) => {
              setTargetType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-stormy-teal/20 bg-ink-black p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-floral-white uppercase tracking-wider mb-4 border-b border-stormy-teal/10 pb-2 flex justify-between items-center">
              <span>Inspect Audit Entry Details</span>
              <span className="text-3xs font-extrabold uppercase tracking-widest text-vivid-tangerine">
                ID: {inspectedLog.id}
              </span>
            </h3>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-dust-grey/80">
                <div>
                  <span className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Action executed
                  </span>
                  <span className="text-floral-white uppercase font-black">{inspectedLog.action}</span>
                </div>
                <div>
                  <span className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Admin Operator
                  </span>
                  <span className="text-floral-white">{inspectedLog.admin?.name || "System"} (@{inspectedLog.admin?.username || "system"})</span>
                </div>
              </div>

              <div>
                <span className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Metadata Payload (Details)
                </span>
                <pre className="p-4 bg-black/40 border border-stormy-teal/10 rounded-xl font-mono text-2xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(inspectedLog.details || {}, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-stormy-teal/10 pt-4 mt-6">
              <button
                type="button"
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 rounded-xl bg-stormy-teal hover:bg-stormy-teal/80 text-floral-white font-extrabold uppercase tracking-wider text-2xs cursor-pointer"
              >
                Dismiss Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
