"use client";

import React from "react";

interface DangerZoneTabProps {
  onKarmaReset: () => void;
  onSignOut: () => void;
}

export const DangerZoneTab: React.FC<DangerZoneTabProps> = ({
  onKarmaReset,
  onSignOut,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl border border-red-500/20 bg-red-950/10 backdrop-blur-xs space-y-6">
        <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider border-b border-red-500/20 pb-3.5">
          Danger Zone - Irreversible Actions
        </h3>

        <div className="space-y-5">
          {/* Action 1: Reset Karma */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-(--foreground) block">
                Reset Karma & reputation score
              </span>
              <span className="text-xs text-dust-grey block max-w-md leading-relaxed">
                This action will set your community karma score back to 0. All your authored posts remain unchanged.
              </span>
            </div>
            <button
              type="button"
              onClick={onKarmaReset}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-xs font-bold text-red-400 cursor-pointer active:scale-95 transition-all self-start sm:self-center"
            >
              Reset Karma
            </button>
          </div>

          {/* Action 2: Sign Out session */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-red-500/15 pt-5">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-(--foreground) block">
                Sign Out of Session
              </span>
              <span className="text-xs text-dust-grey block max-w-md leading-relaxed">
                Clears your active security cookies on this device and redirects you to the login screen.
              </span>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="px-4 py-2 bg-spicy-paprika/10 hover:bg-spicy-paprika/20 border border-spicy-paprika/30 rounded-xl text-xs font-bold text-spicy-paprika cursor-pointer active:scale-95 transition-all self-start sm:self-center"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
