"use client";

import React, { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Thread } from "@/app/(main)/post/postData";
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

interface BanSuggestionUser extends CommunityUserInfo {
  isAlreadyBanned: boolean;
}

function CommunityPageContent() {
  const { slug } = useParams<{ slug: string }>();
  const { user: isLoggedIn, userData, setIsCreatePostOpen } = useAuth();
  const router = useRouter();

  // State Management
  const [community, setCommunity] = useState<CommunityInfo | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [membersCount, setMembersCount] = useState(0);
  const [sortBy, setSortBy] = useState<"trending" | "recent">("trending");
  
  // UI states
  const [isLoadingCommunity, setIsLoadingCommunity] = useState(true);
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
  const [modTab, setModTab] = useState<"requests" | "bans" | "moderators" | "settings">("requests");
  const [pendingRequestsList, setPendingRequestsList] = useState<CommunityUserInfo[]>([]);
  const [bannedUsersList, setBannedUsersList] = useState<CommunityUserInfo[]>([]);
  const [banInput, setBanInput] = useState("");
  const [modInput, setModInput] = useState("");
  const [rulesInput, setRulesInput] = useState("");
  const [avatarInput, setAvatarInput] = useState("");
  const [bannerInput, setBannerInput] = useState("");
  const [isModActionLoading, setIsModActionLoading] = useState(false);
  const [allUsersList, setAllUsersList] = useState<CommunityUserInfo[]>([]);
  const [isResolvingAvatar, setIsResolvingAvatar] = useState(false);
  const [isResolvingBanner, setIsResolvingBanner] = useState(false);

  const isAvatarResolvable = avatarInput.trim().startsWith("http") && 
    (avatarInput.includes("pin.it") || 
     avatarInput.includes("pinterest.com") || 
     !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(avatarInput));

  const isBannerResolvable = bannerInput.trim().startsWith("http") && 
    (bannerInput.includes("pin.it") || 
     bannerInput.includes("pinterest.com") || 
     !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(bannerInput));

  const handleResolveCommunityAvatar = async () => {
    if (!avatarInput.trim()) return;
    setIsResolvingAvatar(true);
    try {
      const res = await axiosInstance.post("/api/resolve-avatar", { url: avatarInput.trim() });
      if (res.data?.imageUrl) {
        setAvatarInput(res.data.imageUrl);
        toast.success("Successfully resolved avatar image URL!");
      }
    } catch (err) {
      toast.error("Failed to resolve image URL.");
    } finally {
      setIsResolvingAvatar(false);
    }
  };

  const handleResolveCommunityBanner = async () => {
    if (!bannerInput.trim()) return;
    setIsResolvingBanner(true);
    try {
      const res = await axiosInstance.post("/api/resolve-avatar", { url: bannerInput.trim() });
      if (res.data?.imageUrl) {
        setBannerInput(res.data.imageUrl);
        toast.success("Successfully resolved banner image URL!");
      }
    } catch (err) {
      toast.error("Failed to resolve image URL.");
    } finally {
      setIsResolvingBanner(false);
    }
  };

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
        setRulesInput(res.data.community.rules ? res.data.community.rules.join("\n") : "");
        setAvatarInput(res.data.community.avatar || "");
        setBannerInput(res.data.community.banner || "");
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

  // Fetch Pending Queue
  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/communities/${slug}/requests`);
      if (res.data?.success) {
        setPendingRequestsList(res.data.requests);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  }, [slug]);

  // Process Approval Queue
  const handleProcessRequest = async (userId: string, action: "approve" | "reject") => {
    try {
      setIsModActionLoading(true);
      const res = await axiosInstance.post(`/api/communities/${slug}/requests`, { userId, action });
      if (res.data?.success) {
        toast.success(`Request ${action}d successfully!`);
        setPendingRequestsList((prev) => prev.filter((r) => r._id !== userId));
        loadCommunityInfo();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Action failed.");
    } finally {
      setIsModActionLoading(false);
    }
  };

  // Fetch Banned Users
  const fetchBannedUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/communities/${slug}/bans`);
      if (res.data?.success) {
        setBannedUsersList(res.data.bannedUsers);
      }
    } catch (err) {
      console.error("Error fetching bans:", err);
    }
  }, [slug]);

  // Process Bans
  const handleBanAction = async (action: "ban" | "unban", usernameStr?: string) => {
    const uName = usernameStr || banInput;
    if (!uName.trim()) return;
    try {
      setIsModActionLoading(true);
      const res = await axiosInstance.post(`/api/communities/${slug}/bans`, { username: uName.trim(), action });
      if (res.data?.success) {
        toast.success(`User @${uName} successfully ${action}ned!`);
        if (action === "ban") {
          setBanInput("");
          fetchBannedUsers();
        } else {
          setBannedUsersList((prev) => prev.filter((u) => u.username !== uName));
        }
        loadCommunityInfo();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Action failed.");
    } finally {
      setIsModActionLoading(false);
    }
  };

  // Appoint Moderators
  const handleModAction = async (action: "promote" | "demote", usernameStr?: string) => {
    const uName = usernameStr || modInput;
    if (!uName.trim()) return;
    try {
      setIsModActionLoading(true);
      const res = await axiosInstance.post(`/api/communities/${slug}/moderators`, { username: uName.trim(), action });
      if (res.data?.success) {
        toast.success(`User @${uName} successfully ${action === "promote" ? "appointed moderator" : "demoted"}!`);
        setModInput("");
        loadCommunityInfo();
        fetchMembersList();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Action failed.");
    } finally {
      setIsModActionLoading(false);
    }
  };

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

  // Load everything on mount
  useEffect(() => {
    if (!slug) return;
    const timer = setTimeout(() => {
      loadCommunityInfo();
      loadCommunityPosts();
    }, 0);
    return () => clearTimeout(timer);
  }, [slug, loadCommunityInfo, loadCommunityPosts]);

  // Sync visible post counts
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleCount(10);
    }, 0);
    return () => clearTimeout(timer);
  }, [activeCategory, selectedTag, sortBy]);

  // Load Moderator Hub lists and suggestions
  useEffect(() => {
    if (isModPortalOpen) {
      const timer = setTimeout(() => {
        fetchMembersList();
        fetchBannedUsers();
        fetchPendingRequests();
      }, 0);
      
      const loadAllUsers = async () => {
        try {
          const res = await axiosInstance.get("/api/profile?all=true");
          if (res.data?.success || res.data?.users) {
            setAllUsersList(res.data.users);
          }
        } catch (e) {
          console.error("Error loading user suggestions:", e);
        }
      };
      loadAllUsers();

      return () => clearTimeout(timer);
    }
  }, [isModPortalOpen, fetchMembersList, fetchBannedUsers, fetchPendingRequests]);

  // Suggest existing users for Banning/Unbanning
  const banSuggestions = useMemo(() => {
    const query = banInput.trim().toLowerCase();
    if (!query) return [];
    
    return allUsersList.filter((u) => {
      const isSelf = userData && (userData.id === u._id || userData.id === u._id.toString());
      const matchesUsername = u.username.toLowerCase().includes(query);
      const matchesName = u.name.toLowerCase().includes(query);
      return (matchesUsername || matchesName) && !isSelf;
    }).map(u => ({
      ...u,
      isAlreadyBanned: bannedUsersList.some((b) => b._id === u._id)
    })).slice(0, 5);
  }, [banInput, allUsersList, bannedUsersList, userData]);

  const isInputUserBanned = useMemo(() => {
    const input = banInput.trim().toLowerCase();
    return bannedUsersList.some(b => b.username.toLowerCase() === input);
  }, [banInput, bannedUsersList]);

  // Suggest joined members who are not moderators yet
  const modSuggestions = useMemo(() => {
    const query = modInput.trim().toLowerCase();
    if (!query) return [];

    return membersList.filter((u) => {
      const isSelf = userData && (userData.id === u._id || userData.id === u._id.toString());
      const creatorId = community?.creator?._id || community?.creator;
      const isCreator = creatorId === u._id;
      const isAlreadyMod = u.isModerator;
      const matchesUsername = u.username.toLowerCase().includes(query);
      const matchesName = u.name.toLowerCase().includes(query);
      return (matchesUsername || matchesName) && !isCreator && !isAlreadyMod && !isSelf;
    }).slice(0, 5);
  }, [modInput, membersList, community, userData]);

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
    if (!isLoggedIn) {
      toast.warning("Please pull up a chair and Log In to join this community!");
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
    if (!isLoggedIn) {
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
        toast.success(type === "up" ? "Charcha upvoted!" : "Charcha downvoted!");
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
      console.error("Error voting:", err);
    }
  };

  // Add Comment Flow
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
            return {
              ...post,
              commentsCount: post.commentsCount + 1,
              comments: [...(post.comments || []), res.data.comment],
            };
          })
        );
        toast.success("Comment added successfully!");
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      toast.error("Failed to add comment.");
    }
  };

  // Add Reply Flow
  const handleAddReply = async (threadId: string, commentId: string, text: string) => {
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
        toast.success("Reply added successfully!");
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
      {isMembersModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-5 shadow-2xl backdrop-blur-lg flex flex-col max-h-[80vh] relative animate-slide-down">
            <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5 mb-4">
              <h2 className="text-sm sm:text-base font-extrabold text-(--foreground) flex items-center gap-2">
                <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.978 11.978 0 0112 20.25a11.98 11.98 0 01-3-.122v-.109m0-1.018a4.125 4.125 0 00-7.533 2.493 9.337 9.337 0 004.121.952 9.38 9.38 0 002.625-.372m0-3.03c0-1.113.285-2.16.786-3.07M12 18.75a6 6 0 100-12 6 6 0 000 12z" />
                </svg>
                <span>Joined Members Directory</span>
              </h2>
              <button
                onClick={() => setIsMembersModalOpen(false)}
                className="rounded-full p-1 hover:bg-(--btn-icon-hover-bg) text-dust-grey hover:text-(--foreground) cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoadingMembers ? (
              <div className="py-12 flex flex-col justify-center items-center text-dust-grey gap-2">
                <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[10px] font-mono tracking-wider animate-pulse">Brewing members...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {membersList.length === 0 ? (
                  <p className="text-xs text-dust-grey italic py-8 text-center">No joined members found.</p>
                ) : (
                  membersList.map((m) => (
                    <div key={m._id} className="flex items-center justify-between bg-(--card-background)/35 p-3 rounded-xl border border-(--card-border)/80">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white font-mono">
                          {m.avatar && (m.avatar.startsWith("http") || m.avatar.startsWith("/")) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                          ) : (
                            m.avatar || m.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-(--foreground)">{m.name}</span>
                          <span className="text-3xs font-semibold font-mono text-dust-grey">@{m.username}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.isCreator && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-orange bg-orange/15 px-2 py-0.5 rounded-md border border-orange/25">
                            Admin
                          </span>
                        )}
                        {m.isModerator && !m.isCreator && (
                          <span className="text-[8px] font-black uppercase tracking-wider text-vivid-tangerine bg-vivid-tangerine/15 px-2 py-0.5 rounded-md border border-vivid-tangerine/25">
                            Mod
                          </span>
                        )}
                        <span className="text-3xs font-extrabold text-dust-grey px-2 py-0.5 rounded-full bg-(--nav-border)/40 shrink-0 font-mono">
                          +{m.karma || 0} rep
                        </span>
                        {isModerator && !m.isCreator && (!m.isModerator || isAdmin) && m._id.toString() !== userData?.id && (
                          <button
                            onClick={async () => {
                              const conf = confirm(`Are you sure you want to kick @${m.username} from c/${slug}?`);
                              if (!conf) return;
                              try {
                                const res = await axiosInstance.post(`/api/communities/${slug}/members`, { username: m.username });
                                if (res.data?.success) {
                                  toast.success(`Successfully kicked @${m.username}!`);
                                  fetchMembersList();
                                  loadCommunityInfo();
                                }
                              } catch (err) {
                                const error = err as { response?: { data?: { error?: string } } };
                                toast.error(error.response?.data?.error || "Failed to kick member.");
                              }
                            }}
                            className="px-2 py-1 rounded-md bg-transparent border border-spicy-paprika text-spicy-paprika hover:bg-spicy-paprika/10 active:scale-95 text-[9px] font-black uppercase transition-all cursor-pointer select-none shrink-0"
                            title={`Kick @${m.username}`}
                          >
                            Kick
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. MODERATOR HUB PORTAL OVERLAY */}
      {isModPortalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-6 shadow-2xl backdrop-blur-lg flex flex-col max-h-[85vh] relative animate-slide-down">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5 mb-4">
              <h2 className="text-base sm:text-lg font-black text-(--foreground) flex items-center gap-2">
                <svg className="w-5.5 h-5.5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>c/{community.slug} Moderator Hub</span>
              </h2>
              <button
                onClick={() => setIsModPortalOpen(false)}
                className="rounded-full p-1 hover:bg-(--btn-icon-hover-bg) text-dust-grey hover:text-(--foreground) cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-(--divider-color)/60 pb-2 mb-4 gap-4 text-xs font-black text-dust-grey select-none">
              <button
                onClick={() => { setModTab("requests"); fetchPendingRequests(); }}
                className={`pb-1 cursor-pointer transition-colors ${modTab === "requests" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
              >
                Requests ({pendingRequestsList.length})
              </button>
              <button
                onClick={() => { setModTab("bans"); fetchBannedUsers(); }}
                className={`pb-1 cursor-pointer transition-colors ${modTab === "bans" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
              >
                Bans
              </button>
              {isAdmin && (
                <button
                  onClick={() => { setModTab("moderators"); fetchMembersList(); }}
                  className={`pb-1 cursor-pointer transition-colors ${modTab === "moderators" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
                >
                  Mods Management
                </button>
              )}
              <button
                onClick={() => setModTab("settings")}
                className={`pb-1 cursor-pointer transition-colors ${modTab === "settings" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
              >
                Settings
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh]">
              {/* Tab 1: PENDING REQUESTS */}
              {modTab === "requests" && (
                <div className="space-y-3">
                  {pendingRequestsList.length === 0 ? (
                    <p className="text-xs text-dust-grey italic py-12 text-center">No pending membership requests.</p>
                  ) : (
                    pendingRequestsList.map((req) => (
                      <div key={req._id} className="flex items-center justify-between p-3 bg-(--card-background)/40 border border-(--card-border) rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                            {req.avatar && (req.avatar.startsWith("http") || req.avatar.startsWith("/")) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={req.avatar} alt={req.name} className="h-full w-full object-cover" />
                            ) : (
                              req.avatar || req.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-extrabold text-(--foreground)">{req.name}</span>
                            <span className="text-3xs font-semibold font-mono text-dust-grey">@{req.username}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleProcessRequest(req._id, "approve")}
                            disabled={isModActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-orange text-ink-black font-extrabold text-[10px] shadow-sm cursor-pointer hover:bg-orange-600 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessRequest(req._id, "reject")}
                            disabled={isModActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-transparent border border-spicy-paprika text-spicy-paprika font-extrabold text-[10px] cursor-pointer hover:bg-spicy-paprika/5 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: BANNING */}
              {modTab === "bans" && (
                <div className="space-y-4">
                  {/* Ban Form */}
                  <div className="flex items-end gap-2 border-b border-(--divider-color)/40 pb-4">
                    <div className="flex-1 relative">
                      <label htmlFor="ban-username" className="block text-2xs font-extrabold text-dust-grey uppercase mb-1">
                        Ban User by Username
                      </label>
                      <input
                        type="text"
                        id="ban-username"
                        value={banInput}
                        onChange={(e) => setBanInput(e.target.value)}
                        placeholder="e.g. janesmith"
                        className="w-full text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                        disabled={isModActionLoading}
                        autoComplete="off"
                      />
                      {banSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-(--dropdown-border) bg-(--dropdown-bg)/95 backdrop-blur-md shadow-lg overflow-hidden py-1 max-h-40 overflow-y-auto animate-fade-in">
                          {banSuggestions.map((u: BanSuggestionUser) => (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => setBanInput(u.username)}
                              className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-(--foreground) hover:bg-orange/10 transition-colors cursor-pointer"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="h-5 w-5 rounded-full overflow-hidden border border-orange/15 flex items-center justify-center bg-(--profile-bg) text-[8px] font-bold text-floral-white shrink-0">
                                  {u.avatar && (u.avatar.startsWith("http") || u.avatar.startsWith("/")) ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                                  ) : (
                                    u.avatar || u.name.substring(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="font-extrabold truncate text-3xs">{u.name}</span>
                                  <span className="text-[9px] text-dust-grey font-mono truncate">@{u.username}</span>
                                </div>
                              </div>
                              {u.isAlreadyBanned && (
                                <span className="text-[8px] font-black uppercase text-spicy-paprika bg-spicy-paprika/15 px-1.5 py-0.5 rounded border border-spicy-paprika/20 shrink-0">
                                  Banned
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {isInputUserBanned ? (
                      <button
                        onClick={() => handleBanAction("unban")}
                        disabled={isModActionLoading}
                        className="px-4 py-2.5 rounded-xl bg-orange text-ink-black font-extrabold text-xs cursor-pointer shadow-md hover:bg-orange-600 disabled:opacity-55 shrink-0"
                      >
                        Unban User
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanAction("ban")}
                        disabled={isModActionLoading || !banInput.trim()}
                        className="px-4 py-2.5 rounded-xl bg-spicy-paprika text-floral-white font-extrabold text-xs cursor-pointer shadow-md hover:bg-spicy-paprika-600 disabled:opacity-55 shrink-0"
                      >
                        Ban User
                      </button>
                    )}
                  </div>

                  {/* Banned Users List */}
                  <div className="space-y-3">
                    <h4 className="text-2xs font-extrabold uppercase text-dust-grey tracking-wider">Currently Banned ({bannedUsersList.length})</h4>
                    {bannedUsersList.length === 0 ? (
                      <p className="text-xs text-dust-grey italic py-4 text-center">No banned users inside this community.</p>
                    ) : (
                      bannedUsersList.map((user) => (
                        <div key={user._id} className="flex items-center justify-between p-3 bg-(--card-background)/40 border border-(--card-border) rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                              {user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/")) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                              ) : (
                                user.avatar || user.name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-extrabold text-(--foreground)">{user.name}</span>
                              <span className="text-3xs font-semibold font-mono text-dust-grey">@{user.username}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleBanAction("unban", user.username)}
                            disabled={isModActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-transparent border border-orange text-orange font-extrabold text-[10px] cursor-pointer hover:bg-orange/5 disabled:opacity-50"
                          >
                            Unban
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: MODERATOR APPOINTMENT */}
              {modTab === "moderators" && isAdmin && (
                <div className="space-y-4">
                  {/* Promote Form */}
                  <div className="flex items-end gap-2 border-b border-(--divider-color)/40 pb-4">
                    <div className="flex-1 relative">
                      <label htmlFor="mod-username" className="block text-2xs font-extrabold text-dust-grey uppercase mb-1">
                        Appoint Moderator by Username
                      </label>
                      <input
                        type="text"
                        id="mod-username"
                        value={modInput}
                        onChange={(e) => setModInput(e.target.value)}
                        placeholder="e.g. johndoe"
                        className="w-full text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                        disabled={isModActionLoading}
                        autoComplete="off"
                      />
                      {modSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-(--dropdown-border) bg-(--dropdown-bg)/95 backdrop-blur-md shadow-lg overflow-hidden py-1 max-h-40 overflow-y-auto animate-fade-in">
                          {modSuggestions.map((u: CommunityUserInfo) => (
                            <button
                              key={u._id}
                              type="button"
                              onClick={() => setModInput(u.username)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-(--foreground) hover:bg-orange/10 transition-colors cursor-pointer"
                            >
                              <div className="h-5 w-5 rounded-full overflow-hidden border border-orange/15 flex items-center justify-center bg-(--profile-bg) text-[8px] font-bold text-floral-white shrink-0">
                                {u.avatar && (u.avatar.startsWith("http") || u.avatar.startsWith("/")) ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                                ) : (
                                  u.avatar || u.name.substring(0, 2).toUpperCase()
                                )}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-extrabold truncate text-3xs">{u.name}</span>
                                <span className="text-[9px] text-dust-grey font-mono truncate">@{u.username}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleModAction("promote")}
                      disabled={isModActionLoading || !modInput.trim()}
                      className="px-4 py-2.5 rounded-xl bg-orange text-ink-black font-extrabold text-xs cursor-pointer shadow-md hover:bg-orange-600 disabled:opacity-55 shrink-0"
                    >
                      Promote User
                    </button>
                  </div>

                   {/* List of Current Mods */}
                  <div className="space-y-3">
                    <h4 className="text-2xs font-extrabold uppercase text-dust-grey tracking-wider">Moderators</h4>
                    {/* Creator is always head admin */}
                    <div className="flex items-center justify-between p-3 bg-orange/5 border border-orange/20 rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                          {community.creator?.avatar && (community.creator.avatar.startsWith("http") || community.creator.avatar.startsWith("/")) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={community.creator.avatar} alt={community.creator.name} className="h-full w-full object-cover" />
                          ) : (
                            community.creator?.name?.substring(0, 2).toUpperCase() || "CR"
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-(--foreground)">{community.creator?.name}</span>
                          <span className="text-3xs font-semibold font-mono text-dust-grey">@{community.creator?.username}</span>
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase text-orange bg-orange/15 px-2 py-0.5 rounded border border-orange/25">
                        Head Admin
                      </span>
                    </div>

                    {/* Appointed Moderators */}
                    {isLoadingMembers ? (
                      <div className="py-4 text-center">
                        <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
                      </div>
                    ) : (
                      membersList.filter(m => m.isModerator && !m.isCreator).map(mod => (
                        <div key={mod._id} className="flex items-center justify-between p-3 bg-(--card-background)/40 border border-(--card-border) rounded-xl">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                              {mod.avatar && (mod.avatar.startsWith("http") || mod.avatar.startsWith("/")) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={mod.avatar} alt={mod.name} className="h-full w-full object-cover" />
                              ) : (
                                mod.avatar || mod.name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-extrabold text-(--foreground)">{mod.name}</span>
                              <span className="text-3xs font-semibold font-mono text-dust-grey">@{mod.username}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleModAction("demote", mod.username)}
                            disabled={isModActionLoading}
                            className="px-3 py-1.5 rounded-lg bg-transparent border border-spicy-paprika text-spicy-paprika font-extrabold text-[10px] cursor-pointer hover:bg-spicy-paprika/5 disabled:opacity-50"
                          >
                            Demote
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: SETTINGS / RULES / DELETION */}
              {modTab === "settings" && (
                <div className="space-y-4">
                  {/* Community Avatar URL */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="settings-avatar" className="block text-2xs font-extrabold text-dust-grey uppercase">
                      Community Avatar URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="settings-avatar"
                        value={avatarInput}
                        onChange={(e) => setAvatarInput(e.target.value)}
                        placeholder="https://example.com/logo.png"
                        className="flex-1 text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                        disabled={isModActionLoading}
                      />
                      {isAvatarResolvable && (
                        <button
                          type="button"
                          onClick={handleResolveCommunityAvatar}
                          disabled={isResolvingAvatar}
                          className="px-3.5 py-2.5 bg-orange/15 hover:bg-orange/25 border border-orange/20 rounded-xl text-[10px] font-bold text-orange hover:text-orange-600 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isResolvingAvatar ? "Resolving..." : "⚡ Resolve"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Community Banner URL */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="settings-banner" className="block text-2xs font-extrabold text-dust-grey uppercase">
                      Community Banner URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="settings-banner"
                        value={bannerInput}
                        onChange={(e) => setBannerInput(e.target.value)}
                        placeholder="https://example.com/banner.png"
                        className="flex-1 text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                        disabled={isModActionLoading}
                      />
                      {isBannerResolvable && (
                        <button
                          type="button"
                          onClick={handleResolveCommunityBanner}
                          disabled={isResolvingBanner}
                          className="px-3.5 py-2.5 bg-orange/15 hover:bg-orange/25 border border-orange/20 rounded-xl text-[10px] font-bold text-orange hover:text-orange-600 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                        >
                          {isResolvingBanner ? "Resolving..." : "⚡ Resolve"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Update Rules Text */}
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="settings-rules" className="block text-2xs font-extrabold text-dust-grey uppercase">
                      Edit Community Rules (One per line)
                    </label>
                    <textarea
                      id="settings-rules"
                      value={rulesInput}
                      onChange={(e) => setRulesInput(e.target.value)}
                      className="w-full text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2 outline-none focus:border-orange resize-none text-(--foreground)"
                      rows={5}
                      placeholder="Be respectful to all members..."
                      disabled={isModActionLoading}
                    />
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        setIsModActionLoading(true);
                        const ruleArr = rulesInput.split("\n").map(r => r.trim()).filter(Boolean);
                        const res = await axiosInstance.put(`/api/communities/${slug}`, { 
                          rules: ruleArr,
                          avatar: avatarInput,
                          banner: bannerInput
                        });
                        if (res.data?.success) {
                          toast.success("Community settings updated successfully!");
                          loadCommunityInfo();
                        }
                      } catch (err) {
                        const error = err as { response?: { data?: { error?: string } } };
                        toast.error(error.response?.data?.error || "Failed to save settings.");
                      } finally {
                        setIsModActionLoading(false);
                      }
                    }}
                    disabled={isModActionLoading}
                    className="px-4 py-2.5 rounded-xl bg-orange text-ink-black font-extrabold text-xs cursor-pointer shadow-md hover:bg-orange-600 disabled:opacity-50"
                  >
                    Save Settings
                  </button>

                  {/* DELETE COMMUNITY (CREATOR ONLY) */}
                  {isAdmin && (
                    <div className="border-t border-(--divider-color)/60 pt-4 mt-4 space-y-2">
                      <h4 className="text-2xs font-extrabold text-spicy-paprika uppercase tracking-wider">Danger Zone</h4>
                      <p className="text-[10px] text-dust-grey leading-relaxed">
                        Permanently delete this community and all its threads/comments. This action is irreversible.
                      </p>
                      <button
                        onClick={async () => {
                          const conf = confirm(`Are you absolutely sure you want to delete c/${slug}?\nThis will permanently erase all threads, comments, and members.`);
                          if (!conf) return;
                          try {
                            setIsModActionLoading(true);
                            const res = await axiosInstance.delete(`/api/communities/${slug}`);
                            if (res.data?.success) {
                              toast.success("Community successfully deleted!");
                              setIsModPortalOpen(false);
                              router.push("/");
                            }
                          } catch (err) {
                            const error = err as { response?: { data?: { error?: string } } };
                            toast.error(error.response?.data?.error || "Failed to delete community.");
                          } finally {
                            setIsModActionLoading(false);
                          }
                        }}
                        disabled={isModActionLoading}
                        className="px-4 py-2 rounded-xl bg-spicy-paprika text-floral-white font-extrabold text-xs cursor-pointer hover:bg-spicy-paprika-600 disabled:opacity-50"
                      >
                        Delete Community
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          <div className="relative overflow-hidden rounded-3xl border border-(--card-border) bg-(--card-background) shadow-2xl transition-all duration-300 mb-6">
            {community.banner ? (
              <div className="h-32 sm:h-44 w-full relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={community.banner} 
                  alt={`${community.name} Banner`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-(--card-background) via-(--card-background)/35 to-transparent" />
              </div>
            ) : (
              <>
                {/* Ambient Background Glows */}
                <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-orange/10 blur-[80px] pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-spicy-paprika/10 blur-[80px] pointer-events-none" />
              </>
            )}

            <div className={`relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${community.banner ? "-mt-12 sm:-mt-16" : ""}`}>
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                {/* Community Avatar */}
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-4 border-(--card-background) bg-(--profile-bg) flex items-center justify-center text-xl font-bold text-floral-white font-mono shrink-0 shadow-lg relative">
                  {community.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={community.avatar} alt={community.name} className="h-full w-full object-cover" />
                  ) : (
                    community.name.substring(0, 2).toUpperCase()
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-orange bg-orange/10 border border-orange/20">
                      c/{community.slug}
                    </span>
                    {community.isPrivate && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/25">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                        Restricted
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-(--foreground)">
                    {community.name}
                  </h1>
                  <p className="text-xs text-(--text-secondary) leading-relaxed max-w-xl">
                    {community.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isLoggedIn && !isAdmin && (
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-2.5 rounded-2xl border border-(--card-border) bg-(--card-background) text-dust-grey hover:text-spicy-paprika hover:border-spicy-paprika/20 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
                    title="Report Community"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 5h12l-1 3.5 1 3.5H3" />
                    </svg>
                  </button>
                )}

                {isLoggedIn && !isBanned && !isAdmin && (
                  <button
                    onClick={handleJoinLeave}
                    disabled={isJoinActionLoading}
                    className={`rounded-2xl px-5 py-2.5 text-xs font-extrabold shadow-md cursor-pointer transition-all duration-200 active:scale-95 shrink-0 select-none ${
                      isJoined
                        ? "bg-transparent border border-spicy-paprika text-spicy-paprika hover:bg-spicy-paprika/5"
                        : isPending
                        ? "bg-amber-500/10 border border-amber-500 text-amber-500 hover:bg-amber-500/20"
                        : "bg-spicy-paprika text-floral-white hover:bg-spicy-paprika-600"
                    }`}
                  >
                    {isJoined ? "Leave" : isPending ? "Request Pending" : "Join"}
                  </button>
                )}

                {isLoggedIn && !isBanned && isAdmin && (
                  <span className="rounded-2xl px-5 py-2.5 text-xs font-extrabold bg-orange/15 border border-orange/25 text-orange shrink-0 select-none">
                    Admin / Creator
                  </span>
                )}

                {isLoggedIn && isBanned && (
                  <span className="rounded-2xl px-4 py-2 text-xs font-extrabold bg-red-500/15 border border-red-500/25 text-red-500 shrink-0 select-none">
                    Banned
                  </span>
                )}

                {isLoggedIn && isModerator && (
                  <button
                    onClick={() => { setIsModPortalOpen(true); fetchPendingRequests(); }}
                    className="p-2.5 rounded-2xl border border-(--card-border) bg-(--card-background) text-dust-grey hover:text-orange hover:border-orange/20 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
                    title="Moderator Hub Settings"
                  >
                    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Posts Feed */}
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
            onRefresh={loadCommunityPosts}
            isLoading={isLoadingPosts}
            hasMore={visibleCount < filteredThreads.length}
            isCommunityMod={isModerator}
            isBanned={isBanned}
          />
        </main>

        {/* RIGHT COLUMN: ABOUT COMMUNITY SIDEBAR */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm transition-all duration-300 hover:border-orange/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
            
            <h3 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-spicy-paprika to-vivid-tangerine bg-clip-text text-transparent mb-4">
              About Community
            </h3>

            <div className="space-y-4 text-xs">
              <p className="text-(--text-secondary) leading-relaxed">
                {community.description}
              </p>
              
              <div className="border-t border-(--divider-color)/40 pt-3 flex justify-between">
                <span className="text-dust-grey">Members</span>
                <span className="font-extrabold text-(--foreground)">{membersCount}</span>
              </div>

              <div className="border-t border-(--divider-color)/40 pt-3 flex justify-between">
                <span className="text-dust-grey">Created</span>
                <span className="font-extrabold text-(--foreground)">
                  {new Date(community.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>

              <div className="border-t border-(--divider-color)/40 pt-3 flex justify-between items-center">
                <span className="text-dust-grey">Created By</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-orange">@{community.creator?.username || "creator"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COMMUNITY RULES SIDEBAR WIDGET */}
          <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm transition-all duration-300 hover:border-orange/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
            
            <h3 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-spicy-paprika to-vivid-tangerine bg-clip-text text-transparent mb-4 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Community Rules</span>
            </h3>

            <div className="space-y-3 text-xs">
              {(community.rules && community.rules.length > 0 ? community.rules : [
                "Be respectful to all members.",
                "No hate speech or harassment.",
                "No spam or self-promotion.",
                "Keep discussions relevant to the community topic."
              ]).map((rule: string, i: number) => (
                <div key={i} className="flex gap-2 text-(--text-secondary) leading-relaxed border-b border-(--divider-color)/20 pb-2 last:border-b-0 last:pb-0">
                  <span className="font-mono text-orange font-bold shrink-0">{i + 1}.</span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* COMMUNITY MEMBERS ROSTER BUTTON (visible only if joined or moderator) */}
          {(isJoined || isModerator) && (
            <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm transition-all duration-300 hover:border-orange/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
              
              <h3 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-spicy-paprika to-vivid-tangerine bg-clip-text text-transparent mb-3">
                Community Members
              </h3>
              
              <p className="text-[11px] text-dust-grey leading-relaxed mb-4">
                Explore the roster directory of joined community members. Visible strictly to joined members.
              </p>

              <button
                onClick={() => { setIsMembersModalOpen(true); fetchMembersList(); }}
                className="w-full text-center rounded-xl bg-orange hover:bg-orange-600 py-2.5 text-xs font-bold text-ink-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.978 11.978 0 0112 20.25a11.98 11.98 0 01-3-.122v-.109m0-1.018a4.125 4.125 0 00-7.533 2.493 9.337 9.337 0 004.121.952 9.38 9.38 0 002.625-.372m0-3.03c0-1.113.285-2.16.786-3.07M12 18.75a6 6 0 100-12 6 6 0 000 12z" />
                </svg>
                <span>View Roster Directory</span>
              </button>
            </div>
          )}

        </aside>

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

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col flex-1 bg-(--background) items-center justify-center py-20 text-dust-grey gap-3">
        <svg className="animate-spin h-8 w-8 text-spicy-paprika" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-mono tracking-wider animate-pulse">Brewing community page...</span>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  );
}
