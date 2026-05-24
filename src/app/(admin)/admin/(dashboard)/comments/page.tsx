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

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-2xl bg-[#111318] border border-white/6 hover:border-white/12 hover:bg-white/2 transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-white/2 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
        {icon && <div className="text-white/20 group-hover:text-white/40 transition-colors duration-300">{icon}</div>}
      </div>
      <span className={`text-xl font-black tabular-nums leading-none tracking-tight ${color || "text-white"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
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
        toast.success("Comment and nested replies deleted");
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
        <div className="min-w-0 max-w-md space-y-1 py-1">
          <p className="text-xs font-semibold text-white/90 line-clamp-2 leading-relaxed">
            {row.content}
          </p>
          <span className="text-[10px] text-white/30 block">
            By{" "}
            {row.author?.username ? (
              <Link href={`/admin/users?search=${row.author.username}`}
                className="text-[#14b8a6] hover:text-[#2dd4bf] font-bold transition-colors">
                @{row.author.username}
              </Link>
            ) : "deleted"}{" "}
            · on &ldquo;<span className="text-white/40 font-medium">{row.postTitle}</span>&rdquo;
          </span>
        </div>
      ),
    },
    {
      key: "stats",
      label: "Stats",
      render: (row: CommentItem) => (
        <div className="text-[10px] text-white/50 space-y-0.5 font-semibold">
          <span className="block text-orange-400">▲ {row.upvotesCount} votes</span>
          <span className="block text-stormy-teal">💬 {row.repliesCount} replies</span>
        </div>
      ),
    },
    {
      key: "parentId",
      label: "Type",
      render: (row: CommentItem) => (
        <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider
          ${row.parentId
            ? "bg-[#14b8a6]/10 text-[#14b8a6] border-[#14b8a6]/15"
            : "bg-white/4 text-white/40 border-white/6"
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
        <span className="text-[10px] text-white/30 font-semibold">{new Date(row.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: CommentItem) => (
        <button
          onClick={() => { setSelectedComment(row); setDeleteModalOpen(true); }}
          title="Delete Comment"
          className="w-7 h-7 rounded-lg bg-red-500/6 border border-red-500/20 text-red-400 hover:bg-red-500/12 flex items-center justify-center transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      ),
    },
  ];

  // Dynamic Page Calculations
  const replyCount = comments.filter(c => c.parentId).length;
  const topLevelCount = comments.filter(c => !c.parentId).length;
  const avgUpvotes = comments.length > 0 ? (comments.reduce((acc, c) => acc + c.upvotesCount, 0) / comments.length).toFixed(1) : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">Comment Management</h1>
        <p className="text-xs text-white/30 mt-1">
          Reviewing <span className="font-bold text-white/60">{totalComments.toLocaleString()}</span> user comment submissions
        </p>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Comments" value={totalComments} color="text-indigo-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        } />
        <StatCard label="Top-Level (Page)" value={topLevelCount} color="text-[#14b8a6]" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        } />
        <StatCard label="Replies (Page)" value={replyCount} color="text-[#f97316]" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        } />
        <StatCard label="Avg Upvotes (Page)" value={avgUpvotes} color="text-amber-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        } />
      </div>

      {/* Filters bar */}
      <div className="rounded-3xl border border-white/6 bg-[#111318] p-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/1 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by comment content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 focus:bg-white/4 rounded-2xl text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-200"
            />
          </div>
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <input
              type="text"
              placeholder="Filter by Post ID..."
              value={postId}
              onChange={(e) => { setPostId(e.target.value); setPage(1); }}
              className="w-full pl-11 pr-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 focus:bg-white/4 rounded-2xl text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-200 sm:w-60"
            />
          </div>
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
