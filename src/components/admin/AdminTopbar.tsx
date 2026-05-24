/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
}

export const AdminTopbar: React.FC<AdminTopbarProps> = ({ onToggleSidebar }) => {
  const { userData, handelSignOut } = useAuth();
  const [pendingReportsCount, setPendingReportsCount] = useState(0);

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

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-stormy-teal/15 bg-ink-black/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Sidebar toggle button (Mobile) */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden text-dust-grey hover:text-floral-white cursor-pointer"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Breadcrumb or title */}
      <div className="hidden md:flex items-center gap-2">
        <span className="text-2xs font-extrabold uppercase tracking-widest text-stormy-teal">
          Secure Administrative Session
        </span>
      </div>

      {/* Right notifications and user menu */}
      <div className="flex items-center gap-3.5 ml-auto">


        {/* Pending Reports alert badge */}
        <Link
          href="/admin/reports"
          className="relative w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center text-dust-grey hover:text-floral-white hover:bg-white/10 transition-colors"
          title="Moderation Reports"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {pendingReportsCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-spicy-paprika text-floral-white text-3xs font-black w-5 h-5 rounded-full flex items-center justify-center border border-ink-black animate-pulse">
              {pendingReportsCount}
            </span>
          )}
        </Link>

        {/* User Profile dropdown */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-black text-floral-white block">
              {userData?.name || "Administrator"}
            </span>
            <span className="text-3xs font-extrabold uppercase tracking-widest text-vivid-tangerine block">
              Super Admin
            </span>
          </div>

          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-vivid-tangerine/30 bg-vivid-tangerine/10">
            {userData?.avatar ? (
              <img
                src={userData.avatar}
                alt="Admin avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-black text-floral-white uppercase">
                {userData?.name?.substring(0, 2) || "AD"}
              </div>
            )}
          </div>

          <button
            onClick={handelSignOut}
            className="w-9 h-9 rounded-xl bg-spicy-paprika/10 hover:bg-spicy-paprika/20 flex items-center justify-center text-spicy-paprika hover:text-floral-white transition-all cursor-pointer"
            title="Log Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
