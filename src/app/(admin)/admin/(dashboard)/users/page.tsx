"use client";

import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { DataTable } from "@/components/admin/DataTable";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import Image from "next/image";

interface UserItem {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  role: string;
  karma: number;
  isBanned: boolean;
  createdAt: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [role, setRole] = useState("");
  const [banned, setBanned] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/users", {
        params: {
          page,
          limit: 15,
          search: debouncedSearch,
          role,
          banned: banned || undefined,
          sort,
          order,
        },
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

  const handleBanToggle = async (user: UserItem) => {
    try {
      const res = await axiosInstance.post(`/api/admin/users/${user.id}/ban`);
      if (res.status === 200) {
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isBanned: res.data.isBanned } : u))
        );
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      alert(errorMsg || "Failed to update ban status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    try {
      const res = await axiosInstance.delete(`/api/admin/users/${selectedUser.id}`);
      if (res.status === 200) {
        setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
        setTotalUsers((prev) => prev - 1);
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      alert(errorMsg || "Failed to delete user");
    }
  };

  const columns = [
    {
      key: "name",
      label: "User info",
      sortable: true,
      render: (row: UserItem) => (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-stormy-teal/20 bg-stormy-teal/10 shrink-0">
            {row.avatar ? (
              <Image src={row.avatar} alt={row.name} fill sizes="32px" className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xs font-black uppercase">
                {row.name.substring(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-floral-white block truncate">{row.name}</span>
            <span className="text-3xs text-dust-grey/60 block truncate">@{row.username}</span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
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
        <span className="font-extrabold text-vivid-tangerine">{row.karma} pts</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: UserItem) => (
        <AdminBadge type={row.isBanned ? "banned" : "active"} />
      ),
    },
    {
      key: "createdAt",
      label: "Joined Date",
      sortable: true,
      render: (row: UserItem) => (
        <span className="text-2xs font-semibold text-dust-grey/80">
          {new Date(row.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: UserItem) => (
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/users/${row.id}`}
            className="px-2.5 py-1 rounded bg-stormy-teal/10 hover:bg-stormy-teal/20 text-stormy-teal border border-stormy-teal/20 text-3xs font-bold uppercase transition-all"
          >
            Edit
          </Link>
          <button
            onClick={() => handleBanToggle(row)}
            className={`px-2.5 py-1 rounded text-3xs font-bold uppercase transition-all border ${
              row.isBanned
                ? "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/20"
                : "bg-orange/10 hover:bg-orange/20 text-orange border-orange/20"
            }`}
          >
            {row.isBanned ? "Unban" : "Ban"}
          </button>
          <button
            onClick={() => {
              setSelectedUser(row);
              setDeleteModalOpen(true);
            }}
            className="px-2.5 py-1 rounded bg-spicy-paprika/10 hover:bg-spicy-paprika/20 text-spicy-paprika border border-spicy-paprika/20 text-3xs font-bold uppercase transition-all"
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-floral-white tracking-tight uppercase">
            User Management
          </h1>
          <p className="text-xs text-dust-grey font-bold uppercase tracking-wider mt-1">
            Registered forum users ({totalUsers} total)
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border border-stormy-teal/10 bg-ink-black/30 rounded-2xl">
        <div className="sm:col-span-2">
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Search Users
          </label>
          <input
            type="text"
            placeholder="Search by name, email, or username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
          />
        </div>

        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Role
          </label>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
          >
            <option value="">All Roles</option>
            <option value="member">Members</option>
            <option value="moderator">Moderators</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div>
          <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1.5">
            Filter by Status
          </label>
          <select
            value={banned}
            onChange={(e) => {
              setBanned(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
          >
            <option value="">All Statuses</option>
            <option value="false">Active Only</option>
            <option value="true">Banned Only</option>
          </select>
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
        emptyMessage="No users found matching search criteria"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Delete User Account"
        message={`Are you sure you want to permanently delete the account for ${selectedUser?.name} (@${selectedUser?.username})? This will hard-delete their posts, comments, messages, and is completely IRREVERSIBLE.`}
        confirmText="Hard Delete Account"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteModalOpen(false);
          setSelectedUser(null);
        }}
        isDanger={true}
      />
    </div>
  );
}
