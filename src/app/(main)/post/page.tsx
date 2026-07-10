"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Thread } from "@/types/post";
import { ThreadCard } from "@/components/home/ThreadCard";
import { authClient } from "@/lib/auth-client";
import axiosInstance from "@/lib/axios";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  updateCommentVote 
} from "../../../components/post/commentHelpers";

const MyPostPage = () => {
  const { data: sessionData, isPending } = authClient.useSession();
  const [posts, setPosts] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPosts = useCallback(async () => {
    if (!sessionData?.user) return;
    try {
      setTimeout(() => {
        setIsLoading(true);
        setError(null);
      }, 0);
      const res = await axiosInstance.get(`/api/posts?authorId=${sessionData.user.id}&sort=recent`);
      if (res.data?.posts) {
        setPosts(res.data.posts);
      }
    } catch (err) {
      console.error("Error fetching my posts:", err);
      setError("Failed to fetch discussions.");
    } finally {
      setIsLoading(false);
    }
  }, [sessionData]);

  useEffect(() => {
    if (isPending) return;
    if (!sessionData?.user) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => {
      fetchMyPosts();
    }, 0);
    return () => clearTimeout(timer);
  }, [sessionData, isPending, fetchMyPosts]);

  useEffect(() => {
    const handleNewPost = () => {
      fetchMyPosts();
    };
    window.addEventListener("new-post-created", handleNewPost);
    return () => {
      window.removeEventListener("new-post-created", handleNewPost);
    };
  }, [fetchMyPosts]);

  const handleVote = async (id: string, type: "up" | "down") => {
    try {
      const res = await axiosInstance.post("/api/votes", {
        targetId: id,
        targetType: "Post",
        voteType: type,
      });

      if (res.data?.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id !== id) return post;
            return {
              ...post,
              upvotes: res.data.score,
              upvotesCount: res.data.upvotes,
              downvotesCount: res.data.downvotes,
              userVoted: res.data.userVoted,
            };
          })
        );
      }
    } catch (err) {
      console.error("Voting error in my posts:", err);
    }
  };

  const handleAddComment = async (threadId: string, text: string) => {
    try {
      const res = await axiosInstance.post("/api/comments", {
        postId: threadId,
        content: text,
      });

      if (res.data?.comment) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
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
      console.error("Error adding comment in my posts:", err);
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
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
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
      console.error("Error adding reply in my posts:", err);
    }
  };

  const handleEditSubmit = async (threadId: string, commentId: string, text: string) => {
    try {
      const res = await axiosInstance.put(`/api/comments/${commentId}`, {
        content: text,
      });

      if (res.data?.comment) {
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
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
      console.error("Error editing comment in my posts:", err);
    }
  };

  const handleDeleteComment = async (threadId: string, commentId: string) => {
    try {
      const res = await axiosInstance.delete(`/api/comments/${commentId}`);
      const deletedCount = res.data?.deletedCount || 1;

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
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
      console.error("Error deleting comment in my posts:", err);
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
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
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
      console.error("Error upvoting comment in my posts:", err);
    }
  };

  const handleUpdateThread = useCallback((updatedThread: Thread) => {
    setPosts((prev) =>
      prev.map((t) => (t.id === updatedThread.id ? updatedThread : t))
    );
  }, []);

  const handleDeletePost = useCallback((id: string) => {
    setPosts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-(--nav-bg) text-(--foreground) flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-dust-grey">Pouring your chai and loading discussions...</p>
        </div>
      </div>
    );
  }

  if (!sessionData?.user) {
    return (
      <div className="min-h-screen bg-(--nav-bg) text-(--foreground) flex items-center justify-center p-4">
        <div className="text-center py-16 px-6 max-w-sm rounded-2xl border border-dashed border-(--input-border) bg-(--input-bg)/30 flex flex-col items-center justify-center">
          <div className="text-orange mb-3">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
            </svg>
          </div>
          <h3 className="text-base font-bold mt-2 text-(--foreground)">Access Denied</h3>
          <p className="text-xs text-(--text-secondary) mt-1">Please pull up a chair and Log In to view your charchas.</p>
          <Link 
            href="/auth/signin"
            className="inline-flex items-center gap-1.5 rounded-full bg-spicy-paprika px-5 py-2.5 text-xs font-bold text-floral-white shadow-md shadow-spicy-paprika/15 mt-6 hover:bg-spicy-paprika-600 transition-all active:scale-95 cursor-pointer"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  const totalUpvotes = posts.reduce((acc, curr) => acc + curr.upvotes, 0);

  return (
    <div className="min-h-screen bg-(--nav-bg) text-(--foreground) pb-16">
      
      <div className="relative overflow-hidden bg-linear-to-br from-stormy-teal/20 via-orange/5 to-spicy-paprika/15 border-b border-(--nav-border) py-12 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-orange/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-spicy-paprika/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-orange hover:text-orange-600 transition-colors uppercase tracking-wider mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Chai Charcha
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-none bg-linear-to-r from-spicy-paprika via-orange to-vivid-tangerine bg-clip-text text-transparent">
            My Charchas
          </h1>
          <p className="mt-3 text-sm text-(--text-secondary) max-w-lg mx-auto leading-relaxed">
            Your ignited discussions, debates, and shared guides.
          </p>

          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-8">
            <div className="rounded-xl border border-(--input-border) bg-(--input-bg)/50 backdrop-blur-md p-3 text-center transition-all duration-300 hover:border-orange/20">
              <span className="block text-xl sm:text-2xl font-black font-mono text-orange">{posts.length}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-(--text-role) mt-1">Discussions</span>
            </div>
            <div className="rounded-xl border border-(--input-border) bg-(--input-bg)/50 backdrop-blur-md p-3 text-center transition-all duration-300 hover:border-spicy-paprika/20">
              <span className="block text-xl sm:text-2xl font-black font-mono text-spicy-paprika">{totalUpvotes}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-(--text-role) mt-1">Upvotes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col gap-6">
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-500">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </span>
            </div>
          )}
          {posts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-(--input-border) bg-(--input-bg)/30 flex flex-col items-center justify-center">
              <div className="text-orange mb-3">
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
                </svg>
              </div>
              <h3 className="text-base font-bold mt-2 text-(--foreground)">No charchas found</h3>
              <p className="text-xs text-(--text-secondary) mt-1">You haven&apos;t started any conversations yet.</p>
              <Link 
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-spicy-paprika px-5 py-2.5 text-xs font-bold text-floral-white shadow-md shadow-spicy-paprika/15 mt-6 hover:bg-spicy-paprika-600 transition-all active:scale-95 cursor-pointer"
              >
                Go to Feed & Ask a Question
              </Link>
            </div>
          ) : (
            posts.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                onVote={handleVote}
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
      </div>
    </div>
  );
};

export default MyPostPage;