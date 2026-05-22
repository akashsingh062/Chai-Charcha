"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { EditProfileTab } from "./EditProfileTab";
import { AccountDetailsTab } from "./AccountDetailsTab";
import { PreferencesTab } from "./PreferencesTab";
import { DangerZoneTab } from "./DangerZoneTab";

export const SettingsForm = () => {
  const router = useRouter();
  const { login, handelSignOut } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "preferences" | "danger">("profile");

  // DB User object
  const [dbUser, setDbUser] = useState<any>(null);

  // UI/Request states
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch initial profile data
  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          throw new Error("Failed to load user profile");
        }
        const data = await res.json();
        if (active && data?.user) {
          setDbUser(data.user);
        }
      } catch (err: unknown) {
        if (active) {
          const message = err instanceof Error ? err.message : "Error loading profile details";
          setGlobalError(message);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  // Mock Danger Zone actions
  const handleResetKarma = () => {
    const confirmReset = window.confirm(
      "Are you absolutely sure you want to reset your reputation karma? This cannot be undone."
    );
    if (confirmReset) {
      if (dbUser) {
        setDbUser({ ...dbUser, karma: 0 });
      }
      setSuccessMessage("Your reputation karma has been reset to 0!");
      setTimeout(() => setSuccessMessage(""), 4000);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 bg-(--profile-bg) rounded-md w-1/3"></div>
          <div className="h-4 bg-(--profile-bg) rounded-md w-2/3"></div>
        </div>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="w-full md:w-64 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-11 bg-(--profile-bg) rounded-xl w-full"></div>
            ))}
          </div>
          <div className="flex-1 space-y-6">
            <div className="h-24 bg-(--profile-bg) rounded-2xl w-full"></div>
            <div className="h-12 bg-(--profile-bg) rounded-xl w-full"></div>
            <div className="h-32 bg-(--profile-bg) rounded-xl w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation tab list
  const tabs = [
    { id: "profile", name: "Edit Profile", icon: "👤" },
    { id: "account", name: "Account Details", icon: "🛡️" },
    { id: "preferences", name: "Preferences", icon: "⚙️" },
    { id: "danger", name: "Danger Zone", icon: "⚠️" },
  ] as const;


  return (
    <div className="w-full space-y-6">
      
      {/* Toast Alert Notifications */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 rounded-2xl text-sm transition-all duration-300 shadow-lg animate-bounce">
          <svg className="w-5 h-5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {globalError && (
        <div className="flex items-center gap-3 p-4 bg-red-950/50 border border-red-500/30 text-red-200 rounded-2xl text-sm transition-all duration-300 shadow-lg">
          <svg className="w-5 h-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span className="font-semibold">{globalError}</span>
        </div>
      )}

      {/* Settings Tab Layout Container */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        
        {/* Navigation Sidebar Tabs */}
        <aside className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-(--divider-color) md:pr-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-orange/10 text-orange border-b-2 md:border-b-0 md:border-l-3 border-orange pl-3 md:pl-3"
                  : "text-dust-grey hover:bg-(--btn-secondary-hover-bg) hover:text-(--foreground)"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </aside>

        {/* Tab Contents Block */}
        <div className="flex-1 w-full min-h-[300px]">
          
          {/* TAB 1: PROFILE CUSTOMIZATION */}
          {activeTab === "profile" && (
            <EditProfileTab
              user={dbUser}
              onProfileUpdate={(updatedUser) => setDbUser(updatedUser)}
              setSuccessMessage={setSuccessMessage}
              setGlobalError={setGlobalError}
            />
          )}

          {/* TAB 2: ACCOUNT SUMMARY METADATA */}
          {activeTab === "account" && (
            <AccountDetailsTab user={dbUser} />
          )}

          {/* TAB 3: PREFERENCES TOGGLES */}
          {activeTab === "preferences" && (
            <PreferencesTab
              setSuccessMessage={setSuccessMessage}
              setGlobalError={setGlobalError}
            />
          )}

          {/* TAB 4: DANGER ZONE ACTIONS */}
          {activeTab === "danger" && (
            <DangerZoneTab
              onKarmaReset={handleResetKarma}
              onSignOut={handelSignOut}
            />
          )}

        </div>

      </div>
    </div>
  );
};
