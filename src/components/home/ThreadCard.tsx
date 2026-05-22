import React from "react";
import { Thread } from "@/app/(main)/post/postData";

interface ThreadCardProps {
  thread: Thread;
  onVote: (id: string, type: "up" | "down") => void;
  onTagClick?: (tag: string) => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({ thread, onVote, onTagClick }) => {
  return (
    <article className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-orange/20 transition-all duration-300">
      {/* Author card & Category tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--profile-avatar-bg)] text-2xs font-bold text-[var(--profile-avatar-text)] shadow-sm overflow-hidden">
            {thread.author.avatar && (thread.author.avatar.startsWith("http") || thread.author.avatar.startsWith("/")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thread.author.avatar} alt={thread.author.name} className="h-full w-full object-cover" />
            ) : (
              thread.author.avatar
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-[var(--foreground)]">{thread.author.name}</span>
            <span className="text-[10px] text-dust-grey font-mono leading-none mt-0.5">{thread.author.role}</span>
          </div>
        </div>
        
        <span className={`rounded-full text-[10px] font-bold border px-2 py-0.5 ${
          thread.category === "Tech & Architecture"
            ? "bg-stormy-teal/10 text-stormy-teal border-stormy-teal/25"
            : "bg-spicy-paprika/10 text-spicy-paprika border-spicy-paprika/25"
        }`}>
          {thread.category}
        </span>
      </div>

      {/* Title & Excerpt */}
      <h3 className="text-base sm:text-lg font-extrabold mt-3.5 tracking-tight text-[var(--foreground)] leading-snug">
        {thread.title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
        {thread.excerpt}
      </p>

      {/* Hashtags list */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {thread.tags.map((tag) => (
          <span 
            key={tag} 
            onClick={() => onTagClick?.(tag)}
            className="text-[10px] font-semibold text-[var(--link-color)] hover:text-[var(--link-hover-color)] transition-colors cursor-pointer"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Bottom Footer Interactions */}
      <div className="mt-5 pt-4 border-t border-[var(--divider-color)] flex items-center justify-between text-xs text-dust-grey">
        
        {/* Interactive Upvote & Downvote component */}
        <div className="flex items-center gap-1 bg-[var(--profile-bg)] border border-[var(--profile-border)] rounded-full p-0.5">
          <button
            onClick={() => onVote(thread.id, "up")}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              thread.userVoted === "up"
                ? "bg-spicy-paprika text-floral-white shadow-sm"
                : "hover:bg-[var(--btn-icon-hover-bg)] hover:text-spicy-paprika"
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
              : "text-[var(--text-role)]"
          }`}>
            {thread.upvotes}
          </span>

          <button
            onClick={() => onVote(thread.id, "down")}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              thread.userVoted === "down"
                ? "bg-stormy-teal text-floral-white shadow-sm"
                : "hover:bg-[var(--btn-icon-hover-bg)] hover:text-stormy-teal"
            }`}
            aria-label="Downvote"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
        </div>

        {/* Visual Statistics (Views and Comments) */}
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l1.684-1.684m0 0l-1.684-1.684m1.684 1.684h6.723M8.684 16.258l1.684-1.684m0 0l-1.684-1.684m1.684 1.684h6.723M3 21h18M3 3h18" />
            </svg>
            <span>{thread.commentsCount} replies</span>
          </span>
          <span className="hidden sm:inline">{thread.views} views</span>
          <span>{thread.timeAgo}</span>
        </div>

      </div>
    </article>
  );
};
