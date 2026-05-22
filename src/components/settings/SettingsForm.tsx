"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { EditProfileTab } from "./EditProfileTab";
import { AccountDetailsTab } from "./AccountDetailsTab";
import { PreferencesTab } from "./PreferencesTab";
import { DangerZoneTab } from "./DangerZoneTab";
import { DbUser } from "@/types/user";

export const SettingsForm = () => {
  const { handelSignOut } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "preferences" | "danger">("profile");

  // DB User object
  const [dbUser, setDbUser] = useState<DbUser | null>(null);

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
    { id: "profile", name: "Edit Profile" },
    { id: "account", name: "Account Details" },
    { id: "preferences", name: "Preferences" },
    { id: "danger", name: "Danger Zone" },
  ] as const;

  const getTabIcon = (id: string) => {
    const className = "w-4 h-4 shrink-0";
    switch (id) {
      case "profile":
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 01-7.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        );
      case "account":
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        );
      case "preferences":
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case "danger":
        return (
          <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        );
      default:
        return null;
    }
  };


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
              {getTabIcon(tab.id)}
              <span>{tab.name}</span>
            </button>
          ))}
        </aside>

        {/* Tab Contents Block */}
        <div className="flex-1 w-full min-h-[300px]">
          
          {/* TAB 1: PROFILE CUSTOMIZATION */}
          {activeTab === "profile" && (
            <EditProfileTab
              key={dbUser?.username || "loading"}
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
