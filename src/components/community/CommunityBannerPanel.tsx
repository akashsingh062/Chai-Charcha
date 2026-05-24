import React from "react";

interface CreatorInfo {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  karma?: number;
}

interface CommunityInfo {
  _id: string;
  name: string;
  slug: string;
  description: string;
  membersCount: number;
  creator: CreatorInfo;
  createdAt: string;
  isPrivate?: boolean;
  rules?: string[];
  avatar?: string;
  banner?: string;
}

interface CommunityBannerPanelProps {
  community: CommunityInfo;
  isLoggedIn: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  isJoined: boolean;
  isPending: boolean;
  isModerator: boolean;
  isJoinActionLoading: boolean;
  handleJoinLeave: () => void;
  setIsReportModalOpen: (open: boolean) => void;
  setIsModPortalOpen: (open: boolean) => void;
}

export const CommunityBannerPanel: React.FC<CommunityBannerPanelProps> = ({
  community,
  isLoggedIn,
  isAdmin,
  isBanned,
  isJoined,
  isPending,
  isModerator,
  isJoinActionLoading,
  handleJoinLeave,
  setIsReportModalOpen,
  setIsModPortalOpen,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-(--card-border) bg-(--card-background) shadow-2xl transition-all duration-300 mb-6">
      {community.banner ? (
        <div className="h-32 sm:h-44 w-full relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={community.banner} 
            alt={`${community.name} Banner`} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-(--card-background) via-(--card-background)/35 to-transparent" />
        </div>
      ) : (
        <>
          {/* Ambient Background Glows */}
          <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-orange/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-spicy-paprika/10 blur-[80px] pointer-events-none" />
        </>
      )}

      <div className={`relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${community.banner ? "-mt-12 sm:-mt-16" : ""}`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
          {/* Community Avatar */}
          <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl overflow-hidden border-4 border-(--card-background) bg-(--profile-bg) flex items-center justify-center text-xl font-bold text-floral-white font-mono shrink-0 shadow-lg relative">
            {community.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={community.avatar} alt={community.name} className="w-full h-full object-cover" />
            ) : (
              community.name.substring(0, 2).toUpperCase()
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-orange bg-orange/10 border border-orange/20">
                c/{community.slug}
              </span>
              {community.isPrivate && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/25">
                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Restricted
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-(--foreground)">
              {community.name}
            </h1>
            <p className="text-xs text-(--text-secondary) leading-relaxed max-w-xl">
              {community.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn && !isAdmin && (
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="p-2.5 rounded-2xl border border-(--card-border) bg-(--card-background) text-dust-grey hover:text-spicy-paprika hover:border-spicy-paprika/20 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Report Community"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18M3 5h12l-1 3.5 1 3.5H3" />
              </svg>
            </button>
          )}

          {isLoggedIn && !isBanned && !isAdmin && (
            <button
              onClick={handleJoinLeave}
              disabled={isJoinActionLoading}
              className={`rounded-2xl px-5 py-2.5 text-xs font-extrabold shadow-md cursor-pointer transition-all duration-200 active:scale-95 shrink-0 select-none ${
                isJoined
                  ? "bg-transparent border border-spicy-paprika text-spicy-paprika hover:bg-spicy-paprika/5"
                  : isPending
                  ? "bg-amber-500/10 border border-amber-500 text-amber-500 hover:bg-amber-500/20"
                  : "bg-spicy-paprika text-floral-white hover:bg-spicy-paprika-600"
              }`}
            >
              {isJoined ? "Leave" : isPending ? "Request Pending" : "Join"}
            </button>
          )}

          {isLoggedIn && !isBanned && isAdmin && (
            <span className="rounded-2xl px-5 py-2.5 text-xs font-extrabold bg-orange/15 border border-orange/25 text-orange shrink-0 select-none">
              Admin / Creator
            </span>
          )}

          {isLoggedIn && isBanned && (
            <span className="rounded-2xl px-4 py-2 text-xs font-extrabold bg-red-500/15 border border-red-500/25 text-red-500 shrink-0 select-none">
              Banned
            </span>
          )}

          {isLoggedIn && isModerator && (
            <button
              onClick={() => setIsModPortalOpen(true)}
              className="p-2.5 rounded-2xl border border-(--card-border) bg-(--card-background) text-dust-grey hover:text-orange hover:border-orange/20 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 flex items-center justify-center"
              title="Moderator Hub Settings"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
export default CommunityBannerPanel;
