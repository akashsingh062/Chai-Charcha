"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SAMPLE_POSTS, Thread, Comment } from "./postData";
import { CommentSection } from "../../../components/post/CommentSection";
import { 
  insertReply, 
  updateComment, 
  removeComment, 
  voteComment, 
  findNodeAndGetCount 
} from "../../../components/post/commentHelpers";

const MyPostPage = () => {
  const [posts, setPosts] = useState<Thread[]>(SAMPLE_POSTS);

  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});

  const handleToggleComments = (threadId: string) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));
  };

  const handleVote = (id: string, type: "up" | "down") => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== id) return post;

        const currentVote = post.userVoted;
        let upvoteChange = 0;

        if (type === "up") {
          if (currentVote === "up") {
            upvoteChange = -1;
            return { ...post, upvotes: post.upvotes + upvoteChange, userVoted: null };
          } else if (currentVote === "down") {
            upvoteChange = 2;
            return { ...post, upvotes: post.upvotes + upvoteChange, userVoted: "up" };
          } else {
            upvoteChange = 1;
            return { ...post, upvotes: post.upvotes + upvoteChange, userVoted: "up" };
          }
        } else {
          if (currentVote === "down") {
            upvoteChange = 1;
            return { ...post, upvotes: post.upvotes + upvoteChange, userVoted: null };
          } else if (currentVote === "up") {
            upvoteChange = -2;
            return { ...post, upvotes: post.upvotes + upvoteChange, userVoted: "down" };
          } else {
            upvoteChange = -1;
            return { ...post, upvotes: post.upvotes + upvoteChange, userVoted: "down" };
          }
        }
      })
    );
  };

  const handleAddComment = (threadId: string, text: string) => {
    const newComment: Comment = {
      id: `c_${Date.now()}`,
      author: {
        name: "Akash Singh",
        avatar: "AS",
        role: "Lead Engineer",
      },
      content: text,
      upvotes: 0,
      timeAgo: "Just now",
      replies: [],
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== threadId) return post;
        const currentComments = post.comments || [];
        return {
          ...post,
          commentsCount: post.commentsCount + 1,
          comments: [...currentComments, newComment],
        };
      })
    );
  };

  const handleAddReply = (threadId: string, commentId: string, text: string) => {
    const newReply: Comment = {
      id: `r_${Date.now()}`,
      author: {
        name: "Akash Singh",
        avatar: "AS",
        role: "Lead Engineer",
      },
      content: text,
      upvotes: 0,
      timeAgo: "Just now",
      replies: [],
    };

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== threadId) return post;
        
        const updatedComments = JSON.parse(JSON.stringify(post.comments || []));
        const inserted = insertReply(updatedComments, commentId, newReply);
        
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
  };

  const handleEditSubmit = (threadId: string, commentId: string, text: string) => {
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
  };

  const handleDeleteComment = (threadId: string, commentId: string) => {
    let deletedCount = 0;

    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== threadId) return post;
        
        const updatedComments = JSON.parse(JSON.stringify(post.comments || []));
        deletedCount = findNodeAndGetCount(updatedComments, commentId);
        
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
  };

  const handleCommentVote = (threadId: string, commentId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => {
        if (post.id !== threadId) return post;
        
        const updatedComments = JSON.parse(JSON.stringify(post.comments || []));
        const voted = voteComment(updatedComments, commentId);
        
        if (voted) {
          return {
            ...post,
            comments: updatedComments,
          };
        }
        return post;
      })
    );
  };

  const totalUpvotes = posts.reduce((acc, curr) => acc + curr.upvotes, 0);
  const totalViews = posts.reduce((acc, curr) => acc + curr.views, 0);

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

          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto mt-8">
            <div className="rounded-xl border border-(--input-border) bg-(--input-bg)/50 backdrop-blur-md p-3 text-center transition-all duration-300 hover:border-orange/20">
              <span className="block text-xl sm:text-2xl font-black font-mono text-orange">{posts.length}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-(--text-role) mt-1">Discussions</span>
            </div>
            <div className="rounded-xl border border-(--input-border) bg-(--input-bg)/50 backdrop-blur-md p-3 text-center transition-all duration-300 hover:border-spicy-paprika/20">
              <span className="block text-xl sm:text-2xl font-black font-mono text-spicy-paprika">{totalUpvotes}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-(--text-role) mt-1">Upvotes</span>
            </div>
            <div className="rounded-xl border border-(--input-border) bg-(--input-bg)/50 backdrop-blur-md p-3 text-center transition-all duration-300 hover:border-stormy-teal/20">
              <span className="block text-xl sm:text-2xl font-black font-mono text-stormy-teal">{totalViews}</span>
              <span className="text-[10px] uppercase font-mono tracking-widest text-(--text-role) mt-1">Total Views</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="flex flex-col gap-6">
          {posts.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-(--input-border) bg-(--input-bg)/30">
              <span className="text-4xl">☕</span>
              <h3 className="text-base font-bold mt-4 text-(--foreground)">No charchas found</h3>
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
                        thread.category === "Tech & Architecture"
                          ? "bg-stormy-teal/10 text-stormy-teal border-stormy-teal/25"
                          : "bg-spicy-paprika/10 text-spicy-paprika border-spicy-paprika/25"
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
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-dust-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {thread.views} views
                        </span>
                        
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
                        
                        <span className="hidden sm:inline font-medium text-(--text-role)">
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