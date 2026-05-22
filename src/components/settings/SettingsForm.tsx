"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { profileUpdateSchema } from "@/lib/Schemas/profileUpdateSchema";
import { useAuth } from "@/context/AuthContext";

export const SettingsForm = () => {
  const router = useRouter();
  const { login, handelSignOut } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "preferences" | "danger">("profile");

  // DB User object
  const [dbUser, setDbUser] = useState<any>(null);

  // Form states (Profile Tab)
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [seed, setSeed] = useState("");

  // Preference states (Preferences Tab)
  const [emailNotif, setEmailNotif] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [publicProfile, setPublicProfile] = useState(true);
  const [darkModeSync, setDarkModeSync] = useState(true);

  // UI/Request states
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch initial profile data
  useEffect(() => {
    let active = true;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/about");
        if (!res.ok) {
          throw new Error("Failed to load user profile");
        }
        const data = await res.json();
        if (active && data?.user) {
          setDbUser(data.user);
          setName(data.user.name || "");
          setUsername(data.user.username || "");
          setBio(data.user.bio || "");
          
          const avatarUrl = data.user.avatar || "";
          setAvatar(avatarUrl);
          
          // Try to extract Dicebear seed if present in URL
          const dicebearMatch = avatarUrl.match(/api\.dicebear\.com\/.*?\/svg\?seed=(.*)/);
          if (dicebearMatch && dicebearMatch[1]) {
            setSeed(decodeURIComponent(dicebearMatch[1]));
          }
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

  // Sync avatar url when seed changes
  const handleSeedChange = (newSeed: string) => {
    setSeed(newSeed);
    if (newSeed.trim()) {
      setAvatar(`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newSeed.trim())}`);
    }
  };

  // Generate a random seed
  const generateRandomSeed = () => {
    const randomWords = [
      "Chai", "Coffee", "Code", "Debug", "Git", "Merge", "Stack", "Pixel", 
      "Sip", "Brew", "Mug", "Byte", "Binary", "Syntax", "Kernel", "Compiler", 
      "Array", "Vector", "Node", "Docker", "Cloud", "Script", "Loop", "Schema"
    ];
    const firstWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    const secondWord = randomWords[Math.floor(Math.random() * randomWords.length)];
    const randomNumber = Math.floor(100 + Math.random() * 900);
    const newSeed = `${firstWord}${secondWord}${randomNumber}`;
    handleSeedChange(newSeed);
  };

  // Save profile changes (Profile tab)
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGlobalError("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const validation = profileUpdateSchema.safeParse({
      name,
      username,
      bio,
      image: avatar || undefined,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path.length > 0) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/about", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          bio,
          image: avatar,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An error occurred while updating profile");
      }

      setSuccessMessage("Profile settings updated successfully!");
      login(); // Refresh layout header profile
      
      // Update local dbUser copy
      if (result.user) {
        setDbUser(result.user);
      }

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle saving Preferences (Preferences tab)
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    setSuccessMessage("Preferences saved successfully!");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

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

  // Get Account Tier label
  const getAccountTier = (karma: number) => {
    if (karma >= 500) return "Chai Connoisseur (Pro)";
    if (karma >= 200) return "Active Brewer (Intermediate)";
    return "Chai Apprentice (Novice)";
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
            <form onSubmit={handleSubmitProfile} className="space-y-6">
              
              {/* Avatar Selector */}
              <div className="p-5 rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-wider border-b border-(--divider-color) pb-2">
                  Profile Avatar
                </h3>
                
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative w-20 h-20 rounded-full bg-(--profile-avatar-bg) border border-orange/30 p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
                    {avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatar} alt="Profile Avatar Preview" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-(--profile-avatar-text)">
                        {name.substring(0, 2).toUpperCase() || "JD"}
                      </span>
                    )}
                  </div>

                  <div className="w-full space-y-3.5">
                    {/* Seed input */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-dust-grey uppercase tracking-wider">
                        Generate Dicebear Seed
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={seed}
                          onChange={(e) => handleSeedChange(e.target.value)}
                          placeholder="e.g. CodeBrewer"
                          className="flex-1 px-3 py-2 bg-(--input-bg) border border-(--input-border) rounded-xl text-xs text-(--foreground) focus:outline-none focus:border-(--input-focus-border) focus:ring-1 focus:ring-(--input-focus-ring) transition-all"
                        />
                        <button
                          type="button"
                          onClick={generateRandomSeed}
                          className="px-3.5 py-2 bg-orange/15 hover:bg-orange/25 border border-orange/20 rounded-xl text-[10px] font-bold text-orange hover:text-orange-600 transition-all cursor-pointer"
                        >
                          🎲 Random
                        </button>
                      </div>
                    </div>

                    {/* Image URL input */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-dust-grey uppercase tracking-wider">
                        Or Custom Image URL
                      </label>
                      <input
                        type="text"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full px-3 py-2 bg-(--input-bg) border border-(--input-border) rounded-xl text-xs text-(--foreground) focus:outline-none focus:border-(--input-focus-border) focus:ring-1 focus:ring-(--input-focus-ring) transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Text Fields */}
              <div className="space-y-4">
                {/* Display Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-dust-grey uppercase tracking-wider">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full Name"
                    className={`w-full px-4 py-3 bg-(--input-bg) border ${errors.name ? "border-red-500" : "border-(--input-border)"} rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--input-focus-border) focus:ring-1 focus:ring-(--input-focus-ring) transition-all`}
                    required
                  />
                  {errors.name && <p className="text-2xs text-red-400 font-semibold">{errors.name}</p>}
                </div>

                {/* Username */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-dust-grey uppercase tracking-wider">
                    Username handle
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-semibold text-dust-grey select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className={`w-full pl-8 pr-4 py-3 bg-(--input-bg) border ${errors.username ? "border-red-500" : "border-(--input-border)"} rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--input-focus-border) focus:ring-1 focus:ring-(--input-focus-ring) transition-all`}
                      required
                    />
                  </div>
                  {errors.username && <p className="text-2xs text-red-400 font-semibold">{errors.username}</p>}
                </div>

                {/* Bio */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold text-dust-grey uppercase tracking-wider">
                      Biography
                    </label>
                    <span className="text-[10px] text-dust-grey">{bio.length}/160</span>
                  </div>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Brief developer introduction..."
                    rows={4}
                    maxLength={160}
                    className={`w-full px-4 py-3 bg-(--input-bg) border ${errors.bio ? "border-red-500" : "border-(--input-border)"} rounded-xl text-sm text-(--foreground) focus:outline-none focus:border-(--input-focus-border) focus:ring-1 focus:ring-(--input-focus-ring) transition-all resize-none`}
                  />
                  {errors.bio && <p className="text-2xs text-red-400 font-semibold">{errors.bio}</p>}
                </div>
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-linear-to-r from-orange to-spicy-paprika hover:from-orange-600 hover:to-spicy-paprika-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Saving Profile..." : "Save Profile Details"}
              </button>

            </form>
          )}

          {/* TAB 2: ACCOUNT SUMMARY METADATA */}
          {activeTab === "account" && dbUser && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs space-y-4">
                <h3 className="text-sm font-bold text-(--foreground) uppercase tracking-wider border-b border-(--divider-color) pb-3.5">
                  Registration Metadata
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  {/* Email address */}
                  <div className="space-y-1">
                    <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
                      Email Address
                    </span>
                    <span 
                      title={dbUser.email}
                      className="font-semibold text-(--foreground) block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border) break-all"
                    >
                      {dbUser.email}
                    </span>
                  </div>

                  {/* Joined Date */}
                  <div className="space-y-1">
                    <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
                      Account Created
                    </span>
                    <span className="font-semibold text-(--foreground) block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
                      {new Date(dbUser.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {/* User Role */}
                  <div className="space-y-1">
                    <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
                      System Role
                    </span>
                    <span className="font-bold text-orange capitalize block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
                      🛡️ {dbUser.role || "Member"}
                    </span>
                  </div>

                  {/* Reputation / Karma */}
                  <div className="space-y-1">
                    <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
                      Karma Reputation Score
                    </span>
                    <span className="font-bold text-spicy-paprika block py-2.5 px-4 bg-(--profile-bg)/30 rounded-xl border border-(--card-border)">
                      ☕ {dbUser.karma || 0} Points
                    </span>
                  </div>
                </div>

                {/* Account Tier */}
                <div className="mt-4 pt-4 border-t border-(--divider-color) flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="block text-2xs font-extrabold text-dust-grey uppercase tracking-wider">
                      Current Account Tier
                    </span>
                    <span className="text-sm font-extrabold text-(--foreground)">
                      {getAccountTier(dbUser.karma || 0)}
                    </span>
                  </div>
                  <span className="text-xs bg-orange/15 text-orange px-3 py-1.5 rounded-full border border-orange/20 font-bold">
                    Developer Basic
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES TOGGLES */}
          {activeTab === "preferences" && (
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
                        Receive real-time alerts when other developers reply to your charchas or upvote your replies.
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
                        Receive a weekly roundup of trending system design discussions and local off-line meetups.
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
                        Allow search engines and non-registered guests to view your developer statistics and charchas.
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
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-linear-to-r from-orange to-spicy-paprika hover:from-orange-600 hover:to-spicy-paprika-600 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98] cursor-pointer"
              >
                Save Preferences
              </button>
            </form>
          )}

          {/* TAB 4: DANGER ZONE ACTIONS */}
          {activeTab === "danger" && (
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
                      onClick={handleResetKarma}
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
                      onClick={handelSignOut}
                      className="px-4 py-2 bg-spicy-paprika/10 hover:bg-spicy-paprika/20 border border-spicy-paprika/30 rounded-xl text-xs font-bold text-spicy-paprika cursor-pointer active:scale-95 transition-all self-start sm:self-center"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
