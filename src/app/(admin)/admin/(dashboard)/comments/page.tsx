"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import { toast } from "@/store/useToastStore";

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
      toast.error(errorMsg || "Failed to delete comment");
    }
  };

  const columns = [
    {
      key: "content",
      label: "Comment Content",
      render: (row: CommentItem) => (
        <div className="min-w-0 max-w-md">
          <p className="text-xs font-semibold text-white/80 line-clamp-2 leading-relaxed">
            {row.content}
          </p>
          <span className="text-[10px] text-white/30 block mt-1">
            By{" "}
            {row.author?.username ? (
              <Link href={`/admin/users?search=${row.author.username}`}
                className="text-[#14b8a6] hover:text-[#2dd4bf] font-semibold transition-colors">
                @{row.author.username}
              </Link>
            ) : "deleted"}{" "}
            · on &ldquo;{row.postTitle}&rdquo;
          </span>
        </div>
      ),
    },
    {
      key: "stats",
      label: "Stats",
      render: (row: CommentItem) => (
        <div className="text-[10px] text-white/40 space-y-0.5">
          <span className="block">▲ {row.upvotesCount} votes</span>
          <span className="block">💬 {row.repliesCount} replies</span>
        </div>
      ),
    },
    {
      key: "parentId",
      label: "Type",
      render: (row: CommentItem) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider
          ${row.parentId
            ? "bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/20"
            : "bg-white/[0.06] text-white/50 border-white/[0.08]"
          }`}>
          {row.parentId ? "Reply" : "Top-level"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      sortable: true,
      render: (row: CommentItem) => (
        <span className="text-[10px] text-white/30 font-medium">{new Date(row.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: CommentItem) => (
        <button
          onClick={() => { setSelectedComment(row); setDeleteModalOpen(true); }}
          title="Delete Comment"
          className="w-7 h-7 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-red-400 hover:bg-red-500/[0.12] flex items-center justify-center transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">Comment Management</h1>
        <p className="text-[11px] text-white/30 mt-1">
          <span className="font-semibold text-white/50">{totalComments.toLocaleString()}</span> community comments
        </p>
      </div>

      {/* Filters bar */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 space-y-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by comment content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#f97316]/40 transition-all"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by Post ID..."
            value={postId}
            onChange={(e) => { setPostId(e.target.value); setPage(1); }}
            className="px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#f97316]/40 transition-all min-w-48"
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
