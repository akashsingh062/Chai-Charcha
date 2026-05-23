"use client";

import React from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-sm rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-5 shadow-2xl backdrop-blur-md pointer-events-auto">
        <h3 className="text-sm font-extrabold text-(--foreground) uppercase tracking-wider">{title}</h3>
        <p className="mt-2.5 text-xs text-(--text-secondary) leading-relaxed">{message}</p>
        <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-(--divider-color) pt-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-(--foreground) hover:bg-(--btn-secondary-hover-bg) cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="rounded-xl bg-spicy-paprika hover:bg-spicy-paprika-600 px-4 py-2 text-xs font-bold text-floral-white shadow-md cursor-pointer"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
