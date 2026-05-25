"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import { toast } from "@/store/useToastStore";

interface PostItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: string;
  upvotesCount: number;
  downvotesCount: number;
  commentCount: number;
  trendingScore: number;
  isSoftDeleted: boolean;
  isCommunityOnly: boolean;
  author?: {
    name: string;
    username: string;
  };
  community?: {
    name: string;
    slug: string;
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

export default function PostManagementPage() {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showDeleted, setShowDeleted] = useState("true"); // "true", "false", "only"
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/posts", {
        params: {
          page,
          limit: 15,
          search: debouncedSearch,
          category,
          showDeleted,
          sort,
          order,
        },
      });
      setPosts(res.data.posts || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalPosts(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, category, showDeleted, sort, order]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts();
  }, [fetchPosts]);

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

  const handleSoftDeleteToggle = async (post: PostItem) => {
    try {
      const res = await axiosInstance.patch(`/api/admin/posts/${post.id}`);
      if (res.status === 200) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, isSoftDeleted: res.data.isSoftDeleted } : p))
        );
        toast.success(`Post ${res.data.isSoftDeleted ? "soft-deleted" : "restored"}`);
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      toast.error(errorMsg || "Failed to toggle deletion status");
    }
  };

  const handleHardDeleteConfirm = async () => {
    if (!selectedPost) return;
    try {
      const res = await axiosInstance.delete(`/api/admin/posts/${selectedPost.id}`);
      if (res.status === 200) {
        setPosts((prev) => prev.filter((p) => p.id !== selectedPost.id));
        setTotalPosts((prev) => prev - 1);
        toast.success("Post permanently deleted");
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      toast.error(errorMsg || "Failed to hard delete post");
    }
  };

  const columns = [
    {
      key: "title",
      label: "Post Title",
      sortable: true,
      render: (row: PostItem) => (
        <div className="min-w-0 max-w-xs space-y-0.5 py-0.5">
          <span className="text-xs font-bold text-white/90 block truncate">{row.title}</span>
          <span className="text-[10px] text-white/30 block truncate">
            By{" "}
            {row.author?.username ? (
              <Link href={`/admin/users?search=${row.author.username}`}
                className="text-[#14b8a6] hover:text-[#2dd4bf] font-bold transition-colors">
                @{row.author.username}
              </Link>
            ) : "deleted"}{" "}
            · <span className="text-white/40">{row.community?.name || "General"}</span>
          </span>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (row: PostItem) => (
        <span className="text-xs text-white/60 font-semibold">{row.category}</span>
      ),
    },
    {
      key: "stats",
      label: "Votes/Comments",
      render: (row: PostItem) => (
        <div className="text-[10px] text-white/50 space-y-0.5 font-semibold">
          <span className="block text-orange-400">▲ {row.upvotesCount - row.downvotesCount} votes</span>
          <span className="block text-stormy-teal">💬 {row.commentCount} comments</span>
        </div>
      ),
    },
    {
      key: "trendingScore",
      label: "Score",
      sortable: true,
      render: (row: PostItem) => (
        <span className="text-xs font-bold text-[#f97316] tabular-nums">{row.trendingScore.toFixed(0)}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: PostItem) => (
        <AdminBadge type={row.isSoftDeleted ? "deleted" : "active"} />
      ),
    },
    {
      key: "createdAt",
      label: "Posted Date",
      sortable: true,
      render: (row: PostItem) => (
        <span className="text-[10px] text-white/30 font-semibold">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: PostItem) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleSoftDeleteToggle(row)}
            title={row.isSoftDeleted ? "Restore Post" : "Soft-Delete Post"}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer
              ${row.isSoftDeleted
                ? "bg-green-500/6 border-green-500/20 text-green-400 hover:bg-green-500/12"
                : "bg-orange-500/6 border-orange-500/20 text-orange-400 hover:bg-orange-500/12"
              }`}
          >
            {row.isSoftDeleted ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            )}
          </button>
          <button
            onClick={() => { setSelectedPost(row); setDeleteModalOpen(true); }}
            title="Hard Delete Post"
            className="w-7 h-7 rounded-lg bg-red-500/6 border border-red-500/20 text-red-400 hover:bg-red-500/12 flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  // Dynamic calculated stats (reactive to currently loaded page context)
  const activeCount = posts.filter(p => !p.isSoftDeleted).length;
  const deletedCount = posts.filter(p => p.isSoftDeleted).length;
  const communityOnlyCount = posts.filter(p => p.isCommunityOnly).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">Post Management</h1>
        <p className="text-xs text-white/30 mt-1">
          Reviewing <span className="font-bold text-white/60">{totalPosts.toLocaleString()}</span> user post submissions
        </p>
      </div>

      {/* Dynamic Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Posts" value={totalPosts} color="text-indigo-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        } />
        <StatCard label="Active (Page)" value={activeCount} color="text-[#14b8a6]" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        } />
        <StatCard label="Soft-Deleted (Page)" value={deletedCount} color="text-red-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        } />
        <StatCard label="Community Only (Page)" value={communityOnlyCount} color="text-[#f97316]" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        } />
      </div>

      {/* Filters bar */}
      <div className="rounded-3xl border border-white/6 bg-[#111318] p-4 shadow-lg space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/1 rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, content, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 focus:bg-white/4 rounded-2xl text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-200"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="pl-3.5 pr-8 py-2.5 bg-white/2 border border-white/8 hover:border-white/15 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[#f97316]/40 transition-all appearance-none cursor-pointer"
            >
              <option value="">All Categories</option>
              <option value="General Charcha">General Charcha</option>
              <option value="Tech & Code">Tech & Code</option>
              <option value="Startups & Business">Startups & Business</option>
              <option value="Career & Salary">Career & Salary</option>
              <option value="Showcase & Projects">Showcase & Projects</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={showDeleted}
              onChange={(e) => { setShowDeleted(e.target.value); setPage(1); }}
              className="pl-3.5 pr-8 py-2.5 bg-white/2 border border-white/8 hover:border-white/15 rounded-xl text-xs text-white/75 focus:outline-none focus:border-[#f97316]/40 transition-all appearance-none cursor-pointer"
            >
              <option value="true">Active &amp; Soft-Deleted</option>
              <option value="false">Active Only</option>
              <option value="only">Soft-Deleted Only</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={posts}
        isLoading={loading}
        sortKey={sort}
        sortOrder={order}
        onSort={handleSort}
        pagination={{ page, limit: 15, total: totalPosts, totalPages }}
        onPageChange={setPage}
        emptyMessage="No posts found matching search criteria"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Permanently Delete Post"
        message={`Are you sure you want to permanently delete "${selectedPost?.title}"? This will hard-delete the post and all associated comments, and is completely IRREVERSIBLE.`}
        confirmText="Confirm Hard Delete"
        onConfirm={handleHardDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedPost(null);
        }}
        isDanger={true}
      />
    </div>
  );
}
