import React from "react";

type BadgeType =
  | "admin"
  | "moderator"
  | "member"
  | "pending"
  | "resolved"
  | "rejected"
  | "banned"
  | "active"
  | "deleted";

interface AdminBadgeProps {
  type: BadgeType | string;
}

export const AdminBadge: React.FC<AdminBadgeProps> = ({ type }) => {
  const normalized = type.toLowerCase();

  let styles = "bg-white/[0.06] text-white/40 border-white/[0.08]";

  switch (normalized) {
    case "admin":
      styles = "bg-[#f97316]/10 text-[#f97316] border-[#f97316]/20";
      break;
    case "moderator":
      styles = "bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20";
      break;
    case "member":
      styles = "bg-white/[0.05] text-white/50 border-white/[0.08]";
      break;
    case "pending":
      styles = "bg-orange-500/10 text-orange-400 border-orange-500/20";
      break;
    case "resolved":
    case "active":
      styles = "bg-green-500/10 text-green-400 border-green-500/20";
      break;
    case "rejected":
    case "deleted":
      styles = "bg-slate-500/10 text-slate-400 border-slate-500/20";
      break;
    case "banned":
      styles = "bg-red-500/10 text-red-400 border-red-500/20";
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.08em] border ${styles}`}>
      {type}
    </span>
  );
};
