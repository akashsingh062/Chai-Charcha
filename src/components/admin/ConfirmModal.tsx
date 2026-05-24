"use client";

import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  isDanger = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      {/* Modal card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111318] p-6 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Radial glow */}
        <div
          className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20
            ${isDanger ? "bg-red-500" : "bg-[#14b8a6]"}
          `}
        />

        {/* Icon + Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border
              ${isDanger
                ? "bg-red-500/10 border-red-500/20 text-red-400"
                : "bg-[#14b8a6]/10 border-[#14b8a6]/20 text-[#14b8a6]"
              }
            `}
          >
            {isDanger ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>

        {/* Message */}
        <p className="text-sm text-white/50 leading-relaxed ml-[3.375rem]">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-white/[0.06]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white/50 hover:text-white hover:bg-white/[0.06] transition-all cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all cursor-pointer
              ${isDanger
                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20"
                : "bg-[#14b8a6] hover:bg-[#0d9488] shadow-[#14b8a6]/20"
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
