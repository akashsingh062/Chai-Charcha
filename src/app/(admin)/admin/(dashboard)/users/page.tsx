/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import { toast } from "@/store/useToastStore";

interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  karma: number;
  isBanned: boolean;
  isMuted?: boolean;
  createdAt: string;
}

function UserManagementPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get("search") || "";

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [role, setRole] = useState("");
  const [banned, setBanned] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("0");
  const [muteModalOpen, setMuteModalOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState("0");

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/users", {
        params: { page, limit: 15, search: debouncedSearch, role, banned: banned || undefined, sort, order },
      });
      setUsers(res.data.users || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalUsers(res.data.pagination?.total || 0);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, role, banned, sort, order]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const s = searchParams?.get("search") || "";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(s);
    setDebouncedSearch(s);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (search === (searchParams?.get("search") || "")) return;
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search, searchParams]);

  const handleSort = (key: string) => {
    if (sort === key) setOrder(order === "asc" ? "desc" : "asc");
    else { setSort(key); setOrder("desc"); }
    setPage(1);
  };

  const handleBanClick = async (user: UserItem) => {
    if (user.isBanned) {
      try {
        const res = await axiosInstance.post(`/api/admin/users/${user.id}/ban`);
        if (res.status === 200) setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isBanned: res.data.isBanned } : u));
      } catch { toast.error("Failed to unban user"); }
    } else {
      setSelectedUser(user); setBanDuration("0"); setBanModalOpen(true);
    }
  };

  const handleConfirmBan = async () => {
    if (!selectedUser) return;
    try {
      const payload = banDuration !== "0" ? { durationHours: parseInt(banDuration) } : {};
      const res = await axiosInstance.post(`/api/admin/users/${selectedUser.id}/ban`, payload);
      if (res.status === 200) setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, isBanned: res.data.isBanned } : u));
      setBanModalOpen(false); setSelectedUser(null);
    } catch { toast.error("Failed to ban user"); }
  };

  const handleMuteClick = async (user: UserItem) => {
    if (user.isMuted) {
      try {
        const res = await axiosInstance.post(`/api/admin/users/${user.id}/mute`);
        if (res.status === 200) setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isMuted: res.data.isMuted } : u));
      } catch { toast.error("Failed to unmute user"); }
    } else {
      setSelectedUser(user); setMuteDuration("0"); setMuteModalOpen(true);
    }
  };

  const handleConfirmMute = async () => {
    if (!selectedUser) return;
    try {
      const payload = muteDuration !== "0" ? { durationHours: parseInt(muteDuration) } : {};
      const res = await axiosInstance.post(`/api/admin/users/${selectedUser.id}/mute`, payload);
      if (res.status === 200) setUsers((prev) => prev.map((u) => u.id === selectedUser.id ? { ...u, isMuted: res.data.isMuted } : u));
      setMuteModalOpen(false); setSelectedUser(null);
    } catch { toast.error("Failed to mute user"); }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      const res = await axiosInstance.delete(`/api/admin/users/${selectedUser.id}`);
      if (res.status === 200) { setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id)); setTotalUsers((prev) => prev - 1); }
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
        : "";
      toast.error(errorMsg || "Failed to delete user");
    }
  };

  const columns = [
    {
      key: "name",
      label: "User",
      sortable: true,
      render: (row: UserItem) => (
        <div className="flex items-center gap-3">
          <Link href={`/admin/users/${row.id}`} className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/8 bg-white/4 hover:border-[#f97316]/40 shrink-0 block transition-all">
            {row.avatar ? (
              <img src={row.avatar} alt={row.name} className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${row.username || row.name}`; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white uppercase">{row.name.substring(0, 2)}</div>
            )}
          </Link>
          <div className="min-w-0">
            <Link href={`/admin/users/${row.id}`} className="text-xs font-semibold text-white/90 block truncate hover:text-[#f97316] transition-colors">
              {row.name}
            </Link>
            <span className="text-[10px] text-white/30 block">@{row.username}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row: UserItem) => (
        <span className="text-[11px] text-white/50 font-medium">{row.email}</span>
      ),
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (row: UserItem) => <AdminBadge type={row.role} />,
    },
    {
      key: "karma",
      label: "Karma",
      sortable: true,
      render: (row: UserItem) => (
        <span className="text-xs font-bold text-[#f97316] tabular-nums">{row.karma.toLocaleString()}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: UserItem) => (
        <div className="flex flex-col gap-1 items-start">
          <AdminBadge type={row.isBanned ? "banned" : "active"} />
          {row.isMuted && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              Muted
            </span>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "Joined",
      sortable: true,
      render: (row: UserItem) => (
        <span className="text-[10px] text-white/30 font-medium">{new Date(row.createdAt).toLocaleDateString()}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: UserItem) => (
        <div className="flex items-center gap-1.5">
          {/* Inspect */}
          <Link
            href={`/admin/users/${row.id}`}
            title="Inspect User"
            className="w-7 h-7 rounded-lg bg-white/4 border border-white/8 text-white/40 hover:text-[#14b8a6] hover:border-[#14b8a6]/30 hover:bg-[#14b8a6]/6 flex items-center justify-center transition-all"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </Link>

          {/* Ban/Unban */}
          <button
            onClick={() => handleBanClick(row)}
            title={row.isBanned ? "Unban User" : "Ban User"}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer
              ${row.isBanned
                ? "bg-green-500/6 border-green-500/20 text-green-400 hover:bg-green-500/12"
                : "bg-orange-500/6 border-orange-500/20 text-orange-400 hover:bg-orange-500/12"
              }
            `}
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

          {/* Mute/Unmute */}
          <button
            onClick={() => handleMuteClick(row)}
            title={row.isMuted ? "Unmute User" : "Mute User"}
            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all cursor-pointer
              ${row.isMuted
                ? "bg-green-500/6 border-green-500/20 text-green-400 hover:bg-green-500/12"
                : "bg-white/4 border-white/8 text-white/40 hover:text-orange-400 hover:border-orange-500/20 hover:bg-orange-500/6"
              }
            `}
          >
            {row.isMuted ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => { setSelectedUser(row); setDeleteModalOpen(true); }}
            title="Delete User"
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

  const roleFilters = [
    { label: "All Roles", value: "" },
    { label: "Members", value: "member" },
    { label: "Moderators", value: "moderator" },
    { label: "Admins", value: "admin" },
  ];

  const statusFilters = [
    { label: "All", value: "" },
    { label: "Active", value: "false" },
    { label: "Banned", value: "true" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">User Management</h1>
          <p className="text-[11px] text-white/30 mt-1">
            <span className="font-semibold text-white/50">{totalUsers.toLocaleString()}</span> registered accounts
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-white/7 bg-[#111318] p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/4 border border-white/8 rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#f97316]/40 focus:bg-white/6 transition-all"
          />
        </div>

        {/* Pill tab filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider mr-1">Role:</span>
            {roleFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setRole(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer
                  ${role === f.value
                    ? "bg-[#f97316] text-white shadow-sm shadow-[#f97316]/20"
                    : "bg-white/4 text-white/40 hover:text-white/70 hover:bg-white/7"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-bold text-white/25 uppercase tracking-wider mr-1">Status:</span>
            {statusFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => { setBanned(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer
                  ${banned === f.value
                    ? "bg-[#f97316] text-white shadow-sm shadow-[#f97316]/20"
                    : "bg-white/4 text-white/40 hover:text-white/70 hover:bg-white/7"
                  }
                `}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        sortKey={sort}
        sortOrder={order}
        onSort={handleSort}
        pagination={{ page, limit: 15, total: totalUsers, totalPages }}
        onPageChange={setPage}
        emptyMessage="No users found matching your criteria"
      />

      {/* Ban Modal */}
      {banModalOpen && selectedUser && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#111318] p-6 shadow-2xl overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Ban User</h3>
                <p className="text-[10px] text-white/30">@{selectedUser.username}</p>
              </div>
            </div>
            <div className="space-y-1.5 mb-5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Duration</label>
              <select
                value={banDuration}
                onChange={(e) => setBanDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/8 rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#f97316]/40 transition-all"
              >
                <option value="0">Permanent Ban</option>
                <option value="1">1 Hour</option>
                <option value="24">1 Day</option>
                <option value="168">1 Week</option>
                <option value="720">30 Days</option>
              </select>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { setBanModalOpen(false); setSelectedUser(null); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:bg-white/6 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBan}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Confirm Ban
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mute Modal */}
      {muteModalOpen && selectedUser && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-white/8 bg-[#111318] p-6 shadow-2xl overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Mute User</h3>
                <p className="text-[10px] text-white/30">@{selectedUser.username}</p>
              </div>
            </div>
            <div className="space-y-1.5 mb-5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Duration</label>
              <select
                value={muteDuration}
                onChange={(e) => setMuteDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/4 border border-white/8 rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#f97316]/40 transition-all"
              >
                <option value="0">Permanent Mute</option>
                <option value="1">1 Hour</option>
                <option value="24">1 Day</option>
                <option value="168">1 Week</option>
                <option value="720">30 Days</option>
              </select>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => { setMuteModalOpen(false); setSelectedUser(null); }}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white/50 hover:bg-white/6 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMute}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-orange-500/20"
              >
                Confirm Mute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for ${selectedUser?.name} (@${selectedUser?.username})? This will hard-delete their posts, comments, messages, and is completely IRREVERSIBLE.`}
        confirmText="Hard Delete Account"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteModalOpen(false); setSelectedUser(null); }}
        isDanger={true}
      />
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5 animate-pulse">
        <div className="h-14 bg-white/4 rounded-2xl w-1/3" />
        <div className="h-32 bg-white/4 rounded-2xl" />
        <div className="h-96 bg-white/4 rounded-2xl" />
      </div>
    }>
      <UserManagementPageContent />
    </Suspense>
  );
}
