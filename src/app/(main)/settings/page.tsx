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
            ⚙️ Personalize
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