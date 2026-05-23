"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";
import { CreateCommunityModal } from "@/components/community/CreateCommunityModal";

interface CommunityInfo {
  _id: string;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  creator: string;
  isPrivate?: boolean;
  isJoined?: boolean;
  isPending?: boolean;
  rules?: string[];
  avatar?: string;
  banner?: string;
  createdAt: string;
}

export default function CommunitiesPage() {
  const { user } = useAuth();
  const [communities, setCommunities] = useState<CommunityInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateCommOpen, setIsCreateCommOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"joined" | "explore">("explore");
  const [exploreVisibleCount, setExploreVisibleCount] = useState(8);

  // Reset explore visible count when tab or search query changes
  useEffect(() => {
    setExploreVisibleCount(8);
  }, [searchQuery, activeTab]);

  // Sync active tab state to Joined by default if logged in
  useEffect(() => {
    setActiveTab(user ? "joined" : "explore");
  }, [user]);

  const fetchCommunities = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/api/communities?search=${encodeURIComponent(searchQuery)}`);
      if (res.data?.success && res.data?.communities) {
        setCommunities(res.data.communities);
      }
    } catch (err) {
      console.error("Failed to load communities:", err);
      toast.error("Failed to fetch communities. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCommunities();
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [fetchCommunities]);

  // Sync communities list on global event change
  useEffect(() => {
    const handleJoinedChanged = () => {
      fetchCommunities();
    };
    window.addEventListener("joined-communities-changed", handleJoinedChanged);
    return () => {
      window.removeEventListener("joined-communities-changed", handleJoinedChanged);
    };
  }, [fetchCommunities]);

  const handleJoinLeave = async (comm: CommunityInfo) => {
    if (!user) {
      toast.warning("Please pull up a chair and Log In to join this community!");
      return;
    }
    try {
      setActionLoadingId(comm._id);
      const action = (comm.isJoined || comm.isPending) ? "leave" : "join";
      const res = await axiosInstance.post(`/api/communities/${comm.slug}/join`, { action });
      
      if (res.data?.success) {
        setCommunities((prev) =>
          prev.map((c) => {
            if (c._id !== comm._id) return c;
            return {
              ...c,
              isJoined: res.data.isJoined || false,
              isPending: res.data.isPending || false,
              membersCount: res.data.membersCount,
            };
          })
        );
        
        if (res.data.isPending) {
          toast.success("Join request sent! Pending moderator approval.");
        } else {
          toast.success(res.data.isJoined ? `Joined c/${comm.slug}!` : `Left c/${comm.slug}!`);
        }
        
        window.dispatchEvent(new Event("joined-communities-changed"));
      }
    } catch (err) {
      console.error("Failed to update membership:", err);
      toast.error("Failed to update membership. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter based on active tab selection: Joined tab shows joined, Explore tab shows ONLY non-joined
  const filteredCommunities = communities.filter((comm) => {
    if (activeTab === "joined") {
      return comm.isJoined;
    }
    return !comm.isJoined; // Exclude already joined communities from the Explore tab
  });

  // Paginated communities specifically for Explore tab
  const displayedCommunities = activeTab === "explore"
    ? filteredCommunities.slice(0, exploreVisibleCount)
    : filteredCommunities;

  return (
    <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground) transition-all duration-300 min-h-screen">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Section */}
        <div className="w-full p-6 md:p-8 rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col gap-2 max-w-2xl relative z-10">
            <h1 className="text-2xl md:text-3xl font-black text-(--foreground) tracking-tight flex items-center gap-2.5">
              <svg className="w-8 h-8 text-spicy-paprika shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <span>Explore Communities</span>
            </h1>
            <p className="text-sm text-dust-grey font-medium leading-relaxed">
              Discover active developer circles, follow custom topics, ask questions, and share experiences. Join existing forums or build a brand-new space for your squad.
            </p>
          </div>
          <div className="relative z-10 shrink-0">
            {user && (
              <button
                onClick={() => setIsCreateCommOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 rounded-full bg-spicy-paprika px-6 py-3 text-sm font-extrabold text-floral-white shadow-lg shadow-spicy-paprika/20 transition-all duration-250 hover:bg-spicy-paprika-600 hover:shadow-spicy-paprika/30 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>Create Community</span>
              </button>
            )}
          </div>
        </div>

        {/* Search bar card */}
        <div className="w-full p-4 rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communities by name or description..."
              className="w-full bg-(--input-bg)/20 hover:bg-(--input-bg)/30 focus:bg-(--input-bg)/30 border border-(--input-border)/40 focus:border-spicy-paprika/30 text-sm px-4 py-3 pl-11 rounded-2xl outline-none transition-all placeholder-dust-grey/60 text-(--foreground) shadow-xs"
            />
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-dust-grey">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-dust-grey hover:text-spicy-paprika cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Toggle Selector */}
        <div className="w-full p-4 rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2 bg-(--input-bg)/25 p-1 rounded-2xl border border-(--input-border)/40 max-w-md w-full sm:w-auto">
            {user && (
              <button
                onClick={() => setActiveTab("joined")}
                className={`flex-1 sm:flex-initial text-center rounded-xl px-5 py-2.5 transition-all cursor-pointer font-bold text-xs ${
                  activeTab === "joined"
                    ? "bg-spicy-paprika text-floral-white shadow-sm"
                    : "text-dust-grey hover:text-(--foreground)"
                }`}
              >
                Joined Communities
              </button>
            )}
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex-1 sm:flex-initial text-center rounded-xl px-5 py-2.5 transition-all cursor-pointer font-bold text-xs ${
                activeTab === "explore" || !user
                  ? "bg-spicy-paprika text-floral-white shadow-sm"
                  : "text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Explore Communities
            </button>
          </div>
          
          <div className="text-xs text-dust-grey font-semibold">
            {activeTab === "joined" && user
              ? `Displaying ${filteredCommunities.length} communities you have joined.` 
              : `Displaying ${filteredCommunities.length} communities to explore.`
            }
          </div>
        </div>

        {/* Dynamic Grid Layout */}
        {isLoading && communities.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center justify-center text-dust-grey gap-3">
            <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-mono tracking-wider animate-pulse">Brewing active developer hubs...</span>
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs flex flex-col items-center justify-center p-8 shadow-sm">
            <div className="text-spicy-paprika mb-3.5 bg-spicy-paprika/5 p-4.5 rounded-full border border-spicy-paprika/10">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-extrabold text-(--foreground)">
              {activeTab === "joined" ? "You haven't joined any communities yet" : "No communities found"}
            </h3>
            <p className="text-xs text-dust-grey mt-2 max-w-sm leading-relaxed">
              {activeTab === "joined"
                ? "Explore communities below to browse and join active developer forums!"
                : `We couldn't find any community matching "${searchQuery}". You can create a new one to start the conversation!`
              }
            </p>
            {activeTab === "joined" && (
              <button
                onClick={() => setActiveTab("explore")}
                className="mt-5 rounded-full bg-orange px-6 py-2.5 text-xs font-bold text-ink-black hover:bg-orange-600 transition-all cursor-pointer active:scale-95 hover:scale-[1.02]"
              >
                Explore Communities
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedCommunities.map((comm) => {
                const isJoined = comm.isJoined;
                const isPending = comm.isPending;
                const isLoadingAction = actionLoadingId === comm._id;

                return (
                  <div
                    key={comm._id}
                    className="rounded-3xl border border-(--card-border) bg-(--card-background)/40 hover:bg-(--card-background)/70 backdrop-blur-xs p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01] hover:border-orange/15 flex flex-col justify-between group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="flex-1">
                      {/* Header Banner Background */}
                      <div className="h-16 w-full -mx-6 -mt-6 mb-4 relative overflow-hidden bg-linear-to-r from-orange/10 to-spicy-paprika/15 border-b border-(--card-border)/50">
                        {comm.banner && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={comm.banner} 
                            alt="" 
                            className="w-full h-full object-cover opacity-80" 
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-3.5 mb-4 relative z-10">
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-xs">
                          {comm.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={comm.avatar}
                              alt={comm.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/c/${comm.slug}`} className="block">
                            <h2 className="text-sm font-black text-(--foreground) truncate hover:text-orange transition-colors">
                              c/{comm.slug}
                            </h2>
                          </Link>
                          <span className="block text-[10px] text-dust-grey font-semibold mt-0.5 truncate">
                            {comm.name}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-(--text-secondary) line-clamp-3 leading-relaxed mb-5 min-h-[54px]">
                        {comm.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-(--card-border)/50 pt-4 mt-2">
                      <span className="text-[10px] font-bold text-dust-grey flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <span>{comm.membersCount} {comm.membersCount === 1 ? "member" : "members"}</span>
                      </span>

                      <div className="flex gap-2">
                        <Link 
                          href={`/c/${comm.slug}`}
                          className="rounded-full border border-(--input-border) bg-(--input-bg)/30 hover:bg-(--input-bg)/60 px-4 py-1.5 text-xs font-bold text-(--text-secondary) hover:text-(--foreground) transition-all active:scale-95 shrink-0"
                        >
                          Enter
                        </Link>

                        <button
                          disabled={isLoadingAction}
                          onClick={() => handleJoinLeave(comm)}
                          className={`rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm active:scale-95 transition-all min-w-[70px] flex items-center justify-center shrink-0 cursor-pointer ${
                            isJoined
                              ? "border border-spicy-paprika/20 bg-spicy-paprika/5 text-spicy-paprika hover:bg-spicy-paprika/15"
                              : isPending
                              ? "border border-orange/20 bg-orange/5 text-orange hover:bg-orange/15"
                              : "bg-orange hover:bg-orange-600 text-ink-black"
                          }`}
                        >
                          {isLoadingAction ? (
                            <svg className="animate-spin h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          ) : isJoined ? (
                            "Leave"
                          ) : isPending ? (
                            "Pending"
                          ) : (
                            "Join"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load More Button */}
            {!isLoading && activeTab === "explore" && exploreVisibleCount < filteredCommunities.length && (
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => setExploreVisibleCount((prev) => prev + 8)}
                  className="px-6 py-3 rounded-full border border-(--card-border) bg-(--card-background)/80 text-xs font-extrabold text-(--text-secondary) hover:text-(--foreground) hover:border-orange/30 hover:bg-orange/5 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 hover:scale-[1.02]"
                >
                  <span>Show More Communities</span>
                  <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {isCreateCommOpen && (
        <CreateCommunityModal
          onClose={() => setIsCreateCommOpen(false)}
          onSuccess={fetchCommunities}
        />
      )}
    </div>
  );
}
