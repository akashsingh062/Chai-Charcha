"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Thread } from "@/app/(main)/post/postData";
import { MarketingView } from "@/components/home/MarketingView";
import { FeedSidebar } from "@/components/home/FeedSidebar";
import { FeedRightSidebar } from "@/components/home/FeedRightSidebar";
import { CreatePostModal } from "@/components/home/CreatePostModal";
import { DiscussionFeed } from "@/components/home/DiscussionFeed";
import { INITIAL_THREADS } from "@/components/home/initialThreads";

export default function Home() {
  const { user, login, userData } = useAuth();
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<"trending" | "recent">("trending");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Handle Dynamic Upvote/Downvote actions
  const handleVote = (id: string, type: "up" | "down") => {
    if (!user) {
      alert("Please pull up a chair and Log In to vote!");
      return;
    }

    setThreads((prevThreads) =>
      prevThreads.map((t) => {
        if (t.id !== id) return t;

        let voteDiff = 0;
        let nextVote: "up" | "down" | null = null;

        if (t.userVoted === type) {
          // Undo vote
          voteDiff = type === "up" ? -1 : 1;
          nextVote = null;
        } else {
          // Applying vote or reversing opposite vote
          const originalVoteVal = t.userVoted === "up" ? -1 : t.userVoted === "down" ? 1 : 0;
          const newVoteVal = type === "up" ? 1 : -1;
          voteDiff = originalVoteVal + newVoteVal;
          nextVote = type;
        }

        return {
          ...t,
          upvotes: t.upvotes + voteDiff,
          userVoted: nextVote,
        };
      })
    );
  };

  // Handle Thread Submission
  const handleCreatePost = (post: { title: string; excerpt: string; category: string; tagsStr: string }) => {
    const tagsArray = post.tagsStr
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newThread: Thread = {
      id: String(Date.now()),
      title: post.title,
      excerpt: post.excerpt,
      author: {
        name: userData?.name || "Developer",
        avatar: userData?.avatar || "JD",
        role: userData?.role || "member",
        reputation: userData?.reputation !== undefined ? userData.reputation : 342,
      },
      category: post.category,
      tags: tagsArray.length > 0 ? tagsArray : ["general"],
      upvotes: 1,
      commentsCount: 0,
      views: 12,
      timeAgo: "Just now",
      userVoted: "up",
    };

    setThreads([newThread, ...threads]);
    setIsModalOpen(false);
  };

  // Filter and Sort threads
  const filteredThreads = threads
    .filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "trending") {
        return b.upvotes - a.upvotes;
      }
      return 0; // Natural state / chronological
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
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              threadsCountAll={threads.length}
              threadsCountTech={threads.filter((t) => t.category === "Tech & Architecture").length}
              threadsCountCareer={threads.filter((t) => t.category === "Career Prep").length}
            />

            {/* CENTER COLUMN: MAIN FEED (6 Cols on large) */}
            <DiscussionFeed
              filteredThreads={filteredThreads}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onVote={handleVote}
              onTagClick={(tag) => setSearchQuery(tag)}
              onStartCharcha={() => setIsModalOpen(true)}
              userData={userData}
            />

            {/* RIGHT COLUMN: SIDEBAR WIDGETS (3 Cols on large) */}
            <FeedRightSidebar />

          </div>
        </div>
      )}

      {/* 3. DYNAMIC POST CREATION MODAL CONTAINER */}
      {isModalOpen && (
        <CreatePostModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreatePost}
        />
      )}

    </div>
  );
}
