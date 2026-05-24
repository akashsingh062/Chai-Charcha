/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/store/useToastStore";

interface UserDetail {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  banner: string;
  bio: string;
  role: string;
  karma: number;
  isBanned: boolean;
  bannedAt: string;
  banExpiresAt?: string | null;
  isMuted?: boolean;
  mutedAt?: string | null;
  muteExpiresAt?: string | null;
  followersCount: number;
  followingCount: number;
  communitiesCount: number;
  postsCount: number;
  commentsCount: number;
  createdAt: string;
}

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white/2 border border-white/6 hover:border-white/12 hover:bg-white/4 transition-all duration-300 overflow-hidden">
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

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/1 px-1 rounded-lg transition-colors">
      <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-semibold text-white/80 ${mono ? "font-mono text-[11px] text-white/50 bg-white/4 px-2 py-0.5 rounded" : ""}`}>
        {value}
      </span>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userData: loggedInUser } = useAuth();
  const userId = params.id as string;

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [karma, setKarma] = useState(0);
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [banDuration, setBanDuration] = useState("0");
  const [muteDuration, setMuteDuration] = useState("0");
  const [activeTab, setActiveTab] = useState<"overview" | "edit" | "danger">("overview");

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/admin/users/${userId}`);
      const userData = res.data.user;
      setUser(userData);
      setName(userData.name);
      setUsername(userData.username);
      setEmail(userData.email);
      setRole(userData.role);
      setKarma(userData.karma);
      setBio(userData.bio);
      setAvatar(userData.avatar || "");
      setBanner(userData.banner || "");
    } catch (err: unknown) {
      console.error("Failed to load user details", err);
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
        : "";
      setError(errorMsg || "Failed to load user details");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchUserDetails();
    }
  }, [userId, fetchUserDetails]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess(""); setSaving(true);
    try {
      await axiosInstance.put(`/api/admin/users/${userId}`, {
        name, username, email, role, karma, bio,
        avatar: avatar || undefined,
        banner: banner || undefined,
      });
      setSuccess("User updated successfully");
      toast.success("User profile saved");
      fetchUserDetails();
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string) : "";
      setError(errorMsg || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleBanToggle = async () => {
    try {
      const payload = !user?.isBanned && banDuration !== "0" ? { durationHours: parseInt(banDuration) } : {};
      const res = await axiosInstance.post(`/api/admin/users/${userId}/ban`, payload);
      if (res.status === 200) {
        setUser((prev) => (prev ? { ...prev, isBanned: res.data.isBanned } : null));
        setSuccess(`User ${res.data.isBanned ? "banned" : "unbanned"} successfully`);
        fetchUserDetails();
      }
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string) : "";
      setError(errorMsg || "Failed to toggle ban status");
    }
  };

  const handleMuteToggle = async () => {
    try {
      const payload = !user?.isMuted && muteDuration !== "0" ? { durationHours: parseInt(muteDuration) } : {};
      const res = await axiosInstance.post(`/api/admin/users/${userId}/mute`, payload);
      if (res.status === 200) {
        setUser((prev) => (prev ? { ...prev, isMuted: res.data.isMuted } : null));
        setSuccess(`Comment access ${res.data.isMuted ? "blocked" : "restored"}`);
        fetchUserDetails();
      }
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string) : "";
      setError(errorMsg || "Failed to toggle mute status");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await axiosInstance.delete(`/api/admin/users/${userId}`);
      if (res.status === 200) router.push("/admin/users");
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string) : "";
      setError(errorMsg || "Failed to delete user");
    }
  };

  const isSelf = loggedInUser?.id === userId;
  const isAdmin = loggedInUser?.role === "admin";
  const targetIsModOrAdmin = user?.role === "admin" || user?.role === "moderator";
  const disableSanctions = isSelf || (!isAdmin && targetIsModOrAdmin);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-white/4 rounded-xl w-1/4" />
        <div className="h-44 bg-white/4 rounded-3xl" />
        <div className="h-10 bg-white/4 rounded-xl w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-white/4 rounded-3xl" />
          <div className="lg:col-span-2 h-72 bg-white/4 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-4 max-w-md mx-auto mt-12">
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 text-sm font-semibold">{error}</p>
        </div>
        <Link href="/admin/users" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/4 border border-white/8 text-xs font-bold text-white hover:bg-white/8 transition-all">
          ← Back to Users
        </Link>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )},
    { id: "edit" as const, label: "Edit Profile", icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )},
    { id: "danger" as const, label: "Danger Zone", icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    )},
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link href="/admin/users" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stormy-teal hover:text-[#2dd4bf] uppercase tracking-wider transition-colors mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Users
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight bg-linear-to-r from-white to-white/70 bg-clip-text text-transparent">{user.name}</h1>
            <div className="flex items-center gap-2">
              <AdminBadge type={user.isBanned ? "banned" : user.role} />
              
              {isAdmin && !isSelf && user.role !== "admin" && (
                <button
                  onClick={async () => {
                    const newRole = user.role === "moderator" ? "member" : "moderator";
                    try {
                      await axiosInstance.put(`/api/admin/users/${user.id}`, { role: newRole });
                      toast.success(`User role updated to ${newRole}`);
                      fetchUserDetails();
                    } catch (err: unknown) {
                      toast.error("Failed to update user role");
                    }
                  }}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider cursor-pointer transition-colors
                    ${user.role === "moderator" 
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20" 
                      : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
                    }
                  `}
                >
                  {user.role === "moderator" ? "Demote Mod" : "Appoint Mod"}
                </button>
              )}

              {user.isMuted && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                  Muted
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-white/40 font-medium">@{user.username} · <span className="text-white/30">{user.email}</span></p>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl border border-white/6 bg-[#111318] overflow-hidden shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-28 bg-linear-to-r from-orange-500/20 via-stormy-teal/10 to-indigo-500/20 pointer-events-none blur-xl opacity-80" />
        
        {/* Banner */}
        <div className="relative h-28 bg-[#161a22] overflow-hidden">
          {user.banner ? (
            <img src={user.banner} alt="banner" className="w-full h-full object-cover opacity-40 hover:opacity-50 transition-opacity duration-500" />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-[#f97316]/10 to-[#14b8a6]/10" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#111318] via-transparent to-black/20" />
        </div>

        {/* User Card Content */}
        <div className="px-6 pb-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-10 mb-6">
            <div className="flex items-end gap-4 flex-wrap md:flex-nowrap">
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-linear-to-tr from-[#f97316] to-[#14b8a6] opacity-30 blur group-hover:opacity-75 transition duration-500" />
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#111318] bg-[#161a22] shadow-2xl">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${user.username}`; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white uppercase bg-linear-to-br from-[#f97316] to-[#ea6a05]">
                      {user.name.substring(0, 2)}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-1 space-y-1">
                <h2 className="text-lg font-black text-white leading-none">{user.name}</h2>
                <p className="text-xs text-white/50 font-medium">@{user.username}</p>
              </div>
            </div>
          </div>

          {/* Stats Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <StatCard label="Karma" value={user.karma} color="text-[#f97316]" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            } />
            <StatCard label="Posts" value={user.postsCount} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 01-2-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            } />
            <StatCard label="Comments" value={user.commentsCount} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            } />
            <StatCard label="Communities" value={user.communitiesCount} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            } />
            <StatCard label="Followers" value={user.followersCount} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            } />
            <StatCard label="Following" value={user.followingCount} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            } />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#111318] border border-white/6 rounded-2xl w-fit shadow-lg">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 cursor-pointer
                ${isActive
                  ? tab.id === "danger"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30 shadow-md shadow-red-500/5"
                    : "bg-[#f97316] text-white shadow-lg shadow-[#f97316]/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/3"
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-green-500/4 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold animate-slide-in-right">
          <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          </div>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/4 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-slide-in-right">
          <div className="w-5 h-5 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          {error}
        </div>
      )}

      {/* ── OVERVIEW TAB ─────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-white/6 bg-[#111318] p-6 shadow-xl space-y-2 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-stormy-teal/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1.5 h-3 bg-stormy-teal rounded-full" />
              <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-widest">Account Information</h3>
            </div>
            <InfoRow label="User ID" value={user.id} mono />
            <InfoRow label="Display Name" value={user.name} />
            <InfoRow label="Username" value={`@${user.username}`} />
            <InfoRow label="Email Address" value={user.email} />
            <InfoRow label="Account Role" value={<AdminBadge type={user.role} />} />
            <InfoRow label="Joined Date" value={new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          </div>

          <div className="space-y-6">
            {/* Status Panel */}
            <div className="rounded-3xl border border-white/6 bg-[#111318] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-3 bg-[#f97316] rounded-full" />
                <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-widest">System Status</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/8 transition-all">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Ban Status</span>
                    {user.isBanned ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-400 font-semibold">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                        </span>
                        Restricted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                        <span className="relative flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <AdminBadge type={user.isBanned ? "banned" : "active"} />
                    {user.isBanned && user.banExpiresAt && (
                      <p className="text-[9px] text-white/30 mt-1">Expires: {new Date(user.banExpiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-white/8 transition-all">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Comment Access</span>
                    {user.isMuted ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-orange-400 font-semibold">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                        </span>
                        Muted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-green-400 font-semibold">
                        <span className="relative flex h-2 w-2">
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Allowed
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider
                      ${user.isMuted
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        : "bg-green-500/10 text-green-400 border-green-500/20"
                      }`}
                    >
                      {user.isMuted ? "Muted" : "Active"}
                    </span>
                    {user.isMuted && user.muteExpiresAt && (
                      <p className="text-[9px] text-white/30 mt-1">Expires: {new Date(user.muteExpiresAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Card */}
            {user.bio && (
              <div className="rounded-3xl border border-white/6 bg-[#111318] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                  <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-widest">Biography</h3>
                </div>
                <p className="text-xs text-white/60 leading-relaxed italic bg-white/1 p-3 border border-white/4 rounded-2xl">
                  &ldquo;{user.bio}&rdquo;
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT TAB ─────────────────────────────────────── */}
      {activeTab === "edit" && (
        <form onSubmit={handleUpdate} className="rounded-3xl border border-white/6 bg-[#111318] p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#f97316]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3 bg-[#f97316] rounded-full" />
            <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-widest">Edit User Profile Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { label: "Display Name", value: name, setter: setName, type: "text", placeholder: "Enter name..." },
              { label: "Username", value: username, setter: setUsername, type: "text", placeholder: "Enter username..." },
              { label: "Email Address", value: email, setter: setEmail, type: "email", placeholder: "Enter email..." },
              { label: "Karma Points", value: karma, setter: (v: string) => setKarma(Number(v)), type: "number", placeholder: "Enter karma..." },
            ].map((field) => (
              <div key={field.label} className="space-y-1.5">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  placeholder={field.placeholder}
                  onChange={(e) => (field.setter as (v: string) => void)(e.target.value)}
                  className="w-full px-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 focus:bg-white/4 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
                />
              </div>
            ))}
          </div>

          {/* Role selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={!isAdmin}
              className="w-full px-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="member">Member (Standard User)</option>
              <option value="moderator">Moderator (Community Admin)</option>
              <option value="admin">Administrator (Full Access)</option>
            </select>
          </div>

          {/* Bio text area */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Short Biography</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us about this user..."
              className="w-full px-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200 resize-none"
            />
          </div>

          {/* Asset URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Avatar Image URL</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Banner Background URL</label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-white/2 border border-white/8 hover:border-white/15 focus:border-[#f97316]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/6">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f97316] hover:bg-[#ea6a05] text-white text-xs font-bold shadow-lg shadow-[#f97316]/20 hover:shadow-[#f97316]/30 transition-all duration-300 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving changes...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2v-3M9 9L15 3m0 0l-3 3m3-3v8" />
                  </svg>
                  Save Profile changes
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── DANGER ZONE TAB ────────────────────────────────── */}
      {activeTab === "danger" && (
        <div className="space-y-6">
          {isSelf && (
            <div className="flex items-center gap-3 p-4 bg-orange-500/4 border border-orange-500/20 rounded-2xl text-orange-400 text-xs font-bold">
              <svg className="w-5 h-5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Safety Warning: You cannot restrict, mute, or delete your own active account.
            </div>
          )}
          
          {!isSelf && disableSanctions && (
            <div className="flex items-center gap-3 p-4 bg-orange-500/4 border border-orange-500/20 rounded-2xl text-orange-400 text-xs font-bold">
              <svg className="w-5 h-5 text-orange-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Permission Denied: Moderators cannot sanction administrators or other moderators.
            </div>
          )}

          {/* Ban User */}
          <div className="rounded-3xl border border-white/6 bg-[#111318] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Temporary / Permanent Ban</h4>
                  {user.isBanned && <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">Restricted</span>}
                </div>
                <p className="text-xs text-white/40 leading-relaxed max-w-lg">
                  {user.isBanned
                    ? user.banExpiresAt
                      ? `This user is currently temporarily banned. Restriction will expire: ${new Date(user.banExpiresAt).toLocaleString()}`
                      : "Permanent ban active. The user is locked out from the platform completely."
                    : "Restrict the user from logging in and accessing all platform activities. You can specify duration parameters below."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {!user.isBanned && (
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="px-3.5 py-2 bg-white/2 border border-white/8 hover:border-white/15 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
                  >
                    <option value="0">Permanent</option>
                    <option value="1">1 Hour</option>
                    <option value="24">1 Day</option>
                    <option value="168">1 Week</option>
                    <option value="720">30 Days</option>
                  </select>
                )}
                <button
                  onClick={handleBanToggle}
                  disabled={disableSanctions}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer disabled:opacity-40
                    ${user.isBanned
                      ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                      : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                    }
                  `}
                >
                  {user.isBanned ? "Lift Ban Restriction" : "Execute Ban"}
                </button>
              </div>
            </div>
          </div>

          {/* Mute User */}
          <div className="rounded-3xl border border-white/6 bg-[#111318] p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Comment Access Suspension (Mute)</h4>
                  {user.isMuted && <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">Suspended</span>}
                </div>
                <p className="text-xs text-white/40 leading-relaxed max-w-lg">
                  {user.isMuted
                    ? user.muteExpiresAt
                      ? `The user's write access is temporarily suspended. Re-enables: ${new Date(user.muteExpiresAt).toLocaleString()}`
                      : "Write access suspended indefinitely. The user cannot post comment threads."
                    : "Prevent this user from posting new comments or replies across any community board."}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                {!user.isMuted && (
                  <select
                    value={muteDuration}
                    onChange={(e) => setMuteDuration(e.target.value)}
                    className="px-3.5 py-2 bg-white/2 border border-white/8 hover:border-white/15 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
                  >
                    <option value="0">Permanent</option>
                    <option value="1">1 Hour</option>
                    <option value="24">1 Day</option>
                    <option value="168">1 Week</option>
                    <option value="720">30 Days</option>
                  </select>
                )}
                <button
                  onClick={handleMuteToggle}
                  disabled={disableSanctions}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-all duration-300 cursor-pointer disabled:opacity-40
                    ${user.isMuted
                      ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
                      : "bg-orange-500/10 border-orange-500/20 text-orange-400 hover:bg-orange-500/20"
                    }
                  `}
                >
                  {user.isMuted ? "Restore Write Access" : "Mute Comments"}
                </button>
              </div>
            </div>
          </div>

          {/* Hard Delete User */}
          {isAdmin && (
            <div className="rounded-3xl border border-red-500/20 bg-red-500/2 p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-red-400">Permanently Erase Profile</h4>
                  <p className="text-xs text-white/40 leading-relaxed max-w-lg">
                    Permanently delete this user, deleting all their posts, messages, and comments from the server. This is a destructive operation and is **completely irreversible**.
                  </p>
                </div>

                <button
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={isSelf}
                  className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-xs font-bold transition-all duration-300 cursor-pointer disabled:opacity-40 shrink-0 self-end sm:self-center"
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Permanently Delete User Profile"
        message={`Are you sure you want to completely delete the profile for ${user.name} (@${user.username})? This will wipe their posts, comments, messages, and followers and is IRREVERSIBLE.`}
        confirmText="Confirm Hard Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  );
}
