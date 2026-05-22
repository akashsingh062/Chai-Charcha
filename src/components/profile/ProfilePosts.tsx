"use client";

import React, { useEffect, useState } from "react";
import { Thread } from "@/app/(main)/post/postData";

interface UserProfileData {
  _id: string;
  name: string;
  username: string;
  email: string;
}

interface ProfilePostsProps {
  user: UserProfileData | null;
  onPostsCountChange: (count: number) => void;
}

export const ProfilePosts: React.FC<ProfilePostsProps> = ({ user, onPostsCountChange }) => {
  const [posts, setPosts] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onPostsCountChangeRef = React.useRef(onPostsCountChange);
  useEffect(() => {
    onPostsCountChangeRef.current = onPostsCountChange;
  }, [onPostsCountChange]);

  useEffect(() => {
    if (!user) return;

    let active = true;

    const fetchUserPosts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/posts");
        if (!res.ok) {
          throw new Error("Failed to fetch posts");
        }
        const data = await res.json();
        if (active && data?.posts) {
          // Filter posts where author is the logged-in user
          // Match by name/username/id to be fully robust
          const filtered = data.posts.filter((post: Thread) => {
            return (
              post.author?.id === user._id ||
              post.author?.username?.toLowerCase() === user.username.toLowerCase() ||
              post.author?.name === user.name
            );
          });
          setPosts(filtered);
          onPostsCountChangeRef.current(filtered.length);
        }
      } catch (err: unknown) {
        if (active) {
          const msg = err instanceof Error ? err.message : "Error loading posts feed";
          setError(msg);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchUserPosts();

    return () => {
      active = false;
    };
  }, [user]);

  const handleVote = async (id: string, type: "up" | "down") => {
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId: id,
          targetType: "Post",
          voteType: type,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit vote");
      }

      const result = await res.json();
      if (result.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                upvotes: result.score,
                userVoted: result.userVoted,
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error("Voting error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs p-5 shadow-sm animate-pulse space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-(--profile-bg)"></div>
                <div className="space-y-1">
                  <div className="h-3.5 bg-(--profile-bg) rounded-md w-24"></div>
                  <div className="h-2.5 bg-(--profile-bg) rounded-md w-16"></div>
                </div>
              </div>
              <div className="h-5 bg-(--profile-bg) rounded-full w-20"></div>
            </div>
            <div className="h-5 bg-(--profile-bg) rounded-md w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-(--profile-bg) rounded-md w-full"></div>
              <div className="h-3 bg-(--profile-bg) rounded-md w-5/6"></div>
            </div>
            <div className="flex justify-between items-center border-t border-(--divider-color) pt-4">
              <div className="h-7 bg-(--profile-bg) rounded-full w-16"></div>
              <div className="h-4 bg-(--profile-bg) rounded-md w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 rounded-2xl border border-red-500/20 bg-red-950/20 text-red-200">
        <p className="text-sm font-semibold">{error}</p>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 px-6 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background)/30 flex flex-col items-center justify-center">
        <div className="text-orange mb-2">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
          </svg>
        </div>
        <h3 className="text-base font-bold mt-2 text-(--foreground)">No charchas yet</h3>
        <p className="text-xs text-dust-grey mt-2 max-w-xs mx-auto leading-relaxed">
          You haven&apos;t started any technical discussions yet. Head over to the home page to start a new charcha!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <article
          key={post.id}
          className="rounded-2xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs p-5 shadow-sm hover:shadow-md hover:border-orange/20 transition-all duration-300"
        >
          {/* Author Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--profile-avatar-bg) text-2xs font-bold text-(--profile-avatar-text) shadow-sm overflow-hidden">
                {post.author.avatar && (post.author.avatar.startsWith("http") || post.author.avatar.startsWith("/")) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.author.avatar} alt={post.author.name} className="h-full w-full object-cover" />
                ) : (
                  post.author.avatar
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-(--foreground)">{post.author.name}</span>
                <span className="text-[10px] text-dust-grey font-mono leading-none mt-0.5">{post.author.role}</span>
              </div>
            </div>
            
            <span className="rounded-full text-[10px] font-bold border px-2 py-0.5 bg-stormy-teal/10 text-stormy-teal border-stormy-teal/25">
              {post.category || "Tech & Architecture"}
            </span>
          </div>

          {/* Title & Excerpt */}
          <h3 className="text-base sm:text-lg font-extrabold mt-3.5 tracking-tight text-(--foreground) leading-snug">
            {post.title}
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-(--text-secondary) leading-relaxed line-clamp-3">
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-semibold text-(--link-color)">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Footer Interactions */}
          <div className="mt-5 pt-4 border-t border-(--divider-color) flex items-center justify-between text-xs text-dust-grey">
            {/* Upvote & Downvote Component */}
            <div className="flex items-center gap-1 bg-(--profile-bg) border border-(--profile-border) rounded-full p-0.5">
              <button
                onClick={() => handleVote(post.id, "up")}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  post.userVoted === "up"
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
                post.userVoted === "up"
                  ? "text-spicy-paprika font-black"
                  : post.userVoted === "down"
                  ? "text-stormy-teal font-black"
                  : "text-(--text-role)"
              }`}>
                {post.upvotes}
              </span>

              <button
                onClick={() => handleVote(post.id, "down")}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  post.userVoted === "down"
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

            {/* Replies and Date */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742l1.684-1.684m0 0l-1.684-1.684m1.684 1.684h6.723M8.684 16.258l1.684-1.684m0 0l-1.684-1.684m1.684 1.684h6.723M3 21h18M3 3h18" />
                </svg>
                <span>{post.commentsCount} replies</span>
              </span>
              <span 
                title={post.createdAt ? new Date(post.createdAt).toLocaleString() : undefined}
                className="cursor-help hover:text-orange transition-colors"
              >
                {post.timeAgo}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
};
