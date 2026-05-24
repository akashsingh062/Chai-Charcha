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
        <div className="min-w-0 max-w-xs">
          <span className="text-xs font-semibold text-white/90 block truncate">{row.title}</span>
          <span className="text-[10px] text-white/30 block truncate mt-0.5">
            By{" "}
            {row.author?.username ? (
              <Link href={`/admin/users?search=${row.author.username}`}
                className="text-[#14b8a6] hover:text-[#2dd4bf] font-semibold transition-colors">
                @{row.author.username}
              </Link>
            ) : "deleted"}{" "}
            · {row.community?.name || "General"}
          </span>
        </div>
      ),
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
    },
    {
      key: "stats",
      label: "Votes/Comments",
      render: (row: PostItem) => (
        <div className="text-[10px] text-white/40 space-y-0.5">
          <span className="block">▲ {row.upvotesCount - row.downvotesCount} votes</span>
          <span className="block">💬 {row.commentCount} replies</span>
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
        <span className="text-2xs font-semibold text-dust-grey/80">
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
                ? "bg-green-500/[0.06] border-green-500/20 text-green-400 hover:bg-green-500/[0.12]"
                : "bg-orange-500/[0.06] border-orange-500/20 text-orange-400 hover:bg-orange-500/[0.12]"
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
            className="w-7 h-7 rounded-lg bg-red-500/[0.06] border border-red-500/20 text-red-400 hover:bg-red-500/[0.12] flex items-center justify-center transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-white tracking-tight">Post Management</h1>
        <p className="text-[11px] text-white/30 mt-1">
          <span className="font-semibold text-white/50">{totalPosts.toLocaleString()}</span> community posts
        </p>
      </div>

      {/* Filters bar */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-4 space-y-3">
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title, content, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#f97316]/40 focus:bg-white/[0.06] transition-all"
          />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white/60 focus:outline-none focus:border-[#f97316]/40 transition-all"
          >
            <option value="">All Categories</option>
            <option value="General Charcha">General Charcha</option>
            <option value="Tech Support">Tech Support</option>
            <option value="Coding Lounge">Coding Lounge</option>
            <option value="Showcase">Showcase</option>
          </select>
          <select
            value={showDeleted}
            onChange={(e) => { setShowDeleted(e.target.value); setPage(1); }}
            className="px-3.5 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs text-white/60 focus:outline-none focus:border-[#f97316]/40 transition-all"
          >
            <option value="true">Active &amp; Soft-Deleted</option>
            <option value="false">Active Only</option>
            <option value="only">Soft-Deleted Only</option>
          </select>
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
