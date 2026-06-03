import React from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";

interface CommunityUserInfo {
  _id: string;
  name: string;
  username: string;
  avatar?: string;
  role?: string;
  karma?: number;
  isCreator?: boolean;
  isModerator?: boolean;
}

interface MembersRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoadingMembers: boolean;
  membersList: CommunityUserInfo[];
  isModerator: boolean;
  isAdmin: boolean;
  userData: { id: string } | null;
  slug: string;
  fetchMembersList: () => void;
  loadCommunityInfo: () => void;
}

export const MembersRosterModal: React.FC<MembersRosterModalProps> = ({
  isOpen,
  onClose,
  isLoadingMembers,
  membersList,
  isModerator,
  isAdmin,
  userData,
  slug,
  fetchMembersList,
  loadCommunityInfo,
}) => {
  if (!isOpen) return null;

  const handleKickMember = async (username: string) => {
    const conf = confirm(`Are you sure you want to kick @${username} from c/${slug}?`);
    if (!conf) return;
    try {
      const res = await axiosInstance.post(`/api/communities/${slug}/members`, { username });
      if (res.data?.success) {
        toast.success(`Successfully kicked @${username}!`);
        fetchMembersList();
        loadCommunityInfo();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to kick member.");
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-5 shadow-2xl backdrop-blur-lg flex flex-col max-h-[80vh] relative animate-slide-down">
        <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5 mb-4">
          <h2 className="text-sm sm:text-base font-extrabold text-(--foreground) flex items-center gap-2">
            <svg className="w-5 h-5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.978 11.978 0 0112 20.25a11.98 11.98 0 01-3-.122v-.109m0-1.018a4.125 4.125 0 00-7.533 2.493 9.337 9.337 0 004.121.952 9.38 9.38 0 002.625-.372m0-3.03c0-1.113.285-2.16.786-3.07M12 18.75a6 6 0 100-12 6 6 0 000 12z" />
            </svg>
            <span>Joined Members Directory</span>
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-(--btn-icon-hover-bg) text-dust-grey hover:text-(--foreground) cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoadingMembers ? (
          <div className="py-12 flex flex-col justify-center items-center text-dust-grey gap-2">
            <div className="w-6 h-6 border-2 border-orange border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] font-mono tracking-wider animate-pulse">Brewing members...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {membersList.length === 0 ? (
              <p className="text-xs text-dust-grey italic py-8 text-center">No joined members found.</p>
            ) : (
              membersList.map((m) => (
                <div key={m._id} className="flex items-center justify-between bg-(--card-background)/35 p-3 rounded-xl border border-(--card-border)/80">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white font-mono">
                      {m.avatar && (m.avatar.startsWith("http") || m.avatar.startsWith("/")) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                      ) : (
                        m.avatar || m.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-(--foreground)">{m.name}</span>
                      <span className="text-3xs font-semibold font-mono text-dust-grey">@{m.username}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {m.isCreator && (
                      <span className="text-[8px] font-black uppercase tracking-wider text-orange bg-orange/15 px-2 py-0.5 rounded-md border border-orange/25">
                        Admin
                      </span>
                    )}
                    {m.isModerator && !m.isCreator && (
                      <span className="text-[8px] font-black uppercase tracking-wider text-vivid-tangerine bg-vivid-tangerine/15 px-2 py-0.5 rounded-md border border-vivid-tangerine/25">
                        Mod
                      </span>
                    )}
                    <span className="text-3xs font-extrabold text-dust-grey px-2 py-0.5 rounded-full bg-(--nav-border)/40 shrink-0 font-mono">
                      +{m.karma || 0} rep
                    </span>
                    {isModerator && !m.isCreator && (!m.isModerator || isAdmin) && m._id.toString() !== userData?.id && (
                      <button
                        onClick={() => handleKickMember(m.username)}
                        className="px-2 py-1 rounded-md bg-transparent border border-spicy-paprika text-spicy-paprika hover:bg-spicy-paprika/10 active:scale-95 text-[9px] font-black uppercase transition-all cursor-pointer select-none shrink-0"
                        title={`Kick @${m.username}`}
                      >
                        Kick
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
