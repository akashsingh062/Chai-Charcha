"use client";

import React from "react";
import { DbUser } from "@/types/user";

interface AccountDetailsTabProps {
  user: DbUser | null;
}

export const AccountDetailsTab: React.FC<AccountDetailsTabProps> = ({ user }) => {
  if (!user) return null;

  // Get Account Tier label
  const getAccountTier = (karma: number) => {
    if (karma >= 500) return "Chai Connoisseur (Pro)";
    if (karma >= 200) return "Active Brewer (Intermediate)";
    return "Chai Apprentice (Novice)";
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs space-y-4">
        <h3 className="text-sm font-bold text-(--foreground) uppercase tracking-wider border-b border-(--divider-color) pb-3.5">
          Registration Metadata
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
          {/* Email address */}
          <div className="space-y-1">
            <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
              Email Address
            </span>
            <span
              title={user.email}
              className="font-semibold text-(--foreground) block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border) break-all"
            >
              {user.email}
            </span>
          </div>

          {/* Joined Date */}
          <div className="space-y-1">
            <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
              Account Created
            </span>
            <span className="font-semibold text-(--foreground) block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* User Role */}
          <div className="space-y-1">
            <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
              System Role
            </span>
            <span className="font-bold text-orange capitalize block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
              🛡️ {user.role || "Member"}
            </span>
          </div>

          {/* Reputation / Karma */}
          <div className="space-y-1">
            <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
              Karma Reputation Score
            </span>
            <span className="font-bold text-spicy-paprika block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
              ☕ {user.karma || 0} Points
            </span>
          </div>
        </div>

        {/* Account Tier */}
        <div className="mt-4 pt-4 border-t border-(--divider-color) flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
              Current Account Tier
            </span>
            <span className="text-sm font-extrabold text-(--foreground)">
              {getAccountTier(user.karma || 0)}
            </span>
          </div>
          <span className="text-xs bg-orange/15 text-orange px-3 py-1.5 rounded-full border border-orange/20 font-bold">
            Developer Basic
          </span>
        </div>
      </div>
    </div>
  );
};
