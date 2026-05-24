"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { StatsCard } from "@/components/admin/StatsCard";

/* eslint-disable @next/next/no-img-element */

interface DashboardStats {
  users: {
    total: number;
    new24h: number;
    new7d: number;
    new30d: number;
    banned: number;
  };
  posts: {
    total: number;
    new24h: number;
    new7d: number;
    new30d: number;
  };
  comments: { total: number };
  communities: { total: number };
  reports: { total: number; pending: number };
  messages: { total: number };
  topUsers: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
    karma: number;
    role: string;
  }>;
  topPosts: Array<{
    id: string;
    title: string;
    trendingScore: number;
    votes: number;
    comments: number;
    author?: {
      name: string;
      username: string;
      avatar: string;
    };
    createdAt: string;
  }>;
}

interface AuditLogItem {
  id: string;
  admin: {
    name: string;
    username: string;
  };
  action: string;
  targetType: string;
  createdAt: string;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const actionColors: Record<string, string> = {
  ban: "text-red-400",
  delete: "text-red-400",
  warn: "text-orange-400",
  mute: "text-orange-400",
  unban: "text-green-400",
  unmute: "text-green-400",
  resolve: "text-teal-400",
  reject: "text-slate-400",
};

function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  for (const key of Object.keys(actionColors)) {
    if (lower.includes(key)) return actionColors[key];
  }
  return "text-white/60";
}

