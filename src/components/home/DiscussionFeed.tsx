import React, { useState } from "react";
import { Thread } from "@/types/post";
import { UserProfile } from "@/context/AuthContext";
import { ThreadCard } from "./ThreadCard";
import { getCleanAvatarUrl, isAvatarUrl } from "@/lib/avatarHelper";

interface DiscussionFeedProps {
  filteredThreads: Thread[];
  sortBy: "trending" | "recent";
  setSortBy: (val: "trending" | "recent") => void;
  onVote: (id: string, type: "up" | "down") => void;
  onTagClick: (tag: string) => void;
  onStartCharcha: () => void;
  userData: UserProfile | null;
  onAddComment: (threadId: string, text: string) => void;
  onAddReply: (threadId: string, commentId: string, text: string) => void;
  onEditSubmit: (threadId: string, commentId: string, text: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onCommentVote: (threadId: string, commentId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  onUpdateThread?: (thread: Thread) => void;
  onDeletePost?: (id: string) => void;
  hasMore?: boolean;
  isCommunityMod?: boolean;
  isBanned?: boolean;
  feedTab?: "all" | "home";
  setFeedTab?: (val: "all" | "home") => void;
}

export const DiscussionFeed: React.FC<DiscussionFeedProps> = ({
  filteredThreads,
  sortBy,
  setSortBy,
  onVote,
  onTagClick,
  onStartCharcha,
  userData,
  onAddComment,
  onAddReply,
  onEditSubmit,
  onDeleteComment,
  onCommentVote,
  onRefresh,
  isLoading = false,
  onUpdateThread,
  onDeletePost,
  hasMore = false,
  isCommunityMod = false,
  isBanned = false,
  feedTab,
  setFeedTab,
}) => {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <main className="lg:col-span-6 flex flex-col gap-6">
      
      {/* Quick Post Creator Box */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--profile-avatar-bg) text-xs font-bold text-(--profile-avatar-text) shadow-sm overflow-hidden">
            {isAvatarUrl(userData?.avatar) && !avatarError ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={getCleanAvatarUrl(userData?.avatar)} alt={userData?.name || "User"} className="h-full w-full object-cover" onError={() => setAvatarError(true)} />
            ) : (
              userData?.name ? userData.name.substring(0, 2).toUpperCase() : "JD"
            )}
          </div>
          <button
            onClick={isBanned ? undefined : onStartCharcha}
            className={`flex-1 rounded-full border py-2 px-4 text-left text-sm transition-all ${
              isBanned 
                ? "text-red-500/50 border-red-500/20 bg-red-500/5 cursor-not-allowed" 
                : "text-dust-grey border-(--input-border) bg-(--input-bg) hover:bg-(--btn-icon-hover-bg) hover:border-orange/50 cursor-pointer"
            }`}
            disabled={isBanned}
          >
            {isBanned ? "You are banned from starting a charcha in this community" : "Start a charcha... What's on your mind?"}
          </button>
        </div>
      </div>

      {/* Segmented Feed Tab Selector */}
      {feedTab && setFeedTab && (
        <div className="flex bg-(--card-background) border border-(--card-border) p-1 rounded-2xl shadow-xs self-start text-xs font-bold text-dust-grey select-none gap-1">
          <button
            onClick={() => setFeedTab("all")}
            className={`rounded-xl px-4 py-2 transition-all cursor-pointer select-none ${
              feedTab === "all"
                ? "bg-orange text-ink-black shadow-sm font-extrabold"
                : "hover:text-(--foreground)"
            }`}
          >
            All Discussions
          </button>
          <button
            onClick={() => setFeedTab("home")}
            className={`rounded-xl px-4 py-2 transition-all cursor-pointer select-none ${
              feedTab === "home"
                ? "bg-orange text-ink-black shadow-sm font-extrabold"
                : "hover:text-(--foreground)"
            }`}
          >
            My Feed (Home)
          </button>
        </div>
      )}

      {/* Feed Controls Header */}
      <div className="flex items-center justify-between border-b border-(--divider-color) pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-(--foreground)">Discussion Feed</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`p-1.5 rounded-full border border-(--card-border) bg-(--card-background) text-dust-grey hover:text-orange hover:border-orange/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center ${
                isLoading ? "animate-spin text-orange border-orange/30" : ""
              }`}
              title="Refresh Feed"
              aria-label="Refresh Feed"
              disabled={isLoading}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          )}

          <div className="flex rounded-full border border-(--card-border) bg-(--card-background) p-0.5 shadow-sm text-xs font-semibold">
            <button
              onClick={() => setSortBy("trending")}
              className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                sortBy === "trending" ? "bg-spicy-paprika text-floral-white" : "text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Trending
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                sortBy === "recent" ? "bg-spicy-paprika text-floral-white" : "text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Recent
            </button>
          </div>
        </div>
      </div>

      {/* Discussion Thread List */}
      <div className="flex flex-col gap-4">
        {filteredThreads.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background) flex flex-col items-center justify-center">
            <div className="text-orange mb-2">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
              </svg>
            </div>
            <h3 className="text-base font-bold mt-1 text-(--foreground)">No charchas found</h3>
            <p className="text-xs text-dust-grey mt-1">Be the first to ignite a discussion!</p>
          </div>
        ) : (
          filteredThreads.map((thread) => (
            <ThreadCard
              key={thread.id}
              thread={thread}
              onVote={onVote}
              onTagClick={onTagClick}
              onAddComment={onAddComment}
              onAddReply={onAddReply}
              onEditSubmit={onEditSubmit}
              onDeleteComment={onDeleteComment}
              onCommentVote={onCommentVote}
              onUpdateThread={onUpdateThread}
              onDeletePost={onDeletePost}
              isCommunityMod={isCommunityMod}
            />
          ))
        )}
      </div>

      {hasMore && (
        <div className="py-6 flex justify-center items-center gap-2 border-t border-(--divider-color)/10 mt-2 animate-fade-in">
          <div className="w-5 h-5 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-dust-grey font-semibold">Brewing more charchas...</span>
        </div>
      )}

    </main>
  );
};
