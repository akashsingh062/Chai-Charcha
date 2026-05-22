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
            <span className="font-bold text-orange capitalize flex items-center gap-1.5 py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
              <svg className="w-4 h-4 text-orange shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              <span>{user.role || "Member"}</span>
            </span>
          </div>

          {/* Reputation / Karma */}
          <div className="space-y-1">
            <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
              Karma Reputation Score
            </span>
            <span className="font-bold text-spicy-paprika flex items-center gap-1.5 py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
              <svg className="w-4 h-4 text-spicy-paprika shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
              </svg>
              <span>{user.karma || 0} Points</span>
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
