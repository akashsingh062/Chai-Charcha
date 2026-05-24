import React, { useState } from "react";
import { Comment } from "@/types/post";
import { useAuth } from "@/context/AuthContext";
import { ReportModal } from "../shared/ReportModal";
import Link from "next/link";

export interface CommentNodeProps {
  comment: Comment;
  activeReplyCommentId: string | null;
  setActiveReplyCommentId: (id: string | null) => void;
  activeEditCommentId: string | null;
  setActiveEditCommentId: (id: string | null) => void;
  replyInputs: Record<string, string>;
  setReplyInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  editInputs: Record<string, string>;
  setEditInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onVote: (commentId: string) => void;
  onReplySubmit: (commentId: string, e: React.FormEvent) => void;
  onEditSubmit: (commentId: string, e: React.FormEvent) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}

export const CommentNode = ({
  comment,
  activeReplyCommentId,
  setActiveReplyCommentId,
  activeEditCommentId,
  setActiveEditCommentId,
  replyInputs,
  setReplyInputs,
  editInputs,
  setEditInputs,
  onVote,
  onReplySubmit,
  onEditSubmit,
  onDelete,
  depth = 0
}: CommentNodeProps) => {
  const isEditing = activeEditCommentId === comment.id;
  const isReplying = activeReplyCommentId === comment.id;
  const [showReplies, setShowReplies] = useState(true);
  const { userData } = useAuth();
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Track draft values locally
  const replyVal = replyInputs[comment.id] || "";
  const editVal = editInputs[comment.id] || "";

  const handleEditClick = () => {
    setEditInputs((prev) => ({ ...prev, [comment.id]: comment.content }));
    setActiveEditCommentId(comment.id);
    setActiveReplyCommentId(null);
  };

  const handleReplyClick = () => {
    setReplyInputs((prev) => ({ ...prev, [comment.id]: "" }));
    setActiveReplyCommentId(comment.id);
    setActiveEditCommentId(null);
  };

  // Generate dynamic gradient for avatar based on author's first letter
  const getAvatarGradient = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    if (charCode % 3 === 0) {
      return "bg-linear-to-br from-spicy-paprika to-vivid-tangerine";
    } else if (charCode % 3 === 1) {
      return "bg-linear-to-br from-stormy-teal to-blue-500";
    } else {
      return "bg-linear-to-br from-orange to-spicy-paprika";
    }
  };

  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-start gap-3 group relative">
        <div className="flex flex-col items-center self-stretch relative z-10">
          {comment.author.username ? (
            <Link 
              href={`/profile?username=${comment.author.username}`}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black text-floral-white overflow-hidden shadow-md border-2 border-(--input-border)/60 hover:border-orange/50 transition-all duration-300 ${getAvatarGradient(comment.author.name)}`}
            >
              {comment.author.avatar && (comment.author.avatar.startsWith("http") || comment.author.avatar.startsWith("/")) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={comment.author.avatar} alt={comment.author.name} className="h-full w-full object-cover" />
              ) : (
                comment.author.avatar
              )}
            </Link>
          ) : (
            <div 
              className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black text-floral-white overflow-hidden shadow-md border-2 border-(--input-border)/60 group-hover:border-orange/50 transition-all duration-300 ${getAvatarGradient(comment.author.name)}`}
            >
              {comment.author.avatar && (comment.author.avatar.startsWith("http") || comment.author.avatar.startsWith("/")) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={comment.author.avatar} alt={comment.author.name} className="h-full w-full object-cover" />
              ) : (
                comment.author.avatar
              )}
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && showReplies && (
            <div className="w-0.5 flex-1 bg-linear-to-b from-orange/20 to-transparent my-1 border-dashed border-l border-orange/10 group-hover:from-orange/30 transition-all duration-300" />
          )}
        </div>

        <div 
          className="flex-1 p-4 rounded-2xl rounded-tl-none bg-(--input-bg)/35 backdrop-blur-md border border-(--input-border)/65 flex flex-col gap-2 hover:border-orange/35 hover:bg-(--input-bg)/50 hover:shadow-[0_4px_25px_-5px_rgba(249,115,22,0.06)] transition-all duration-300 relative"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1.5">
                {comment.author.username ? (
                  <Link 
                    href={`/profile?username=${comment.author.username}`}
                    className="text-xs font-extrabold text-(--foreground) hover:text-orange hover:underline transition-colors duration-200"
                  >
                    {comment.author.name}
                  </Link>
                ) : (
                  <span className="text-xs font-extrabold text-(--foreground)">
                    {comment.author.name}
                  </span>
                )}
                {comment.author.name === "Akash Singh" && (
                  <span className="text-[7.5px] bg-linear-to-r from-orange/20 to-spicy-paprika/20 text-orange border border-orange/30 px-1.5 py-0.5 rounded-sm font-black uppercase tracking-wider">
                    You
                  </span>
                )}
              </div>
              <span className="text-[8.5px] text-(--text-role) sm:border-l sm:border-(--input-border)/60 sm:pl-2 leading-none">
                {comment.author.role}
              </span>
            </div>
            <span 
              title={comment.createdAt ? new Date(comment.createdAt).toLocaleString() : undefined}
              className="text-[8.5px] text-(--text-role) font-mono cursor-help hover:text-orange transition-colors"
            >
              {comment.timeAgo}
            </span>
          </div>

          {isEditing ? (
            <form onSubmit={(e) => onEditSubmit(comment.id, e)} className="flex flex-col gap-2 mt-1">
              <textarea
                value={editVal}
                onChange={(e) => setEditInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
                placeholder="Edit your comment..."
                className="w-full min-h-[65px] rounded-xl border border-orange bg-(--input-bg) p-3 text-xs text-(--foreground) outline-none focus:ring-2 focus:ring-orange/20 resize-y transition-all"
                autoFocus
              />
              <div className="flex items-center gap-1.5 self-end">
                <button
                  type="button"
                  onClick={() => setActiveEditCommentId(null)}
                  className="rounded-full border border-(--input-border) bg-transparent px-3 py-1.5 text-[10px] font-bold text-(--text-secondary) hover:bg-(--btn-icon-hover-bg) cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-orange px-4 py-1.5 text-[10px] font-bold text-ink-black shadow-xs hover:bg-orange-600 transition-all cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <p className="text-[12.5px] text-(--text-secondary) leading-relaxed pl-0.5 whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {!isEditing && (
            <div className="flex items-center justify-between mt-1.5 pt-2 border-t border-(--divider-color)/40 pl-0.5">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => onVote(comment.id)}
                  className="flex items-center gap-1 text-[9.5px] font-bold text-(--text-role) hover:text-spicy-paprika transition-all cursor-pointer bg-(--nav-bg)/90 hover:bg-spicy-paprika/10 hover:border-spicy-paprika/20 px-3 py-1 rounded-full border border-(--input-border)/50 shadow-3xs"
                >
                  <svg className="w-3 h-3 text-spicy-paprika/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                  <span>{comment.upvotes}</span>
                </button>

                <button 
                  onClick={handleReplyClick}
                  className="flex items-center gap-1 text-[9.5px] font-bold text-(--text-role) hover:text-orange transition-all cursor-pointer bg-(--nav-bg)/90 hover:bg-orange/10 hover:border-orange/20 px-3 py-1 rounded-full border border-(--input-border)/50 shadow-3xs"
                >
                  <svg className="w-3 h-3 text-orange/90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.92 1.613c-.46.505-.15 1.37.536 1.24A9.101 9.101 0 0012 20.25z" />
                  </svg>
                  <span>Reply</span>
                </button>

                {comment.replies && comment.replies.length > 0 && (
                  <button 
                    onClick={() => setShowReplies(!showReplies)}
                    className="flex items-center gap-1 text-[9.5px] font-bold text-(--text-role) hover:text-orange transition-all cursor-pointer bg-(--nav-bg)/90 hover:bg-orange/10 hover:border-orange/20 px-3 py-1 rounded-full border border-(--input-border)/50 shadow-3xs"
                  >
                    <span>{showReplies ? "▲ Hide Replies" : `▼ Show Replies (${comment.replies.length})`}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {userData && comment.author.id && comment.author.id !== userData.id && (
                  <button 
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-1 rounded-lg text-(--text-role) hover:text-spicy-paprika hover:bg-(--btn-icon-hover-bg) border border-transparent hover:border-(--input-border)/30 transition-all cursor-pointer"
                    title="Report Comment"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 5h12l-1 3.5 1 3.5H3" />
                    </svg>
                  </button>
                )}
                {(userData?.id === comment.author.id || userData?.role === "admin") && (
                  <>
                    <button 
                      onClick={handleEditClick}
                      className="p-1 rounded-lg text-(--text-role) hover:text-orange hover:bg-(--btn-icon-hover-bg) border border-transparent hover:border-(--input-border)/30 transition-all cursor-pointer"
                      title="Edit Comment"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => onDelete(comment.id)}
                      className="p-1 rounded-lg text-(--text-role) hover:text-spicy-paprika hover:bg-(--btn-icon-hover-bg) border border-transparent hover:border-(--input-border)/30 transition-all cursor-pointer"
                      title="Delete Comment"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {isReplying && (
        <form 
          onSubmit={(e) => onReplySubmit(comment.id, e)}
          className="flex items-center gap-2 mt-2 ml-11 p-1 bg-(--nav-bg)/80 border border-orange/40 rounded-full shadow-md animate-fade-in transition-all duration-200"
        >
          <input 
            type="text" 
            value={replyVal}
            onChange={(e) => setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))}
            placeholder={`Reply to ${comment.author.name}...`}
            className="flex-1 bg-transparent px-4 py-1.5 text-xs text-(--foreground) placeholder-dust-grey/70 outline-none"
            autoFocus
          />
          <div className="flex items-center gap-1 pr-1">
            <button 
              type="button"
              onClick={() => setActiveReplyCommentId(null)}
              className="rounded-full border border-(--input-border) bg-transparent px-3 py-1 text-[9.5px] font-bold text-(--text-secondary) hover:bg-(--btn-icon-hover-bg) cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="rounded-full bg-orange px-4 py-1 text-[9.5px] font-bold text-ink-black shadow-xs hover:bg-orange-600 transition-all cursor-pointer"
            >
              Submit
            </button>
          </div>
        </form>
      )}

      {comment.replies && comment.replies.length > 0 && showReplies && (
        <div className="flex flex-col gap-4 mt-1.5 ml-4 pl-7 border-l-2 border-dashed border-orange/15 hover:border-orange/25 transition-colors duration-300">
          {comment.replies.map((reply) => (
            <CommentNode 
              key={reply.id} 
              comment={reply}
              activeReplyCommentId={activeReplyCommentId}
              setActiveReplyCommentId={setActiveReplyCommentId}
              activeEditCommentId={activeEditCommentId}
              setActiveEditCommentId={setActiveEditCommentId}
              replyInputs={replyInputs}
              setReplyInputs={setReplyInputs}
              editInputs={editInputs}
              setEditInputs={setEditInputs}
              onVote={onVote}
              onReplySubmit={onReplySubmit}
              onEditSubmit={onEditSubmit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ReportModal
        isOpen={isReportModalOpen}
        targetId={comment.id}
        targetType="Comment"
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
