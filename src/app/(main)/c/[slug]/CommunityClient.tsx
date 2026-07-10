"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Thread, Comment } from "@/types/post";
import { FeedSidebar } from "@/components/home/FeedSidebar";
import { DiscussionFeed } from "@/components/home/DiscussionFeed";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";
import { ReportModal } from "@/components/shared/ReportModal";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  updateCommentVote 
} from "@/components/post/commentHelpers";
import { MembersRosterModal } from "@/components/community/MembersRosterModal";
import { ModeratorHubModal } from "@/components/community/ModeratorHubModal";
import { CommunityBannerPanel } from "@/components/community/CommunityBannerPanel";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";

interface CreatorInfo {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  karma?: number;
}

interface CommunityInfo {
  _id: string;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  creator: CreatorInfo;
  createdAt: string;
  isPrivate?: boolean;
  rules?: string[];
  avatar?: string;
  banner?: string;
}

interface CommunityUserInfo {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  karma?: number;
  isCreator?: boolean;
  isModerator?: boolean;
}


export default function CommunityClient({ 
  initialCommunity, 
  slug 
}: { 
  initialCommunity: CommunityInfo; 
  slug: string; 
}) {
  const { userData, setIsCreatePostOpen } = useAuth();
  const router = useRouter();

  // State Management
  const [community, setCommunity] = useState<CommunityInfo | null>(initialCommunity);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [membersCount, setMembersCount] = useState(initialCommunity?.membersCount || 0);
  const [sortBy, setSortBy] = useState<"trending" | "recent">("trending");
  
  // UI states
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isJoinActionLoading, setIsJoinActionLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [visibleCount, setVisibleCount] = useState(10);

  // Roster Directory Modal State
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [membersList, setMembersList] = useState<CommunityUserInfo[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Moderator Hub State
  const [isModPortalOpen, setIsModPortalOpen] = useState(false);

  // 1. Fetch Community Metadata
  const loadCommunityInfo = useCallback(async () => {
    try {
      setIsLoadingCommunity(true);
      const res = await axiosInstance.get(`/api/communities/${slug}`);
      if (res.data?.success && res.data?.community) {
        setCommunity(res.data.community);
        setIsJoined(res.data.isJoined || false);
        setIsPending(res.data.isPending || false);
        setIsBanned(res.data.isBanned || false);
        setIsAdmin(res.data.isAdmin || false);
        setIsModerator(res.data.isModerator || false);
        setMembersCount(res.data.community.membersCount || 0);
      } else {
        toast.error("Failed to load community information.");
      }
    } catch (err) {
      console.error("Error fetching community info:", err);
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setCommunity(null);
      }
    } finally {
      setIsLoadingCommunity(false);
    }
  }, [slug]);

  // Fetch Member Roster
  const fetchMembersList = useCallback(async () => {
    try {
      setIsLoadingMembers(true);
      const res = await axiosInstance.get(`/api/communities/${slug}/members`);
      if (res.data?.success) {
        setMembersList(res.data.members);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to load members roster.");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [slug]);

  // 2. Fetch Posts for this community
  const loadCommunityPosts = useCallback(async () => {
    try {
      setIsLoadingPosts(true);
      const res = await axiosInstance.get(`/api/posts?communitySlug=${slug}&sort=${sortBy}`);
      if (res.data?.posts) {
        setThreads(res.data.posts);
      }
    } catch (err) {
      console.error("Error loading community posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [slug, sortBy]);

  // Load community metadata on slug mount/change
  useEffect(() => {
    if (!slug) return;
    const timer = setTimeout(() => {
      loadCommunityInfo();
    }, 0);
    return () => clearTimeout(timer);
  }, [slug, loadCommunityInfo]);

  // Load community posts when slug or sortBy changes
  useEffect(() => {
    if (!slug) return;
    const timer = setTimeout(() => {
      loadCommunityPosts();
    }, 0);
    return () => clearTimeout(timer);
  }, [slug, sortBy, loadCommunityPosts]);

  // Sync visible post counts
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(10);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeCategory, selectedTag, sortBy]);

  // Infinite Scroll Listener
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

  // Handle Post Created
  useEffect(() => {
    const handleNewPost = () => {
      loadCommunityPosts();
    };
    window.addEventListener("new-post-created", handleNewPost);
    return () => {
      window.removeEventListener("new-post-created", handleNewPost);
    };
  }, [loadCommunityPosts]);

  // Join / Leave Actions
  const handleJoinLeave = async () => {
    if (!userData) {
      toast.warning("Please pull up a chair and Log In to join this community!");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (isJoinActionLoading || !community) return;

    try {
      setIsJoinActionLoading(true);
      const action = (isJoined || isPending) ? "leave" : "join";
      const res = await axiosInstance.post(`/api/communities/${slug}/join`, { action });

      if (res.data?.success) {
        setIsJoined(res.data.isJoined || false);
        setIsPending(res.data.isPending || false);
        setMembersCount(res.data.membersCount);
        
        if (res.data.isPending) {
          toast.success("Join request sent! Pending moderator approval.");
        } else {
          toast.success(res.data.isJoined ? `Joined c/${slug}!` : `Left c/${slug}!`);
        }
        
        window.dispatchEvent(new Event("joined-communities-changed"));
      }
    } catch (err) {
      console.error("Failed to toggle join status:", err);
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to update membership. Please try again.");
    } finally {
      setIsJoinActionLoading(false);
    }
  };

  // Upvote/Downvote actions
  const handleVote = async (id: string, type: "up" | "down") => {
    if (!userData) {
      toast.warning("Please pull up a chair and Log In to vote!");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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
      console.error("Error voting:", err);
    }
  };

  // Add Comment Flow
  const handleAddComment = async (threadId: string, text: string) => {
    if (!userData) {
      toast.warning("Please log in first to do that!");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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
              comments: [...(post.comments || []), res.data.comment],
            };
          })
        );
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to add comment.");
    }
  };

  // Add Reply Flow
  const handleAddReply = async (threadId: string, commentId: string, text: string) => {
    if (!userData) {
      toast.warning("Please log in first to do that!");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    try {
      const res = await axiosInstance.post("/api/comments", {
        postId: threadId,
        parentId: commentId,
        content: text,
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
      toast.error("Failed to add reply.");
    }
  };

  // Edit Comment Flow
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
        toast.success("Comment updated successfully!");
      }
    } catch (err) {
      console.error("Error editing comment:", err);
      toast.error("Failed to edit comment.");
    }
  };

  // Delete Comment Flow
  const handleDeleteComment = async (threadId: string, commentId: string) => {
    try {
      const res = await axiosInstance.delete(`/api/comments/${commentId}`);
      const deletedCount = res.data?.deletedCount || 1;

      if (res.data?.success) {
        toast.success("Comment deleted successfully!");
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
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment.");
    }
  };

  // Comment Vote Flow
  const handleCommentVote = async (threadId: string, commentId: string) => {
    if (!userData) {
      toast.warning("Please log in first to do that!");
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
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
      console.error("Error voting comment:", err);
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

  // Category and Tag lists logic
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

  const filteredThreads = threads
    .filter((t) => {
      const matchesCategory = activeCategory === "All" || t.category === activeCategory;
      const matchesTag =
        !selectedTag ||
        t.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase());
      return matchesCategory && matchesTag;
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

  // Skeletal Loading / Errors
  if (isLoadingCommunity) {
    return (
      <div className="flex flex-col flex-1 bg-(--background) items-center justify-center py-20 text-dust-grey gap-3">
        <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider animate-pulse">Brewing community page...</span>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center py-24 text-center px-4 bg-(--background)">
        <div className="p-4 bg-orange/5 text-orange rounded-full border border-orange/10 mb-4 animate-bounce">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-xl font-black text-(--foreground)">Community Not Found</h2>
        <p className="text-xs text-dust-grey mt-2 max-w-sm leading-relaxed">
          The sub-community `/c/{slug}` does not exist yet. Pull up a chair and start one yourself!
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 rounded-2xl bg-orange hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-ink-black shadow-md cursor-pointer transition-all active:scale-95"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* 1. MEMBERS DIRECTORY MODAL OVERLAY */}
      <MembersRosterModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        isLoadingMembers={isLoadingMembers}
        membersList={membersList}
        isModerator={isModerator}
        isAdmin={isAdmin}
        userData={userData}
        slug={slug}
        fetchMembersList={fetchMembersList}
        loadCommunityInfo={loadCommunityInfo}
      />

      {/* 2. MODERATOR HUB PORTAL OVERLAY */}
      <ModeratorHubModal
        isOpen={isModPortalOpen}
        onClose={() => setIsModPortalOpen(false)}
        community={community}
        slug={slug}
        isAdmin={isAdmin}
        userData={userData}
        loadCommunityInfo={loadCommunityInfo}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: NAVIGATION SIDEBAR */}
        <FeedSidebar
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          categories={categoriesList}
          categoryCounts={categoryCounts}
          tagCounts={tagCounts}
        />

        {/* CENTER COLUMN: MAIN FEED WITH BANNER HEADER */}
        <main className="lg:col-span-6 flex flex-col min-w-0">
          
          {isBanned && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-xs font-bold text-red-500 mb-6 flex items-center gap-2 shadow-md">
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>You are banned from participating in this community. You cannot create new posts or comment.</span>
            </div>
          )}

          {/* Glassmorphic Community Banner Panel */}
          <CommunityBannerPanel
            community={community}
            isLoggedIn={!!userData}
            isAdmin={isAdmin}
            isBanned={isBanned}
            isJoined={isJoined}
            isPending={isPending}
            isModerator={isModerator}
            isJoinActionLoading={isJoinActionLoading}
            handleJoinLeave={handleJoinLeave}
            setIsReportModalOpen={setIsReportModalOpen}
            setIsModPortalOpen={setIsModPortalOpen}
          />

          {/* Posts Feed */}
          <DiscussionFeed
            filteredThreads={filteredThreads.slice(0, visibleCount)}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onVote={handleVote}
            onTagClick={(tag) => setSelectedTag(tag)}
            onStartCharcha={() => {
              if (!userData) {
                router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
              } else if (!isJoined) {
                toast.error("You must join this community before posting.");
              } else {
                setIsCreatePostOpen(true);
              }
            }}
            userData={userData}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onEditSubmit={handleEditSubmit}
            onDeleteComment={handleDeleteComment}
            onCommentVote={handleCommentVote}
            onUpdateThread={handleUpdateThread}
            onDeletePost={handleDeletePost}
            onRefresh={loadCommunityPosts}
            isLoading={isLoadingPosts}
            hasMore={visibleCount < filteredThreads.length}
            isCommunityMod={isModerator}
            isBanned={isBanned}
          />
        </main>

        {/* RIGHT COLUMN: ABOUT COMMUNITY SIDEBAR */}
        <CommunitySidebar
          community={community}
          membersCount={membersCount}
          isJoined={isJoined}
          isModerator={isModerator}
          handleOpenMembersModal={() => {
            setIsMembersModalOpen(true);
            fetchMembersList();
          }}
        />

      </div>

      {community && (
        <ReportModal
          isOpen={isReportModalOpen}
          targetId={community._id}
          targetType="Community"
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
}


