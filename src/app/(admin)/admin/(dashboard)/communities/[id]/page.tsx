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

function StatCard({ label, value, color, icon }: { label: string; value: string | number; color?: string; icon?: React.ReactNode }) {
  return (
    <div className="group relative flex flex-col justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 overflow-hidden">
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

function InfoRow({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.05] last:border-0 hover:bg-white/[0.01] px-1 rounded-lg transition-colors">
      <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-semibold text-white/80 ${mono ? "font-mono text-[11px] text-white/50 bg-white/[0.04] px-2 py-0.5 rounded" : ""}`}>
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
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-white/[0.04] rounded-xl w-1/4" />
        <div className="h-44 bg-white/[0.04] rounded-3xl" />
        <div className="h-10 bg-white/[0.04] rounded-xl w-72" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-white/[0.04] rounded-3xl" />
          <div className="lg:col-span-2 h-72 bg-white/[0.04] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error && !community) {
    return (
      <div className="space-y-4 max-w-md mx-auto mt-12">
        <div className="p-6 bg-red-500/5 border border-red-500/20 rounded-3xl text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-red-400 text-sm font-semibold">{error}</p>
        </div>
        <Link href="/admin/communities" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-bold text-white hover:bg-white/[0.08] transition-all">
          ← Back to Communities
        </Link>
      </div>
    );
  }

  if (!community) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    )},
    { id: "edit" as const, label: "Edit Community", icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00-2 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )},
    { id: "danger" as const, label: "Danger Zone", icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    )},
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Link href="/admin/communities" className="inline-flex items-center gap-1.5 text-[10px] font-bold text-stormy-teal hover:text-[#2dd4bf] uppercase tracking-wider transition-colors mb-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Communities
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">{community.name}</h1>
            <div className="flex items-center gap-2">
              {community.isBanned ? <AdminBadge type="banned" /> : <AdminBadge type={community.isPrivate ? "rejected" : "active"} />}
            </div>
          </div>
          <p className="text-xs text-white/40 font-medium">c/{community.slug}</p>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="relative rounded-3xl border border-white/[0.06] bg-[#111318] overflow-hidden shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-r from-stormy-teal/20 via-[#14b8a6]/10 to-indigo-500/20 pointer-events-none blur-xl opacity-80" />
        
        {/* Banner */}
        <div className="relative h-28 bg-[#161a22] overflow-hidden">
          {community.banner ? (
            <img src={community.banner} alt="banner" className="w-full h-full object-cover opacity-40 hover:opacity-50 transition-opacity duration-500" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#14b8a6]/10 to-[#60a5fa]/10" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-transparent to-black/20" />
        </div>

        {/* User Card Content */}
        <div className="px-6 pb-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-10 mb-6">
            <div className="flex items-end gap-4 flex-wrap md:flex-nowrap">
              <div className="relative group shrink-0">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#14b8a6] to-stormy-teal opacity-30 blur group-hover:opacity-75 transition duration-500" />
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-[#111318] bg-[#161a22] shadow-2xl flex items-center justify-center">
                  {community.avatar ? (
                    <img src={community.avatar} alt={community.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white uppercase bg-gradient-to-br from-[#14b8a6] to-[#0d9488]">
                      {community.name.substring(0, 2)}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-1 space-y-1">
                <h2 className="text-lg font-black text-white leading-none">{community.name}</h2>
                <p className="text-xs text-white/50 font-medium">c/{community.slug}</p>
              </div>
            </div>
          </div>

          {/* Stats Pills Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Members" value={community.membersCount} color="text-[#14b8a6]" icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            } />
            <StatCard label="Posts" value={community.postsCount} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 01-2-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            } />
            <StatCard label="Moderators" value={community.moderators?.length || 0} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.952 11.952 0 01-6.802 3.638M15 7h.01M9 7h.01M15 13h.01M9 13h.01M12 17h.01" />
              </svg>
            } />
            <StatCard label="Rules" value={rules.length} icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            } />
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1.5 p-1.5 bg-[#111318] border border-white/[0.06] rounded-2xl w-fit shadow-lg">
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
                    : "bg-[#14b8a6] text-white shadow-lg shadow-[#14b8a6]/20"
                  : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
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
        <div className="flex items-center gap-3 p-4 bg-green-500/[0.04] border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold animate-slide-in-right">
          <div className="w-5 h-5 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 border border-green-500/20">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
            </svg>
          </div>
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/[0.04] border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold animate-slide-in-right">
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
          <div className="space-y-6">
            {/* Info Card */}
            <div className="rounded-3xl border border-white/[0.06] bg-[#111318] p-6 shadow-xl space-y-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-28 h-28 bg-[#14b8a6]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-3 bg-stormy-teal rounded-full" />
                <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-[0.15em]">Community Details</h3>
              </div>
              <InfoRow label="Community ID" value={community.id} mono />
              <InfoRow label="Direct Slug" value={`c/${community.slug}`} />
              <InfoRow label="Privacy Policy" value={community.isPrivate ? "Private (Approved only)" : "Public (Open join)"} />
              <InfoRow label="Platform Status" value={community.isBanned ? <AdminBadge type="banned" /> : <AdminBadge type="active" />} />
              <InfoRow
                label="Founder / Owner"
                value={community.creator?.username ? (
                  <Link href={`/admin/users?search=${community.creator.username}`} className="text-stormy-teal hover:text-[#2dd4bf] font-bold transition-colors">
                    @{community.creator.username}
                  </Link>
                ) : "deleted"}
              />
            </div>

            {/* Moderators List */}
            <div className="rounded-3xl border border-white/[0.06] bg-[#111318] p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#14b8a6]/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-3 bg-stormy-teal rounded-full" />
                <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-[0.15em]">
                  Moderators ({community.moderators?.length || 0})
                </h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {community.moderators?.map((mod) => (
                  <div key={mod.id} className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] hover:border-white/[0.07] transition-all">
                    <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.04] shrink-0">
                      {mod.avatar ? (
                        <img src={mod.avatar} alt={mod.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-white uppercase bg-[#14b8a6]">
                          {mod.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-white/90 block truncate">{mod.name}</span>
                      <Link href={`/admin/users?search=${mod.username}`} className="text-[10px] text-stormy-teal hover:text-[#2dd4bf] font-semibold transition-colors block truncate">
                        @{mod.username}
                      </Link>
                    </div>
                  </div>
                ))}
                {(!community.moderators || community.moderators.length === 0) && (
                  <p className="text-xs text-white/25 py-2 italic text-center">No moderators assigned to this channel.</p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="rounded-3xl border border-white/[0.06] bg-[#111318] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-[0.15em]">About Channel</h3>
              </div>
              <p className="text-xs text-white/60 leading-relaxed bg-white/[0.01] p-4 border border-white/[0.04] rounded-2xl whitespace-pre-wrap">
                {community.description || "No description provided for this community."}
              </p>
            </div>

            {/* Rules Cards */}
            <div className="rounded-3xl border border-white/[0.06] bg-[#111318] p-6 shadow-xl relative overflow-hidden">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-[0.15em]">
                  Rules List ({rules.length})
                </h3>
              </div>
              {rules.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rules.map((rule, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-all">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-[#14b8a6]/10 text-stormy-teal text-xs font-extrabold flex items-center justify-center border border-[#14b8a6]/15">
                        {idx + 1}
                      </span>
                      <span className="text-xs text-white/70 leading-relaxed font-medium">{rule}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-white/25 py-2 italic text-center">No rules defined for this community.</p>
              )}
            </div>

            {/* Join Requests */}
            {community.isPrivate && (
              <div className="rounded-3xl border border-white/[0.06] bg-[#111318] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                  <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-[0.15em]">
                    Pending Join Requests ({community.pendingRequests?.length || 0})
                  </h3>
                </div>
                {community.pendingRequests?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {community.pendingRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-[#14b8a6]/30 transition-all">
                        <span className="text-xs font-bold text-white/80">{req.name}</span>
                        <Link href={`/admin/users?search=${req.username}`} className="text-[10px] font-bold text-stormy-teal hover:text-[#2dd4bf] transition-colors uppercase tracking-wider">
                          @{req.username} →
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/25 py-2 italic text-center">No pending membership join requests.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── EDIT TAB ─────────────────────────────────────── */}
      {activeTab === "edit" && (
        <form onSubmit={handleUpdate} className="rounded-3xl border border-white/[0.06] bg-[#111318] p-6 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#14b8a6]/5 rounded-full blur-3xl pointer-events-none" />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-3 bg-[#14b8a6] rounded-full" />
            <h3 className="text-xs font-extrabold text-white/40 uppercase tracking-[0.15em]">Edit Channel Settings</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Community Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name..."
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#14b8a6]/40 focus:bg-white/[0.04] rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Channel Slug URL</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="Enter slug (e.g. general)..."
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#14b8a6]/40 focus:bg-white/[0.04] rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">About Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe this channel..."
              className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#14b8a6]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200 resize-none"
            />
          </div>

          {/* Visibility toggle option */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.08] transition-all">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-white">Private Community Channel</span>
              <p className="text-[10px] text-white/30">Require manual approval for new users to view and post content</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} className="sr-only peer" />
              <div className="w-10 h-6 bg-white/[0.08] peer-focus:ring-2 peer-focus:ring-[#14b8a6]/20 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#14b8a6]" />
            </label>
          </div>

          {/* Assets URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Avatar Image URL</label>
              <input
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#14b8a6]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Banner Image URL</label>
              <input
                type="text"
                value={banner}
                onChange={(e) => setBanner(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#14b8a6]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              />
            </div>
          </div>

          {/* Rules builder section */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/30 uppercase tracking-wider block">Community Rules Editor</label>
            <div className="space-y-2 mb-3">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] transition-all">
                  <span className="shrink-0 w-6 h-6 rounded-lg bg-[#14b8a6]/10 text-stormy-teal text-[10px] font-black flex items-center justify-center border border-[#14b8a6]/15">{idx + 1}</span>
                  <span className="flex-1 text-xs text-white/70 font-semibold">{rule}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRule(idx)}
                    className="w-6 h-6 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 flex items-center justify-center transition-all cursor-pointer border border-red-500/10"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2.5">
              <input
                type="text"
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddRule(); } }}
                placeholder="Enter community rule content..."
                className="flex-1 px-4 py-3 bg-white/[0.02] border border-white/[0.08] hover:border-white/[0.15] focus:border-[#14b8a6]/40 rounded-xl text-xs text-white focus:outline-none transition-all duration-200"
              />
              <button
                type="button"
                onClick={handleAddRule}
                className="px-5 py-3 rounded-xl bg-[#14b8a6]/10 border border-[#14b8a6]/20 text-[#14b8a6] text-xs font-bold hover:bg-[#14b8a6]/20 transition-all duration-300 cursor-pointer"
              >
                Add Rule
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-white/[0.06]">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#14b8a6] hover:bg-[#0d9488] text-white text-xs font-bold shadow-lg shadow-[#14b8a6]/20 hover:shadow-[#14b8a6]/30 transition-all duration-300 cursor-pointer disabled:opacity-50"
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
                  Save Community details
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ── DANGER TAB ───────────────────────────────────── */}
      {activeTab === "danger" && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/[0.02] p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-400">Permanently Remove Community</h4>
              <p className="text-xs text-white/40 leading-relaxed max-w-lg">
                Permanently erases the channel database record, cascade-deleting all posts, comments, and memberships. This operation is **completely irreversible**.
              </p>
            </div>
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 text-xs font-bold transition-all duration-300 cursor-pointer shrink-0 self-end sm:self-center"
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
