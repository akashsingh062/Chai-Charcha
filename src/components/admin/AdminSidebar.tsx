"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
      </svg>
    ),
    color: "teal",
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    color: "blue",
  },
  {
    label: "Posts",
    href: "/admin/posts",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: "orange",
  },
  {
    label: "Comments",
    href: "/admin/comments",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    color: "purple",
  },
  {
    label: "Communities",
    href: "/admin/communities",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: "green",
  },
  {
    label: "Moderation",
    href: "/admin/reports",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    color: "red",
  },
  {
    label: "Audit Log",
    href: "/admin/audit-log",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: "yellow",
  },
];

const colorMap: Record<string, { active: string; hover: string; iconBg: string; dot: string }> = {
  teal:   { active: "text-[#2dd4bf]", hover: "group-hover:text-[#2dd4bf]", iconBg: "bg-[#2dd4bf]/10", dot: "bg-[#2dd4bf]" },
  blue:   { active: "text-[#60a5fa]", hover: "group-hover:text-[#60a5fa]", iconBg: "bg-[#60a5fa]/10", dot: "bg-[#60a5fa]" },
  orange: { active: "text-[#fb923c]", hover: "group-hover:text-[#fb923c]", iconBg: "bg-[#fb923c]/10", dot: "bg-[#fb923c]" },
  purple: { active: "text-[#a78bfa]", hover: "group-hover:text-[#a78bfa]", iconBg: "bg-[#a78bfa]/10", dot: "bg-[#a78bfa]" },
  green:  { active: "text-[#4ade80]", hover: "group-hover:text-[#4ade80]", iconBg: "bg-[#4ade80]/10", dot: "bg-[#4ade80]" },
  red:    { active: "text-[#f87171]", hover: "group-hover:text-[#f87171]", iconBg: "bg-[#f87171]/10", dot: "bg-[#f87171]" },
  yellow: { active: "text-[#fbbf24]", hover: "group-hover:text-[#fbbf24]", iconBg: "bg-[#fbbf24]/10", dot: "bg-[#fbbf24]" },
};

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#0d0f14] transition-all duration-300 ease-in-out
          ${isCollapsed ? "md:w-16" : "md:w-64"}
          ${isOpen ? "w-64 translate-x-0 visible" : "w-64 -translate-x-full invisible md:translate-x-0 md:visible"}
        `}
      >
        {/* Header */}
        <div className={`flex items-center border-b border-white/[0.06] h-16 px-4 shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}>
          {!isCollapsed && (
            <Link href="/admin" className="flex items-center gap-2 min-w-0" onClick={onClose}>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div className="min-w-0">
                <span className="text-sm font-black text-white tracking-tight block leading-none">
                  Chai<span className="text-[#f97316]">Charcha</span>
                </span>
                <span className="text-[9px] font-bold text-[#14b8a6] uppercase tracking-[0.12em] leading-none">
                  Admin Panel
                </span>
              </div>
            </Link>
          )}

          {isCollapsed && (
            <Link href="/admin" className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#f97316] to-[#fb923c] flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </Link>
          )}

          {/* Desktop collapse toggle */}
          {!isCollapsed && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex w-7 h-7 rounded-lg items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer shrink-0"
              title="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Mobile close */}
          {isOpen && onClose && (
            <button
              onClick={onClose}
              className="md:hidden w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex mx-auto mt-3 w-8 h-6 rounded items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer"
            title="Expand sidebar"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto py-4 space-y-0.5 ${isCollapsed ? "px-2" : "px-3"}`}>
          {!isCollapsed && (
            <span className="px-3 text-[9px] font-bold text-white/20 uppercase tracking-[0.15em] block mb-2">
              Navigation
            </span>
          )}

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const colors = colorMap[item.color];

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={`group relative flex items-center gap-3 rounded-xl transition-all duration-200 cursor-pointer
                  ${isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
                  ${isActive
                    ? `bg-white/[0.07] ${colors.active}`
                    : "text-white/40 hover:text-white/80 hover:bg-white/[0.04]"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full ${colors.dot}`} />
                )}

                {/* Icon */}
                <span className={`flex items-center justify-center rounded-lg transition-colors ${isActive ? colors.iconBg : ""} ${isCollapsed ? "w-8 h-8" : "w-7 h-7"}`}>
                  {item.icon}
                </span>

                {/* Label */}
                {!isCollapsed && (
                  <span className="text-xs font-semibold truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={`border-t border-white/[0.06] py-4 ${isCollapsed ? "px-2" : "px-3"}`}>
          <Link
            href="/"
            title={isCollapsed ? "Exit Panel" : undefined}
            className={`group flex items-center gap-3 rounded-xl text-white/30 hover:text-white/70 hover:bg-white/[0.04] transition-all cursor-pointer
              ${isCollapsed ? "justify-center p-2.5" : "px-3 py-2.5"}
            `}
          >
            <span className={`flex items-center justify-center ${isCollapsed ? "w-8 h-8" : "w-7 h-7"}`}>
              <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            {!isCollapsed && (
              <span className="text-xs font-semibold">Exit to App</span>
            )}
          </Link>
        </div>
      </aside>
    </>
  );
};
