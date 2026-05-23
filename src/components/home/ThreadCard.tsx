"use client";

import React, { useState, useEffect } from "react";
import { Thread } from "@/app/(main)/post/postData";
import { CommentSection } from "../post/CommentSection";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/store/useToastStore";
import { ConfirmModal } from "../shared/ConfirmModal";
import Link from "next/link";

interface ThreadCardProps {
  thread: Thread;
  onVote: (id: string, type: "up" | "down") => void;
  onTagClick?: (tag: string) => void;
  onAddComment: (threadId: string, text: string) => void;
  onAddReply: (threadId: string, commentId: string, text: string) => void;
  onEditSubmit: (threadId: string, commentId: string, text: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onCommentVote: (threadId: string, commentId: string) => void;
  onUpdateThread?: (thread: Thread) => void;
  onDeletePost?: (id: string) => void;
}

export const ThreadCard: React.FC<ThreadCardProps> = ({
  thread,
  onVote,
  onTagClick,
  onAddComment,
  onAddReply,
  onEditSubmit,
  onDeleteComment,
  onCommentVote,
  onUpdateThread,
  onDeletePost,
}) => {
  const { userData } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);

  // Editing States
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(thread.title);
  const [editContent, setEditContent] = useState(thread.content || thread.excerpt);
  const [editCategory, setEditCategory] = useState(thread.category);
  const [editTagsString, setEditTagsString] = useState(thread.tags.join(", "));
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const startEditing = () => {
    setEditTitle(thread.title);
    setEditContent(thread.content || thread.excerpt);
    setEditCategory(thread.category);
    setEditTagsString(thread.tags.join(", "));
    setEditError(null);
    setIsEditing(true);
  };

