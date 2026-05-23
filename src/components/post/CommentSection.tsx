import React, { useState } from "react";
import { Thread } from "../../app/(main)/post/postData";
import { CommentNode } from "./CommentNode";

interface CommentSectionProps {
  thread: Thread;
  onAddComment: (threadId: string, text: string) => void;
  onAddReply: (threadId: string, commentId: string, text: string) => void;
  onEditSubmit: (threadId: string, commentId: string, text: string) => void;
  onDeleteComment: (threadId: string, commentId: string) => void;
  onCommentVote: (threadId: string, commentId: string) => void;
}

export const CommentSection = ({
  thread,
  onAddComment,
  onAddReply,
  onEditSubmit,
  onDeleteComment,
  onCommentVote
}: CommentSectionProps) => {
  const [newCommentText, setNewCommentText] = useState("");
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(null);
  const [activeEditCommentId, setActiveEditCommentId] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [editInputs, setEditInputs] = useState<Record<string, string>>({});
  const [commentSort, setCommentSort] = useState<"top" | "newest" | "oldest">("top");

  const sortedComments = React.useMemo(() => {
    if (!thread.comments) return [];
    return [...thread.comments].sort((a, b) => {
      if (commentSort === "top") {
        return b.upvotes - a.upvotes;
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (commentSort === "newest") {
        return dateB - dateA;
      }
      if (commentSort === "oldest") {
        return dateA - dateB;
      }
      return 0;
    });
  }, [thread.comments, commentSort]);

  const handleAddCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentText.trim();
    if (!text) return;
    onAddComment(thread.id, text);
    setNewCommentText("");
  };

  const handleAddReplySubmit = (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = replyInputs[commentId]?.trim();
    if (!text) return;
    onAddReply(thread.id, commentId, text);
    setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
    setActiveReplyCommentId(null);
  };

  const handleEditCommentSubmit = (commentId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = editInputs[commentId]?.trim();
    if (!text) return;
    onEditSubmit(thread.id, commentId, text);
    setActiveEditCommentId(null);
  };

  return (
    <div className="mt-4 pt-4 border-t border-(--input-border)/50 flex flex-col gap-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <h4 className="text-xs font-black uppercase tracking-widest text-orange flex items-center gap-2 pl-1">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.92 1.613c-.46.505-.15 1.37.536 1.24A9.101 9.101 0 0012 20.25z" />
          </svg>
          Discussion Thread ({thread.commentsCount} comments)
        </h4>

        {/* Comment sorting filters */}
        {thread.comments && thread.comments.length > 0 && (
          <div className="relative inline-block self-start sm:self-auto">
            <select
              value={commentSort}
              onChange={(e) => setCommentSort(e.target.value as "top" | "newest" | "oldest")}
              className="appearance-none bg-(--input-bg)/40 hover:bg-(--input-bg)/60 border border-(--input-border)/40 hover:border-orange/30 text-(--text-role) hover:text-(--foreground) py-1.5 pl-3 pr-8 rounded-lg text-[10px] font-bold outline-none cursor-pointer transition-all shadow-3xs"
            >
              <option value="top">Top Liked</option>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-(--text-role)">
              <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Primary Comment Input Form */}
      <form 
         onSubmit={handleAddCommentSubmit} 
         className="flex items-center gap-2 bg-(--input-bg)/30 p-2 rounded-xl border border-(--input-border)/50 focus-within:border-orange transition-all"
       >
        <input 
           type="text" 
           value={newCommentText}
           onChange={(e) => setNewCommentText(e.target.value)}
           placeholder="Ignite a charcha reply..."
           className="flex-1 bg-transparent px-2.5 py-1 text-xs text-(--foreground) placeholder-dust-grey/70 outline-none"
         />
        <button 
           type="submit"
           className="rounded-full bg-orange px-4 py-2 text-xs font-bold text-ink-black shadow-md hover:bg-orange-600 transition-all cursor-pointer"
         >
          Comment
        </button>
      </form>

      {/* Recursive Comments list */}
      <div className="flex flex-col gap-4 mt-2">
        {sortedComments.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-(--input-border)/40 bg-(--input-bg)/10 flex flex-col items-center justify-center">
            <div className="text-orange/60 mb-1.5">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
              </svg>
            </div>
            <p className="text-[11px] text-(--text-role) italic mt-1">No charcha replies yet. Be the first to spark a debate!</p>
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentNode 
              key={comment.id}
              comment={comment}
              activeReplyCommentId={activeReplyCommentId}
              setActiveReplyCommentId={setActiveReplyCommentId}
              activeEditCommentId={activeEditCommentId}
              setActiveEditCommentId={setActiveEditCommentId}
              replyInputs={replyInputs}
              setReplyInputs={setReplyInputs}
              editInputs={editInputs}
              setEditInputs={setEditInputs}
              onVote={(commentId) => onCommentVote(thread.id, commentId)}
              onReplySubmit={(commentId, e) => handleAddReplySubmit(commentId, e)}
              onEditSubmit={(commentId, e) => handleEditCommentSubmit(commentId, e)}
              onDelete={(commentId) => onDeleteComment(thread.id, commentId)}
            />
          ))
        )}
      </div>
    </div>
  );
};
