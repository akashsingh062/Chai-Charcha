"use client";

import React, { useState } from "react";
import { profileUpdateSchema } from "@/lib/Schemas/profileUpdateSchema";
import { useAuth } from "@/context/AuthContext";
import { DbUser } from "@/types/user";

interface EditProfileTabProps {
  user: DbUser | null;
  onProfileUpdate: (updatedUser: DbUser) => void;
  setSuccessMessage: (msg: string) => void;
  setGlobalError: (msg: string) => void;
}

export const EditProfileTab: React.FC<EditProfileTabProps> = ({
  user,
  onProfileUpdate,
  setSuccessMessage,
  setGlobalError,
}) => {
  const { login } = useAuth();

  // Form states initialized directly from user prop
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [banner, setBanner] = useState(user?.banner || "");
  const [isResolvingBanner, setIsResolvingBanner] = useState(false);
  const [seed, setSeed] = useState(() => {
    const avatarUrl = user?.avatar || "";
    const dicebearMatch = avatarUrl.match(/api\.dicebear\.com\/.*?\/svg\?seed=(.*)/);
    return dicebearMatch && dicebearMatch[1] ? decodeURIComponent(dicebearMatch[1]) : "";
  });

  // UI/Request states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  // Resolving external avatar URLs (like Pinterest)
  const handleResolveUrl = async () => {
    if (!avatar.trim()) return;
    setIsResolving(true);
    setGlobalError("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/resolve-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: avatar.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resolve image URL");
      }
      if (data.imageUrl) {
        setAvatar(data.imageUrl);
        setSuccessMessage("Successfully resolved image URL!");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resolving image URL";
      setGlobalError(msg);
    } finally {
      setIsResolving(false);
    }
  };

  const isResolvableUrl = avatar.trim().startsWith("http") && 
    (avatar.includes("pin.it") || 
     avatar.includes("pinterest.com") || 
     !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(avatar));

  const isBannerResolvable = banner.trim().startsWith("http") && 
    (banner.includes("pin.it") || 
     banner.includes("pinterest.com") || 
     !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(banner));

  const handleResolveBannerUrl = async () => {
    if (!banner.trim()) return;
    setIsResolvingBanner(true);
    setGlobalError("");
    setSuccessMessage("");
    try {
      const res = await fetch("/api/resolve-avatar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: banner.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resolve image URL");
      }
      if (data.imageUrl) {
        setBanner(data.imageUrl);
        setSuccessMessage("Successfully resolved banner image URL!");
        setTimeout(() => setSuccessMessage(""), 4000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error resolving image URL";
      setGlobalError(msg);
    } finally {
      setIsResolvingBanner(false);
    }
  };

  // Save profile changes
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
      banner: banner || "",
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
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          username,
          bio,
          image: avatar,
          banner,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "An error occurred while updating profile");
      }

      setSuccessMessage("Profile settings updated successfully!");
      login(); // Refresh layout header profile
      
      if (result.user) {
        onProfileUpdate(result.user);
      }

      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setGlobalError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
              <div className="flex gap-2">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 bg-(--input-bg) border border-(--input-border) rounded-xl text-xs text-(--foreground) focus:outline-none focus:border-(--input-focus-border) focus:ring-1 focus:ring-(--input-focus-ring) transition-all"
                />
                {isResolvableUrl && (
                  <button
                    type="button"
                    onClick={handleResolveUrl}
                    disabled={isResolving}
                    className="px-3.5 py-2 bg-orange/15 hover:bg-orange/25 border border-orange/20 rounded-xl text-[10px] font-bold text-orange hover:text-orange-600 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {isResolving ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-orange" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Resolving...</span>
                      </>
                    ) : (
                      <span>⚡ Resolve Link</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Cover URL */}
      <div className="p-5 rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-(--foreground) uppercase tracking-wider border-b border-(--divider-color) pb-2">
          Profile Banner Cover
        </h3>
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-dust-grey uppercase tracking-wider">
              Custom Banner Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://example.com/banner.jpg"
                className="flex-1 px-3 py-2 bg-(--input-bg) border border-(--input-border) rounded-xl text-xs text-(--foreground) focus:outline-none focus:border-(--input-focus-border) focus:ring-1 focus:ring-(--input-focus-ring) transition-all"
              />
              {isBannerResolvable && (
                <button
                  type="button"
                  onClick={handleResolveBannerUrl}
                  disabled={isResolvingBanner}
                  className="px-3.5 py-2 bg-orange/15 hover:bg-orange/25 border border-orange/20 rounded-xl text-[10px] font-bold text-orange hover:text-orange-600 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {isResolvingBanner ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-orange" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Resolving...</span>
                    </>
                  ) : (
                    <span>⚡ Resolve Link</span>
                  )}
                </button>
              )}
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
  );
};