  useEffect(() => {
    if (!isExpanded) return;

    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(`/api/posts/${thread.id}`);
        if (res.data?.post && onUpdateThread) {
          onUpdateThread(res.data.post);
        }
      } catch (err) {
        console.error("Error polling thread comments:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isExpanded, thread.id, onUpdateThread]);

  // Authorization Check
  const isAuthor = userData?.id === thread.author.id;
  const isAdmin = userData?.role === "admin";
  const canModify = isAuthor || isAdmin;

  // In-Place Update Handler
  const handleSave = async () => {
    const titleTrimmed = editTitle.trim();
    const contentTrimmed = editContent.trim();
    
    // Client-side validations matching postSchema Zod limits
    if (titleTrimmed.length < 3 || titleTrimmed.length > 100) {
      setEditError("Title must be between 3 and 100 characters.");
      return;
    }
    if (contentTrimmed.length < 10 || contentTrimmed.length > 1000) {
      setEditError("Content must be between 10 and 1000 characters.");
      return;
    }

    const parsedTags = editTagsString
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    const hasSpaces = parsedTags.some((tag) => /\s/.test(tag));
    if (hasSpaces) {
      setEditError("Hashtags cannot contain spaces. Use hyphens (e.g. 'web-dev') or run words together (e.g. 'webdev').");
      return;
    }

    setEditError(null);
    setIsSaving(true);

    try {

      const res = await axiosInstance.put(`/api/posts/${thread.id}`, {
        title: titleTrimmed,
        content: contentTrimmed,
        category: editCategory,
        tags: parsedTags,
      });

      if (res.data?.post) {
        toast.success("Charcha updated successfully!");
        if (onUpdateThread) {
          onUpdateThread(res.data.post);
        }
        setIsEditing(false);
      } else {
        throw new Error("Failed to receive updated post details");
      }
    } catch (err: unknown) {
      console.error("Failed to save post:", err);
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setEditError(error.response?.data?.error || error.message || "Failed to update charcha");
    } finally {
      setIsSaving(false);
    }
  };

  // In-Place Deletion Handler
  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    try {
      const res = await axiosInstance.delete(`/api/posts/${thread.id}`);
      if (res.status === 200 || res.data?.message) {
        toast.success("Charcha deleted successfully!");
        if (onDeletePost) {
          onDeletePost(thread.id);
        }
      }
    } catch (err: unknown) {
      console.error("Failed to delete post:", err);
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to delete this post. Please try again.");
    }
  };

  if (isEditing) {
    return (
      <article className="rounded-2xl border border-vivid-tangerine bg-(--card-background) p-4 sm:p-5 shadow-md transition-all duration-300 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-(--divider-color)">
          <span className="text-xs font-bold uppercase tracking-wider text-vivid-tangerine">
            Edit Discussion Charcha
          </span>
          <span className="text-2xs text-dust-grey font-mono">
            ID: {thread.id}
          </span>
        </div>

        {editError && (
          <div className="text-xs text-spicy-paprika bg-spicy-paprika/10 p-2.5 rounded-xl border border-spicy-paprika/20">
            {editError}
          </div>
        )}

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-2xs font-extrabold tracking-wider text-dust-grey uppercase mb-1">
              Discussion Title (3 - 100 characters)
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2 text-sm outline-none focus:border-vivid-tangerine transition-all"
              placeholder="Migrating to Next.js 15..."
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-2xs font-extrabold tracking-wider text-dust-grey uppercase mb-1">
              Discussion Content (10 - 1000 characters)
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full min-h-[140px] rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2 text-sm outline-none focus:border-vivid-tangerine transition-all resize-y"
              placeholder="Provide more context or low-level design patterns..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-2xs font-extrabold tracking-wider text-dust-grey uppercase mb-1">
                Category
              </label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2 text-sm outline-none focus:border-vivid-tangerine transition-all text-(--foreground)"
              >
                {[
                  "Tech & Code",
                  "Startups & Business",
                  "Career & Salary",
                  "Education & Learning",
                  "Lifestyle & Hobbies",
                  "Gaming & Entertainment",
                  "Health & Fitness",
                  "General Charcha",
                  "Showcase & Projects",
                ].map((cat) => (
                  <option key={cat} value={cat} className="bg-(--dropdown-bg) text-(--foreground)">{cat}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-2xs font-extrabold tracking-wider text-dust-grey uppercase mb-1">
                Tags (comma separated)
              </label>
              <input
                type="text"
                value={editTagsString}
                onChange={(e) => setEditTagsString(e.target.value)}
                className="w-full rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2 text-sm outline-none focus:border-vivid-tangerine transition-all"
                placeholder="nextjs, react, architecture"
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-(--divider-color)">
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setEditError(null);
            }}
            className="rounded-full px-4 py-2 text-xs font-bold text-dust-grey hover:bg-(--btn-icon-hover-bg) hover:text-(--foreground) transition-colors cursor-pointer"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-full bg-vivid-tangerine px-5 py-2 text-xs font-bold text-ink-black shadow-md shadow-vivid-tangerine/10 hover:bg-vivid-tangerine-600 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-55"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-ink-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-orange/20 transition-all duration-300">
      {/* Author card & Category tag */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-(--profile-avatar-bg) text-2xs font-bold text-(--profile-avatar-text) shadow-sm overflow-hidden">
            {thread.author.avatar && (thread.author.avatar.startsWith("http") || thread.author.avatar.startsWith("/")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thread.author.avatar} alt={thread.author.name} className="h-full w-full object-cover" />
            ) : (
              thread.author.avatar
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-(--foreground)">{thread.author.name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-dust-grey font-mono leading-none">{thread.author.role}</span>
              {thread.community && (
                <>
                  <span className="text-dust-grey text-[10px]">•</span>
                  <Link 
                    href={`/c/${thread.community.slug}`}
                    className="text-[10px] font-bold text-orange hover:underline leading-none shrink-0"
                  >
                    c/{thread.community.slug}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {canModify && (
            <div className="flex items-center gap-1">
              <button
                onClick={startEditing}
                className="p-1 rounded-full text-dust-grey hover:text-vivid-tangerine hover:bg-vivid-tangerine/10 transition-all cursor-pointer"
                title="Edit Post"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                className="p-1 rounded-full text-dust-grey hover:text-spicy-paprika hover:bg-spicy-paprika/10 transition-all cursor-pointer"
                title="Delete Post"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          )}

          <span className={`rounded-full text-[10px] font-bold border px-2 py-0.5 ${
            (() => {
              const cat = thread.category.toLowerCase().trim();
              if (
                cat === "tech & code" || 
                cat === "tech" || 
                cat === "education & learning"
              ) {
                return "bg-stormy-teal/10 text-stormy-teal border-stormy-teal/25";
              }
              if (
                cat === "career & salary" || 
                cat === "career" || 
                cat === "health & fitness"
              ) {
                return "bg-spicy-paprika/10 text-spicy-paprika border-spicy-paprika/25";
              }
              if (
                cat === "general charcha" || 
                cat === "general" || 
                cat === "gaming & entertainment"
              ) {
                return "bg-orange/10 text-orange border-orange/25";
              }
              if (
                cat === "showcase & projects" || 
                cat === "showcase" || 
                cat === "startups & business"
              ) {
                return "bg-vivid-tangerine/10 text-vivid-tangerine border-vivid-tangerine/25";
              }
              return "bg-brandy/10 text-brandy-700 border-brandy-700/25";
            })()
          }`}>
            {thread.category}
          </span>
        </div>
      </div>

      {/* Title & Excerpt */}
      <h3 className="text-base sm:text-lg font-extrabold mt-3.5 tracking-tight text-(--foreground) leading-snug">
        {thread.title}
      </h3>
      <p className="mt-2 text-xs sm:text-sm text-(--text-secondary) leading-relaxed line-clamp-3">
        {thread.excerpt}
      </p>

      {/* Hashtags list */}
      {thread.tags && thread.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {thread.tags.map((tag, index) => (
            <span 
              key={`${tag}-${index}`} 
              onClick={() => onTagClick?.(tag)}
              className="text-[10px] font-semibold text-(--link-color) hover:text-(--link-hover-color) transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Bottom Footer Interactions */}
      <div className="mt-5 pt-4 border-t border-(--divider-color) flex items-center justify-between text-xs text-dust-grey">
        
        {/* Interactive Upvote & Downvote component */}
        <div className="flex items-center gap-1 bg-(--profile-bg) border border-(--profile-border) rounded-full p-0.5">
          <button
            onClick={() => onVote(thread.id, "up")}
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
            onClick={() => onVote(thread.id, "down")}
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

        {/* Visual Statistics (Comments) */}
        <div className="flex items-center gap-4 text-[10px] sm:text-xs">
          
          <button 
            onClick={() => setIsExpanded(prev => !prev)}
            className={`flex items-center gap-1.5 transition-all duration-300 font-bold px-3 py-1.5 rounded-full border border-orange/20 cursor-pointer ${
              isExpanded 
                ? "bg-orange/15 text-orange hover:bg-orange/25" 
                : "text-orange hover:bg-orange/10 hover:text-orange"
            }`}
            aria-expanded={isExpanded}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.92 1.613c-.46.505-.15 1.37.536 1.24A9.101 9.101 0 0012 20.25z" />
            </svg>
            <span>{thread.commentsCount} replies</span>
          </button>
          
          <span 
            title={thread.createdAt ? new Date(thread.createdAt).toLocaleString() : undefined}
            className="cursor-help hover:text-orange transition-colors"
          >
            {thread.timeAgo}
          </span>
        </div>

      </div>

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

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-(--divider-color) animate-slide-down">
          <CommentSection 
            thread={thread}
            onAddComment={onAddComment}
            onAddReply={onAddReply}
            onEditSubmit={onEditSubmit}
            onDeleteComment={onDeleteComment}
            onCommentVote={onCommentVote}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Charcha"
        message="Are you sure you want to delete this charcha? This will also permanently delete all its replies."
        onConfirm={executeDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </article>
  );
};
