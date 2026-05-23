"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

interface CommentItem {
  id: string;
  postId: string;
  postTitle: string;
  content: string;
  parentId: string | null;
  upvotesCount: number;
  repliesCount: number;
  author?: {
    name: string;
    username: string;
  };
  createdAt: string;
}

export default function CommentManagementPage() {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [postId, setPostId] = useState("");
  const authorId = "";
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<CommentItem | null>(null);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/comments", {
        params: {
          page,
          limit: 15,
          search: debouncedSearch,
          postId: postId || undefined,
          authorId: authorId || undefined,
          sort,
          order,
        },
      });
      setComments(res.data.comments || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalComments(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setLoading(false);
    }
  }, [page, postId, authorId, sort, order, debouncedSearch]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();
  }, [fetchComments]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSort = (key: string) => {
    if (sort === key) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setSort(key);
      setOrder("desc");
    }
    setPage(1);
  };

  const handleEditClick = (comment: CommentItem) => {
    setSelectedComment(comment);
    setEditContent(comment.content);
    setEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComment) return;
    setSavingEdit(true);

    try {
      await axiosInstance.put(`/api/admin/comments/${selectedComment.id}`, {
        content: editContent,
      });

      setComments((prev) =>
        prev.map((c) => (c.id === selectedComment.id ? { ...c, content: editContent } : c))
      );

      setEditModalOpen(false);
      setSelectedComment(null);
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      alert(errorMsg || "Failed to update comment");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedComment) return;
    try {
      const res = await axiosInstance.delete(`/api/admin/comments/${selectedComment.id}`);
      if (res.status === 200) {
        // Since delete cascade might delete replies, reload is cleaner but filtering is faster
        // The API returns message about comments deleted. Let's refetch to keep data accurate.
        fetchComments();
      }
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      alert(errorMsg || "Failed to delete comment");
    }
  };

  const columns = [
    {
      key: "content",
      label: "Comment Content",
      render: (row: CommentItem) => (
        <div className="min-w-0 max-w-md">
          <p className="font-bold text-floral-white line-clamp-2 leading-relaxed">
            {row.content}
          </p>
          <span className="text-3xs text-dust-grey/60 block truncate mt-1">
            By @{row.author?.username || "deleted"} • on post &ldquo;{row.postTitle}&rdquo;
          </span>
        </div>
      ),
    },
    {
      key: "stats",
      label: "Stats",
      render: (row: CommentItem) => (
        <span className="text-2xs font-semibold text-dust-grey/80">
          ▲{row.upvotesCount} votes • 💬{row.repliesCount} replies
        </span>
      ),
    },
    {
      key: "parentId",
      label: "Type",
      render: (row: CommentItem) => (
        <span className="text-2xs font-extrabold uppercase tracking-widest text-stormy-teal">
          {row.parentId ? "Reply" : "Top-level"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (row: CommentItem) => (
        <span className="text-2xs font-semibold text-dust-grey/80">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: CommentItem) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="px-2.5 py-1 rounded bg-stormy-teal/10 hover:bg-stormy-teal/20 text-stormy-teal border border-stormy-teal/20 text-3xs font-bold uppercase transition-all cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => {
              setSelectedComment(row);
              setDeleteModalOpen(true);
            }}
            className="px-2.5 py-1 rounded bg-spicy-paprika/10 hover:bg-spicy-paprika/20 text-spicy-paprika border border-spicy-paprika/20 text-3xs font-bold uppercase transition-all cursor-pointer"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-floral-white tracking-tight uppercase">
          Comment Management
        </h1>
        <p className="text-xs text-dust-grey font-bold uppercase tracking-wider mt-1">
          Moderate community comments and replies ({totalComments} total)
        </p>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-stormy-teal/10 bg-ink-black/30 rounded-2xl">
        <div className="sm:col-span-2">
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Search Content
          </label>
          <input
            type="text"
            placeholder="Search by comment content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
          />
        </div>

        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Post ID
          </label>
          <input
            type="text"
            placeholder="Filter by exact Post ObjectId..."
            value={postId}
            onChange={(e) => {
              setPostId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={comments}
        isLoading={loading}
        sortKey={sort}
        sortOrder={order}
        onSort={handleSort}
        pagination={{ page, limit: 15, total: totalComments, totalPages }}
        onPageChange={setPage}
        emptyMessage="No comments found matching search criteria"
      />

      {/* Edit Comment Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-stormy-teal/20 bg-ink-black p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-floral-white uppercase tracking-wider mb-4 border-b border-stormy-teal/10 pb-2">
              Edit Comment Content
            </h3>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Comment Text
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                  required
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-stormy-teal/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedComment(null);
                  }}
                  className="px-4 py-2 rounded-xl text-2xs font-extrabold uppercase tracking-wider text-dust-grey hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl bg-stormy-teal hover:bg-stormy-teal/80 text-floral-white font-extrabold uppercase tracking-wider text-2xs cursor-pointer"
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Comment Tree"
        message={`Are you sure you want to delete this comment? Doing so will delete this comment and ALL nested replies recursively, updating the post's total comment count. This is completely IRREVERSIBLE.`}
        confirmText="Confirm Tree Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedComment(null);
        }}
        isDanger={true}
      />
    </div>
  );
}
