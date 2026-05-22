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
      <h4 className="text-xs font-black uppercase tracking-widest text-orange flex items-center gap-1.5 pl-1 mb-1">
        <span>💬</span> Discussion Thread ({thread.commentsCount} comments)
      </h4>

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
        {!thread.comments || thread.comments.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-(--input-border)/40 bg-(--input-bg)/10">
            <span className="text-xl">☕</span>
            <p className="text-[11px] text-(--text-role) italic mt-1.5">No charcha replies yet. Be the first to spark a debate!</p>
          </div>
        ) : (
          thread.comments.map((comment) => (
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
