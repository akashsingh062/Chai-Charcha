"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";

interface FollowedUser {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  bio?: string;
  karma: number;
  role?: string;
}

function FollowersPageContent() {
  const { user: isLoggedIn, userData } = useAuth();
  const searchParams = useSearchParams();

  const userIdParam = searchParams.get("userId") || "";
  const usernameParam = searchParams.get("username") || "";
  const initialTab = (searchParams.get("tab") as "followers" | "following") || "followers";

  // States
  const [activeTab, setActiveTab] = useState<"followers" | "following">(initialTab);
  const [list, setList] = useState<FollowedUser[]>([]);
  const [myFollowingIds, setMyFollowingIds] = useState<string[]>([]);
  const [targetUser, setTargetUser] = useState<{ name: string; username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load followers/following list
  const fetchFollowList = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Determine query params
      let params = `?type=${activeTab}`;
      if (userIdParam) {
        params += `&userId=${userIdParam}`;
      } else if (usernameParam) {
        params += `&username=${usernameParam}`;
      } else if (userData?.id) {
        params += `&userId=${userData.id}`;
      } else {
        // Safe check
        setIsLoading(false);
        return;
      }

      const res = await axiosInstance.get(`/api/follow/list${params}`);
      if (res.data?.list) {
        setList(res.data.list);
      }

      // Also get the target user details for header display if not the logged in user
      if (userIdParam || usernameParam) {
        const profileParams = userIdParam ? `?all=true` : `?username=${usernameParam}`;
        const profileRes = await axiosInstance.get(`/api/profile${profileParams}`);
        if (profileRes.data?.user) {
          setTargetUser({
            name: profileRes.data.user.name,
            username: profileRes.data.user.username
          });
        } else if (profileRes.data?.users && userIdParam) {
          const matched = profileRes.data.users.find((u: { _id: string; name: string; username: string }) => u._id === userIdParam);
          if (matched) {
            setTargetUser({
              name: matched.name,
              username: matched.username
            });
          }
        }
      } else if (userData) {
        setTargetUser({
          name: userData.name,
          username: userData.email.split("@")[0] // Fallback username prefix
        });
      }
    } catch (err: unknown) {
      console.error("Error loading follow list:", err);
      const axiosErr = err as { response?: { data?: { error?: string } } };
      setError(axiosErr.response?.data?.error || "Failed to load member profiles list");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, userIdParam, usernameParam, userData]);

  // Fetch logged in user's own following list to render toggle buttons correctly
  const fetchMyFollowing = useCallback(async () => {
    if (!isLoggedIn || !userData?.id) return;
    try {
      const res = await axiosInstance.get(`/api/follow/list?userId=${userData.id}&type=following`);
      if (res.data?.list) {
        setMyFollowingIds(res.data.list.map((u: FollowedUser) => u._id));
      }
    } catch (err) {
      console.error("Error loading own following ids:", err);
    }
  }, [isLoggedIn, userData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFollowList();
      fetchMyFollowing();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchFollowList, fetchMyFollowing]);

  // Handle follow/unfollow toggle on the card
  const handleFollowToggle = async (targetId: string) => {
    if (!userData) {
      toast.warning("Please Log In to follow other users!");
      return;
    }
    try {
      const res = await axiosInstance.post("/api/follow", { targetUserId: targetId });
      if (res.data?.success) {
        const following = res.data.following;
        toast.success(following ? "User followed!" : "User unfollowed!");
        setMyFollowingIds((prev) =>
          following ? [...prev, targetId] : prev.filter((id) => id !== targetId)
        );

        // If viewing own following tab, remove the user from list dynamically
        if (!userIdParam && !usernameParam && activeTab === "following" && !following) {
          setList((prev) => prev.filter((u) => u._id !== targetId));
        }
      }
    } catch (err) {
      console.error("Error toggling follow:", err);
    }
  };

  return (
    <div className="min-h-screen bg-(--nav-bg) text-(--foreground) transition-all duration-300">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Header Section */}
        <div className="mb-8 border-b border-(--divider-color) pb-5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-(--foreground) flex items-center gap-2.5">
            <span>
              {targetUser
                ? `${targetUser.name}'s Connection Network`
                : "Member Network"}
            </span>
          </h1>
          <p className="text-xs text-dust-grey mt-1.5 font-medium">
            {targetUser
              ? `Browse who @${targetUser.username} follows and their community network.`
              : "Discover member profiles, connections, and followers."}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-(--divider-color) mb-6 gap-6 text-sm font-bold">
          <button
            onClick={() => setActiveTab("followers")}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === "followers"
                ? "text-spicy-paprika font-extrabold border-b-2 border-spicy-paprika"
                : "text-dust-grey hover:text-(--foreground)"
            }`}
          >
            Followers ({activeTab === "followers" ? list.length : "..."})
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`pb-3 transition-colors cursor-pointer relative ${
              activeTab === "following"
                ? "text-spicy-paprika font-extrabold border-b-2 border-spicy-paprika"
                : "text-dust-grey hover:text-(--foreground)"
            }`}
          >
            Following ({activeTab === "following" ? list.length : "..."})
          </button>
        </div>

        {/* Grid List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs p-5 shadow-sm animate-pulse flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-(--profile-bg) shrink-0"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-(--profile-bg) rounded-md w-3/4"></div>
                  <div className="h-3 bg-(--profile-bg) rounded-md w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center p-8 rounded-2xl border border-red-500/20 bg-red-950/20 text-red-200">
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background)/30 flex flex-col items-center justify-center p-6">
            <div className="text-dust-grey mb-3 text-4xl">👥</div>
            <h3 className="text-lg font-bold text-(--foreground)">
              No profiles found
            </h3>
            <p className="text-xs text-dust-grey mt-1.5 max-w-sm">
              {activeTab === "followers"
                ? "This user doesn't have any followers yet."
                : "This user isn't following anyone yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {list.map((u) => {
              const isFollowing = myFollowingIds.includes(u._id);
              const isSelf = userData?.id === u._id;

              return (
                <div
                  key={u._id}
                  className="rounded-2xl border border-(--card-border) bg-(--card-background)/35 hover:bg-(--card-background)/60 backdrop-blur-xs p-5 shadow-sm flex items-center justify-between gap-4 transition-all duration-300 hover:shadow-md"
                >
                  <Link
                    href={`/profile?username=${u.username}`}
                    className="flex items-center gap-3.5 min-w-0 flex-1 group"
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-(--profile-avatar-bg) border border-(--profile-border) flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {u.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${u.username}`;
                          }}
                        />
                      ) : (
                        <span className="text-sm font-extrabold text-(--profile-avatar-text)">
                          {u.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-(--foreground) truncate group-hover:text-orange transition-colors">
                          {u.name}
                        </span>
                        {u.karma > 0 && (
                          <span className="rounded-full bg-orange/10 border border-orange/20 px-1.5 py-0.5 text-[9px] font-extrabold font-mono text-orange">
                            {u.karma}★
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-dust-grey font-semibold mt-0.5 font-mono truncate">
                        @{u.username}
                      </span>
                      {u.bio && (
                        <p className="text-[11px] text-dust-grey line-clamp-1 mt-1 font-medium">
                          {u.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Actions (Follow / Message) */}
                  {!isSelf && isLoggedIn && (
                    <button
                      onClick={() => handleFollowToggle(u._id)}
                      className={`rounded-xl px-3.5 py-2 text-[10px] font-extrabold transition-all cursor-pointer select-none active:scale-95 ${
                        isFollowing
                          ? "bg-(--profile-bg) border border-(--profile-border) text-(--text-role) hover:border-red-500/35 hover:text-red-400 hover:bg-red-950/10"
                          : "bg-orange hover:bg-orange-600 text-ink-black shadow-md shadow-orange/10"
                      }`}
                    >
                      {isFollowing ? "Unfollow" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function FollowersPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 bg-(--background) items-center justify-center py-20 text-dust-grey gap-3">
        <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider animate-pulse">Brewing connections dashboard...</span>
      </div>
    }>
      <FollowersPageContent />
    </Suspense>
  );
}
