"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import Link from "next/link";
import { toast } from "@/store/useToastStore";

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

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-2xl bg-[#111318] border border-white/6 hover:border-white/12 hover:bg-white/2 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
        {icon && <div className="text-white/20 group-hover:text-white/40 transition-colors duration-300">{icon}</div>}
      </div>
      <span className={`text-xl font-black tabular-nums leading-none tracking-tight ${color || "text-white"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
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

  const handleCopyPayload = (payload: unknown) => {
    if (!payload) return;
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    toast.success("Payload copied to clipboard");
  };

  const getActionPulse = (act: string) => {
    const norm = act.toLowerCase();
    if (norm.includes("ban") || norm.includes("delete") || norm.includes("reject")) {
      return (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      );
    }
    if (norm.includes("unban") || norm.includes("restore") || norm.includes("resolve")) {
      return (
        <span className="relative flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      );
    }
    return (
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14b8a6]"></span>
      </span>
    );
  };

  const columns = [
    {
      key: "action",
      label: "Action",
      render: (row: AuditLogItem) => (
        <div className="flex items-center gap-2">
          {getActionPulse(row.action)}
          <span className="font-bold text-white/95 uppercase tracking-wider text-[10px]">
            {row.action.replace(/_/g, " ")}
          </span>
        </div>
      ),
    },
    {
      key: "admin",
      label: "Admin User",
      render: (row: AuditLogItem) => (
        <div className="min-w-0">
          <span className="font-bold text-white/90 block truncate">
            {row.admin?.name || "System Operations"}
          </span>
          <span className="text-[10px] text-white/35 block truncate">
            {row.admin?.username ? (
              <Link
                href={`/admin/users?search=${row.admin.username}`}
                className="text-stormy-teal hover:text-orange-400 font-semibold transition-colors"
              >
                @{row.admin.username}
              </Link>
            ) : (
              "automated daemon"
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
          <span className="text-[10px] font-bold text-stormy-teal block uppercase tracking-wider">
            {row.targetType}
          </span>
          {row.targetId && (
            <span className="font-mono text-[9px] text-white/20 block truncate">
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
        <span className="text-[10px] text-white/30 font-semibold">
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
          className="px-2.5 py-1 rounded-lg bg-stormy-teal/10 hover:bg-stormy-teal/20 text-stormy-teal border border-stormy-teal/20 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Inspect
        </button>
      ),
    },
  ];

  // Dynamic Calculated Statistics
  const adminOps = logs.filter(l => l.admin?.username).length;
  const systemOps = logs.filter(l => !l.admin?.username).length;
  const criticalEvents = logs.filter(l => {
    const act = l.action.toLowerCase();
    return act.includes("ban") || act.includes("delete") || act.includes("reject");
  }).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">Audit Logs</h1>
        <p className="text-xs text-white/30 mt-1">
          Reviewing <span className="font-bold text-white/60">{totalLogs.toLocaleString()}</span> historical administrative events
        </p>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Log Entries" value={totalLogs} color="text-indigo-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        } />
        <StatCard label="Admin Actions (Page)" value={adminOps} color="text-[#14b8a6]" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        } />
        <StatCard label="System Ops (Page)" value={systemOps} color="text-amber-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        } />
        <StatCard label="Critical Events (Page)" value={criticalEvents} color="text-red-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        } />
      </div>

      {/* Filters bar */}
      <div className="rounded-3xl border border-white/6 bg-[#111318] p-4 shadow-lg flex items-center gap-3 flex-wrap relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/1 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <select
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="pl-3.5 pr-8 py-2.5 bg-white/2 border border-white/8 hover:border-white/15 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[#f97316]/40 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Operations</option>
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
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="relative">
          <select
            value={targetType}
            onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
            className="pl-3.5 pr-8 py-2.5 bg-white/2 border border-white/8 hover:border-white/15 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[#f97316]/40 transition-all appearance-none cursor-pointer"
          >
            <option value="">All Target Types</option>
            <option value="User">Users</option>
            <option value="Post">Posts</option>
            <option value="Comment">Comments</option>
            <option value="Community">Communities</option>
            <option value="Report">Reports</option>
            <option value="Notification">Notifications</option>
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={logs}
        isLoading={loading}
        pagination={{ page, limit: 15, total: totalLogs, totalPages }}
        onPageChange={setPage}
        emptyMessage="No administrative audit log entries found matching criteria"
      />

      {/* Log Details Inspector Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl border border-white/8 bg-[#111318] p-6 shadow-2xl overflow-hidden animate-scale-in">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#14b8a6]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Security Event Inspector</h3>
                <div className="flex items-center gap-2">
                  {getActionPulse(inspectedLog.action)}
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{inspectedLog.action}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-white/20 select-all">Log ID: {inspectedLog.id}</span>
                <button
                  onClick={() => setInspectedLog(null)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/6 transition-all cursor-pointer border border-white/6"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5">
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1">Trigger Operation</span>
                  <span className="text-xs font-black text-white uppercase tracking-wider">{inspectedLog.action.replace(/_/g, " ")}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/2 border border-white/5">
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1">Responsible Agent</span>
                  <span className="text-xs text-white/80 font-bold">{inspectedLog.admin?.name || "System Daemon"}</span>
                </div>
              </div>

              <div className="relative group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider block">Metadata Payload</span>
                  <button
                    onClick={() => handleCopyPayload(inspectedLog.details)}
                    className="text-[9px] font-bold text-stormy-teal hover:text-[#2dd4bf] uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Copy JSON Payload
                  </button>
                </div>
                <pre className="p-4 bg-black/40 border border-white/6 rounded-2xl font-mono text-[11px] text-green-400 overflow-x-auto whitespace-pre-wrap select-all">
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
