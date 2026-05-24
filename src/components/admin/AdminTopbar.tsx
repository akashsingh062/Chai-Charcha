/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
}

const routeLabels: Record<string, string[]> = {
  "/admin": ["Dashboard"],
  "/admin/users": ["Users", "Management"],
  "/admin/posts": ["Posts", "Management"],
  "/admin/comments": ["Comments", "Management"],
  "/admin/communities": ["Communities", "Management"],
  "/admin/reports": ["Moderation", "Queue"],
  "/admin/audit-log": ["Audit", "Log"],
};

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ onToggleSidebar }) => {
  const { userData, handelSignOut } = useAuth();
  const pathname = usePathname();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = routeLabels[pathname] ?? ["Admin"];

  useEffect(() => {
    async function fetchReportsCount() {
      try {
        const res = await axiosInstance.get("/api/admin/stats");
        if (res.data && res.data.reports) {
          setPendingReportsCount(res.data.reports.pending || 0);
        }
      } catch (err) {
        console.error("Failed to load reports count for topbar", err);
      }
    }
    fetchReportsCount();

    window.addEventListener("reportsUpdated", fetchReportsCount);
    return () => {
      window.removeEventListener("reportsUpdated", fetchReportsCount);
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-white/[0.06] bg-[#0a0b0f]/80 backdrop-blur-xl px-5 flex items-center justify-between gap-4">
      {/* Left: mobile toggle + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Breadcrumb */}
        <nav className="hidden sm:flex items-center gap-1.5 min-w-0">
          <span className="text-white/20 text-xs font-medium">Admin</span>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              <svg className="w-3 h-3 text-white/15 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span
                className={`text-xs font-semibold truncate ${
                  i === breadcrumbs.length - 1 ? "text-white" : "text-white/40"
                }`}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Reports badge */}
        <Link
          href="/admin/reports"
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
          title="Moderation Queue"
        >
          <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {pendingReportsCount > 0 && (
            <>
              {/* Pulse ring */}
              <span className="absolute -top-1 -right-1 w-4 h-4">
                <span className="absolute inset-0 rounded-full bg-[#f97316] opacity-30 animate-ping" />
                <span className="relative flex h-full w-full items-center justify-center rounded-full bg-[#f97316] text-white text-[8px] font-black leading-none border border-[#0a0b0f]">
                  {pendingReportsCount > 9 ? "9+" : pendingReportsCount}
                </span>
              </span>
            </>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-6 bg-white/[0.08]" />

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            <div className="relative w-7 h-7 rounded-lg overflow-hidden border border-white/10 bg-[#1c1f26] shrink-0">
              {userData?.avatar ? (
                <img src={userData.avatar} alt="Admin" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white uppercase">
                  {userData?.name?.substring(0, 2) || "AD"}
                </div>
              )}
              {/* Online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] border-2 border-[#0a0b0f]" />
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-semibold text-white block leading-tight">
                {userData?.name?.split(" ")[0] || "Admin"}
              </span>
              <span className="text-[9px] font-bold text-[#f97316] uppercase tracking-wider leading-tight block">
                Super Admin
              </span>
            </div>
            <svg
              className={`w-3.5 h-3.5 text-white/30 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-white/[0.08] bg-[#111318]/95 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
              {/* User info header */}
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <span className="text-xs font-semibold text-white block">{userData?.name || "Administrator"}</span>
                <span className="text-[10px] text-white/40 block mt-0.5">@{userData?.username || "admin"}</span>
              </div>

              {/* Menu items */}
              <div className="p-1.5 space-y-0.5">
                <Link
                  href="/"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Go to App
                </Link>
                <button
                  onClick={() => { handelSignOut(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/[0.08] transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
