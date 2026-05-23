import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

interface CommunityItem {
  _id: string;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  isPrivate?: boolean;
}

export const FeedRightSidebar: React.FC = () => {
  const [trendingCommunities, setTrendingCommunities] = useState<CommunityItem[]>([]);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(true);

  const loadCommunities = useCallback(async () => {
    try {
      setIsLoadingCommunities(true);
      const res = await axiosInstance.get("/api/communities");
      if (res.data?.communities) {
        setTrendingCommunities(res.data.communities.slice(0, 4));
      }
    } catch (err) {
      console.error("Error loading communities in sidebar:", err);
    } finally {
      setIsLoadingCommunities(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCommunities();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCommunities]);

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      
      {/* 1. Trending Communities Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-dust-grey/85 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253" />
            </svg>
            Popular Guilds
          </h2>
          <button 
            onClick={loadCommunities}
            className="text-[9px] font-bold text-orange hover:underline cursor-pointer"
            title="Refresh Guilds"
          >
            Refresh
          </button>
        </div>

        {isLoadingCommunities ? (
          <div className="flex flex-col gap-3.5 p-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex flex-col gap-1.5">
                  <div className="w-24 h-2 bg-(--input-border)/50 rounded-sm" />
                  <div className="w-16 h-1.5 bg-(--input-border)/40 rounded-sm" />
                </div>
                <div className="w-10 h-5 bg-(--input-border)/50 rounded-md" />
              </div>
            ))}
          </div>
        ) : trendingCommunities.length === 0 ? (
          <p className="text-2xs text-dust-grey/85 text-center py-4 italic">
            No guilds found. Create the first one!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {trendingCommunities.map((c) => (
              <div
                key={c._id}
                className="flex items-center justify-between p-2 rounded-xl bg-(--profile-bg)/20 border border-(--card-border)/45 hover:border-orange/20 transition-all duration-200"
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-(--foreground) truncate leading-tight">
                    c/{c.slug}
                  </span>
                  <span className="text-[9px] text-dust-grey/85 leading-none mt-1 truncate">
                    {c.membersCount} {c.membersCount === 1 ? "member" : "members"}
                  </span>
                </div>

                <Link
                  href={`/c/${c.slug}`}
                  className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg bg-orange hover:bg-orange-600 text-ink-black transition-all shrink-0 cursor-pointer text-center select-none"
                >
                  Visit
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

    </aside>
  );
};
