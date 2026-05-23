"use client";

import React from "react";
import { useToastStore } from "@/store/useToastStore";

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-200 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        let bgColor = "bg-(--card-background) border-orange/20 text-orange";
        let icon = (
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.085 1.085l-.04.02m-.086-1.085a.75.75 0 00-1.085 1.085l.04-.02M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );

        if (t.type === "success") {
          bgColor = "bg-(--card-background) border-stormy-teal/30 text-stormy-teal dark:text-stormy-teal-600";
          icon = (
            <svg className="w-5 h-5 text-stormy-teal shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          );
        } else if (t.type === "error") {
          bgColor = "bg-(--card-background) border-spicy-paprika/30 text-spicy-paprika";
          icon = (
            <svg className="w-5 h-5 text-spicy-paprika shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          );
        } else if (t.type === "warning") {
          bgColor = "bg-(--card-background) border-vivid-tangerine/30 text-vivid-tangerine";
          icon = (
            <svg className="w-5 h-5 text-vivid-tangerine shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376C1.83 19.13 2.9 21 4.697 21h14.606c1.8 0 2.87-1.87 1.97-3.376L13.97 4.376c-.9-1.5-3.03-1.5-3.93 0L2.697 17.626zM12 17.25h.007v.007H12v-.007z" />
            </svg>
          );
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-slide-in-right ${bgColor}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {icon}
              <span className="text-xs font-bold font-sans tracking-tight wrap-break-word">{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/5 text-dust-grey/60 hover:text-dust-grey transition-colors cursor-pointer shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
