"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";

interface UserProfileData {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
  role: "member" | "moderator" | "admin";
  karma: number;
  joinedCommunities?: string[];
  followers?: string[];
  following?: string[];
  createdAt: string;
}

interface ProfileDetailsProps {
  user: UserProfileData | null;
  isLoading: boolean;
  postCount: number;
  isOwnProfile?: boolean;
  onProfileUpdate?: (updatedUser: UserProfileData) => void;
}

export const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  user,
  isLoading,
  postCount,
  isOwnProfile = true,
  onProfileUpdate
}) => {
  const { user: isLoggedIn } = useAuth();
  const router = useRouter();

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Fetch follow status if viewing another profile
  useEffect(() => {
    if (!isOwnProfile && user && isLoggedIn) {
      axiosInstance
        .get(`/api/follow/status?targetUserId=${user._id}`)
        .then((res) => {
          setIsFollowing(res.data.following);
        })
        .catch((err) => {
          console.error("Error loading follow status:", err);
        });
    }
  }, [isOwnProfile, user, isLoggedIn]);

  const handleFollowToggle = async () => {
    if (!isLoggedIn) {
      toast.warning("Please Log In to follow other developers!");
      router.push("/auth/signin");
      return;
    }
    if (!user || isFollowLoading) return;

    try {
      setIsFollowLoading(true);
      const res = await axiosInstance.post("/api/follow", {
        targetUserId: user._id
      });
      if (res.data?.success) {
        setIsFollowing(res.data.following);
        toast.success(res.data.following ? `Following ${user.name}` : `Unfollowed ${user.name}`);

        // Update local arrays to sync counts
        if (onProfileUpdate && user.followers) {
          const currentUserId = user._id; // Placeholder ID update
          const updatedFollowers = res.data.following
            ? [...(user.followers || []), currentUserId] // Add placeholder
            : (user.followers || []).filter((id) => id !== currentUserId);

          onProfileUpdate({
            ...user,
            followers: updatedFollowers
          });
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md overflow-hidden animate-pulse">
        {/* Banner cover skeleton */}
        <div className="h-32 sm:h-44 bg-(--profile-bg) w-full"></div>
        
        {/* Profile Info block */}
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 mb-6 gap-4">
            {/* Avatar circle */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-(--profile-bg) border-4 border-(--card-background) shadow-lg shrink-0"></div>
            {/* Button placeholder */}
            <div className="h-10 bg-(--profile-bg) rounded-xl w-32 sm:self-end"></div>
          </div>

          {/* Texts placeholder */}
          <div className="space-y-3 mb-6">
            <div className="h-6 bg-(--profile-bg) rounded-md w-1/3"></div>
            <div className="h-4 bg-(--profile-bg) rounded-md w-1/4"></div>
            <div className="h-4 bg-(--profile-bg) rounded-md w-1/2"></div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-(--divider-color) pt-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-4 bg-(--profile-bg) rounded-md w-1/2 mx-auto"></div>
                <div className="h-6 bg-(--profile-bg) rounded-md w-1/3 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full text-center py-12 rounded-3xl border border-dashed border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs">
        <span className="text-4xl">🕵️‍♂️</span>
        <h3 className="text-lg font-bold mt-4 text-(--foreground)">Profile Not Found</h3>
        <p className="text-sm text-dust-grey mt-2">Could not find user details in the database.</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-orange text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-all">
          Go Home
        </Link>
      </div>
    );
  }

  // Format joined date
  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "May 2026";

  // Map roles to tags
  const roleColors = {
    admin: "bg-red-500/10 text-red-400 border-red-500/25",
    moderator: "bg-purple-500/10 text-purple-400 border-purple-500/25",
    member: "bg-orange/10 text-orange border-orange/25",
  };

  return (
    <div className="w-full rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
      {/* Visual Cover Banner */}
      <div className="relative h-32 sm:h-44 bg-linear-to-r from-orange/20 via-spicy-paprika/20 to-purple-600/10 w-full overflow-hidden border-b border-(--card-border)">
        {/* Geometric Accent Shapes */}
        <div className="absolute top-2 right-4 text-xs font-mono text-dust-grey/30 select-none pointer-events-none hidden sm:block">
          console.log(&quot;chai_charcha&quot;);
        </div>
        <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-orange/5 blur-xl"></div>
        <div className="absolute top-6 right-24 w-32 h-32 rounded-full bg-purple-600/5 blur-2xl"></div>
      </div>

      {/* Profile Header Wrapper */}
      <div className="px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 mb-5 gap-4">
          {/* Avatar Area */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-(--profile-avatar-bg) border-4 border-(--card-background) p-1 flex items-center justify-center shadow-xl shrink-0 overflow-hidden group">
            {user.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar}
                alt={`${user.name}'s Avatar`}
                className="w-full h-full rounded-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${user.username}`;
                }}
              />
            ) : (
              <span className="text-3xl font-extrabold text-(--profile-avatar-text) select-none">
                {user.name.substring(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          {/* Actions button group */}
          {isOwnProfile ? (
            <Link
              href="/settings"
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-linear-to-r from-orange/10 to-spicy-paprika/10 hover:from-orange/20 hover:to-spicy-paprika/20 border border-orange/20 hover:border-orange/40 rounded-xl text-sm font-bold text-orange hover:text-orange-600 transition-all duration-200 cursor-pointer active:scale-95 whitespace-nowrap self-start sm:self-end"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              <span>Edit Profile</span>
            </Link>
          ) : (
            <div className="flex gap-2 self-start sm:self-end">
              <button
                onClick={handleFollowToggle}
                disabled={isFollowLoading}
                className={`flex items-center justify-center gap-1.5 px-4 py-2.5 border rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer active:scale-95 ${
                  isFollowing
                    ? "bg-(--profile-bg) border-(--profile-border) text-(--text-role) hover:border-red-500/25 hover:text-red-400 hover:bg-red-950/10"
                    : "bg-orange border-orange hover:bg-orange-600 text-ink-black shadow-md shadow-orange/10"
                }`}
              >
                <span>{isFollowing ? "Following" : "Follow"}</span>
              </button>

              <Link
                href={`/messages?chatWith=${user._id}`}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-linear-to-r from-orange/10 to-spicy-paprika/10 hover:from-orange/20 hover:to-spicy-paprika/20 border border-orange/20 hover:border-orange/40 rounded-xl text-xs font-bold text-orange hover:text-orange-600 transition-all duration-200 cursor-pointer active:scale-95"
              >
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379L12 21l3.12-3.134c1.153-.086 2.294-.213 3.423-.379 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                <span>Message</span>
              </Link>
            </div>
          )}
        </div>

        {/* User Identity Details */}
        <div className="space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-(--foreground)">
                {user.name}
              </h1>
              {user.role && (
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wide ${roleColors[user.role]}`}>
                  {user.role}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1 text-sm text-dust-grey">
              <span className="font-semibold text-orange/90 font-mono">@{user.username}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(user.username);
                  toast.success("Username copied to clipboard!");
                }}
                className="p-1 rounded-lg text-dust-grey hover:text-orange hover:bg-orange/10 active:scale-90 transition-all duration-200 cursor-pointer flex items-center justify-center shrink-0"
                title="Copy Username"
                aria-label="Copy Username"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6A2.25 2.25 0 008.25 10.5v6" />
                </svg>
              </button>
              <span className="text-dust-grey/40">•</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                <span>Joined {joinedDate}</span>
              </span>
            </div>
          </div>

          {/* User Bio */}
          {user.bio ? (
            <p className="text-sm text-(--text-secondary) leading-relaxed bg-(--profile-bg)/40 p-4 rounded-2xl border border-(--card-border)">
              {user.bio}
            </p>
          ) : (
            <p className="text-sm italic text-dust-grey bg-(--profile-bg)/20 p-4 rounded-2xl border border-dashed border-(--card-border)">
              &quot;This developer hasn&apos;t brewed a bio yet.&quot;
            </p>
          )}

          {/* Connection Stats counters */}
          <div className="flex gap-4 text-xs font-semibold text-dust-grey">
            <Link
              href={`/followers?username=${user.username}&tab=followers`}
              className="hover:text-orange transition-colors flex gap-1"
            >
              <span className="font-extrabold text-(--foreground)">
                {user.followers?.length || 0}
              </span>
              <span>followers</span>
            </Link>
            <Link
              href={`/followers?username=${user.username}&tab=following`}
              className="hover:text-orange transition-colors flex gap-1"
            >
              <span className="font-extrabold text-(--foreground)">
                {user.following?.length || 0}
              </span>
              <span>following</span>
            </Link>
          </div>

          {/* Interactive Stats Grid */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t border-(--divider-color) pt-6 mt-2">
            
            {/* Reputation/Karma */}
            <div className="text-center p-2 sm:p-3 rounded-2xl bg-(--profile-bg)/30 border border-(--card-border) hover:border-orange/20 transition-all group">
              <span className="block text-[9px] sm:text-2xs font-extrabold text-dust-grey uppercase tracking-wider mb-1 truncate">
                Reputation
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-orange group-hover:scale-105 transition-transform inline-block">
                {user.karma || 0}
              </span>
            </div>

            {/* Posts Created */}
            <div className="text-center p-2 sm:p-3 rounded-2xl bg-(--profile-bg)/30 border border-(--card-border) hover:border-spicy-paprika/20 transition-all group">
              <span className="block text-[9px] sm:text-2xs font-extrabold text-dust-grey uppercase tracking-wider mb-1 truncate">
                Charchas
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-spicy-paprika group-hover:scale-105 transition-transform inline-block">
                {postCount}
              </span>
            </div>

            {/* Communities */}
            <div className="text-center p-2 sm:p-3 rounded-2xl bg-(--profile-bg)/30 border border-(--card-border) hover:border-purple-500/20 transition-all group">
              <span className="block text-[9px] sm:text-2xs font-extrabold text-dust-grey uppercase tracking-wider mb-1 truncate">
                Guilds
              </span>
              <span className="text-lg sm:text-xl font-black font-mono text-purple-400 group-hover:scale-105 transition-transform inline-block">
                {user.joinedCommunities?.length || 0}
              </span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
