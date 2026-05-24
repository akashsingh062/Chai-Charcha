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

interface CommunitySidebarProps {
  community: CommunityInfo;
  membersCount: number;
  isJoined: boolean;
  isModerator: boolean;
  handleOpenMembersModal: () => void;
}

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  community,
  membersCount,
  isJoined,
  isModerator,
  handleOpenMembersModal,
}) => {
  return (
    <aside className="lg:col-span-3 space-y-6">
      {/* 1. About Community Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm transition-all duration-300 hover:border-orange/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
        
        <h3 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-spicy-paprika to-vivid-tangerine bg-clip-text text-transparent mb-4">
          About Community
        </h3>

        <div className="space-y-4 text-xs">
          <p className="text-(--text-secondary) leading-relaxed">
            {community.description}
          </p>
          
          <div className="border-t border-(--divider-color)/40 pt-3 flex justify-between">
            <span className="text-dust-grey">Members</span>
            <span className="font-extrabold text-(--foreground)">{membersCount}</span>
          </div>

          <div className="border-t border-(--divider-color)/40 pt-3 flex justify-between">
            <span className="text-dust-grey">Created</span>
            <span className="font-extrabold text-(--foreground)">
              {new Date(community.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>

          <div className="border-t border-(--divider-color)/40 pt-3 flex justify-between items-center">
            <span className="text-dust-grey">Created By</span>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-orange">@{community.creator?.username || "creator"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Community Rules Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm transition-all duration-300 hover:border-orange/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
        
        <h3 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-spicy-paprika to-vivid-tangerine bg-clip-text text-transparent mb-4 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Community Rules</span>
        </h3>

        <div className="space-y-3 text-xs">
          {(community.rules && community.rules.length > 0 ? community.rules : [
            "Be respectful to all members.",
            "No hate speech or harassment.",
            "No spam or self-promotion.",
            "Keep discussions relevant to the community topic."
          ]).map((rule, i) => (
            <div key={i} className="flex gap-2 text-(--text-secondary) leading-relaxed border-b border-(--divider-color)/20 pb-2 last:border-b-0 last:pb-0">
              <span className="font-mono text-orange font-bold shrink-0">{i + 1}.</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Community Members Directory Button Widget */}
      {(isJoined || isModerator) && (
        <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-5 shadow-sm transition-all duration-300 hover:border-orange/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
          
          <h3 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-spicy-paprika to-vivid-tangerine bg-clip-text text-transparent mb-3">
            Community Members
          </h3>
          
          <p className="text-[11px] text-dust-grey leading-relaxed mb-4">
            Explore the roster directory of joined community members. Visible strictly to joined members.
          </p>

          <button
            onClick={handleOpenMembersModal}
            className="w-full text-center rounded-xl bg-orange hover:bg-orange-600 py-2.5 text-xs font-bold text-ink-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.978 11.978 0 0112 20.25a11.98 11.98 0 01-3-.122v-.109m0-1.018a4.125 4.125 0 00-7.533 2.493 9.337 9.337 0 004.121.952 9.38 9.38 0 002.625-.372m0-3.03c0-1.113.285-2.16.786-3.07M12 18.75a6 6 0 100-12 6 6 0 000 12z" />
            </svg>
            <span>View Roster Directory</span>
          </button>
        </div>
      )}
    </aside>
  );
};
export default CommunitySidebar;
