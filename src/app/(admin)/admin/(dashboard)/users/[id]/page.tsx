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

function StatPill({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <span className={`text-lg font-black tabular-nums leading-none ${color || "text-white"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.1em] mt-1">{label}</span>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-white/[0.05] last:border-0">
      <span className="text-[10px] font-medium text-white/30 shrink-0">{label}</span>
      <span className={`text-[11px] font-semibold text-white/80 text-right ${mono ? "font-mono text-[10px] text-white/50" : ""}`}>
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

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 bg-white/[0.04] rounded-xl w-1/3" />
        <div className="h-40 bg-white/[0.04] rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="h-64 bg-white/[0.04] rounded-2xl" />
          <div className="lg:col-span-2 h-64 bg-white/[0.04] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-center text-red-400 text-sm">{error}</div>
        <Link href="/admin/users" className="text-xs font-semibold text-[#f97316] hover:text-[#fb923c] block text-center transition-colors">
          ← Back to Users
        </Link>
      </div>
    );
  }

  if (!user) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "edit" as const, label: "Edit Profile" },
    { id: "danger" as const, label: "Danger Zone" },
  ];

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/users" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#14b8a6] hover:text-[#2dd4bf] transition-colors mb-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Users
          </Link>
          <h1 className="text-xl font-black text-white tracking-tight">{user.name}</h1>
          <p className="text-[11px] text-white/30 mt-0.5">@{user.username} · {user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <AdminBadge type={user.isBanned ? "banned" : user.role} />
          {user.isMuted && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              Muted
            </span>
          )}
        </div>
      </div>

      {/* Hero card */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-[#111318] overflow-hidden">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-[#f97316]/10 via-[#14b8a6]/5 to-[#a78bfa]/10">
          {user.banner && (
            <img src={user.banner} alt="banner" className="w-full h-full object-cover opacity-30" />
          )}
        </div>
        {/* Avatar + name */}
        <div className="px-5 pb-5">
          <div className="relative -mt-10 mb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#111318] bg-white/[0.06] shadow-lg">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://avatar.iran.liara.run/public/boy?username=${user.username}`; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-black text-white uppercase">
                  {user.name.substring(0, 2)}
                </div>
              )}
            </div>
          </div>

          {/* Stat pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <StatPill label="Karma" value={user.karma} color="text-[#f97316]" />
            <StatPill label="Posts" value={user.postsCount} />
            <StatPill label="Comments" value={user.commentsCount} />
            <StatPill label="Communities" value={user.communitiesCount} />
            <StatPill label="Followers" value={user.followersCount} />
            <StatPill label="Following" value={user.followingCount} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-white/[0.03] rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer
              ${activeTab === tab.id
                ? tab.id === "danger"
                  ? "bg-red-500 text-white shadow-sm"
                  : "bg-[#f97316] text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Status messages */}
      {success && (
        <div className="flex items-center gap-2 p-3.5 bg-green-500/[0.06] border border-green-500/20 rounded-xl text-green-400 text-xs font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3.5 bg-red-500/[0.06] border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {/* ── OVERVIEW TAB ─────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5 space-y-1">
            <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-3">Account Info</h3>
            <InfoRow label="User ID" value={user.id} mono />
            <InfoRow label="Display Name" value={user.name} />
            <InfoRow label="Username" value={`@${user.username}`} />
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Role" value={<AdminBadge type={user.role} />} />
            <InfoRow label="Joined" value={new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} />
          </div>

          <div className="space-y-5">
            {/* Status */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-3">Status</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-xs text-white/60">Ban Status</span>
                  {user.isBanned ? (
                    <div className="text-right">
                      <AdminBadge type="banned" />
                      {user.banExpiresAt && (
                        <p className="text-[9px] text-white/30 mt-1">Expires: {new Date(user.banExpiresAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <AdminBadge type="active" />
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="text-xs text-white/60">Comment Access</span>
                  {user.isMuted ? (
                    <div className="text-right">
                      <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Muted</span>
                      {user.muteExpiresAt && (
                        <p className="text-[9px] text-white/30 mt-1">Expires: {new Date(user.muteExpiresAt).toLocaleString()}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Active</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-2">Bio</h3>
                <p className="text-xs text-white/60 leading-relaxed italic">&ldquo;{user.bio}&rdquo;</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT TAB ─────────────────────────────────────── */}
      {activeTab === "edit" && (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5 space-y-4">
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em]">Edit User Profile</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Display Name", value: name, setter: setName, type: "text" },
              { label: "Username", value: username, setter: setUsername, type: "text" },
              { label: "Email", value: email, setter: setEmail, type: "email" },
              { label: "Karma", value: karma, setter: (v: string) => setKarma(Number(v)), type: "number" },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => (field.setter as (v: string) => void)(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#f97316]/40 transition-all"
                />
              </div>
            ))}
          </div>

          {/* Role */}
          <div>
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/70 focus:outline-none focus:border-[#f97316]/40 transition-all"
            >
              <option value="member">Member</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Bio */}
          <div>
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/70 focus:outline-none focus:border-[#f97316]/40 transition-all resize-none"
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Avatar URL</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#f97316]/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Banner URL</label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#f97316]/40 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/[0.06]">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-[#ea6a05] text-white text-xs font-bold shadow-lg shadow-[#f97316]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      {/* ── DANGER TAB ───────────────────────────────────── */}
      {activeTab === "danger" && (
        <div className="space-y-4">
          {isSelf && (
            <div className="flex items-center gap-2.5 p-3.5 bg-orange-500/[0.06] border border-orange-500/20 rounded-xl text-orange-400 text-xs font-semibold">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              You cannot ban or delete your own active admin account.
            </div>
          )}

          {/* Ban */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">Ban Account</h4>
                  {user.isBanned && <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full uppercase">Currently Banned</span>}
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  {user.isBanned
                    ? user.banExpiresAt
                      ? `Temporary ban active. Expires: ${new Date(user.banExpiresAt).toLocaleString()}`
                      : "Permanent ban active. User cannot log in."
                    : "Lock this user out from all sessions and community activity."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!user.isBanned && (
                  <select
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    className="px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[11px] text-white/60 focus:outline-none transition-all"
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
                  disabled={isSelf}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-40
                    ${user.isBanned
                      ? "bg-green-500/[0.08] border-green-500/20 text-green-400 hover:bg-green-500/[0.15]"
                      : "bg-orange-500/[0.08] border-orange-500/20 text-orange-400 hover:bg-orange-500/[0.15]"
                    }
                  `}
                >
                  {user.isBanned ? "Unban" : "Ban Account"}
                </button>
              </div>
            </div>
          </div>

          {/* Mute */}
          <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-bold text-white">Comment Block (Mute)</h4>
                  {user.isMuted && <span className="text-[9px] font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full uppercase">Currently Muted</span>}
                </div>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  {user.isMuted
                    ? user.muteExpiresAt
                      ? `Temporary block active. Expires: ${new Date(user.muteExpiresAt).toLocaleString()}`
                      : "Permanent comment block active."
                    : "Block this user from writing new comments and replies across the platform."}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!user.isMuted && (
                  <select
                    value={muteDuration}
                    onChange={(e) => setMuteDuration(e.target.value)}
                    className="px-2.5 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[11px] text-white/60 focus:outline-none transition-all"
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
                  disabled={isSelf}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-40
                    ${user.isMuted
                      ? "bg-green-500/[0.08] border-green-500/20 text-green-400 hover:bg-green-500/[0.15]"
                      : "bg-orange-500/[0.08] border-orange-500/20 text-orange-400 hover:bg-orange-500/[0.15]"
                    }
                  `}
                >
                  {user.isMuted ? "Restore Access" : "Mute User"}
                </button>
              </div>
            </div>
          </div>

          {/* Delete */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-red-400 mb-1">Delete Account</h4>
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Permanently erase this user along with all their posts, comments, and messages. Completely irreversible.
                </p>
              </div>
              <button
                onClick={() => setDeleteModalOpen(true)}
                disabled={isSelf}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer disabled:opacity-40 shrink-0"
              >
                Delete Account
              </button>
            </div>
          </div>
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
