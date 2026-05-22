import React, { useState } from "react";
import { Thread } from "@/app/(main)/post/postData";
import { CommentSection } from "../post/CommentSection";

interface ThreadCardProps {
  thread: Thread;
  onVote: (id: string, type: "up" | "down") => void;
  onTagClick?: (tag: string) => void;
  onAddComment: (threadId: string, text: string) => void;
  onAddReply: (threadId: string, commentId: string, text: string) => void;
  onEditSubmit: (threadId: string, commentId: string, text: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onCommentVote: (threadId: string, commentId: string) => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  onVote,
  onTagClick,
  onAddComment,
  onAddReply,
  onEditSubmit,
  onDeleteComment,
  onCommentVote,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <article className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-orange/20 transition-all duration-300">
      {/* Author card & Category tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--profile-avatar-bg) text-2xs font-bold text-(--profile-avatar-text) shadow-sm overflow-hidden">
            {thread.author.avatar && (thread.author.avatar.startsWith("http") || thread.author.avatar.startsWith("/")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thread.author.avatar} alt={thread.author.name} className="h-full w-full object-cover" />
            ) : (
              thread.author.avatar
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-(--foreground)">{thread.author.name}</span>
            <span className="text-[10px] text-dust-grey font-mono leading-none mt-0.5">{thread.author.role}</span>
          </div>
        </div>
        
        <span className={`rounded-full text-[10px] font-bold border px-2 py-0.5 ${
          (() => {
            const cat = thread.category.toLowerCase().trim();
            if (cat === "tech & architecture" || cat === "tech") {
              return "bg-stormy-teal/10 text-stormy-teal border-stormy-teal/25";
            }
            if (cat === "career prep" || cat === "career") {
              return "bg-spicy-paprika/10 text-spicy-paprika border-spicy-paprika/25";
            }
            if (cat === "general charcha" || cat === "general") {
              return "bg-orange/10 text-orange border-orange/25";
            }
            if (cat === "showcase") {
              return "bg-vivid-tangerine/10 text-vivid-tangerine border-vivid-tangerine/25";
            }
            return "bg-brandy/10 text-brandy-700 border-brandy-700/25";
          })()
        }`}>
          {thread.category}
        </span>
      </div>

      {/* Title & Excerpt */}
      <h3 className="text-base sm:text-lg font-extrabold mt-3.5 tracking-tight text-(--foreground) leading-snug">
        {thread.title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-(--text-secondary) leading-relaxed line-clamp-3">
        {thread.excerpt}
      </p>

      {/* Hashtags list */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {thread.tags.map((tag) => (
          <span 
            key={tag} 
            onClick={() => onTagClick?.(tag)}
            className="text-[10px] font-semibold text-(--link-color) hover:text-(--link-hover-color) transition-colors cursor-pointer"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Bottom Footer Interactions */}
      <div className="mt-5 pt-4 border-t border-(--divider-color) flex items-center justify-between text-xs text-dust-grey">
        
        {/* Interactive Upvote & Downvote component */}
        <div className="flex items-center gap-1 bg-(--profile-bg) border border-(--profile-border) rounded-full p-0.5">
          <button
            onClick={() => onVote(thread.id, "up")}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              thread.userVoted === "up"
                ? "bg-spicy-paprika text-floral-white shadow-sm"
                : "hover:bg-(--btn-icon-hover-bg) hover:text-spicy-paprika"
            }`}
            aria-label="Upvote"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
          
          <span className={`px-1.5 font-bold font-mono text-center min-w-4 text-xs ${
            thread.userVoted === "up"
              ? "text-spicy-paprika font-black"
              : thread.userVoted === "down"
              ? "text-stormy-teal font-black"
              : "text-(--text-role)"
          }`}>
            {thread.upvotes}
          </span>

          <button
            onClick={() => onVote(thread.id, "down")}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              thread.userVoted === "down"
                ? "bg-stormy-teal text-floral-white shadow-sm"
                : "hover:bg-(--btn-icon-hover-bg) hover:text-stormy-teal"
            }`}
            aria-label="Downvote"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Visual Statistics (Views and Comments) */}
        <div className="flex items-center gap-4 text-[10px] sm:text-xs">
          <span className="hidden sm:inline">{thread.views} views</span>
          
          <button 
            onClick={() => setIsExpanded(prev => !prev)}
            className={`flex items-center gap-1.5 transition-all duration-300 font-bold px-3 py-1.5 rounded-full border border-orange/20 cursor-pointer ${
              isExpanded 
                ? "bg-orange/15 text-orange hover:bg-orange/25" 
                : "text-orange hover:bg-orange/10 hover:text-orange"
            }`}
            aria-expanded={isExpanded}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.92 1.613c-.46.505-.15 1.37.536 1.24A9.101 9.101 0 0012 20.25z" />
            </svg>
            <span>{thread.commentsCount} replies</span>
          </button>
          
          <span 
            title={thread.createdAt ? new Date(thread.createdAt).toLocaleString() : undefined}
            className="cursor-help hover:text-orange transition-colors"
          >
            {thread.timeAgo}
          </span>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { height: 0; opacity: 0; transform: translateY(-10px); }
          to { height: auto; opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-(--divider-color) animate-slide-down">
          <CommentSection 
            thread={thread}
            onAddComment={onAddComment}
            onAddReply={onAddReply}
            onEditSubmit={onEditSubmit}
            onDeleteComment={onDeleteComment}
            onCommentVote={onCommentVote}
          />
        </div>
      )}
    </article>
  );
};
