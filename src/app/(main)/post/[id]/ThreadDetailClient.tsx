"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Thread, Comment } from "@/types/post";
import { ThreadCard } from "@/components/home/ThreadCard";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  updateCommentVote 
} from "@/components/post/commentHelpers";
import { FeedSidebar } from "@/components/home/FeedSidebar";

interface ThreadDetailClientProps {
  initialThread: Thread;
}

export const ThreadDetailClient: React.FC<ThreadDetailClientProps> = ({ initialThread }) => {
  const { userData } = useAuth();
  const router = useRouter();
  const [thread, setThread] = useState<Thread>(initialThread);

  // Upvote/Downvote actions
  const handleVote = async (id: string, type: "up" | "down") => {
    if (!userData) {
      toast.warning("Please log in first to do that!");
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
        setThread((prev) => ({
          ...prev,
          upvotes: res.data.score,
          upvotesCount: res.data.upvotes,
          downvotesCount: res.data.downvotes,
          userVoted: res.data.userVoted,
        }));
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
        setThread((prev) => {
          const currentComments = prev.comments || [];
          const exists = currentComments.some((c) => c.id === res.data.comment.id);
          if (exists) return prev;
          return {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            comments: [...currentComments, res.data.comment],
          };
        });
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
        setThread((prev) => {
          const updatedComments = JSON.parse(JSON.stringify(prev.comments || []));
          const checkIfReplyExists = (nodes: Comment[], targetId: string): boolean => {
            for (const n of nodes) {
              if (n.id === targetId) return true;
              if (n.replies && checkIfReplyExists(n.replies, targetId)) return true;
            }
            return false;
          };
          if (checkIfReplyExists(updatedComments, res.data.comment.id)) {
            return prev;
          }
          const inserted = insertReply(updatedComments, commentId, res.data.comment);
          if (inserted) {
            return {
              ...prev,
              commentsCount: prev.commentsCount + 1,
              comments: updatedComments,
            };
          }
          return prev;
        });
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
        setThread((prev) => {
          const updatedComments = JSON.parse(JSON.stringify(prev.comments || []));
          const updated = updateComment(updatedComments, commentId, text);
          if (updated) {
            return {
              ...prev,
              comments: updatedComments,
            };
          }
          return prev;
        });
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
        setThread((prev) => {
          const updatedComments = JSON.parse(JSON.stringify(prev.comments || []));
          const removed = removeComment(updatedComments, commentId);
          if (removed) {
            return {
              ...prev,
              commentsCount: Math.max(0, prev.commentsCount - deletedCount),
              comments: updatedComments,
            };
          }
          return prev;
        });
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
        setThread((prev) => {
          const updatedComments = JSON.parse(JSON.stringify(prev.comments || []));
          const voted = updateCommentVote(updatedComments, commentId, res.data.upvotes);
          if (voted) {
            return {
              ...prev,
              comments: updatedComments,
            };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error("Error voting comment:", err);
    }
  };

  const handleUpdateThread = (updatedThread: Thread) => {
    setThread(updatedThread);
  };

  const handleDeletePost = (id: string) => {
    console.log("Post deleted:", id);
    toast.success("Charcha deleted successfully!");
    if (thread.community && typeof thread.community === "object" && "slug" in thread.community) {
      router.push(`/c/${thread.community.slug}`);
    } else {
      router.push("/");
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: NAVIGATION SIDEBAR */}
        <FeedSidebar
          activeCategory="All"
          setActiveCategory={() => router.push("/")}
          selectedTag=""
          setSelectedTag={(tag) => router.push(`/?tag=${tag}`)}
          categories={["All"]}
          categoryCounts={{"All": 0}}
          tagCounts={{}}
        />

        {/* CENTER COLUMN: MAIN DISCUSSION DETAILS */}
        <main className="lg:col-span-6 flex flex-col min-w-0 gap-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-xs text-dust-grey hover:text-orange transition-colors self-start cursor-pointer mb-2 font-bold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to feed</span>
          </button>

          <ThreadCard
            thread={thread}
            onVote={handleVote}
            onAddComment={handleAddComment}
            onAddReply={handleAddReply}
            onEditSubmit={handleEditSubmit}
            onDeleteComment={handleDeleteComment}
            onCommentVote={handleCommentVote}
            onUpdateThread={handleUpdateThread}
            onDeletePost={handleDeletePost}
            isCommunityMod={userData?.role === "admin"}
            defaultExpanded={true}
            isTitleH1={true}
          />
        </main>
      </div>
    </div>
  );
};
export default ThreadDetailClient;
