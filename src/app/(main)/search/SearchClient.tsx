"use client";
// This file is the full client-side search experience. The Server Component
// wrapper (page.tsx) will import this as SearchClient for metadata injection.


import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Thread, Comment } from "@/types/post";
import { ThreadCard } from "@/components/home/ThreadCard";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { toast } from "@/store/useToastStore";
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

interface DeveloperUser {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  karma: number;
  bio?: string;
  createdAt: string;
}

interface CommunitySearchInfo {
  _id: string;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  creator: string;
  isPrivate?: boolean;
  isJoined?: boolean;
  isPending?: boolean;
  rules?: string[];
  avatar?: string;
  banner?: string;
  createdAt: string;
}

function SearchPageContent() {
  const { userData } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q") || "";

  // States
  const [threads, setThreads] = useState<Thread[]>([]);
  const [users, setUsers] = useState<DeveloperUser[]>([]);
  const [communities, setCommunities] = useState<CommunitySearchInfo[]>([]);
  const [activeSearchTab, setActiveSearchTab] = useState<"discussions" | "profiles" | "communities">("discussions");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sortBy, setSortBy] = useState<"relevance" | "popular" | "recent">("relevance");
  
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "All": return "text-orange";
      case "Tech & Code": return "text-stormy-teal";
      case "Startups & Business": return "text-vivid-tangerine";
      case "Career & Salary": return "text-spicy-paprika";
      case "Lifestyle & Hobbies": return "text-brandy-700";
      case "Gaming & Entertainment": return "text-orange";
      case "Education & Learning": return "text-stormy-teal";
      case "Health & Fitness": return "text-spicy-paprika";
      case "Showcase & Projects": return "text-vivid-tangerine";
      case "General Charcha": return "text-orange";
      default: return "text-spicy-paprika";
    }
  };

  const getCategoryIcon = (cat: string, className = "w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110") => {
    if (cat === "All") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
        </svg>
      );
    }
    if (cat === "Tech & Code") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    if (cat === "Startups & Business") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    if (cat === "Career & Salary") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (cat === "Education & Learning") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
        </svg>
      );
    }
    if (cat === "Lifestyle & Hobbies") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    }
    if (cat === "Gaming & Entertainment") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    }
    if (cat === "Health & Fitness") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h2l2 4 2-6 2 2h2m-9 9a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
      );
    }
    if (cat === "Showcase & Projects") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      );
    }
    if (cat === "General Charcha") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    }
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  };

  // Fetch all posts from API
  const loadPosts = useCallback(async () => {
    try {
      setIsLoadingThreads(true);
      const res = await axiosInstance.get("/api/posts?sort=recent");
      if (res.data?.posts) {
        setThreads(res.data.posts);
      }
    } catch (err) {
      console.error("Error loading posts for search:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  }, []);

  // Fetch all member profiles from API
  const loadUsers = useCallback(async () => {
    try {
      setIsLoadingUsers(true);
      const res = await axiosInstance.get("/api/profile?all=true");
      if (res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Error loading member profiles for search:", err);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch all communities from API
  const loadCommunities = useCallback(async () => {
    try {
      setIsLoadingCommunities(true);
      const res = await axiosInstance.get("/api/communities");
      if (res.data?.success && res.data?.communities) {
        setCommunities(res.data.communities);
      }
    } catch (err) {
      console.error("Error loading communities for search:", err);
    } finally {
      setIsLoadingCommunities(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPosts();
      loadUsers();
      loadCommunities();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadPosts, loadUsers, loadCommunities]);

  // Reset pagination on filter or query change
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(10);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeCategory, queryParam, selectedTag, sortBy, activeSearchTab]);

  // Handle Voting
  const handleVote = async (id: string, type: "up" | "down") => {
    if (!userData) {
      toast.warning("Please pull up a chair and Log In to vote!");
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
              upvotesCount: res.data.upvotes,
              downvotesCount: res.data.downvotes,
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
    if (!userData) {
      toast.warning("Please log in first to do that!");
      return;
    }
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
            const exists = currentComments.some((c) => c.id === res.data.comment.id);
            if (exists) return post;
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
    if (!userData) {
      toast.warning("Please log in first to do that!");
      return;
    }
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
            const checkIfReplyExists = (nodes: Comment[], targetId: string): boolean => {
              for (const n of nodes) {
                if (n.id === targetId) return true;
                if (n.replies && checkIfReplyExists(n.replies, targetId)) return true;
              }
              return false;
            };
            if (checkIfReplyExists(updatedComments, res.data.comment.id)) {
              return post;
            }
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
    if (!userData) {
      toast.warning("Please log in first to do that!");
      return;
    }
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

  // Client-side fuzzy search on users list using queryParam
  const searchedUsers = useMemo(() => {
    const cleanQuery = queryParam.trim();
    if (!cleanQuery) return users;

    const fuse = new Fuse(users, {
      keys: ["name", "username", "bio"],
      threshold: 0.35,
    });

    return fuse.search(cleanQuery).map((res) => res.item);
  }, [users, queryParam]);

  // Client-side fuzzy search on communities list using queryParam
  const searchedCommunities = useMemo(() => {
    const cleanQuery = queryParam.trim();
    if (!cleanQuery) return communities;

    const fuse = new Fuse(communities, {
      keys: ["name", "slug", "description"],
      threshold: 0.35,
    });

    return fuse.search(cleanQuery).map((res) => res.item);
  }, [communities, queryParam]);

  // Join/leave communities directly from search results
  const handleCommunityJoinLeave = async (comm: CommunitySearchInfo) => {
    if (!userData) {
      toast.warning("Please pull up a chair and Log In to join this community!");
      return;
    }
    try {
      const action = (comm.isJoined || comm.isPending) ? "leave" : "join";
      const res = await axiosInstance.post(`/api/communities/${comm.slug}/join`, { action });
      
      if (res.data?.success) {
        setCommunities((prev) =>
          prev.map((c) => {
            if (c._id !== comm._id) return c;
            return {
              ...c,
              isJoined: res.data.isJoined || false,
              isPending: res.data.isPending || false,
              membersCount: res.data.membersCount,
            };
          })
        );
        
        if (res.data.isPending) {
          toast.success("Join request sent! Pending moderator approval.");
        } else {
          toast.success(res.data.isJoined ? `Joined c/${comm.slug}!` : `Left c/${comm.slug}!`);
        }
        
        window.dispatchEvent(new Event("joined-communities-changed"));
      }
    } catch (err) {
      console.error("Failed to join community from search:", err);
      toast.error("Failed to update membership. Please try again.");
    }
  };

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
    const defaultCats = [
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
    const extraCats = Array.from(new Set(searchedThreads.map((t) => t.category).filter(Boolean)));
    return Array.from(new Set([...defaultCats, ...extraCats]));
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
        
        {/* Title & Info Card Container */}
        <div className="w-full p-5 rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md mb-4 flex flex-col gap-1.5">
          <h1 className="text-xl md:text-2xl font-black text-(--foreground) flex flex-wrap items-center gap-2">
            <span>Search Results for</span>
            <span className="text-orange bg-orange/10 px-3 py-1 rounded-xl text-lg md:text-xl font-mono">
              &ldquo;{queryParam || "All Topics"}&rdquo;
            </span>
          </h1>
          <p className="text-xs text-dust-grey font-semibold">
            Found {filteredThreads.length} discussions, {searchedCommunities.length} communities, and {searchedUsers.length} member profiles.
          </p>
        </div>

        {/* Tabs switcher container card */}
        <div className="w-full p-4 rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md mb-4">
          <div className="flex flex-wrap gap-2 w-full">
            <button
              onClick={() => setActiveSearchTab("discussions")}
              className={`flex-1 min-w-[120px] text-center rounded-2xl px-5 py-3 transition-all cursor-pointer font-bold text-sm ${
                activeSearchTab === "discussions"
                  ? "bg-spicy-paprika text-floral-white shadow-md shadow-spicy-paprika/20"
                  : "bg-(--card-background) border border-(--card-border) text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Discussions ({filteredThreads.length})
            </button>
            <button
              onClick={() => setActiveSearchTab("communities")}
              className={`flex-1 min-w-[120px] text-center rounded-2xl px-5 py-3 transition-all cursor-pointer font-bold text-sm ${
                activeSearchTab === "communities"
                  ? "bg-spicy-paprika text-floral-white shadow-md shadow-spicy-paprika/20"
                  : "bg-(--card-background) border border-(--card-border) text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Communities ({searchedCommunities.length})
            </button>
            <button
              onClick={() => setActiveSearchTab("profiles")}
              className={`flex-1 min-w-[120px] text-center rounded-2xl px-5 py-3 transition-all cursor-pointer font-bold text-sm ${
                activeSearchTab === "profiles"
                  ? "bg-spicy-paprika text-floral-white shadow-md shadow-spicy-paprika/20"
                  : "bg-(--card-background) border border-(--card-border) text-dust-grey hover:text-(--foreground)"
              }`}
            >
              Profiles ({searchedUsers.length})
            </button>
          </div>
        </div>

        {/* Sorting options container card */}
        {activeSearchTab === "discussions" && (
          <div className="w-full p-4 rounded-3xl border border-(--card-border) bg-(--card-background)/40 backdrop-blur-xs shadow-md mb-6">
            <div className="flex flex-wrap gap-2 w-full">
              <button
                onClick={() => setSortBy("relevance")}
                className={`flex-1 min-w-[100px] text-center rounded-xl px-4 py-2.5 transition-all cursor-pointer font-bold text-xs ${
                  sortBy === "relevance"
                    ? "bg-spicy-paprika text-floral-white shadow-sm"
                    : "bg-(--card-background) border border-(--card-border) text-dust-grey hover:text-(--foreground)"
                }`}
              >
                Relevance
              </button>
              <button
                onClick={() => setSortBy("popular")}
                className={`flex-1 min-w-[100px] text-center rounded-xl px-4 py-2.5 transition-all cursor-pointer font-bold text-xs ${
                  sortBy === "popular"
                    ? "bg-spicy-paprika text-floral-white shadow-sm"
                    : "bg-(--card-background) border border-(--card-border) text-dust-grey hover:text-(--foreground)"
                }`}
              >
                Popular
              </button>
              <button
                onClick={() => setSortBy("recent")}
                className={`flex-1 min-w-[100px] text-center rounded-xl px-4 py-2.5 transition-all cursor-pointer font-bold text-xs ${
                  sortBy === "recent"
                    ? "bg-spicy-paprika text-floral-white shadow-sm"
                    : "bg-(--card-background) border border-(--card-border) text-dust-grey hover:text-(--foreground)"
                }`}
              >
                Recent
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Filter Sidebar (Only rendered if discussions active) */}
          {activeSearchTab === "discussions" && (
            <aside className="hidden lg:flex lg:col-span-3 flex-col gap-6">
              {/* Category selection - Redesigned as Dropdown only */}
              <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm relative z-20">
                <div className="flex items-center justify-between px-2 mb-3">
                  <h2 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-orange to-spicy-paprika bg-clip-text text-transparent">
                    Category Filter
                  </h2>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className={`w-full flex items-center justify-between rounded-xl border border-(--input-border)/50 bg-(--input-bg)/30 hover:bg-(--input-bg)/50 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                      activeCategory !== "All" ? `${getCategoryColor(activeCategory)} border-${getCategoryColor(activeCategory)}/30` : "text-(--foreground)"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      {getCategoryIcon(activeCategory, `w-4 h-4 shrink-0 ${activeCategory !== "All" ? getCategoryColor(activeCategory) : "text-dust-grey/80"}`)}
                      <span>{activeCategory === "All" ? "All Discussions" : activeCategory}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <svg 
                        className={`w-4 h-4 text-dust-grey transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </span>
                  </button>

                  {isCategoryOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
                      
                      <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-(--dropdown-border) bg-(--dropdown-bg) p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in max-h-64 overflow-y-auto">
                        {categoriesList.map((cat) => {
                          const isActive = activeCategory === cat;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setActiveCategory(cat);
                                setIsCategoryOpen(false);
                              }}
                              className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer hover:bg-(--btn-secondary-hover-bg) ${
                                isActive ? `${getCategoryColor(cat)} font-bold bg-white/5` : "text-(--text-secondary)"
                              }`}
                            >
                              <span className="flex items-center gap-2.5">
                                {getCategoryIcon(cat, `w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                                  isActive ? getCategoryColor(cat) : "text-dust-grey/80"
                                }`)}
                                <span>{cat === "All" ? "All Discussions" : cat}</span>
                              </span>
                              <span className="flex items-center gap-2">
                                {isActive && (
                                  <svg className={`w-4 h-4 ${getCategoryColor(cat)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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
          )}

          {/* MAIN CONTENT AREA */}
          <main className={activeSearchTab === "discussions" ? "lg:col-span-9 flex flex-col gap-6" : "lg:col-span-12 flex flex-col gap-6"}>
            
            {activeSearchTab === "discussions" ? (
              <div className="flex flex-col gap-4">
                {isLoadingThreads ? (
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

                {/* Pagination */}
                {!isLoadingThreads && visibleCount < filteredThreads.length && (
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
              </div>
            ) : activeSearchTab === "communities" ? (
              // Communities Search Cards Grid
              <div className="flex flex-col gap-4">
                {isLoadingCommunities ? (
                  <div className="text-center py-20 flex flex-col items-center justify-center text-dust-grey gap-3">
                    <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs font-mono tracking-wider animate-pulse">Brewing matching communities...</span>
                  </div>
                ) : searchedCommunities.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background) flex flex-col items-center justify-center p-6">
                    <div className="text-spicy-paprika mb-3 bg-spicy-paprika/5 p-4 rounded-full border border-spicy-paprika/10">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l.406.34a.75.75 0 010 1.142l-.406.34a1.204 1.204 0 00-.405.864v.568c0 .26.104.51.29.697l.406.406a.75.75 0 001.061 0l.406-.406a1.204 1.204 0 01.864-.405h.568c.26 0 .51-.104.697-.29l.406-.406a.75.75 0 000-1.061l-.406-.406a1.204 1.204 0 01-.29-.864v-.568a.75.75 0 00-.75-.75h-.568a1.204 1.204 0 01-.864-.29l-.406-.406a.75.75 0 00-1.061 0l-.406.406a1.204 1.204 0 01-.29.29zm-6.75 4.5v.568c0 .334.148.65.405.864l.406.34a.75.75 0 010 1.142l-.406.34a1.204 1.204 0 00-.405.864v.568c0 .26.104.51.29.697l.406.406a.75.75 0 001.061 0l.406-.406a1.204 1.204 0 01.864-.405h.568c.26 0 .51-.104.697-.29l.406-.406a.75.75 0 000-1.061l-.406-.406a1.204 1.204 0 01-.29-.864v-.568a.75.75 0 00-.75-.75h-.568a1.204 1.204 0 01-.864-.29l-.406-.406a.75.75 0 00-1.061 0l-.406.406a1.204 1.204 0 01-.29.29zM18 15.75a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-(--foreground)">No communities match</h3>
                    <p className="text-xs text-dust-grey mt-1.5 max-w-sm">
                      We could not find any active communities matching your search keyword.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {searchedCommunities.map((comm) => (
                      <div
                        key={comm._id}
                        className="rounded-3xl border border-(--card-border) bg-(--card-background)/40 hover:bg-(--card-background)/70 backdrop-blur-xs p-6 shadow-md transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                      >
                        <Link href={`/c/${comm.slug}`} className="group flex-1">
                          <div className="flex items-center gap-3.5 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                              {comm.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={comm.avatar}
                                  alt={comm.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <svg className="w-6 h-6 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l.406.34a.75.75 0 010 1.142l-.406.34a1.204 1.204 0 00-.405.864v.568c0 .26.104.51.29.697l.406.406a.75.75 0 001.061 0l.406-.406a1.204 1.204 0 01.864-.405h.568c.26 0 .51-.104.697-.29l.406-.406a.75.75 0 000-1.061l-.406-.406a1.204 1.204 0 01-.29-.864v-.568a.75.75 0 00-.75-.75h-.568a1.204 1.204 0 01-.864-.29l-.406-.406a.75.75 0 00-1.061 0l-.406.406a1.204 1.204 0 01-.29.29zm-6.75 4.5v.568c0 .334.148.65.405.864l.406.34a.75.75 0 010 1.142l-.406.34a1.204 1.204 0 00-.405.864v.568c0 .26.104.51.29.697l.406.406a.75.75 0 001.061 0l.406-.406a1.204 1.204 0 01.864-.405h.568c.26 0 .51-.104.697-.29l.406-.406a.75.75 0 000-1.061l-.406-.406a1.204 1.204 0 01-.29-.864v-.568a.75.75 0 00-.75-.75h-.568a1.204 1.204 0 01-.864-.29l-.406-.406a.75.75 0 00-1.061 0l-.406.406a1.204 1.204 0 01-.29.29zM18 15.75a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-black text-(--foreground) truncate group-hover:text-orange transition-colors">
                                c/{comm.slug}
                              </h3>
                              <span className="block text-[10px] text-dust-grey font-semibold mt-0.5">
                                {comm.name}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-(--text-secondary) line-clamp-2 leading-relaxed mb-4">
                            {comm.description}
                          </p>
                        </Link>
                        <div className="border-t border-(--divider-color)/40 pt-4 flex items-center justify-between mt-2">
                          <span className="text-[11px] font-bold text-dust-grey font-mono">
                            {comm.membersCount} {comm.membersCount === 1 ? "member" : "members"}
                          </span>
                          <button
                            onClick={() => handleCommunityJoinLeave(comm)}
                            className={`px-4 py-1.5 rounded-full text-xs font-extrabold cursor-pointer border shadow-sm transition-all duration-300 shrink-0 ${
                              comm.isJoined
                                ? "bg-spicy-paprika/15 border-spicy-paprika/30 text-spicy-paprika hover:bg-spicy-paprika/25"
                                : comm.isPending
                                ? "bg-orange/15 border-orange text-orange italic"
                                : "bg-orange border-orange text-ink-black hover:bg-orange-600"
                            }`}
                          >
                            {comm.isJoined ? "Joined" : comm.isPending ? "Pending" : "Join"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Profiles Search Cards Grid
              <div className="flex flex-col gap-4">
                {isLoadingUsers ? (
                  <div className="text-center py-20 flex flex-col items-center justify-center text-dust-grey gap-3">
                    <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span className="text-xs font-mono tracking-wider animate-pulse">Brewing matching profiles...</span>
                  </div>
                ) : searchedUsers.length === 0 ? (
                  <div className="text-center py-20 rounded-2xl border border-dashed border-(--card-border) bg-(--card-background) flex flex-col items-center justify-center p-6">
                    <div className="text-spicy-paprika mb-3 bg-spicy-paprika/5 p-4 rounded-full border border-spicy-paprika/10">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 018.625 21c-2.331 0-4.512-.645-6.374-1.766v-.109A12.318 12.318 0 018.625 18c1.63 0 3.197.315 4.63.888m-1.155-12.012a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM20.25 8.582a3.001 3.001 0 11-4.708 3.697 3.003 3.003 0 002.327-.999 3.003 3.003 0 002.381-2.698z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-(--foreground)">No member profiles match</h3>
                    <p className="text-xs text-dust-grey mt-1.5 max-w-sm">
                      We could not find any active members matching your search keyword.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {searchedUsers.map((dev) => (
                      <div
                        key={dev._id}
                        className="rounded-3xl border border-(--card-border) bg-(--card-background)/40 hover:bg-(--card-background)/70 backdrop-blur-xs p-6 shadow-md transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                      >
                        <Link href={`/profile?username=${dev.username}`} className="group flex-1">
                          {/* Card Header area */}
                          <div className="flex items-center gap-3.5 mb-4">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-(--profile-avatar-bg) border border-(--profile-border) flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                              {dev.avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={dev.avatar}
                                  alt={dev.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${dev.username}`;
                                  }}
                                />
                              ) : (
                                <span className="text-sm font-extrabold text-(--profile-avatar-text)">
                                  {dev.name.substring(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs font-black text-(--foreground) truncate group-hover:text-orange transition-colors">
                                  {dev.name}
                                </h3>
                                {dev.role && dev.role !== "member" && (
                                  <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[8px] font-extrabold uppercase text-purple-400">
                                    {dev.role}
                                  </span>
                                )}
                              </div>
                              <span className="block text-[10px] text-dust-grey font-semibold mt-0.5 font-mono">
                                @{dev.username}
                              </span>
                            </div>
                          </div>

                          {/* Bio */}
                          {dev.bio ? (
                            <p className="text-xs text-(--text-secondary) line-clamp-2 leading-relaxed mb-4">
                              {dev.bio}
                            </p>
                          ) : (
                            <p className="text-xs italic text-dust-grey mb-4">
                              This user is still brewing a bio.
                            </p>
                          )}
                        </Link>

                        {/* Card footer details */}
                        <div className="border-t border-(--divider-color)/40 pt-4 flex items-center justify-between text-[11px] font-bold text-dust-grey mt-2">
                          <span className="flex items-center gap-1 font-mono text-orange">
                            <span>★</span>
                            <span>{dev.karma || 0} karma</span>
                          </span>

                          <Link
                            href={`/profile?username=${dev.username}`}
                            className="text-orange hover:underline flex items-center gap-0.5"
                          >
                            <span>View Profile</span>
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                            </svg>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}

export default function SearchClient() {
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
