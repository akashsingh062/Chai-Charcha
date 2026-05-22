import React from "react";
import { Thread } from "@/app/(main)/post/postData";
import { UserProfile } from "@/context/AuthContext";
import { ThreadCard } from "./ThreadCard";

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
}) => {
  return (
    <main className="lg:col-span-6 flex flex-col gap-6">
      
      {/* Quick Post Creator Box */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-(--profile-avatar-bg) text-xs font-bold text-(--profile-avatar-text) shadow-sm overflow-hidden">
            {userData?.avatar && (userData.avatar.startsWith("http") || userData.avatar.startsWith("/")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={userData.avatar} alt={userData.name} className="h-full w-full object-cover" />
            ) : (
              userData?.avatar || "JD"
            )}
          </div>
          <button
            onClick={onStartCharcha}
            className="flex-1 rounded-full border border-(--input-border) bg-(--input-bg) py-2 px-4 text-left text-sm text-dust-grey hover:bg-(--btn-icon-hover-bg) hover:border-orange/50 transition-all cursor-pointer"
          >
            Start a charcha... What&apos;s on your mind?
          </button>
        </div>
      </div>

      {/* Feed Controls Header */}
      <div className="flex items-center justify-between border-b border-(--divider-color) pb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-lg font-bold text-(--foreground)">Discussion Feed</span>
          <span className="text-xs text-dust-grey">({filteredThreads.length} topics)</span>
        </div>
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
            <p className="text-xs text-dust-grey mt-1">Be the first to ignite a technical discussion!</p>
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
            />
          ))
        )}
      </div>

    </main>
  );
};
