"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Thread } from "@/app/(main)/post/postData";
import { MarketingView } from "@/components/home/MarketingView";
import { FeedSidebar } from "@/components/home/FeedSidebar";
import { FeedRightSidebar } from "@/components/home/FeedRightSidebar";
import { CreatePostModal } from "@/components/home/CreatePostModal";
import { ThreadCard } from "@/components/home/ThreadCard";

const INITIAL_THREADS: Thread[] = [
  {
    id: "1",
    title: "Is there a real hiring slowdown in Bangalore for remote developers?",
    excerpt: "Seeing a lot of mixed signals in the ecosystem. Local Indian startups are offering roughly 30-40% lower compensation packages compared to last year's peaks, but global remote firms seem to still hire aggressively with EU/US parity budgets. How are you navigating interviews right now?",
    author: {
      name: "Amit Sharma",
      avatar: "AS",
      role: "Staff Engineer",
      reputation: 420,
    },
    category: "Career Prep",
    tags: ["career", "remote-jobs", "bangalore"],
    upvotes: 48,
    commentsCount: 22,
    views: 312,
    timeAgo: "2 hours ago",
  },
  {
    id: "2",
    title: "Why we migrated our Next.js 15 site back to native CSS variables from custom build tooling",
    excerpt: "Tailwind v4 is fantastic for core design systems, but we hit complex specificity overrides in hybrid server/client dynamic styles. Switching our theme bindings entirely to simple, native CSS variables solved specificity bugs, speeded up reload builds, and made theme switching 100% synchronous.",
    author: {
      name: "Priya Patel",
      avatar: "PP",
      role: "Frontend Lead",
      reputation: 380,
    },
    category: "Tech & Architecture",
    tags: ["nextjs", "css", "frontend"],
    upvotes: 62,
    commentsCount: 17,
    views: 405,
    timeAgo: "5 hours ago",
  },
  {
    id: "3",
    title: "React 19 Server Actions vs Express APIs: What are Indian tech companies adopting in 2026?",
    excerpt: "For fresh greenfield setups, Next Server Actions are incredibly fast to scaffold and keep types safe. However, large enterprise codebases in Gurgaon/Bengaluru still mandate standard Express REST/gRPC backends. Let's debate the scaling overheads and developer experiences.",
    author: {
      name: "Rajesh Kumar",
      avatar: "RK",
      role: "CTO, ChaiTech",
      reputation: 512,
    },
    category: "Tech & Architecture",
    tags: ["react19", "node", "architecture"],
    upvotes: 39,
    commentsCount: 31,
    views: 290,
    timeAgo: "1 day ago",
  },
  {
    id: "4",
    title: "How to negotiate a 50LPA+ package as an IC (Individual Contributor) without entering management?",
    excerpt: "Let's demystify the IC track in India. You do not have to migrate to engineering management to cross the 40-50LPA compensation boundary. Here is a full breakdown of the skills, technical interview positioning, and portfolio projects that landed my current IC role.",
    author: {
      name: "Karan Johar",
      avatar: "KJ",
      role: "Principal Architect",
      reputation: 640,
    },
    category: "Career Prep",
    tags: ["career", "salary", "leadership"],
    upvotes: 89,
    commentsCount: 45,
    views: 870,
    timeAgo: "2 days ago",
  },
  {
    id: "5",
    title: "Understanding Database Sharding: A practical guide for System Design Interviews",
    excerpt: "Sharding is frequently mentioned as a silver bullet in high-level interviews. But dividing tables horizontally introduces major architectural pain points: cross-shard joins, transaction consistency, and key imbalances. Let's analyze the exact tradeoffs of sharding MySQL vs PostgreSQL.",
    author: {
      name: "Neha Krishnan",
      avatar: "NK",
      role: "Database Architect",
      reputation: 295,
    },
    category: "Tech & Architecture",
    tags: ["systemdesign", "database"],
    upvotes: 54,
    commentsCount: 19,
    views: 340,
    timeAgo: "3 days ago",
  },
];

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
                    onClick={() => setIsModalOpen(true)}
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
                  <div className="text-center py-12 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background)">
                    <span className="text-3xl">☕</span>
                    <h3 className="text-base font-bold mt-3 text-(--foreground)">No charchas found</h3>
                    <p className="text-xs text-dust-grey mt-1">Be the first to ignite a technical discussion!</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <ThreadCard
                      key={thread.id}
                      thread={thread}
                      onVote={handleVote}
                      onTagClick={(tag) => setSearchQuery(tag)}
                    />
                  ))
                )}
              </div>

            </main>

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
