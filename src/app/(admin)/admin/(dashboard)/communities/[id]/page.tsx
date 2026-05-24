"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import Image from "next/image";

interface CommunityDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  isPrivate: boolean;
  avatar: string;
  banner: string;
  rules: string[];
  postsCount: number;
  creator?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  moderators: Array<{
    id: string;
    name: string;
    username: string;
    avatar: string;
  }>;
  bannedUsers: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  pendingRequests: Array<{
    id: string;
    name: string;
    username: string;
  }>;
}

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form states
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");

  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchCommunityDetails = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/admin/communities/${communityId}`);
      const data = res.data.community;
      setCommunity(data);

      setName(data.name);
      setSlug(data.slug);
      setDescription(data.description);
      setIsPrivate(data.isPrivate);
      setAvatar(data.avatar || "");
      setBanner(data.banner || "");
      setRules(data.rules || []);
    } catch (err: unknown) {
      console.error("Failed to load community details", err);
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      setError(errorMsg || "Failed to load community details");
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    if (communityId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCommunityDetails();
    }
  }, [communityId, fetchCommunityDetails]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await axiosInstance.put(`/api/admin/communities/${communityId}`, {
        name,
        slug,
        description,
        isPrivate,
        avatar: avatar || undefined,
        banner: banner || undefined,
        rules,
      });
      setSuccess("Community updated successfully");
      fetchCommunityDetails();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      setError(errorMsg || "Failed to update community");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = () => {
    if (newRule.trim()) {
      setRules([...rules, newRule.trim()]);
      setNewRule("");
    }
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleDelete = async () => {
    try {
      const res = await axiosInstance.delete(`/api/admin/communities/${communityId}`);
      if (res.status === 200) {
        router.push("/admin/communities");
      }
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "response" in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string)
          : "";
      setError(errorMsg || "Failed to delete community");
    }
  };

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

  if (error && !community) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-950/20 border border-red-500/20 rounded-2xl text-center text-red-200">
          {error}
        </div>
        <Link href="/admin/communities" className="text-xs font-bold text-vivid-tangerine uppercase hover:underline block text-center">
          ← Back to Communities List
        </Link>
      </div>
    );
  }

  if (!community) return null;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/communities" className="text-2xs font-extrabold uppercase text-stormy-teal hover:underline tracking-wider block mb-1">
            ← Back to Communities List
          </Link>
          <h1 className="text-2xl font-black text-floral-white tracking-tight uppercase">
            Community: {community.name}
          </h1>
        </div>
        <AdminBadge type={community.isPrivate ? "private" : "active"} />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Summary, Creator, Moderators */}
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs text-center space-y-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border border-stormy-teal/20 bg-stormy-teal/10 mx-auto">
              {community.avatar ? (
                <Image src={community.avatar} alt={community.name} fill sizes="96px" className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xl font-black uppercase text-stormy-teal">
                  {community.name.substring(0, 2)}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-floral-white">{community.name}</h3>
              <span className="text-3xs text-dust-grey/60 uppercase tracking-widest mt-0.5 block">
                c/{community.slug}
              </span>
            </div>

            <p className="text-xs text-dust-grey leading-relaxed px-2">
              {community.description}
            </p>

            <div className="border-t border-stormy-teal/10 pt-4 text-left space-y-2 text-2xs font-semibold text-dust-grey/80">
              <div className="flex justify-between">
                <span>Community ID:</span>
                <span className="font-mono text-floral-white">{community.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Members Count:</span>
                <span className="text-floral-white">{community.membersCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Posts Contributed:</span>
                <span className="text-floral-white">{community.postsCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Creator:</span>
                <span className="text-floral-white">
                  {community.creator?.username ? (
                    <Link
                      href={`/admin/users?search=${community.creator.username}`}
                      className="text-stormy-teal hover:text-vivid-tangerine hover:underline font-bold"
                    >
                      @{community.creator.username}
                    </Link>
                  ) : (
                    "deleted"
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Moderators list */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stormy-teal border-b border-stormy-teal/10 pb-2">
              Community Moderators ({community.moderators?.length || 0})
            </h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {community.moderators?.map((mod) => (
                <div key={mod.id} className="flex items-center gap-2">
                  <div className="relative w-6 h-6 rounded-md overflow-hidden bg-stormy-teal/10 shrink-0">
                    {mod.avatar && (
                      <Image src={mod.avatar} alt={mod.name} fill sizes="24px" className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-floral-white block truncate">{mod.name}</span>
                    <span className="text-3xs text-dust-grey/60 block truncate">
                      {mod.username ? (
                        <Link
                          href={`/admin/users?search=${mod.username}`}
                          className="text-stormy-teal hover:text-vivid-tangerine hover:underline font-bold"
                        >
                          @{mod.username}
                        </Link>
                      ) : (
                        "deleted"
                      )}
                    </span>
                  </div>
                </div>
              ))}
              {(!community.moderators || community.moderators.length === 0) && (
                <p className="text-3xs text-dust-grey/50">No moderators assigned.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form & Rules */}
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

          {/* Edit settings */}
          <div className="rounded-2xl border border-stormy-teal/15 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stormy-teal border-b border-stormy-teal/10 pb-2 mb-4">
              Edit Community Configuration
            </h3>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>

                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>

                <div>
                  <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                    Banner URL
                  </label>
                  <input
                    type="text"
                    value={banner}
                    onChange={(e) => setBanner(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white/5 border border-stormy-teal/20 rounded-xl text-xs text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                </div>
              </div>

              <div>
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block mb-1">
                  Privacy Settings
                </label>
                <select
                  value={isPrivate ? "true" : "false"}
                  onChange={(e) => setIsPrivate(e.target.value === "true")}
                  className="w-full px-3.5 py-2.5 bg-ink-black border border-stormy-teal/20 rounded-xl text-xs text-dust-grey focus:outline-none focus:border-vivid-tangerine"
                >
                  <option value="false">Public (Anyone can join and view)</option>
                  <option value="true">Private (Join requests required)</option>
                </select>
              </div>

              {/* Rules Management */}
              <div className="space-y-2">
                <label className="text-3xs font-extrabold uppercase tracking-widest text-stormy-teal block">
                  Community Rules
                </label>
                <div className="space-y-1.5">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 p-2 border border-stormy-teal/10 bg-white/5 rounded-lg">
                      <span className="text-2xs font-semibold text-floral-white">{rule}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="text-spicy-paprika hover:text-floral-white text-3xs font-extrabold uppercase cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newRule}
                    onChange={(e) => setNewRule(e.target.value)}
                    placeholder="Type a new rule..."
                    className="flex-1 px-3.5 py-2 bg-white/5 border border-stormy-teal/20 rounded-xl text-2xs text-floral-white focus:outline-none focus:border-vivid-tangerine"
                  />
                  <button
                    type="button"
                    onClick={handleAddRule}
                    className="px-4 py-2 rounded-xl bg-stormy-teal hover:bg-stormy-teal/80 text-2xs font-extrabold uppercase tracking-wider text-floral-white cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-stormy-teal hover:bg-stormy-teal/80 text-floral-white font-extrabold uppercase tracking-widest text-2xs transition-colors cursor-pointer"
              >
                {saving ? "Saving Community..." : "Save details"}
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-spicy-paprika/20 bg-card-background/40 p-6 shadow-lg backdrop-blur-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-spicy-paprika border-b border-spicy-paprika/15 pb-2">
              Danger Zone
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-floral-white">Delete Community</h4>
                <p className="text-3xs text-dust-grey/60 mt-0.5">
                  Erases the channel database record, cascade deleting posts, comments, and members.
                </p>
              </div>

              <button
                onClick={() => setDeleteModalOpen(true)}
                className="sm:self-center px-4 py-2 rounded-xl bg-spicy-paprika/10 hover:bg-spicy-paprika/20 text-spicy-paprika border border-spicy-paprika/25 text-2xs font-extrabold uppercase tracking-wider cursor-pointer transition-all"
              >
                Delete Channel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Permanently Delete Community"
        message={`Are you sure you want to completely delete c/${community.slug}? All posts and comments in it will be lost. This is IRREVERSIBLE.`}
        confirmText="Confirm Hard Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalOpen(false)}
        isDanger={true}
      />
    </div>
  );
}
