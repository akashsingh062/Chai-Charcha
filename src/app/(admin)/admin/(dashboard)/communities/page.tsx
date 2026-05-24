"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import { toast } from "@/store/useToastStore";

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

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-2xl bg-[#111318] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-all duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">{label}</span>
        {icon && <div className="text-white/20 group-hover:text-white/40 transition-colors duration-300">{icon}</div>}
      </div>
      <span className={`text-xl font-black tabular-nums leading-none tracking-tight ${color || "text-white"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
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
          toast.success("Community unbanned successfully");
        }
      } catch {
        toast.error("Failed to unban community");
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
        toast.success("Community restricted");
      }
      setBanModalOpen(false);
      setSelectedCommunity(null);
    } catch {
      toast.error("Failed to ban community");
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
        toast.success("Community deleted");
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      toast.error(errorMsg || "Failed to delete community");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Community Name",
      sortable: true,
      render: (row: CommunityItem) => (
        <div className="flex items-center gap-3">
          <Link href={`/admin/communities/${row.id}`} className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/[0.08] bg-white/[0.04] shrink-0 block hover:border-[#14b8a6]/40 transition-all">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-[#14b8a6]">
                {row.name.substring(0, 2)}
              </div>
            )}
          </Link>
          <div className="min-w-0">
            <Link href={`/admin/communities/${row.id}`} className="text-xs font-bold text-white/90 block truncate hover:text-[#14b8a6] transition-colors">
              {row.name}
            </Link>
            <span className="text-[10px] text-white/30 block">c/{row.slug}</span>
          </div>
        </div>
      ),
    },
    {
      key: "creator",
      label: "Creator",
      render: (row: CommunityItem) => (
        <span className="text-xs text-white/50 font-semibold">
          {row.creator?.username ? (
            <Link href={`/admin/users?search=${row.creator.username}`}
              className="text-[#14b8a6] hover:text-[#2dd4bf] font-bold transition-colors">
              @{row.creator.username}
            </Link>
          ) : "deleted"}
        </span>
      ),
    },
    {
      key: "membersCount",
      label: "Members",
      sortable: true,
      render: (row: CommunityItem) => (
        <span className="text-xs font-bold text-white/80 tabular-nums">{row.membersCount.toLocaleString()}</span>
      ),
    },
    {
      key: "moderatorsCount",
      label: "Moderators",
      render: (row: CommunityItem) => (
        <span className="text-xs font-bold text-[#14b8a6] tabular-nums">{row.moderatorsCount}</span>
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
        <span className="text-[10px] text-white/30 font-semibold">{new Date(row.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: CommunityItem) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/communities/${row.id}`}
            title="Inspect Community"
            className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-[#14b8a6] hover:border-[#14b8a6]/30 hover:bg-[#14b8a6]/[0.06] flex items-center justify-center transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>
          <button
            onClick={() => handleBanClick(row)}
            title={row.isBanned ? "Unban Community" : "Ban Community"}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer
              ${row.isBanned
                ? "bg-green-500/[0.06] border-green-500/20 text-green-400 hover:bg-green-500/[0.12]"
                : "bg-orange-500/[0.06] border-orange-500/20 text-orange-400 hover:bg-orange-500/[0.12]"
              }`}
          >
            {row.isBanned ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            )}
          </button>
          <button
            onClick={() => { setSelectedCommunity(row); setDeleteModalOpen(true); }}
            title="Delete Community"
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

  // Dynamic calculated stats (reactive to currently loaded page context)
  const privateCount = communities.filter(c => c.isPrivate).length;
  const bannedCount = communities.filter(c => c.isBanned).length;
  const pageMembers = communities.reduce((acc, c) => acc + c.membersCount, 0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Community Channels</h1>
        <p className="text-xs text-white/30 mt-1">
          Managing <span className="font-bold text-white/60">{totalCommunities.toLocaleString()}</span> sub-charcha forum channels
        </p>
      </div>

      {/* Dynamic Quick Stats Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Communities" value={totalCommunities} color="text-[#14b8a6]" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        } />
        <StatCard label="Private (Current Page)" value={privateCount} color="text-amber-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        } />
        <StatCard label="Banned (Current Page)" value={bannedCount} color="text-red-400" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        } />
        <StatCard label="Page Total Members" value={pageMembers} color="text-[#f97316]" icon={
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        } />
      </div>

      {/* Filters bar */}
      <div className="rounded-3xl border border-white/[0.06] bg-[#111318] p-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by community name, slug, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#14b8a6]/40 focus:bg-white/[0.04] rounded-2xl text-xs text-white placeholder-white/20 focus:outline-none transition-all duration-200"
          />
        </div>
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
        emptyMessage="No community channels found matching search criteria"
      />

      {/* Ban Duration Modal */}
      {banModalOpen && selectedCommunity && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#111318] p-6 shadow-2xl overflow-hidden animate-scale-in">
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">Restrict Channel Access</h3>
                <p className="text-[10px] text-white/30 font-semibold mt-0.5">c/{selectedCommunity.slug}</p>
              </div>
            </div>
            
            <div className="space-y-1.5 mb-6">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Suspension Duration</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              >
                <option value="0">Indefinite (Permanent Ban)</option>
                <option value="1">1 Hour Suspension</option>
                <option value="24">24 Hour Suspension</option>
                <option value="168">7 Day Suspension</option>
                <option value="720">30 Day Suspension</option>
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => { setBanModalOpen(false); setSelectedCommunity(null); }}
                className="flex-1 py-3 rounded-xl text-xs font-bold text-white/40 hover:bg-white/[0.04] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Confirm Restrict
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
