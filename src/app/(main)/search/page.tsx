"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Thread } from "@/app/(main)/post/postData";
import { ThreadCard } from "@/components/home/ThreadCard";
import axiosInstance from "@/lib/axios";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  updateCommentVote 
} from "@/components/post/commentHelpers";
import Fuse from "fuse.js";
import { FUSE_OPTIONS } from "@/lib/search/fuseConfig";
import { rankSearchResults } from "@/lib/search/ranking";
import { mapPostToSearchItem } from "@/lib/search/dataset";

function SearchPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sortBy, setSortBy] = useState<"relevance" | "popular" | "recent">("relevance");
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  // Fetch all posts from API
  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/api/posts?sort=recent");
      if (res.data?.posts) {
        setThreads(res.data.posts);
      }
    } catch (err) {
      console.error("Error loading posts for search:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPosts]);

  // Reset pagination on filter or query change
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(10);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeCategory, queryParam, selectedTag, sortBy]);

  // Handle Voting
  const handleVote = async (id: string, type: "up" | "down") => {
    if (!user) {
      alert("Please pull up a chair and Log In to vote!");
      return;
    }
    try {
      const res = await axiosInstance.post("/api/votes", {
        targetId: id,
        targetType: "Post",
        voteType: type,
      });

      if (res.data?.success) {
        setThreads((prevThreads) =>
          prevThreads.map((t) => {
            if (t.id !== id) return t;
            return {
              ...t,
              upvotes: res.data.score,
              userVoted: res.data.userVoted,
            };
          })
        );
      }
    } catch (err) {
      console.error("Error submitting vote:", err);
    }
  };

  // Comments handlers (to keep ThreadCard completely functional!)
  const handleAddComment = async (threadId: string, text: string) => {
    try {
      const res = await axiosInstance.post("/api/comments", {
        postId: threadId,
        content: text,
      });
      if (res.data?.comment) {
        setThreads((prevThreads) =>
          prevThreads.map((post) => {
            if (post.id !== threadId) return post;
            const currentComments = post.comments || [];
            return {
              ...post,
              commentsCount: post.commentsCount + 1,
              comments: [...currentComments, res.data.comment],
            };
          })
        );
      }
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleAddReply = async (threadId: string, commentId: string, text: string) => {
    try {
      const res = await axiosInstance.post("/api/comments", {
        postId: threadId,
        content: text,
        parentId: commentId,
      });
      if (res.data?.comment) {
        setThreads((prevThreads) =>
          prevThreads.map((post) => {
            if (post.id !== threadId) return post;
            const updatedComments = JSON.parse(JSON.stringify(post.comments || []));
            const inserted = insertReply(updatedComments, commentId, res.data.comment);
            if (inserted) {
              return {
                ...post,
                commentsCount: post.commentsCount + 1,
                comments: updatedComments,
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error("Error adding reply:", err);
    }
  };

  const handleEditSubmit = async (threadId: string, commentId: string, text: string) => {
    try {
      const res = await axiosInstance.put(`/api/comments/${commentId}`, {
        content: text,
      });
      if (res.data?.comment) {
        setThreads((prevThreads) =>
          prevThreads.map((post) => {
            if (post.id !== threadId) return post;
            const updatedComments = JSON.parse(JSON.stringify(post.comments || []));
            const updated = updateComment(updatedComments, commentId, text);
            if (updated) {
              return {
                ...post,
                comments: updatedComments,
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  const handleDeleteComment = async (threadId: string, commentId: string) => {
    try {
      const res = await axiosInstance.delete(`/api/comments/${commentId}`);
      const deletedCount = res.data?.deletedCount || 1;
      setThreads((prevThreads) =>
        prevThreads.map((post) => {
          if (post.id !== threadId) return post;
          const updatedComments = JSON.parse(JSON.stringify(post.comments || []));
          const removed = removeComment(updatedComments, commentId);
          if (removed) {
            return {
              ...post,
              commentsCount: Math.max(0, post.commentsCount - deletedCount),
              comments: updatedComments,
            };
          }
          return post;
        })
      );
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleCommentVote = async (threadId: string, commentId: string) => {
    try {
      const res = await axiosInstance.post("/api/votes", {
        targetId: commentId,
        targetType: "Comment",
        voteType: "up",
      });
      if (res.data?.success) {
        setThreads((prevThreads) =>
          prevThreads.map((post) => {
            if (post.id !== threadId) return post;
            const updatedComments = JSON.parse(JSON.stringify(post.comments || []));
            const voted = updateCommentVote(updatedComments, commentId, res.data.upvotes);
            if (voted) {
              return {
                ...post,
                comments: updatedComments,
              };
            }
            return post;
          })
        );
      }
    } catch (err) {
      console.error("Error upvoting comment:", err);
    }
  };

  const handleUpdateThread = useCallback((updatedThread: Thread) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === updatedThread.id ? updatedThread : t))
    );
  }, []);

  const handleDeletePost = useCallback((id: string) => {
    setThreads((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Client-side fuzzy search on threads list using queryParam
  const searchedThreads = useMemo(() => {
    const cleanQuery = queryParam.trim();
    if (!cleanQuery) return threads;

    // Build SearchItem mapping
    const searchItems = threads.map(mapPostToSearchItem);

    // Run Fuse.js fuzzy search
    const fuse = new Fuse(searchItems, FUSE_OPTIONS);
    const fuseResults = fuse.search(cleanQuery);

    // Rank matching results
    const rankedItems = rankSearchResults(fuseResults, cleanQuery);

    // Map ranked search items back to full Thread objects
    const rankedIds = rankedItems.map((item) => item.id);
    const threadsMap = new Map(threads.map((t) => [t.id, t]));

    return rankedIds
      .map((id) => threadsMap.get(id))
      .filter((t): t is Thread => !!t);
  }, [threads, queryParam]);

  // Filter threads by category and tag
  const filteredThreads = useMemo(() => {
    return searchedThreads
      .filter((t) => {
        const matchesCategory = activeCategory === "All" || t.category === activeCategory;
        const matchesTag =
          !selectedTag ||
          t.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase());
        return matchesCategory && matchesTag;
      })
      .sort((a, b) => {
        if (sortBy === "popular") {
          return b.upvotes - a.upvotes;
        }
        if (sortBy === "recent") {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        }
        // "relevance" matches original Fuse.js / ranking score order
        return 0;
      });
  }, [searchedThreads, activeCategory, selectedTag, sortBy]);

  // Dynamic filter lists
  const categoriesList = useMemo(() => {
    const defaultCats = ["All", "Tech & Architecture", "System Design", "DevOps & Cloud", "AI & Machine Learning", "Open Source", "Career Prep", "General Charcha", "Showcase"];
    const extraCats = Array.from(new Set(searchedThreads.map((t) => t.category).filter(Boolean)));
    return Array.from(new Set([...defaultCats, ...extraCats]));
  }, [searchedThreads]);

  const categoryCounts = useMemo(() => {
    return searchedThreads.reduce(
      (acc, t) => {
        if (t.category) {
          acc[t.category] = (acc[t.category] || 0) + 1;
        }
        return acc;
      },
      { All: searchedThreads.length } as Record<string, number>
    );
  }, [searchedThreads]);

  const tagCounts = useMemo(() => {
    return searchedThreads.reduce((acc, t) => {
      if (t.tags) {
        t.tags.forEach((tag) => {
          const cleanTag = tag.trim().toLowerCase();
          if (cleanTag) {
            acc[cleanTag] = (acc[cleanTag] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);
  }, [searchedThreads]);

  return (
    <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground) transition-all duration-300">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search header status */}
        <div className="mb-8 border-b border-(--divider-color) pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-(--foreground) flex items-center gap-2">
              <span>Search Results for</span>
              <span className="text-vivid-tangerine bg-vivid-tangerine/10 px-3 py-1 rounded-xl text-xl md:text-2xl font-mono">
                &ldquo;{queryParam || "All Topics"}&rdquo;
              </span>
            </h1>
            <p className="text-xs text-dust-grey mt-1.5 font-medium">
              Found {filteredThreads.length} matching discussions inside the developer forum.
            </p>
          </div>

          {/* Sort Buttons */}
          <div className="flex rounded-full border border-(--card-border) bg-(--card-background) p-0.5 shadow-sm text-xs font-semibold self-start md:self-center shrink-0">
            <button
              onClick={() => setSortBy("relevance")}
              className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
                sortBy === "relevance" ? "bg-spicy-paprika text-floral-white shadow-md shadow-spicy-paprika/20" : "text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Relevance
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
                sortBy === "popular" ? "bg-spicy-paprika text-floral-white shadow-md shadow-spicy-paprika/20" : "text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`rounded-full px-4 py-1.5 transition-all cursor-pointer ${
                sortBy === "recent" ? "bg-spicy-paprika text-floral-white shadow-md shadow-spicy-paprika/20" : "text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Recent
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Categories & Tags Filter sidebar (3 cols on large) */}
          <aside className="lg:col-span-3 flex flex-col gap-6">
            {/* Category selection */}
            <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm">
              <h2 className="text-xs font-extrabold tracking-wider text-dust-grey uppercase mb-3.5">
                Categories
              </h2>
              <div className="space-y-1">
                {categoriesList.map((cat) => {
                  const isActive = cat === activeCategory;
                  const count = categoryCounts[cat] || 0;

                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-bold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? "bg-spicy-paprika/10 text-spicy-paprika font-black"
                          : "text-(--text-secondary) hover:bg-(--btn-icon-hover-bg) hover:text-(--foreground)"
                      }`}
                    >
                      <span className="truncate pr-2">{cat}</span>
                      <span
                        className={`inline-flex shrink-0 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-mono font-extrabold border ${
                          isActive
                            ? "bg-spicy-paprika/20 text-spicy-paprika border-spicy-paprika/30"
                            : "bg-(--input-bg) text-dust-grey border-(--input-border)"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tag cloud filtering */}
            <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3.5">
                <h2 className="text-xs font-extrabold tracking-wider text-dust-grey uppercase">
                  Filter by Tag
                </h2>
                {selectedTag && (
                  <button
                    onClick={() => setSelectedTag("")}
                    className="text-[10px] font-bold text-spicy-paprika hover:underline cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(tagCounts).length === 0 ? (
                  <span className="text-xs text-dust-grey italic">No tags in match.</span>
                ) : (
                  Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 15)
                    .map(([tag, count]) => {
                      const isActive = tag === selectedTag;

                      return (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(isActive ? "" : tag)}
                          className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold tracking-tight transition-all duration-200 cursor-pointer ${
                            isActive
                              ? "bg-vivid-tangerine text-ink-black shadow-md shadow-vivid-tangerine/10 border border-vivid-tangerine"
                              : "bg-(--input-bg) border border-(--input-border) text-dust-grey hover:border-dust-grey/50 hover:text-(--foreground)"
                          }`}
                        >
                          <span>#{tag}</span>
                          <span className="opacity-70 font-mono text-[9px] font-medium">({count})</span>
                        </button>
                      );
                    })
                )}
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT: Thread List (9 cols on large) */}
          <main className="lg:col-span-9 flex flex-col gap-6">
            <div className="flex flex-col gap-4">
              {isLoading ? (
                <div className="text-center py-20 flex flex-col items-center justify-center text-dust-grey gap-3">
                  <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-xs font-mono tracking-wider animate-pulse">Brewing matching discussions...</span>
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-20 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background) flex flex-col items-center justify-center p-6">
                  <div className="text-spicy-paprika mb-3 bg-spicy-paprika/5 p-4 rounded-full border border-spicy-paprika/10">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-(--foreground)">No discussions match your filters</h3>
                  <p className="text-xs text-dust-grey mt-1.5 max-w-sm">
                    Try broadening your search query or choosing a different category or tag filter.
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory("All");
                      setSelectedTag("");
                      router.push("/search");
                    }}
                    className="mt-5 rounded-full border border-spicy-paprika bg-spicy-paprika/10 px-5 py-2 text-xs font-bold text-spicy-paprika hover:bg-spicy-paprika hover:text-floral-white transition-all cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                filteredThreads.slice(0, visibleCount).map((thread) => (
                  <ThreadCard
                    key={thread.id}
                    thread={thread}
                    onVote={handleVote}
                    onTagClick={(tag) => setSelectedTag(tag)}
                    onAddComment={handleAddComment}
                    onAddReply={handleAddReply}
                    onEditSubmit={handleEditSubmit}
                    onDeleteComment={handleDeleteComment}
                    onCommentVote={handleCommentVote}
                    onUpdateThread={handleUpdateThread}
                    onDeletePost={handleDeletePost}
                  />
                ))
              )}
            </div>

            {/* Pagination Load More */}
            {!isLoading && visibleCount < filteredThreads.length && (
              <button
                onClick={() => setVisibleCount((prev) => prev + 10)}
                className="w-full py-3.5 rounded-2xl border border-(--card-border) bg-(--card-background) text-xs font-extrabold text-(--text-secondary) hover:text-(--foreground) hover:border-spicy-paprika/30 hover:bg-spicy-paprika/5 transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Show More Discussions</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 bg-(--background) items-center justify-center py-20 text-dust-grey gap-3">
        <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider animate-pulse">Brewing search page...</span>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
