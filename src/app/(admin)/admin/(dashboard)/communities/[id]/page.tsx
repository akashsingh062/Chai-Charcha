/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { AdminBadge } from "@/components/admin/AdminBadge";
import { ConfirmModal } from "@/components/admin/ConfirmModal";
import Link from "next/link";
import { toast } from "@/store/useToastStore";

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
  creator?: { id: string; name: string; username: string; avatar: string };
  moderators: Array<{ id: string; name: string; username: string; avatar: string }>;
  bannedUsers: Array<{ id: string; name: string; username: string }>;
  pendingRequests: Array<{ id: string; name: string; username: string }>;
  isBanned?: boolean;
  banExpiresAt?: string | null;
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

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params.id as string;

  const [community, setCommunity] = useState<CommunityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [banner, setBanner] = useState("");
  const [rules, setRules] = useState<string[]>([]);
  const [newRule, setNewRule] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "edit" | "danger">("overview");

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
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string) : "";
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
    setError(""); setSuccess(""); setSaving(true);
    try {
      await axiosInstance.put(`/api/admin/communities/${communityId}`, {
        name, slug, description, isPrivate,
        avatar: avatar || undefined,
        banner: banner || undefined,
        rules,
      });
      setSuccess("Community updated successfully");
      toast.success("Community saved");
      fetchCommunityDetails();
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string) : "";
      setError(errorMsg || "Failed to update community");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRule = () => {
    if (newRule.trim()) { setRules([...rules, newRule.trim()]); setNewRule(""); }
  };
  const handleRemoveRule = (index: number) => setRules(rules.filter((_, idx) => idx !== index));

  const handleDelete = async () => {
    try {
      const res = await axiosInstance.delete(`/api/admin/communities/${communityId}`);
      if (res.status === 200) router.push("/admin/communities");
    } catch (err: unknown) {
      const errorMsg = err && typeof err === "object" && "response" in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error as string) : "";
      setError(errorMsg || "Failed to delete community");
    }
  };

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

  if (error && !community) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-2xl text-center text-red-400 text-sm">{error}</div>
        <Link href="/admin/communities" className="text-xs font-semibold text-[#f97316] hover:text-[#fb923c] block text-center transition-colors">
          ← Back to Communities
        </Link>
      </div>
    );
  }

  if (!community) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview" },
    { id: "edit" as const, label: "Edit Community" },
    { id: "danger" as const, label: "Danger Zone" },
  ];

  return (
    <div className="space-y-5">
      {/* Breadcrumb + Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <Link href="/admin/communities" className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#14b8a6] hover:text-[#2dd4bf] transition-colors mb-2">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Communities
          </Link>
          <h1 className="text-xl font-black text-white tracking-tight">{community.name}</h1>
          <p className="text-[11px] text-white/30 mt-0.5">c/{community.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {community.isBanned ? <AdminBadge type="banned" /> : <AdminBadge type={community.isPrivate ? "rejected" : "active"} />}
        </div>
      </div>

      {/* Hero card */}
      <div className="relative rounded-2xl border border-white/[0.07] bg-[#111318] overflow-hidden">
        <div className="h-20 bg-gradient-to-r from-[#14b8a6]/10 via-[#a78bfa]/5 to-[#60a5fa]/10">
          {community.banner && (
            <img src={community.banner} alt="banner" className="w-full h-full object-cover opacity-30" />
          )}
        </div>
        <div className="px-5 pb-5">
          <div className="relative -mt-10 mb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#111318] bg-white/[0.06] shadow-lg">
              {community.avatar ? (
                <img src={community.avatar} alt={community.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-black text-[#14b8a6] uppercase">
                  {community.name.substring(0, 2)}
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatPill label="Members" value={community.membersCount} color="text-[#14b8a6]" />
            <StatPill label="Posts" value={community.postsCount} />
            <StatPill label="Moderators" value={community.moderators?.length || 0} />
            <StatPill label="Rules" value={rules.length} />
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
                  : "bg-[#14b8a6] text-white shadow-sm"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="space-y-5">
            {/* Info */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-3">Community Info</h3>
              <InfoRow label="ID" value={community.id} mono />
              <InfoRow label="Slug" value={`c/${community.slug}`} />
              <InfoRow label="Visibility" value={community.isPrivate ? "Private" : "Public"} />
              <InfoRow label="Status" value={community.isBanned ? <AdminBadge type="banned" /> : <AdminBadge type="active" />} />
              <InfoRow
                label="Creator"
                value={community.creator?.username ? (
                  <Link href={`/admin/users?search=${community.creator.username}`} className="text-[#14b8a6] hover:text-[#2dd4bf] font-semibold transition-colors">
                    @{community.creator.username}
                  </Link>
                ) : "deleted"}
              />
            </div>

            {/* Moderators */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-3">
                Moderators ({community.moderators?.length || 0})
              </h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {community.moderators?.map((mod) => (
                  <div key={mod.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div className="w-7 h-7 rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.04] shrink-0">
                      {mod.avatar ? (
                        <img src={mod.avatar} alt={mod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-black text-white uppercase">{mod.name[0]}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-white/80 block truncate">{mod.name}</span>
                      <Link href={`/admin/users?search=${mod.username}`} className="text-[9px] text-[#14b8a6] hover:text-[#2dd4bf] transition-colors block truncate">
                        @{mod.username}
                      </Link>
                    </div>
                  </div>
                ))}
                {(!community.moderators || community.moderators.length === 0) && (
                  <p className="text-xs text-white/25 py-2">No moderators assigned.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
              <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-3">Description</h3>
              <p className="text-xs text-white/60 leading-relaxed">{community.description}</p>
            </div>

            {/* Rules */}
            {rules.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-3">
                  Community Rules ({rules.length})
                </h3>
                <div className="space-y-2">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                      <span className="shrink-0 w-5 h-5 rounded-md bg-[#14b8a6]/10 text-[#14b8a6] text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-white/70 leading-relaxed">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending requests if private */}
            {community.isPrivate && community.pendingRequests?.length > 0 && (
              <div className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5">
                <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em] mb-3">
                  Pending Join Requests ({community.pendingRequests.length})
                </h3>
                <div className="space-y-1.5">
                  {community.pendingRequests.map((req) => (
                    <div key={req.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                      <span className="text-xs text-white/70">{req.name}</span>
                      <Link href={`/admin/users?search=${req.username}`} className="text-[10px] text-[#14b8a6] hover:text-[#2dd4bf] transition-colors">
                        @{req.username}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT TAB ─────────────────────────────────────── */}
      {activeTab === "edit" && (
        <form onSubmit={handleUpdate} className="rounded-2xl border border-white/[0.07] bg-[#111318] p-5 space-y-4">
          <h3 className="text-[10px] font-bold text-white/30 uppercase tracking-[0.12em]">Edit Community</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Channel Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#14b8a6]/40 transition-all"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#14b8a6]/40 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/70 focus:outline-none focus:border-[#14b8a6]/40 transition-all resize-none"
            />
          </div>

          {/* Visibility toggle */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="sr-only peer" />
              <div className="w-9 h-5 bg-white/[0.1] peer-focus:ring-2 peer-focus:ring-[#14b8a6]/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14b8a6]" />
            </label>
            <div>
              <span className="text-xs font-semibold text-white/80">Private Community</span>
              <p className="text-[9px] text-white/30 mt-0.5">Require approval to join</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Avatar URL</label>
              <input type="text" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#14b8a6]/40 transition-all" />
            </div>
            <div>
              <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-1.5">Banner URL</label>
              <input type="text" value={banner} onChange={(e) => setBanner(e.target.value)} placeholder="https://..."
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 focus:outline-none focus:border-[#14b8a6]/40 transition-all" />
            </div>
          </div>

          {/* Rules editor */}
          <div>
            <label className="text-[9px] font-bold text-white/25 uppercase tracking-wider block mb-2">Community Rules</label>
            <div className="space-y-2 mb-3">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                  <span className="shrink-0 w-5 h-5 rounded-md bg-[#14b8a6]/10 text-[#14b8a6] text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                  <span className="flex-1 text-xs text-white/70">{rule}</span>
                  <button type="button" onClick={() => handleRemoveRule(idx)}
                    className="w-5 h-5 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all cursor-pointer">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRule(); } }}
                placeholder="Add a new rule and press Enter..."
                className="flex-1 px-3.5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white/80 placeholder-white/20 focus:outline-none focus:border-[#14b8a6]/40 transition-all"
              />
              <button type="button" onClick={handleAddRule}
                className="px-4 py-2.5 rounded-xl bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-[#14b8a6] text-xs font-semibold hover:bg-[#14b8a6]/20 transition-all cursor-pointer">
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-white/[0.06]">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-bold shadow-lg shadow-[#14b8a6]/20 transition-all cursor-pointer disabled:opacity-50">
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
        <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-red-400 mb-1">Delete Community</h4>
              <p className="text-[11px] text-white/30 leading-relaxed">
                Permanently erases the channel database record, cascade-deleting all posts, comments, and membership. Completely irreversible.
              </p>
            </div>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              Delete Channel
            </button>
          </div>
        </div>
      )}

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
