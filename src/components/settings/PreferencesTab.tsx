"use client";

import React, { useState, useEffect } from "react";

interface PreferencesTabProps {
  setSuccessMessage: (msg: string) => void;
  setGlobalError: (msg: string) => void;
}

export const PreferencesTab: React.FC<PreferencesTabProps> = ({
  setSuccessMessage,
  setGlobalError,
}) => {
  // Preference states
  const [emailNotif, setEmailNotif] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [darkModeSync, setDarkModeSync] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDark = document.documentElement.classList.contains("dark");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDarkMode(isDark);
    }
  }, []);

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chai-charcha-preferences");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const timer = setTimeout(() => {
            if (typeof parsed.emailNotif === "boolean") setEmailNotif(parsed.emailNotif);
            if (typeof parsed.newsletter === "boolean") setNewsletter(parsed.newsletter);
            if (typeof parsed.publicProfile === "boolean") setPublicProfile(parsed.publicProfile);
            if (typeof parsed.darkModeSync === "boolean") setDarkModeSync(parsed.darkModeSync);
          }, 0);
          return () => clearTimeout(timer);
        } catch (err) {
          console.error("Failed to parse stored preferences:", err);
        }
      }
    }
  }, []);

  // Handle saving Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("");
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "chai-charcha-preferences",
          JSON.stringify({
            emailNotif,
            newsletter,
            publicProfile,
            darkModeSync,
          })
        );
      }
      setSuccessMessage("Preferences saved successfully!");
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      setGlobalError("Failed to save preferences.");
    }
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsDarkMode(checked);
    if (typeof window !== "undefined") {
      if (checked) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    }
  };

  return (
    <form onSubmit={handleSavePreferences} className="space-y-6">
      <div className="p-6 rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs space-y-6">
        <h3 className="text-sm font-bold text-(--foreground) uppercase tracking-wider border-b border-(--divider-color) pb-3.5">
          Notification & Sync Preferences
        </h3>

        <div className="space-y-5">
          {/* Toggle 1: Email notifications */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-(--foreground) block">
                Email Notifications
              </span>
              <span className="text-xs text-dust-grey block leading-relaxed">
                Receive real-time alerts when other members reply to your charchas or upvote your replies.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-(--profile-bg) rounded-full peer peer-focus:ring-2 peer-focus:ring-orange/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-dust-grey peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
            </label>
          </div>

          {/* Toggle 2: Weekly Digest Newsletter */}
          <div className="flex items-start justify-between gap-4 border-t border-(--divider-color) pt-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-(--foreground) block">
                Weekly Digest Newsletter
              </span>
              <span className="text-xs text-dust-grey block leading-relaxed">
                Receive a weekly roundup of trending community discussions and local off-line meetups.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-(--profile-bg) rounded-full peer peer-focus:ring-2 peer-focus:ring-orange/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-dust-grey peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
            </label>
          </div>

          {/* Toggle 3: Public profile visibility */}
          <div className="flex items-start justify-between gap-4 border-t border-(--divider-color) pt-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-(--foreground) block">
                Public Profile Visibility
              </span>
              <span className="text-xs text-dust-grey block leading-relaxed">
                Allow search engines and non-registered guests to view your statistics and charchas.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={publicProfile}
                onChange={(e) => setPublicProfile(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-(--profile-bg) rounded-full peer peer-focus:ring-2 peer-focus:ring-orange/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-dust-grey peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
            </label>
          </div>

          {/* Toggle 4: Dark Mode Preference Sync */}
          <div className="flex items-start justify-between gap-4 border-t border-(--divider-color) pt-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-(--foreground) block">
                Synchronize Theme preference
              </span>
              <span className="text-xs text-dust-grey block leading-relaxed">
                Enable automatic client-side caching to speed up theme switches and prevent screen-glitch layout shifts.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={darkModeSync}
                onChange={(e) => setDarkModeSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-(--profile-bg) rounded-full peer peer-focus:ring-2 peer-focus:ring-orange/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-dust-grey peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
            </label>
          </div>

          {/* Toggle 5: Dark Mode Active Switch */}
          <div className="flex items-start justify-between gap-4 border-t border-(--divider-color) pt-4">
            <div className="space-y-1">
              <span className="text-sm font-bold text-(--foreground) block">
                Dark Mode Theme
              </span>
              <span className="text-xs text-dust-grey block leading-relaxed">
                Switch between dark mode and light mode themes across the forum.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={handleThemeChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-(--profile-bg) rounded-full peer peer-focus:ring-2 peer-focus:ring-orange/30 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-dust-grey peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange"></div>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3.5 px-4 bg-linear-to-r from-orange to-spicy-paprika hover:from-orange-600 hover:to-spicy-paprika-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
      >
        Save Preferences
      </button>
    </form>
  );
};
