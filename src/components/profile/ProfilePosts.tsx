"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Thread } from "@/types/post";
import { ThreadCard } from "@/components/home/ThreadCard";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/store/useToastStore";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  updateCommentVote 
} from "@/components/post/commentHelpers";

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
  const { userData } = useAuth();
  const [posts, setPosts] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onPostsCountChangeRef = React.useRef(onPostsCountChange);
  useEffect(() => {
    onPostsCountChangeRef.current = onPostsCountChange;
  }, [onPostsCountChange]);

  // Fetch full user profile details from the DB
  const fetchUserPosts = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/api/posts?sort=recent");
      if (res.data?.posts) {
        // Filter posts where author matches the profiled user
        const filtered = res.data.posts.filter((post: Thread) => {
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
      console.error("Error loading user profile posts:", err);
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || error.message || "Failed to load posts");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Wrap async fetch in a setTimeout to prevent cascading render warn
    const timer = setTimeout(() => {
      fetchUserPosts();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchUserPosts]);

  // Handle post upvoting / downvoting
  const handleVote = async (id: string, type: "up" | "down") => {
    if (!userData) {
      toast.warning("Please log in first to do that!");
      return;
    }
    try {
      const res = await axiosInstance.post("/api/votes", {
        targetId: id,
        targetType: "Post",
        voteType: type,
      });

      if (res.data?.success) {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id === id) {
              return {
                ...p,
                upvotes: res.data.score,
                userVoted: res.data.userVoted,
              };
            }
            return p;
          })
        );
      }
    } catch (err) {
      console.error("Voting error inside profile feed:", err);
    }
  };

  // Add Comment callback
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
        setPosts((prev) =>
          prev.map((post) => {
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
      console.error("Error adding comment in profile feed:", err);
    }
  };

  // Add nested reply callback
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
        setPosts((prev) =>
          prev.map((post) => {
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
      console.error("Error adding reply in profile feed:", err);
    }
  };

  // Edit Comment callback
  const handleEditSubmit = async (threadId: string, commentId: string, text: string) => {
    try {
      const res = await axiosInstance.put(`/api/comments/${commentId}`, {
        content: text,
      });
      if (res.data?.comment) {
        setPosts((prev) =>
          prev.map((post) => {
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
      console.error("Error editing comment in profile feed:", err);
    }
  };

  // Delete Comment callback
  const handleDeleteComment = async (threadId: string, commentId: string) => {
    try {
      const res = await axiosInstance.delete(`/api/comments/${commentId}`);
      const deletedCount = res.data?.deletedCount || 1;
      setPosts((prev) =>
        prev.map((post) => {
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
      console.error("Error deleting comment in profile feed:", err);
    }
  };

  // Comment Vote callback
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
        setPosts((prev) =>
          prev.map((post) => {
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
      console.error("Error upvoting comment in profile feed:", err);
    }
  };

  // Post update callback (e.g. from inline edits)
  const handleUpdateThread = useCallback((updatedThread: Thread) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedThread.id ? updatedThread : p))
    );
  }, []);

  // Post delete callback
  const handleDeletePost = useCallback((id: string) => {
    setPosts((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      onPostsCountChangeRef.current(updated.length);
      return updated;
    });
  }, []);

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
          This user hasn&apos;t started any discussions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <ThreadCard
          key={post.id}
          thread={post}
          onVote={handleVote}
          onAddComment={handleAddComment}
          onAddReply={handleAddReply}
          onEditSubmit={handleEditSubmit}
          onDeleteComment={handleDeleteComment}
          onCommentVote={handleCommentVote}
          onUpdateThread={handleUpdateThread}
          onDeletePost={handleDeletePost}
        />
      ))}
    </div>
  );
};
