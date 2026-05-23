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

  let styles = "bg-alabaster-grey text-charcoal-brown border-alabaster-grey-300";

  switch (normalized) {
    case "admin":
      styles = "bg-vivid-tangerine/10 text-vivid-tangerine border-vivid-tangerine/30";
      break;
    case "moderator":
      styles = "bg-stormy-teal/10 text-stormy-teal border-stormy-teal/30";
      break;
    case "member":
      styles = "bg-carbon-black/5 text-carbon-black/70 border-carbon-black/10 dark:bg-white/5 dark:text-white/70 dark:border-white/10";
      break;
    case "pending":
      styles = "bg-orange/10 text-orange border-orange/30";
      break;
    case "resolved":
    case "active":
      styles = "bg-green-500/10 text-green-500 border-green-500/30";
      break;
    case "rejected":
    case "banned":
    case "deleted":
      styles = "bg-spicy-paprika/10 text-spicy-paprika border-spicy-paprika/30";
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider border ${styles}`}>
      {type}
    </span>
  );
};
