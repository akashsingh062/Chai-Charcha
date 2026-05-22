import React from "react";
import { Metadata } from "next";
import { SettingsForm } from "@/components/settings/SettingsForm";

export const metadata: Metadata = {
  title: "Account Settings - Chai Charcha Forum",
  description: "Customize your developer profile details, update your display name, username, bio, and choose or generate a unique avatar seed.",
};

export default function SettingsPage() {
  return (
    <main className="flex-1 w-full mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col gap-8 animate-fade-in">
      {/* Settings Header Panel */}
      <div className="relative overflow-hidden rounded-3xl border border-(--card-border) bg-(--card-background) p-8 shadow-2xl transition-all duration-300">
        {/* Ambient Gradient Background Glow */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-orange/10 blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-spicy-paprika/10 blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-orange bg-orange/10 border border-orange/20 mb-1">
            <svg className="w-3 h-3 text-orange shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Personalize</span>
          </span>
          <h1 className="text-3xl font-black tracking-tight text-(--foreground)">
            Account <span className="text-spicy-paprika">Settings</span>
          </h1>
          <p className="text-xs text-(--text-secondary) leading-relaxed">
            Update your identity credentials and developer presence details across the Chai Charcha developer forum.
          </p>
        </div>
      </div>

      {/* Settings Form Container */}
      <SettingsForm />
    </main>
  );
}