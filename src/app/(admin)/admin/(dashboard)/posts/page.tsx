"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";

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
  
  // Edit post modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editTags, setEditTags] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
      alert(errorMsg || "Failed to toggle deletion status");
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
      alert(errorMsg || "Failed to hard delete post");
    }
  };

  const handleEditClick = (post: PostItem) => {
    setSelectedPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategory(post.category);
    setEditTags(post.tags.join(", "));
    setEditModalOpen(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    setSavingEdit(true);

    try {
      const tagsArray = editTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await axiosInstance.put(`/api/admin/posts/${selectedPost.id}`, {
        title: editTitle,
        content: editContent,
        category: editCategory,
        tags: tagsArray,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === selectedPost.id
            ? {
                ...p,
                title: editTitle,
                content: editContent,
                category: editCategory,
                tags: tagsArray,
              }
            : p
        )
      );

      setEditModalOpen(false);
      setSelectedPost(null);
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      alert(errorMsg || "Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  const columns = [
    {
      key: "title",
      label: "Post Title",
      sortable: true,
      render: (row: PostItem) => (
        <div className="min-w-0 max-w-xs">
          <span className="font-bold text-floral-white block truncate">{row.title}</span>
          <span className="text-3xs text-dust-grey/60 block truncate">
            By @{row.author?.username || "deleted"} • in {row.community?.name || "General"}
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
        <span className="text-2xs font-semibold text-dust-grey/80">
          ▲{row.upvotesCount - row.downvotesCount} votes • 💬{row.commentCount} replies
        </span>
      ),
    },
    {
      key: "trendingScore",
      label: "Score",
      sortable: true,
      render: (row: PostItem) => (
        <span className="font-extrabold text-vivid-tangerine">
          {row.trendingScore.toFixed(0)}
        </span>
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEditClick(row)}
            className="px-2.5 py-1 rounded bg-stormy-teal/10 hover:bg-stormy-teal/20 text-stormy-teal border border-stormy-teal/20 text-3xs font-bold uppercase transition-all cursor-pointer"
          >
            Edit
          </button>
          <button
            onClick={() => handleSoftDeleteToggle(row)}
            className={`px-2.5 py-1 rounded text-3xs font-bold uppercase transition-all border cursor-pointer ${
              row.isSoftDeleted
                ? "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                : "bg-orange/10 hover:bg-orange/20 text-orange border-orange/20"
            }`}
          >
            {row.isSoftDeleted ? "Restore" : "Soft-Delete"}
          </button>
          <button
            onClick={() => {
              setSelectedPost(row);
              setDeleteModalOpen(true);
            }}
            className="px-2.5 py-1 rounded bg-spicy-paprika/10 hover:bg-spicy-paprika/20 text-spicy-paprika border border-spicy-paprika/20 text-3xs font-bold uppercase transition-all cursor-pointer"
          >
            Hard-Delete
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
          Post Management
        </h1>
        <p className="text-xs text-dust-grey font-bold uppercase tracking-wider mt-1">
          Moderate community discussions and posts ({totalPosts} total)
        </p>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border border-stormy-teal/10 bg-ink-black/30 rounded-2xl">
        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Search Content
          </label>
          <input
            type="text"
            placeholder="Search by title, content, or tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
          />
        </div>

        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
          >
            <option value="">All Categories</option>
            <option value="General Charcha">General Charcha</option>
            <option value="Tech Support">Tech Support</option>
            <option value="Coding Lounge">Coding Lounge</option>
            <option value="Showcase">Showcase</option>
          </select>
        </div>

        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Status
          </label>
          <select
            value={showDeleted}
            onChange={(e) => {
              setShowDeleted(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
          >
            <option value="true">Show Active & Soft-Deleted</option>
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

      {/* Edit Post Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-stormy-teal/20 bg-ink-black p-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-floral-white uppercase tracking-wider mb-4 border-b border-stormy-teal/10 pb-2">
              Edit Post Content
            </h3>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Post Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine"
                />
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
                >
                  <option value="General Charcha">General Charcha</option>
                  <option value="Tech Support">Tech Support</option>
                  <option value="Coding Lounge">Coding Lounge</option>
                  <option value="Showcase">Showcase</option>
                </select>
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="nextjs, react, tailwind"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine"
                />
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Post Content
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
                    setSelectedPost(null);
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
