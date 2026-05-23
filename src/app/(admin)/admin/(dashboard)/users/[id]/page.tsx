"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";

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

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/admin/users/${userId}`);
      const userData = res.data.user;
      setUser(userData);

      // Populate form
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
      const errorMsg =
        err && typeof err === "object" && "response" in err
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
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await axiosInstance.put(`/api/admin/users/${userId}`, {
        name,
        username,
        email,
        role,
        karma,
        bio,
        avatar: avatar || undefined,
        banner: banner || undefined,
      });
      setSuccess("User updated successfully");
      fetchUserDetails();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      setError(errorMsg || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const handleBanToggle = async () => {
    try {
      const payload = !user?.isBanned && banDuration !== "0"
        ? { durationHours: parseInt(banDuration) }
        : {};
      const res = await axiosInstance.post(`/api/admin/users/${userId}/ban`, payload);
      if (res.status === 200) {
        setUser((prev) => (prev ? { ...prev, isBanned: res.data.isBanned } : null));
        setSuccess(`User successfully ${res.data.isBanned ? "banned" : "unbanned"}`);
        fetchUserDetails();
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      setError(errorMsg || "Failed to toggle ban status");
    }
  };

  const handleMuteToggle = async () => {
    try {
      const payload = !user?.isMuted && muteDuration !== "0"
        ? { durationHours: parseInt(muteDuration) }
        : {};
      const res = await axiosInstance.post(`/api/admin/users/${userId}/mute`, payload);
      if (res.status === 200) {
        setUser((prev) => (prev ? { ...prev, isMuted: res.data.isMuted } : null));
        setSuccess(`User comment access successfully ${res.data.isMuted ? "blocked" : "restored"}`);
        fetchUserDetails();
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      setError(errorMsg || "Failed to toggle comment block status");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await axiosInstance.delete(`/api/admin/users/${userId}`);
      if (res.status === 200) {
        router.push("/admin/users");
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      setError(errorMsg || "Failed to delete user");
    }
  };

  const isSelf = loggedInUser?.id === userId;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-stormy-teal/10 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-96 bg-stormy-teal/10 rounded-2xl"></div>
          <div className="lg:col-span-2 h-96 bg-stormy-teal/10 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl text-center text-red-200">
          {error}
        </div>
        <Link href="/admin/users" className="text-xs font-bold text-vivid-tangerine uppercase hover:underline block text-center">
          ← Back to User List
        </Link>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/users" className="text-2xs font-extrabold uppercase text-stormy-teal hover:underline tracking-wider block mb-1">
            ← Back to User List
          </Link>
          <h1 className="text-2xl font-black text-floral-white tracking-tight uppercase">
            User details: {user.name}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <AdminBadge type={user.isBanned ? "banned" : user.role} />
          {user.isMuted && (
            <span className="px-2 py-0.5 rounded text-3xs font-extrabold bg-orange/15 text-orange border border-orange/20 uppercase tracking-widest">
              Muted
            </span>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Summary & Stats */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs text-center space-y-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-stormy-teal/20 bg-stormy-teal/10 mx-auto">
              {user.avatar ? (
                <Image src={user.avatar} alt={user.name} fill sizes="96px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-black uppercase">
                  {user.name.substring(0, 2)}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-floral-white">{user.name}</h3>
              <span className="text-3xs text-dust-grey/60 uppercase tracking-widest mt-0.5 block">
                @{user.username}
              </span>
            </div>

            {user.bio && (
              <p className="text-xs text-dust-grey italic leading-relaxed px-2">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}

            <div className="border-t border-stormy-teal/10 pt-4 text-left space-y-2 text-2xs font-semibold text-dust-grey/80">
              <div className="flex justify-between">
                <span>User ID:</span>
                <span className="font-mono text-floral-white">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Email:</span>
                <span className="text-floral-white">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span>Joined:</span>
                <span className="text-floral-white">{new Date(user.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stormy-teal border-b border-stormy-teal/10 pb-2">
              Platform Activity
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-white/5 border border-stormy-teal/10 rounded-xl">
                <span className="text-2xs font-extrabold text-vivid-tangerine block">{user.karma}</span>
                <span className="text-3xs font-extrabold text-dust-grey/60 uppercase tracking-widest mt-1 block">Karma</span>
              </div>
              <div className="p-3 bg-white/5 border border-stormy-teal/10 rounded-xl">
                <span className="text-2xs font-extrabold text-floral-white block">{user.postsCount}</span>
                <span className="text-3xs font-extrabold text-dust-grey/60 uppercase tracking-widest mt-1 block">Posts</span>
              </div>
              <div className="p-3 bg-white/5 border border-stormy-teal/10 rounded-xl">
                <span className="text-2xs font-extrabold text-floral-white block">{user.commentsCount}</span>
                <span className="text-3xs font-extrabold text-dust-grey/60 uppercase tracking-widest mt-1 block">Comments</span>
              </div>
              <div className="p-3 bg-white/5 border border-stormy-teal/10 rounded-xl">
                <span className="text-2xs font-extrabold text-floral-white block">{user.communitiesCount}</span>
                <span className="text-3xs font-extrabold text-dust-grey/60 uppercase tracking-widest mt-1 block">Communities</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form & Danger Zone */}
        <div className="lg:col-span-2 space-y-6">
          {success && (
            <div className="p-4 bg-green-950/30 border border-green-500/20 text-green-200 text-xs font-bold uppercase tracking-wider rounded-xl">
              ✓ {success}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-950/30 border border-red-500/20 text-red-200 text-xs font-bold uppercase tracking-wider rounded-xl">
              ⚠ {error}
            </div>
          )}

          {/* Edit Form */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stormy-teal border-b border-stormy-teal/10 pb-2 mb-4">
              Edit User Settings
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>

                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>

                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>

                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Reputation (Karma)
                  </label>
                  <input
                    type="number"
                    value={karma}
                    onChange={(e) => setKarma(parseInt(e.target.value) || 0)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Leave empty for auto-generated avatar"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
                />
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Banner Image URL
                </label>
                <input
                  type="text"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  placeholder="Profile banner image link"
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine"
                />
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  User Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isSelf}
                  className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine disabled:opacity-50"
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Administrator</option>
                </select>
                {isSelf && (
                  <span className="text-4xs text-spicy-paprika font-bold uppercase tracking-widest mt-1 block">
                    You cannot demote yourself from the admin role.
                  </span>
                )}
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  User Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs placeholder-dust-grey/50 text-floral-white focus:outline-none focus:border-vivid-tangerine resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-stormy-teal hover:bg-stormy-teal/80 text-floral-white font-extrabold uppercase tracking-widest text-2xs transition-colors cursor-pointer"
              >
                {saving ? "Saving changes..." : "Save details"}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-spicy-paprika/20 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-spicy-paprika border-b border-spicy-paprika/15 pb-2">
              Danger Zone
            </h3>

            <div className="flex flex-col gap-4 border-b border-stormy-teal/10 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-floral-white">
                    Ban Account {user.isBanned && <span className="text-spicy-paprika">(Currently Banned)</span>}
                  </h4>
                  <p className="text-3xs text-dust-grey/60 mt-0.5">
                    {user.isBanned 
                      ? user.banExpiresAt 
                        ? `Temporary ban active. Expires: ${new Date(user.banExpiresAt).toLocaleString()}`
                        : "Permanent account ban active. User cannot log in."
                      : "Lock out this user from all community posting and active sessions."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!user.isBanned && (
                    <select
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      className="px-2.5 py-1.5 bg-ink-black border border-stormy-teal/20 rounded-lg text-3xs font-extrabold uppercase tracking-widest text-dust-grey focus:outline-none focus:border-vivid-tangerine"
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
                    className={`px-4 py-2 rounded-xl text-2xs font-extrabold uppercase tracking-wider border cursor-pointer transition-all disabled:opacity-40 ${
                      user.isBanned
                        ? "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/25"
                        : "bg-orange/10 hover:bg-orange/20 text-orange border-orange/25"
                    }`}
                  >
                    {user.isBanned ? "Unban Account" : "Ban Account"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4 border-b border-stormy-teal/10 pb-4 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-floral-white">
                    Comment Block (Mute) {user.isMuted && <span className="text-spicy-paprika">(Currently Muted)</span>}
                  </h4>
                  <p className="text-3xs text-dust-grey/60 mt-0.5">
                    {user.isMuted 
                      ? user.muteExpiresAt 
                        ? `Temporary block active. Expires: ${new Date(user.muteExpiresAt).toLocaleString()}`
                        : "Permanent comment block active. User cannot reply or post comments."
                      : "Block this user from writing new comments and replies across the community."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!user.isMuted && (
                    <select
                      value={muteDuration}
                      onChange={(e) => setMuteDuration(e.target.value)}
                      className="px-2.5 py-1.5 bg-ink-black border border-stormy-teal/20 rounded-lg text-3xs font-extrabold uppercase tracking-widest text-dust-grey focus:outline-none focus:border-vivid-tangerine"
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
                    className={`px-4 py-2 rounded-xl text-2xs font-extrabold uppercase tracking-wider border cursor-pointer transition-all disabled:opacity-40 ${
                      user.isMuted
                        ? "bg-green-500/10 hover:bg-green-500/20 text-green-500 border-green-500/25"
                        : "bg-orange/10 hover:bg-orange/20 text-orange border-orange/25"
                    }`}
                  >
                    {user.isMuted ? "Restore Comment Access" : "Block Commenting"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-stormy-teal/10 pt-4">
              <div>
                <h4 className="text-xs font-bold text-floral-white">Delete Account</h4>
                <p className="text-3xs text-dust-grey/60 mt-0.5">
                  Permanently erase the user profile along with all written posts, comments, and messages.
                </p>
              </div>

              <button
                onClick={() => setDeleteModalOpen(true)}
                disabled={isSelf}
                className="sm:self-center px-4 py-2 rounded-xl bg-spicy-paprika/10 hover:bg-spicy-paprika/20 text-spicy-paprika border border-spicy-paprika/25 text-2xs font-extrabold uppercase tracking-wider cursor-pointer transition-all disabled:opacity-40"
              >
                Delete Account
              </button>
            </div>
            {isSelf && (
              <span className="text-4xs text-spicy-paprika font-bold uppercase tracking-widest block mt-2 text-center">
                You cannot ban or delete your own active admin account.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
