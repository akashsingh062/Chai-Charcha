"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import Image from "next/image";

interface CommunityItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  isPrivate: boolean;
  avatar: string;
  banner: string;
  moderatorsCount: number;
  isBanned?: boolean;
  creator?: {
    name: string;
    username: string;
  };
  createdAt: string;
}

export default function CommunityManagementPage() {
  const [communities, setCommunities] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCommunities, setTotalCommunities] = useState(0);

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityItem | null>(null);

  // Ban Modal
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("0");

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/communities", {
        params: {
          page,
          limit: 15,
          search: debouncedSearch,
          sort,
          order,
        },
      });
      setCommunities(res.data.communities || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalCommunities(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load communities", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, sort, order]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCommunities();
  }, [fetchCommunities]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleBanClick = async (community: CommunityItem) => {
    if (community.isBanned) {
      // Unban directly
      try {
        const res = await axiosInstance.post(`/api/admin/communities/${community.id}/ban`);
        if (res.status === 200) {
          setCommunities((prev) =>
            prev.map((c) => (c.id === community.id ? { ...c, isBanned: res.data.isBanned } : c))
          );
        }
      } catch (err: unknown) {
        alert("Failed to unban community");
      }
    } else {
      setSelectedCommunity(community);
      setBanDuration("0");
      setBanModalOpen(true);
    }
  };

  const handleConfirmBan = async () => {
    if (!selectedCommunity) return;
    try {
      const payload = banDuration !== "0" ? { durationHours: parseInt(banDuration) } : {};
      const res = await axiosInstance.post(`/api/admin/communities/${selectedCommunity.id}/ban`, payload);
      if (res.status === 200) {
        setCommunities((prev) =>
          prev.map((c) => (c.id === selectedCommunity.id ? { ...c, isBanned: res.data.isBanned } : c))
        );
      }
      setBanModalOpen(false);
      setSelectedCommunity(null);
    } catch (err: unknown) {
      alert("Failed to ban community");
    }
  };

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
    if (!selectedCommunity) return;
    try {
      const res = await axiosInstance.delete(`/api/admin/communities/${selectedCommunity.id}`);
      if (res.status === 200) {
        setCommunities((prev) => prev.filter((c) => c.id !== selectedCommunity.id));
        setTotalCommunities((prev) => prev - 1);
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      alert(errorMsg || "Failed to delete community");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Community Name",
      sortable: true,
      render: (row: CommunityItem) => (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-stormy-teal/20 bg-stormy-teal/10 shrink-0">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xs font-black uppercase text-stormy-teal">
                {row.name.substring(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-floral-white block truncate">{row.name}</span>
            <span className="text-3xs text-dust-grey/60 block truncate">c/{row.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: "creator",
      label: "Creator",
      render: (row: CommunityItem) => (
        <span className="text-2xs font-semibold text-dust-grey/80">
          {row.creator?.username ? (
            <Link
              href={`/admin/users?search=${row.creator.username}`}
              className="text-stormy-teal hover:text-vivid-tangerine hover:underline font-bold"
            >
              @{row.creator.username}
            </Link>
          ) : (
            "deleted"
          )}
        </span>
      ),
    },
    {
      key: "membersCount",
      label: "Members",
      sortable: true,
      render: (row: CommunityItem) => (
        <span className="font-extrabold text-floral-white">{row.membersCount} members</span>
      ),
    },
    {
      key: "moderatorsCount",
      label: "Moderators",
      render: (row: CommunityItem) => (
        <span className="text-2xs font-semibold text-stormy-teal">{row.moderatorsCount} moderators</span>
      ),
    },
    {
      key: "isPrivate",
      label: "Visibility",
      render: (row: CommunityItem) => (
        row.isBanned ? (
          <AdminBadge type="banned" />
        ) : (
          <AdminBadge type={row.isPrivate ? "rejected" : "active"} />
        )
      ),
    },
    {
      key: "createdAt",
      label: "Created Date",
      sortable: true,
      render: (row: CommunityItem) => (
        <span className="text-2xs font-semibold text-dust-grey/80">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: CommunityItem) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/communities/${row.id}`}
            className="px-2.5 py-1 rounded bg-stormy-teal/10 hover:bg-stormy-teal/20 text-stormy-teal border border-stormy-teal/20 text-3xs font-bold uppercase transition-all"
          >
            Inspect
          </Link>
          <button
            onClick={() => handleBanClick(row)}
            className={`px-2.5 py-1 rounded text-3xs font-bold uppercase transition-all border cursor-pointer ${
              row.isBanned
                ? "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                : "bg-orange/10 hover:bg-orange/20 text-orange border-orange/20"
            }`}
          >
            {row.isBanned ? "Unban" : "Ban"}
          </button>
          <button
            onClick={() => {
              setSelectedCommunity(row);
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
          Community Management
        </h1>
        <p className="text-xs text-dust-grey font-bold uppercase tracking-wider mt-1">
          Manage sub-charcha channels ({totalCommunities} total)
        </p>
      </div>

      {/* Filters bar */}
      <div className="p-4 border border-stormy-teal/10 bg-ink-black/30 rounded-2xl">
        <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
          Search Communities
        </label>
        <input
          type="text"
          placeholder="Search by community name, description, or slug..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={communities}
        isLoading={loading}
        sortKey={sort}
        sortOrder={order}
        onSort={handleSort}
        pagination={{ page, limit: 15, total: totalCommunities, totalPages }}
        onPageChange={setPage}
        emptyMessage="No communities found matching search criteria"
      />

      {/* Ban Duration Modal */}
      {banModalOpen && selectedCommunity && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-stormy-teal/20 bg-ink-black p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-floral-white uppercase tracking-wider border-b border-stormy-teal/10 pb-2">
              Ban Community: c/{selectedCommunity.slug}
            </h3>
            
            <div>
              <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
                Suspension Duration
              </label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
              >
                <option value="0">Permanent Ban</option>
                <option value="1">1 Hour Suspension</option>
                <option value="24">1 Day Suspension</option>
                <option value="168">1 Week Suspension</option>
                <option value="720">30 Days Suspension</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBanModalOpen(false);
                  setSelectedCommunity(null);
                }}
                className="px-4 py-2 rounded-xl text-2xs font-extrabold uppercase tracking-wider text-dust-grey hover:bg-white/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                className="px-4 py-2 rounded-xl bg-orange hover:bg-orange/80 text-ink-black font-extrabold uppercase tracking-wider text-2xs cursor-pointer"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete Community Channel"
        message={`Are you sure you want to permanently delete c/${selectedCommunity?.slug}? This will delete the community, all posts within it, all comments of those posts, and remove it from all users' subscription lists. This is IRREVERSIBLE.`}
        confirmText="Hard Delete Community"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedCommunity(null);
        }}
        isDanger={true}
      />
    </div>
  );
}
