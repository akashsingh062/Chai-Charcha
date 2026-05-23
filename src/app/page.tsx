"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { Thread } from "@/app/(main)/post/postData";
import { MarketingView } from "@/components/home/MarketingView";
import { FeedSidebar } from "@/components/home/FeedSidebar";
import { FeedRightSidebar } from "@/components/home/FeedRightSidebar";
import { DiscussionFeed } from "@/components/home/DiscussionFeed";
import axiosInstance from "@/lib/axios";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  updateCommentVote 
} from "@/components/post/commentHelpers";

export default function Home() {
  const { user, login, userData, setIsCreatePostOpen } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sortBy, setSortBy] = useState<"trending" | "recent">("trending");
  const [isLoading, setIsLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const loadPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.get(`/api/posts?sort=${sortBy}`);
      if (res.data?.posts) {
        setThreads(res.data.posts);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy]);

  useEffect(() => {
    if (!user) return;
    loadPosts();
  }, [user, loadPosts]);

  useEffect(() => {
    const handleNewPost = () => {
      loadPosts();
    };
    window.addEventListener("new-post-created", handleNewPost);
    return () => {
      window.removeEventListener("new-post-created", handleNewPost);
    };
  }, [loadPosts]);

  useEffect(() => {
    setVisibleCount(10);
  }, [activeCategory, searchQuery, selectedTag, sortBy]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const clientHeight = window.innerHeight || document.documentElement.clientHeight;

      if (clientHeight + scrollTop >= scrollHeight - 150) {
        setVisibleCount((prev) => prev + 10);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle Dynamic Upvote/Downvote actions
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

  // Dynamic categories calculation
  const defaultCategories = [
    "All",
    "Tech & Code",
    "Startups & Business",
    "Career & Salary",
    "Lifestyle & Hobbies",
    "Gaming & Entertainment",
    "Education & Learning",
    "Health & Fitness",
    "General Charcha",
    "Showcase & Projects"
  ];
  const extraCategories = Array.from(new Set(threads.map((t) => t.category).filter(Boolean)));
  const categoriesList = Array.from(new Set([...defaultCategories, ...extraCategories]));

  const categoryCounts = threads.reduce((acc, t) => {
    if (t.category) {
      acc[t.category] = (acc[t.category] || 0) + 1;
    }
    return acc;
  }, { "All": threads.length } as Record<string, number>);

  // Dynamic tag counts calculation
  const tagCounts = threads.reduce((acc, t) => {
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

  categoriesList.forEach((cat) => {
    if (categoryCounts[cat] === undefined) {
      categoryCounts[cat] = 0;
    }
  });

  // Filter and Sort threads
  const filteredThreads = threads
    .filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag =
        !selectedTag ||
        t.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase());
      return matchesCategory && matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      if (sortBy === "trending") {
        if (b.upvotes !== a.upvotes) {
          return b.upvotes - a.upvotes;
        }
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === "recent") {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      }
      return 0;
    });

  return (
    <div className="flex flex-col flex-1 bg-(--background) font-sans text-(--foreground) transition-all duration-300">
      
      {/* 1. LOGGED-OUT MARKETING VIEW */}
      {!user ? (
        <MarketingView login={login} />
      ) : (
        
        /* 2. LOGGED-IN DEVELOPER FEED DASHBOARD */
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: NAVIGATION SIDEBAR (3 Cols on large) */}
            <FeedSidebar
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              selectedTag={selectedTag}
              setSelectedTag={setSelectedTag}
              categories={categoriesList}
              categoryCounts={categoryCounts}
              tagCounts={tagCounts}
            />

            {/* CENTER COLUMN: MAIN FEED (6 Cols on large) */}
            <DiscussionFeed
              filteredThreads={filteredThreads.slice(0, visibleCount)}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onVote={handleVote}
              onTagClick={(tag) => setSelectedTag(tag)}
              onStartCharcha={() => setIsCreatePostOpen(true)}
              userData={userData}
              onAddComment={handleAddComment}
              onAddReply={handleAddReply}
              onEditSubmit={handleEditSubmit}
              onDeleteComment={handleDeleteComment}
              onCommentVote={handleCommentVote}
              onUpdateThread={handleUpdateThread}
              onDeletePost={handleDeletePost}
              onRefresh={loadPosts}
              isLoading={isLoading}
              hasMore={visibleCount < filteredThreads.length}
            />

            {/* RIGHT COLUMN: SIDEBAR WIDGETS (3 Cols on large) */}
            <FeedRightSidebar />

          </div>
        </div>
      )}

    </div>
  );
}
