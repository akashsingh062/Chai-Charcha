"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { StatsCard } from "@/components/admin/StatsCard";
import Image from "next/image";

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
      } catch (err: any) {
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
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-stormy-teal/10 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-stormy-teal/10 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-stormy-teal/10 rounded-2xl"></div>
          <div className="h-96 bg-stormy-teal/10 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl text-center text-red-200">
        {error || "An unexpected error occurred."}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-black text-floral-white tracking-tight uppercase">
          Dashboard Overview
        </h1>
        <p className="text-xs text-dust-grey font-bold uppercase tracking-wider mt-1">
          Chai Charcha Platform Analytics
        </p>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats.users.total}
          description="Total active users"
          trend={{ value: `${stats.users.new7d} new (7d)`, isPositive: true }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Total Posts"
          value={stats.posts.total}
          description="Total community posts"
          trend={{ value: `${stats.posts.new7d} new (7d)`, isPositive: true }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatsCard
          title="Communities"
          value={stats.communities.total}
          description="Sub-charcha channels"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatsCard
          title="Moderation Queue"
          value={stats.reports.pending}
          description="Pending reports"
          trend={{ value: `${stats.reports.total} total`, isPositive: false }}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      {/* Main Stats Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Posts & Content (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stormy-teal">
                Trending Posts
              </h3>
              <Link href="/admin/posts" className="text-2xs font-extrabold uppercase text-vivid-tangerine hover:underline">
                View All Posts →
              </Link>
            </div>

            <div className="divide-y divide-stormy-teal/10">
              {stats.topPosts.map((post) => (
                <div key={post.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-floral-white hover:text-vivid-tangerine block truncate">
                      {post.title}
                    </span>
                    <span className="text-3xs text-dust-grey/60 uppercase tracking-widest mt-1 block">
                      By @{post.author?.username || "deleted"} • {post.votes} votes • {post.comments} comments
                    </span>
                  </div>
                  <span className="shrink-0 text-2xs font-black bg-stormy-teal/10 text-stormy-teal px-2.5 py-1 rounded-md border border-stormy-teal/20">
                    🔥 {post.trendingScore.toFixed(0)}
                  </span>
                </div>
              ))}
              {stats.topPosts.length === 0 && (
                <div className="py-6 text-center text-xs text-dust-grey/50">
                  No trending posts found.
                </div>
              )}
            </div>
          </div>

          {/* Recent Audit Logs */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-stormy-teal">
                Recent Admin Activity
              </h3>
              <Link href="/admin/audit-log" className="text-2xs font-extrabold uppercase text-vivid-tangerine hover:underline">
                View All Logs →
              </Link>
            </div>

            <div className="divide-y divide-stormy-teal/10">
              {recentLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-floral-white block">
                      {log.action.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-3xs text-dust-grey/60 uppercase tracking-widest mt-0.5 block">
                      Admin: {log.admin?.name || "System"} • Target: {log.targetType}
                    </span>
                  </div>
                  <span className="shrink-0 text-3xs text-dust-grey font-bold">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {recentLogs.length === 0 && (
                <div className="py-6 text-center text-xs text-dust-grey/50">
                  No admin activity logged yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Users (Right 1 column) */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-stormy-teal mb-4">
              Top Contributors
            </h3>

            <div className="space-y-4">
              {stats.topUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-stormy-teal/20 bg-stormy-teal/10">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt="User avatar"
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xs font-black uppercase">
                          {user.name.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-floral-white block truncate">
                        {user.name}
                      </span>
                      <span className="text-3xs text-dust-grey/60 block truncate">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-vivid-tangerine bg-vivid-tangerine/5 px-2 py-0.5 rounded border border-vivid-tangerine/10 shrink-0">
                    {user.karma} pts
                  </span>
                </div>
              ))}
              {stats.topUsers.length === 0 && (
                <div className="py-6 text-center text-xs text-dust-grey/50">
                  No contributors found.
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-stormy-teal">
              User Activity
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-dust-grey">New Users (24h)</span>
                <span className="text-floral-white font-extrabold">{stats.users.new24h}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-dust-grey">New Users (30d)</span>
                <span className="text-floral-white font-extrabold">{stats.users.new30d}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-dust-grey">Banned Accounts</span>
                <span className="text-spicy-paprika font-extrabold">{stats.users.banned}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold border-t border-stormy-teal/10 pt-3">
                <span className="text-dust-grey">Comments Contributed</span>
                <span className="text-floral-white font-extrabold">{stats.comments.total}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