const quickActions = [
  { label: "Manage Users", href: "/admin/users", icon: "👥", color: "bg-blue-500/10 border-blue-500/20 text-blue-300", hover: "hover:bg-blue-500/15" },
  { label: "Review Reports", href: "/admin/reports", icon: "🚨", color: "bg-red-500/10 border-red-500/20 text-red-300", hover: "hover:bg-red-500/15" },
  { label: "Browse Posts", href: "/admin/posts", icon: "📝", color: "bg-orange-500/10 border-orange-500/20 text-orange-300", hover: "hover:bg-orange-500/15" },
  { label: "Communities", href: "/admin/communities", icon: "🌐", color: "bg-green-500/10 border-green-500/20 text-green-300", hover: "hover:bg-green-500/15" },
  { label: "Audit Log", href: "/admin/audit-log", icon: "📋", color: "bg-purple-500/10 border-purple-500/20 text-purple-300", hover: "hover:bg-purple-500/15" },
  { label: "Comments", href: "/admin/comments", icon: "💬", color: "bg-teal-500/10 border-teal-500/20 text-teal-300", hover: "hover:bg-teal-500/15" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [statsRes, logsRes] = await Promise.all([
          axiosInstance.get("/api/admin/stats"),
          axiosInstance.get("/api/admin/audit-log?limit=5"),
        ]);
        setStats(statsRes.data);
        setRecentLogs(logsRes.data.auditLogs || []);
      } catch (err: unknown) {
        console.error("Dashboard load failed", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white/[0.04] rounded-2xl w-full" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.04] rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-80 bg-white/[0.04] rounded-2xl" />
          <div className="h-80 bg-white/[0.04] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-center">
        <span className="text-red-400 text-sm">{error || "An unexpected error occurred."}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Greeting */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-[#111318] p-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-[#14b8a6]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-[0.12em] mb-1">
              {getGreeting()}
            </p>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Dashboard <span className="text-[#f97316]">Overview</span>
            </h1>
            <p className="text-xs text-white/30 mt-1.5">
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>

          {stats.reports.pending > 0 && (
            <Link
              href="/admin/reports"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/15 transition-all text-xs font-semibold"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              {stats.reports.pending} pending reports
            </Link>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          description="registered accounts"
          trend={{ value: `+${stats.users.new7d} this week`, isPositive: true }}
          accentColor="blue"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Posts"
          value={stats.posts.total.toLocaleString()}
          description="published posts"
          trend={{ value: `+${stats.posts.new7d} this week`, isPositive: true }}
          accentColor="orange"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Communities"
          value={stats.communities.total.toLocaleString()}
          description="active communities"
          accentColor="green"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Pending Reports"
          value={stats.reports.pending.toLocaleString()}
          description={`of ${stats.reports.total} total`}
          trend={{ value: `needs review`, isPositive: false }}
          accentColor="red"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
        <h2 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border text-center transition-all ${action.color} ${action.hover}`}
            >
              <span className="text-xl">{action.icon}</span>
              <span className="text-[10px] font-semibold leading-tight">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trending Posts */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111318] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-xs font-bold text-white">Trending Posts</h3>
              <Link href="/admin/posts" className="text-[10px] font-semibold text-[#f97316] hover:text-[#fb923c] transition-colors">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {stats.topPosts.map((post, idx) => (
                <div key={post.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <span className="text-[11px] font-black text-white/20 w-5 shrink-0 text-center">{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white/90 truncate leading-tight">
                      {post.title}
                    </p>
                    <span className="text-[10px] text-white/30 mt-0.5 block">
                      {post.author?.username ? (
                        <Link href={`/admin/users?search=${post.author.username}`} className="text-[#14b8a6] hover:text-[#2dd4bf] font-medium transition-colors">
                          @{post.author.username}
                        </Link>
                      ) : (
                        "deleted"
                      )}
                      {" · "}{post.votes} votes · {post.comments} comments
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold bg-[#f97316]/10 text-[#f97316] px-2 py-0.5 rounded-md border border-[#f97316]/15">
                    🔥 {Math.round(post.trendingScore)}
                  </span>
                </div>
              ))}
              {stats.topPosts.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-white/25">No trending posts yet.</div>
              )}
            </div>
          </div>

          {/* Audit Log */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111318] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-xs font-bold text-white">Recent Admin Activity</h3>
              <Link href="/admin/audit-log" className="text-[10px] font-semibold text-[#f97316] hover:text-[#fb923c] transition-colors">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                      <span className={`text-[9px] font-black ${getActionColor(log.action)}`}>
                        {log.action.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className={`text-[11px] font-semibold block ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9px] text-white/25 block">
                        {log.admin?.name || "System"} · {log.targetType}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-[9px] text-white/25 font-medium">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="px-5 py-8 text-center text-xs text-white/25">No admin activity yet.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Top Contributors */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111318] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-xs font-bold text-white">Top Contributors</h3>
            </div>
            <div className="p-4 space-y-2">
              {stats.topUsers.map((user, idx) => (
                <div key={user.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <span className="text-[11px] font-black text-white/20 w-4 shrink-0 text-center">{idx + 1}</span>
                  <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04] shrink-0">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white uppercase">
                        {user.name.substring(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/admin/users?search=${user.username}`}
                      className="text-xs font-semibold text-white/90 block truncate hover:text-[#f97316] transition-colors"
                    >
                      {user.name}
                    </Link>
                    <span className="text-[9px] text-white/30 block">@{user.username}</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#f97316] shrink-0">
                    {user.karma.toLocaleString()}
                  </span>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <div className="py-6 text-center text-xs text-white/25">No contributors yet.</div>
              )}
            </div>
          </div>

          {/* Activity Summary */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5 space-y-3">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em]">Activity Summary</h3>
            <div className="space-y-2.5">
              {[
                { label: "New Users (24h)", value: stats.users.new24h, color: "text-blue-400" },
                { label: "New Posts (24h)", value: stats.posts.new24h, color: "text-orange-400" },
                { label: "New Users (30d)", value: stats.users.new30d, color: "text-blue-400" },
                { label: "Banned Accounts", value: stats.users.banned, color: "text-red-400" },
                { label: "Total Comments", value: stats.comments.total, color: "text-teal-400" },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-white/40 font-medium">{item.label}</span>
                  <span className={`text-[11px] font-bold ${item.color} tabular-nums`}>
                    {item.value.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
