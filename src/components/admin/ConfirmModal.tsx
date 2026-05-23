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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-stormy-teal/20 bg-ink-black p-6 shadow-2xl backdrop-blur-md pointer-events-auto">
        <h3 className="text-base font-extrabold text-floral-white uppercase tracking-wider">
          {title}
        </h3>
        <p className="mt-3 text-sm text-dust-grey leading-relaxed">
          {message}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-stormy-teal/10 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-dust-grey hover:bg-white/5 cursor-pointer transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold text-floral-white shadow-md cursor-pointer transition-colors ${
              isDanger
                ? "bg-spicy-paprika hover:bg-spicy-paprika/80"
                : "bg-stormy-teal hover:bg-stormy-teal/80"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
