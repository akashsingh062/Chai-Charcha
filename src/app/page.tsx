"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface Thread {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatar: string;
    role: string;
    reputation: number;
  };
  category: string;
  tags: string[];
  upvotes: number;
  commentsCount: number;
  views: number;
  timeAgo: string;
  userVoted?: "up" | "down" | null;
}

const INITIAL_THREADS: Thread[] = [
  {
    id: "1",
    title: "Is there a real hiring slowdown in Bangalore for remote developers?",
    excerpt: "Seeing a lot of mixed signals in the ecosystem. Local Indian startups are offering roughly 30-40% lower compensation packages compared to last year&apos;s peaks, but global remote firms seem to still hire aggressively with EU/US parity budgets. How are you navigating interviews right now?",
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
    excerpt: "For fresh greenfield setups, Next Server Actions are incredibly fast to scaffold and keep types safe. However, large enterprise codebases in Gurgaon/Bengaluru still mandate standard Express REST/gRPC backends. Let&apos;s debate the scaling overheads and developer experiences.",
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
    excerpt: "Let&apos;s demystify the IC track in India. You do not have to migrate to engineering management to cross the 40-50LPA compensation boundary. Here is a full breakdown of the skills, technical interview positioning, and portfolio projects that landed my current IC role.",
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
    excerpt: "Sharding is frequently mentioned as a silver bullet in high-level interviews. But dividing tables horizontally introduces major architectural pain points: cross-shard joins, transaction consistency, and key imbalances. Let&apos;s analyze the exact tradeoffs of sharding MySQL vs PostgreSQL.",
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

  // Post Creator Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newExcerpt, setNewExcerpt] = useState("");
  const [newCategory, setNewCategory] = useState("Tech & Architecture");
  const [newTagsStr, setNewTagsStr] = useState("");

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
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExcerpt.trim()) return;

    const tagsArray = newTagsStr
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const newThread: Thread = {
      id: String(Date.now()),
      title: newTitle,
      excerpt: newExcerpt,
      author: {
        name: userData?.name || "Developer",
        avatar: userData?.avatar || "JD",
        role: userData?.role || "Full Stack Engineer",
        reputation: (userData?.reputation || 256) + 10,
      },
      category: newCategory,
      tags: tagsArray.length > 0 ? tagsArray : ["general"],
      upvotes: 1,
      commentsCount: 0,
      views: 12,
      timeAgo: "Just now",
      userVoted: "up",
    };

    setThreads([newThread, ...threads]);
    setIsModalOpen(false);

    // Reset Form
    setNewTitle("");
    setNewExcerpt("");
    setNewCategory("Tech & Architecture");
    setNewTagsStr("");
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
    <div className="flex flex-col flex-1 bg-[var(--background)] font-sans text-[var(--foreground)] transition-all duration-300">
      
      {/* 1. LOGGED-OUT MARKETING VIEW */}
      {!user ? (
        <div className="flex flex-col items-center">
          
          {/* Hero Section */}
          <section className="relative w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-20 md:py-28 flex flex-col items-center text-center overflow-hidden">
            {/* Background Blur Accents */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-[40rem] rounded-full bg-gradient-to-r from-spicy-paprika/10 to-orange/15 blur-3xl opacity-60" />
            
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-spicy-paprika/30 bg-spicy-paprika/5 px-4 py-1.5 text-xs font-semibold text-spicy-paprika mb-8 animate-pulse">
              <span>☕ India&apos;s Ultimate Dev Chai Club</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] max-w-4xl text-[var(--foreground)]">
              Where Indian Developers Gather <br />
              Over <span className="bg-gradient-to-r from-spicy-paprika to-orange bg-clip-text text-transparent">Chai & Code</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl leading-relaxed">
              Skip the noise. Pull up a chair to discuss real system design architectures, remote career growth paths, FAANG prep, and tech ecosystem realities with Indian engineers.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 justify-center">
              <button
                onClick={login}
                className="flex items-center justify-center gap-2 rounded-full bg-spicy-paprika hover:bg-spicy-paprika-600 px-8 py-4 text-base font-bold text-floral-white shadow-xl shadow-spicy-paprika/20 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <span>Pull Up a Chair</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
              
              <a
                href="#public-preview"
                className="flex items-center justify-center rounded-full border border-[var(--btn-secondary-border)] hover:bg-[var(--btn-secondary-hover-bg)] px-8 py-4 text-base font-semibold transition-all duration-200"
              >
                Browse Discussions
              </a>
            </div>

            {/* Tech badging grid */}
            <div className="mt-16 flex flex-wrap justify-center gap-2.5 max-w-2xl">
              {["#nextjs15", "#react19", "#system-design", "#bangalore-remote", "#faang-prep", "#golang-architecture", "#tech-salaries"].map((tag) => (
                <span key={tag} className="rounded-full border border-[var(--card-border)] bg-[var(--card-background)] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] shadow-sm hover:border-orange transition-all duration-200 cursor-default">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Value Pillars Section */}
          <section className="w-full bg-[var(--card-background)] border-y border-[var(--card-border)] transition-all duration-300 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">Why Indian Engineers Join Chai Charcha</h2>
                <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">A community curated to elevate your technical craftsmanship and career.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Pillar 1 */}
                <div className="flex flex-col p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] hover:border-spicy-paprika/30 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-spicy-paprika/10 flex items-center justify-center text-2xl text-spicy-paprika mb-4 group-hover:scale-110 transition-transform duration-300">
                    ☕
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Chai & Real Talks</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    Zero spam, zero vanity metrics. Enjoy high-quality nested threads on production bottlenecks, memory leaks, CSS architecture, and codebases.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="flex flex-col p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] hover:border-vivid-tangerine/30 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-vivid-tangerine/10 flex items-center justify-center text-2xl text-vivid-tangerine mb-4 group-hover:scale-110 transition-transform duration-300">
                    💰
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">Career Parity & Wages</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    Access honest discussions about salary benchmarks, remote negotiation tactics, resume critiques, and interview pipelines.
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="flex flex-col p-6 rounded-2xl border border-[var(--card-border)] bg-[var(--background)] hover:border-stormy-teal/30 transition-all duration-300 group">
                  <div className="h-12 w-12 rounded-xl bg-stormy-teal/10 flex items-center justify-center text-2xl text-stormy-teal mb-4 group-hover:scale-110 transition-transform duration-300">
                    🇮🇳
                  </div>
                  <h3 className="text-lg font-bold text-[var(--foreground)]">City Guilds & AMAs</h3>
                  <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                    Coordinate with local circles in Bengaluru, Delhi-NCR, Pune, Hyderabad, or Mumbai. Participate in live online AMAs with staff engineers.
                  </p>
                </div>

              </div>
            </div>
          </section>

          {/* Public Preview Section */}
          <section id="public-preview" className="w-full max-w-4xl px-4 py-16 sm:py-24">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--foreground)]">Trending Public Discussions</h2>
              <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)]">Take a peek at hot questions circulating in the developer ecosystem.</p>
            </div>

            {/* Blurred Preview Feed */}
            <div className="relative rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 sm:p-6 overflow-hidden">
              
              {/* Overlay Prompt */}
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-[var(--card-background)] via-[var(--card-background)]/90 to-[var(--card-background)]/50 p-6 text-center">
                <div className="rounded-2xl border border-[var(--nav-border)] bg-[var(--nav-bg)] p-8 max-w-md shadow-2xl backdrop-blur-md">
                  <span className="text-3xl">🔒</span>
                  <h3 className="text-xl font-bold mt-4 text-[var(--foreground)]">Join the Discussion</h3>
                  <p className="mt-2 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    Ready to share your experiences, upvote great ideas, or ask your own burning dev questions? Log in instantly.
                  </p>
                  <button
                    onClick={login}
                    className="w-full mt-6 rounded-full bg-spicy-paprika px-5 py-3 text-sm font-bold text-floral-white shadow-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Enter Chai Charcha
                  </button>
                </div>
              </div>

              {/* Blurred Thread 1 */}
              <div className="mb-6 border-b border-[var(--divider-color)] pb-6 blur-xs select-none pointer-events-none opacity-50">
                <span className="rounded-full bg-orange/10 text-orange border border-orange/20 px-2 py-0.5 text-xs font-semibold">Career Prep</span>
                <h3 className="text-lg font-bold mt-2 text-[var(--foreground)]">Is there a real hiring slowdown in Bangalore for remote developers?</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Local Indian startups are offering roughly 30-40% lower compensation packages...</p>
              </div>

              {/* Blurred Thread 2 */}
              <div className="blur-xs select-none pointer-events-none opacity-30">
                <span className="rounded-full bg-stormy-teal/10 text-stormy-teal border border-stormy-teal/20 px-2 py-0.5 text-xs font-semibold">Tech & Architecture</span>
                <h3 className="text-lg font-bold mt-2 text-[var(--foreground)]">Why we migrated our Next.js 15 site back to native CSS variables...</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Tailwind v4 is fantastic for core design systems, but we hit complex specificity overrides...</p>
              </div>

            </div>
          </section>

        </div>
      ) : (
        
        /* 2. LOGGED-IN DEVELOPER FEED DASHBOARD */
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: NAVIGATION SIDEBAR (3 Cols on large) */}
            <aside className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Navigation Filters */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 shadow-sm transition-all duration-300">
                <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Categories</h2>
                <nav className="flex flex-col gap-1">
                  {["All", "Tech & Architecture", "Career Prep"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                        activeCategory === cat
                          ? "bg-spicy-paprika/10 text-spicy-paprika border-l-3 border-spicy-paprika pl-2"
                          : "text-[var(--text-secondary)] hover:bg-[var(--btn-secondary-hover-bg)]"
                      }`}
                    >
                      <span>{cat === "All" ? "☕ All Discussions" : cat === "Tech & Architecture" ? "🛠️ Tech & Architecture" : "💼 Career Prep"}</span>
                      <span className="rounded-full bg-[var(--profile-bg)] border border-[var(--profile-border)] px-2 py-0.5 text-2xs text-[var(--text-role)]">
                        {cat === "All"
                          ? threads.length
                          : threads.filter((t) => t.category === cat).length}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Hot Tags Widget */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 shadow-sm transition-all duration-300">
                <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Trending Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {["nextjs", "react19", "systemdesign", "career", "remote-jobs", "css", "node"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      className="rounded-full border border-[var(--card-border)] bg-[var(--background)] hover:border-spicy-paprika/40 hover:text-spicy-paprika px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-all cursor-pointer"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="w-full mt-4 rounded-xl border border-spicy-paprika/20 bg-spicy-paprika/5 py-1.5 text-xs font-bold text-spicy-paprika hover:bg-spicy-paprika/10 cursor-pointer"
                  >
                    Clear Tag Filter
                  </button>
                )}
              </div>

            </aside>

            {/* CENTER COLUMN: MAIN FEED (6 Cols on large) */}
            <main className="lg:col-span-6 flex flex-col gap-6">
              
              {/* Quick Post Creator Box */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 shadow-sm transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--profile-avatar-bg)] text-xs font-bold text-[var(--profile-avatar-text)] shadow-sm">
                    {userData?.avatar || "JD"}
                  </div>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex-1 rounded-full border border-[var(--input-border)] bg-[var(--input-bg)] py-2 px-4 text-left text-sm text-dust-grey hover:bg-[var(--btn-icon-hover-bg)] hover:border-orange/50 transition-all cursor-pointer"
                  >
                    Start a charcha... What&apos;s on your mind?
                  </button>
                </div>
              </div>

              {/* Feed Controls Header */}
              <div className="flex items-center justify-between border-b border-[var(--divider-color)] pb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold text-[var(--foreground)]">Discussion Feed</span>
                  <span className="text-xs text-dust-grey">({filteredThreads.length} topics)</span>
                </div>
                <div className="flex rounded-full border border-[var(--card-border)] bg-[var(--card-background)] p-0.5 shadow-sm text-xs font-semibold">
                  <button
                    onClick={() => setSortBy("trending")}
                    className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                      sortBy === "trending" ? "bg-spicy-paprika text-floral-white" : "text-dust-grey hover:text-[var(--foreground)]"
                    }`}
                  >
                    Trending
                  </button>
                  <button
                    onClick={() => setSortBy("recent")}
                    className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                      sortBy === "recent" ? "bg-spicy-paprika text-floral-white" : "text-dust-grey hover:text-[var(--foreground)]"
                    }`}
                  >
                    Recent
                  </button>
                </div>
              </div>

              {/* Discussion Thread List */}
              <div className="flex flex-col gap-4">
                {filteredThreads.length === 0 ? (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--card-background)]">
                    <span className="text-3xl">☕</span>
                    <h3 className="text-base font-bold mt-3 text-[var(--foreground)]">No charchas found</h3>
                    <p className="text-xs text-dust-grey mt-1">Be the first to ignite a technical discussion!</p>
                  </div>
                ) : (
                  filteredThreads.map((thread) => (
                    <article
                      key={thread.id}
                      className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-orange/20 transition-all duration-300"
                    >
                      {/* Author card & Category tag */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--profile-avatar-bg)] text-2xs font-bold text-[var(--profile-avatar-text)] shadow-sm">
                            {thread.author.avatar}
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
                          <span key={tag} className="text-[10px] font-semibold text-[var(--link-color)] hover:text-[var(--link-hover-color)] transition-colors cursor-pointer">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Bottom Footer Interactions */}
                      <div className="mt-5 pt-4 border-t border-[var(--divider-color)] flex items-center justify-between text-xs text-dust-grey">
                        
                        {/* Interactive Upvote & Downvote component */}
                        <div className="flex items-center gap-1 bg-[var(--profile-bg)] border border-[var(--profile-border)] rounded-full p-0.5">
                          <button
                            onClick={() => handleVote(thread.id, "up")}
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
                            onClick={() => handleVote(thread.id, "down")}
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
                  ))
                )}
              </div>

            </main>

            {/* RIGHT COLUMN: SIDEBAR WIDGETS (3 Cols on large) */}
            <aside className="lg:col-span-3 flex flex-col gap-6">
              
              {/* Leaderboard Widget */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 shadow-sm transition-all duration-300">
                <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Chai Leaderboard</h2>
                <div className="flex flex-col gap-3">
                  {[
                    { name: "Karan Johar", points: 640, title: "Principal IC", badge: "🥇" },
                    { name: "Rajesh Kumar", points: 512, title: "ChaiTech CTO", badge: "🥈" },
                    { name: "Amit Sharma", points: 420, title: "Staff Dev", badge: "🥉" },
                    { name: "Priya Patel", points: 380, title: "Frontend Lead", badge: "🔥" },
                  ].map((lead, idx) => (
                    <div key={idx} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-[var(--btn-secondary-hover-bg)] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-sm shrink-0">{lead.badge}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-[var(--foreground)]">{lead.name}</span>
                          <span className="text-[9px] text-dust-grey leading-none mt-0.5">{lead.title}</span>
                        </div>
                      </div>
                      <span className="text-2xs font-bold font-mono text-spicy-paprika">+{lead.points} rep</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Charchas Widget */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 shadow-sm transition-all duration-300">
                <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Upcoming Meetups</h2>
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-xl border border-[var(--divider-color)] bg-[var(--profile-bg)] hover:border-orange/20 transition-all">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-spicy-paprika">
                      <span className="animate-ping h-1.5 w-1.5 rounded-full bg-spicy-paprika mr-0.5" />
                      <span>LIVE ONLINE AMA</span>
                    </div>
                    <h3 className="text-xs font-extrabold mt-1 text-[var(--foreground)] leading-snug">Scaling React 19 Server Actions to 10M Pageviews</h3>
                    <p className="text-[10px] text-dust-grey mt-2">Today, 7:00 PM IST</p>
                  </div>
                  
                  <div className="p-3 rounded-xl border border-[var(--divider-color)] bg-[var(--profile-bg)] hover:border-orange/20 transition-all">
                    <span className="text-[10px] font-bold text-stormy-teal uppercase tracking-wider">Bangalore Circle</span>
                    <h3 className="text-xs font-extrabold mt-1 text-[var(--foreground)] leading-snug">Offline Chai & Networking Meetup - Indiranagar</h3>
                    <p className="text-[10px] text-dust-grey mt-2">Saturday, 4:00 PM IST</p>
                  </div>
                </div>
              </div>

              {/* Chai Break News snippet */}
              <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-background)] p-4 shadow-sm transition-all duration-300 text-2xs leading-relaxed text-[var(--text-secondary)]">
                <span className="font-bold text-[var(--foreground)]">☕ Chai Break News:</span> In 2026, global remote developer hires in India grew by 45% with major focus on Rust and Next.js frontend core performance. Keep coding!
              </div>

            </aside>

          </div>
        </div>
      )}

      {/* 3. DYNAMIC POST CREATION MODAL CONTAINER */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--dropdown-border)] bg-[var(--dropdown-bg)] p-6 shadow-2xl backdrop-blur-lg">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--divider-color)] pb-3.5">
              <h2 className="text-lg font-bold text-[var(--foreground)]">Start a New Discussion</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-full p-1.5 hover:bg-[var(--btn-icon-hover-bg)] text-dust-grey hover:text-[var(--foreground)] cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePost} className="mt-4 flex flex-col gap-4">
              
              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="title" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Discussion Title</label>
                <input
                  type="text"
                  id="title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Is anyone else seeing CSS import warnings under Turbopack?"
                  className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-dust-grey/50 outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] focus:ring-1 focus:ring-[var(--input-focus-ring)]"
                  required
                />
              </div>

              {/* Category input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Category</label>
                <select
                  id="category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] cursor-pointer"
                >
                  <option value="Tech & Architecture">🛠️ Tech & Architecture</option>
                  <option value="Career Prep">💼 Career Prep</option>
                </select>
              </div>

              {/* Excerpt Textarea */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="excerpt" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Discussion Body</label>
                <textarea
                  id="excerpt"
                  value={newExcerpt}
                  onChange={(e) => setNewExcerpt(e.target.value)}
                  placeholder="Elaborate on your problem or prompt. Share background context, code structures, or interview setups..."
                  rows={4}
                  className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-dust-grey/50 outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] focus:ring-1 focus:ring-[var(--input-focus-ring)] resize-none"
                  required
                />
              </div>

              {/* Tags input */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="tags" className="text-xs font-bold text-dust-grey uppercase tracking-wider">Hashtags (Comma-separated)</label>
                <input
                  type="text"
                  id="tags"
                  value={newTagsStr}
                  onChange={(e) => setNewTagsStr(e.target.value)}
                  placeholder="e.g. react19, nextjs, styling"
                  className="block w-full rounded-xl border border-[var(--input-border)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-dust-grey/50 outline-none focus:border-[var(--input-focus-border)] focus:bg-[var(--input-focus-bg)] focus:ring-1 focus:ring-[var(--input-focus-ring)]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 mt-4 pt-3.5 border-t border-[var(--divider-color)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--btn-secondary-hover-bg)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-spicy-paprika hover:bg-spicy-paprika-600 px-6 py-2.5 text-sm font-bold text-floral-white shadow-md cursor-pointer"
                >
                  Post Charcha
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
