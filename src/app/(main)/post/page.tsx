"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Thread, Comment } from "./postData";
import { CommentSection } from "../../../components/post/CommentSection";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  updateCommentVote, 
  findNodeAndGetCount 
} from "../../../components/post/commentHelpers";
import { authClient } from "@/lib/auth-client";
import axiosInstance from "@/lib/axios";

const MyPostPage = () => {
  const { data: sessionData, isPending } = authClient.useSession();
  const [posts, setPosts] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  const fetchMyPosts = React.useCallback(async () => {
    if (!sessionData?.user) return;
    try {
      setIsLoading(true);
      const res = await axiosInstance.get("/api/posts");
      if (res.data?.posts) {
        const myPosts = res.data.posts.filter((post: Thread) => {
          return (
            post.author?.id === sessionData.user.id ||
            post.author?.username === sessionData.user.username ||
            post.author?.name === sessionData.user.name
          );
        });
        setPosts(myPosts);
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
      setIsLoading(false);
      return;
    }
    fetchMyPosts();
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

  useEffect(() => {
    const activeIds = Object.keys(expandedThreads).filter((id) => expandedThreads[id]);
    if (activeIds.length === 0) return;

    const interval = setInterval(async () => {
      try {
        await Promise.all(
          activeIds.map(async (id) => {
            const res = await axiosInstance.get(`/api/posts/${id}`);
            if (res.data?.post) {
              setPosts((prevPosts) =>
                prevPosts.map((p) => (p.id === id ? res.data.post : p))
              );
            }
          })
        );
      } catch (err) {
        console.error("Error polling expanded posts comments:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [expandedThreads]);

  const handleToggleComments = (threadId: string) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
  };

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
              userVoted: res.data.userVoted,
            };
          })
        );
      }
    } catch (err) {
      console.error("Voting error:", err);
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
      console.error("Error adding reply:", err);
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
      console.error("Error editing comment:", err);
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
      console.error("Error upvoting comment:", err);
    }
  };

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
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideDown {
          from { height: 0; opacity: 0; transform: translateY(-10px); }
          to { height: auto; opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

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
            Your ignited technical discussions, developer debates, and shared system design guides.
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
            posts.map((thread) => {
              const isExpanded = !!expandedThreads[thread.id];
              return (
                <div key={thread.id} className="flex flex-col gap-3">
                  <article
                    className="rounded-2xl border border-(--input-border) bg-(--input-bg)/20 p-5 shadow-sm hover:shadow-md hover:border-orange/20 transition-all duration-300 relative overflow-hidden group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--profile-avatar-bg) text-2xs font-black text-(--profile-avatar-text) shadow-sm overflow-hidden">
                          {thread.author.avatar}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-(--foreground)">{thread.author.name}</span>
                          <span className="text-[9px] text-(--text-role) font-mono leading-none mt-0.5">{thread.author.role}</span>
                        </div>
                      </div>

                      <span className={`rounded-full text-[10px] font-bold border px-2 py-0.5 ${
                        (() => {
                          const cat = thread.category.toLowerCase().trim();
                          if (cat === "tech & architecture" || cat === "tech") {
                            return "bg-stormy-teal/10 text-stormy-teal border-stormy-teal/25";
                          }
                          if (cat === "career prep" || cat === "career") {
                            return "bg-spicy-paprika/10 text-spicy-paprika border-spicy-paprika/25";
                          }
                          if (cat === "general charcha" || cat === "general") {
                            return "bg-orange/10 text-orange border-orange/25";
                          }
                          if (cat === "showcase") {
                            return "bg-vivid-tangerine/10 text-vivid-tangerine border-vivid-tangerine/25";
                          }
                          return "bg-brandy/10 text-brandy-700 border-brandy-700/25";
                        })()
                      }`}>
                        {thread.category}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold mt-3.5 tracking-tight text-(--foreground) leading-snug group-hover:text-orange transition-colors">
                      {thread.title}
                    </h3>
                    <p className="mt-2 text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                      {thread.excerpt}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {thread.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-bold text-orange hover:text-orange-600 transition-colors cursor-pointer">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 pt-4 border-t border-(--divider-color) flex items-center justify-between text-xs text-(--text-secondary)">
                      
                      <div className="flex items-center gap-1 bg-(--nav-bg) border border-(--input-border) rounded-full p-0.5">
                        <button
                          onClick={() => handleVote(thread.id, "up")}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            thread.userVoted === "up"
                              ? "bg-spicy-paprika text-floral-white shadow-sm"
                              : "hover:bg-(--btn-icon-hover-bg) hover:text-spicy-paprika"
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
                            : "text-(--text-role)"
                        }`}>
                          {thread.upvotes}
                        </span>

                        <button
                          onClick={() => handleVote(thread.id, "down")}
                          className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                            thread.userVoted === "down"
                              ? "bg-stormy-teal text-floral-white shadow-sm"
                              : "hover:bg-(--btn-icon-hover-bg) hover:text-stormy-teal"
                          }`}
                          aria-label="Downvote"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] sm:text-xs">
                         
                        <button 
                          onClick={() => handleToggleComments(thread.id)}
                          className={`flex items-center gap-1.5 transition-all duration-300 font-bold px-3 py-1.5 rounded-full border border-orange/20 cursor-pointer ${
                            isExpanded 
                              ? "bg-orange/15 text-orange hover:bg-orange/25" 
                              : "text-orange hover:bg-orange/10 hover:text-orange"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.92 1.613c-.46.505-.15 1.37.536 1.24A9.101 9.101 0 0012 20.25z" />
                          </svg>
                          <span>{thread.commentsCount} replies</span>
                        </button>
                        
                        <span 
                          title={thread.createdAt ? new Date(thread.createdAt).toLocaleString() : undefined}
                          className="hidden sm:inline font-medium text-(--text-role) cursor-help hover:text-orange transition-colors"
                        >
                          {thread.timeAgo}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-1">
                        <CommentSection 
                          thread={thread}
                          onAddComment={handleAddComment}
                          onAddReply={handleAddReply}
                          onEditSubmit={handleEditSubmit}
                          onDeleteComment={handleDeleteComment}
                          onCommentVote={handleCommentVote}
                        />
                      </div>
                    )}
                  </article>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPostPage;