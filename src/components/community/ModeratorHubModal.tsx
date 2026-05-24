import React, { useState, useEffect, useMemo, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { toast } from "@/store/useToastStore";
import { useRouter } from "next/navigation";

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

interface BanSuggestionUser extends CommunityUserInfo {
  isAlreadyBanned: boolean;
}

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

interface UserData {
  id: string;
}

interface ModeratorHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: CommunityInfo;
  slug: string;
  isAdmin: boolean;
  userData: UserData | null;
  loadCommunityInfo: () => void;
}

export const ModeratorHubModal: React.FC<ModeratorHubModalProps> = ({
  isOpen,
  onClose,
  community,
  slug,
  isAdmin,
  userData,
  loadCommunityInfo,
}) => {
  const router = useRouter();

  // Tab State
  const [modTab, setModTab] = useState<"requests" | "bans" | "moderators" | "settings">("requests");

  // Dynamic Lists State
  const [pendingRequestsList, setPendingRequestsList] = useState<CommunityUserInfo[]>([]);
  const [bannedUsersList, setBannedUsersList] = useState<CommunityUserInfo[]>([]);
  const [membersList, setMembersList] = useState<CommunityUserInfo[]>([]);
  const [allUsersList, setAllUsersList] = useState<CommunityUserInfo[]>([]);

  // Setting Inputs State
  const [banInput, setBanInput] = useState("");
  const [modInput, setModInput] = useState("");
  const [rulesInput, setRulesInput] = useState(community?.rules ? community.rules.join("\n") : "");
  const [avatarInput, setAvatarInput] = useState(community?.avatar || "");
  const [bannerInput, setBannerInput] = useState(community?.banner || "");

  // Load States
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isModActionLoading, setIsModActionLoading] = useState(false);
  const [isResolvingAvatar, setIsResolvingAvatar] = useState(false);
  const [isResolvingBanner, setIsResolvingBanner] = useState(false);

  // Sync inputs when community prop or isOpen state changes during render
  const [prevCommunity, setPrevCommunity] = useState<CommunityInfo | null>(community);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen || community !== prevCommunity) {
    setPrevIsOpen(isOpen);
    setPrevCommunity(community);
    if (isOpen && community) {
      setRulesInput(community.rules ? community.rules.join("\n") : "");
      setAvatarInput(community.avatar || "");
      setBannerInput(community.banner || "");
    }
  }

  // Fetch functions
  const fetchPendingRequests = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/communities/${slug}/requests`);
      if (res.data?.success) {
        setPendingRequestsList(res.data.requests);
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  }, [slug]);

  const fetchBannedUsers = useCallback(async () => {
    try {
      const res = await axiosInstance.get(`/api/communities/${slug}/bans`);
      if (res.data?.success) {
        setBannedUsersList(res.data.bannedUsers);
      }
    } catch (err) {
      console.error("Error fetching bans:", err);
    }
  }, [slug]);

  const fetchMembersList = useCallback(async () => {
    try {
      setIsLoadingMembers(true);
      const res = await axiosInstance.get(`/api/communities/${slug}/members`);
      if (res.data?.success) {
        setMembersList(res.data.members);
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Failed to load members roster.");
    } finally {
      setIsLoadingMembers(false);
    }
  }, [slug]);

  // Load portal statistics on open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        fetchPendingRequests();
        fetchBannedUsers();
        if (isAdmin) {
          fetchMembersList();
        }
      }, 0);

      // Suggestions Users Load
      const loadAllUsers = async () => {
        try {
          const res = await axiosInstance.get("/api/profile?all=true");
          if (res.data?.success || res.data?.users) {
            setAllUsersList(res.data.users);
          }
        } catch (e) {
          console.error("Error loading user suggestions:", e);
        }
      };
      loadAllUsers();

      return () => clearTimeout(timer);
    }
  }, [isOpen, isAdmin, fetchPendingRequests, fetchBannedUsers, fetchMembersList]);

  // Handle Processes
  const handleProcessRequest = async (userId: string, action: "approve" | "reject") => {
    try {
      setIsModActionLoading(true);
      const res = await axiosInstance.post(`/api/communities/${slug}/requests`, { userId, action });
      if (res.data?.success) {
        toast.success(`Request ${action}d successfully!`);
        setPendingRequestsList((prev) => prev.filter((r) => r._id !== userId));
        loadCommunityInfo();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Action failed.");
    } finally {
      setIsModActionLoading(false);
    }
  };

  const handleBanAction = async (action: "ban" | "unban", usernameStr?: string) => {
    const uName = usernameStr || banInput;
    if (!uName.trim()) return;
    try {
      setIsModActionLoading(true);
      const res = await axiosInstance.post(`/api/communities/${slug}/bans`, { username: uName.trim(), action });
      if (res.data?.success) {
        toast.success(`User @${uName} successfully ${action}ned!`);
        if (action === "ban") {
          setBanInput("");
          fetchBannedUsers();
        } else {
          setBannedUsersList((prev) => prev.filter((u) => u.username !== uName));
        }
        loadCommunityInfo();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Action failed.");
    } finally {
      setIsModActionLoading(false);
    }
  };

  const handleModAction = async (action: "promote" | "demote", usernameStr?: string) => {
    const uName = usernameStr || modInput;
    if (!uName.trim()) return;
    try {
      setIsModActionLoading(true);
      const res = await axiosInstance.post(`/api/communities/${slug}/moderators`, { username: uName.trim(), action });
      if (res.data?.success) {
        toast.success(`User @${uName} successfully ${action === "promote" ? "appointed moderator" : "demoted"}!`);
        setModInput("");
        loadCommunityInfo();
        fetchMembersList();
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      toast.error(error.response?.data?.error || "Action failed.");
    } finally {
      setIsModActionLoading(false);
    }
  };

  // Image Resolving
  const isAvatarResolvable = avatarInput.trim().startsWith("http") && 
    (avatarInput.includes("pin.it") || 
     avatarInput.includes("pinterest.com") || 
     !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(avatarInput));

  const isBannerResolvable = bannerInput.trim().startsWith("http") && 
    (bannerInput.includes("pin.it") || 
     bannerInput.includes("pinterest.com") || 
     !/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(bannerInput));

  const handleResolveCommunityAvatar = async () => {
    if (!avatarInput.trim()) return;
    setIsResolvingAvatar(true);
    try {
      const res = await axiosInstance.post("/api/resolve-avatar", { url: avatarInput.trim() });
      if (res.data?.imageUrl) {
        setAvatarInput(res.data.imageUrl);
        toast.success("Successfully resolved avatar image URL!");
      }
    } catch {
      toast.error("Failed to resolve image URL.");
    } finally {
      setIsResolvingAvatar(false);
    }
  };

  const handleResolveCommunityBanner = async () => {
    if (!bannerInput.trim()) return;
    setIsResolvingBanner(true);
    try {
      const res = await axiosInstance.post("/api/resolve-avatar", { url: bannerInput.trim() });
      if (res.data?.imageUrl) {
        setBannerInput(res.data.imageUrl);
        toast.success("Successfully resolved banner image URL!");
      }
    } catch {
      toast.error("Failed to resolve image URL.");
    } finally {
      setIsResolvingBanner(false);
    }
  };

  // Memoized Suggestions
  const banSuggestions = useMemo(() => {
    const query = banInput.trim().toLowerCase();
    if (!query) return [];
    
    return allUsersList.filter((u) => {
      const isSelf = userData && (userData.id === u._id || userData.id === u._id.toString());
      const matchesUsername = u.username.toLowerCase().includes(query);
      const matchesName = u.name.toLowerCase().includes(query);
      return (matchesUsername || matchesName) && !isSelf;
    }).map(u => ({
      ...u,
      isAlreadyBanned: bannedUsersList.some((b) => b._id === u._id)
    })).slice(0, 5);
  }, [banInput, allUsersList, bannedUsersList, userData]);

  const isInputUserBanned = useMemo(() => {
    const input = banInput.trim().toLowerCase();
    return bannedUsersList.some(b => b.username.toLowerCase() === input);
  }, [banInput, bannedUsersList]);

  const modSuggestions = useMemo(() => {
    const query = modInput.trim().toLowerCase();
    if (!query) return [];

    return membersList.filter((u) => {
      const isSelf = userData && (userData.id === u._id || userData.id === u._id.toString());
      const creatorId = community?.creator?._id || community?.creator;
      const isCreator = creatorId === u._id;
      const isAlreadyMod = u.isModerator;
      const matchesUsername = u.username.toLowerCase().includes(query);
      const matchesName = u.name.toLowerCase().includes(query);
      return (matchesUsername || matchesName) && !isCreator && !isAlreadyMod && !isSelf;
    }).slice(0, 5);
  }, [modInput, membersList, community, userData]);

  if (!isOpen || !community) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-6 shadow-2xl backdrop-blur-lg flex flex-col max-h-[85vh] relative animate-slide-down">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-(--divider-color) pb-3.5 mb-4">
          <h2 className="text-base sm:text-lg font-black text-(--foreground) flex items-center gap-2">
            <svg className="w-5.5 h-5.5 text-orange" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>c/{community.slug} Moderator Hub</span>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-(--divider-color)/60 pb-2 mb-4 gap-4 text-xs font-black text-dust-grey select-none">
          <button
            onClick={() => { setModTab("requests"); fetchPendingRequests(); }}
            className={`pb-1 cursor-pointer transition-colors ${modTab === "requests" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
          >
            Requests ({pendingRequestsList.length})
          </button>
          <button
            onClick={() => { setModTab("bans"); fetchBannedUsers(); }}
            className={`pb-1 cursor-pointer transition-colors ${modTab === "bans" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
          >
            Bans
          </button>
          {isAdmin && (
            <button
              onClick={() => { setModTab("moderators"); fetchMembersList(); }}
              className={`pb-1 cursor-pointer transition-colors ${modTab === "moderators" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
            >
              Mods Management
            </button>
          )}
          <button
            onClick={() => setModTab("settings")}
            className={`pb-1 cursor-pointer transition-colors ${modTab === "settings" ? "text-orange border-b-2 border-orange" : "hover:text-(--foreground)"}`}
          >
            Settings
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[50vh]">
          {/* Tab 1: PENDING REQUESTS */}
          {modTab === "requests" && (
            <div className="space-y-3">
              {pendingRequestsList.length === 0 ? (
                <p className="text-xs text-dust-grey italic py-12 text-center">No pending membership requests.</p>
              ) : (
                pendingRequestsList.map((req) => (
                  <div key={req._id} className="flex items-center justify-between p-3 bg-(--card-background)/40 border border-(--card-border) rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                        {req.avatar && (req.avatar.startsWith("http") || req.avatar.startsWith("/")) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={req.avatar} alt={req.name} className="h-full w-full object-cover" />
                        ) : (
                          req.avatar || req.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-extrabold text-(--foreground)">{req.name}</span>
                        <span className="text-3xs font-semibold font-mono text-dust-grey">@{req.username}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProcessRequest(req._id, "approve")}
                        disabled={isModActionLoading}
                        className="px-3 py-1.5 rounded-lg bg-orange text-ink-black font-extrabold text-[10px] shadow-sm cursor-pointer hover:bg-orange-600 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleProcessRequest(req._id, "reject")}
                        disabled={isModActionLoading}
                        className="px-3 py-1.5 rounded-lg bg-transparent border border-spicy-paprika text-spicy-paprika font-extrabold text-[10px] cursor-pointer hover:bg-spicy-paprika/5 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: BANNING */}
          {modTab === "bans" && (
            <div className="space-y-4">
              {/* Ban Form */}
              <div className="flex items-end gap-2 border-b border-(--divider-color)/40 pb-4">
                <div className="flex-1 relative">
                  <label htmlFor="ban-username" className="block text-2xs font-extrabold text-dust-grey uppercase mb-1">
                    Ban User by Username
                  </label>
                  <input
                    type="text"
                    id="ban-username"
                    value={banInput}
                    onChange={(e) => setBanInput(e.target.value)}
                    placeholder="e.g. janesmith"
                    className="w-full text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                    disabled={isModActionLoading}
                    autoComplete="off"
                  />
                  {banSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-(--dropdown-border) bg-(--dropdown-bg)/95 backdrop-blur-md shadow-lg overflow-hidden py-1 max-h-40 overflow-y-auto animate-fade-in">
                      {banSuggestions.map((u: BanSuggestionUser) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => setBanInput(u.username)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-(--foreground) hover:bg-orange/10 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-5 w-5 rounded-full overflow-hidden border border-orange/15 flex items-center justify-center bg-(--profile-bg) text-[8px] font-bold text-floral-white shrink-0">
                              {u.avatar && (u.avatar.startsWith("http") || u.avatar.startsWith("/")) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                              ) : (
                                u.avatar || u.name.substring(0, 2).toUpperCase()
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-extrabold truncate text-3xs">{u.name}</span>
                              <span className="text-[9px] text-dust-grey font-mono truncate">@{u.username}</span>
                            </div>
                          </div>
                          {u.isAlreadyBanned && (
                            <span className="text-[8px] font-black uppercase text-spicy-paprika bg-spicy-paprika/15 px-1.5 py-0.5 rounded border border-spicy-paprika/20 shrink-0">
                              Banned
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {isInputUserBanned ? (
                  <button
                    onClick={() => handleBanAction("unban")}
                    disabled={isModActionLoading}
                    className="px-4 py-2.5 rounded-xl bg-orange text-ink-black font-extrabold text-xs cursor-pointer shadow-md hover:bg-orange-600 disabled:opacity-55 shrink-0"
                  >
                    Unban User
                  </button>
                ) : (
                  <button
                    onClick={() => handleBanAction("ban")}
                    disabled={isModActionLoading || !banInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-spicy-paprika text-floral-white font-extrabold text-xs cursor-pointer shadow-md hover:bg-spicy-paprika-600 disabled:opacity-55 shrink-0"
                  >
                    Ban User
                  </button>
                )}
              </div>

              {/* Banned Users List */}
              <div className="space-y-3">
                <h4 className="text-2xs font-extrabold uppercase text-dust-grey tracking-wider">Currently Banned ({bannedUsersList.length})</h4>
                {bannedUsersList.length === 0 ? (
                  <p className="text-xs text-dust-grey italic py-4 text-center">No banned users inside this community.</p>
                ) : (
                  bannedUsersList.map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-3 bg-(--card-background)/40 border border-(--card-border) rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                          {user.avatar && (user.avatar.startsWith("http") || user.avatar.startsWith("/")) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                          ) : (
                            user.avatar || user.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-(--foreground)">{user.name}</span>
                          <span className="text-3xs font-semibold font-mono text-dust-grey">@{user.username}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBanAction("unban", user.username)}
                        disabled={isModActionLoading}
                        className="px-3 py-1.5 rounded-lg bg-transparent border border-orange text-orange font-extrabold text-[10px] cursor-pointer hover:bg-orange/5 disabled:opacity-50"
                      >
                        Unban
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 3: MODERATOR APPOINTMENT */}
          {modTab === "moderators" && isAdmin && (
            <div className="space-y-4">
              {/* Promote Form */}
              <div className="flex items-end gap-2 border-b border-(--divider-color)/40 pb-4">
                <div className="flex-1 relative">
                  <label htmlFor="mod-username" className="block text-2xs font-extrabold text-dust-grey uppercase mb-1">
                    Appoint Moderator by Username
                  </label>
                  <input
                    type="text"
                    id="mod-username"
                    value={modInput}
                    onChange={(e) => setModInput(e.target.value)}
                    placeholder="e.g. johndoe"
                    className="w-full text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                    disabled={isModActionLoading}
                    autoComplete="off"
                  />
                  {modSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-(--dropdown-border) bg-(--dropdown-bg)/95 backdrop-blur-md shadow-lg overflow-hidden py-1 max-h-40 overflow-y-auto animate-fade-in">
                      {modSuggestions.map((u: CommunityUserInfo) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() => setModInput(u.username)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-(--foreground) hover:bg-orange/10 transition-colors cursor-pointer"
                        >
                          <div className="h-5 w-5 rounded-full overflow-hidden border border-orange/15 flex items-center justify-center bg-(--profile-bg) text-[8px] font-bold text-floral-white shrink-0">
                            {u.avatar && (u.avatar.startsWith("http") || u.avatar.startsWith("/")) ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={u.avatar} alt={u.name} className="h-full w-full object-cover" />
                            ) : (
                              u.avatar || u.name.substring(0, 2).toUpperCase()
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-extrabold truncate text-3xs">{u.name}</span>
                            <span className="text-[9px] text-dust-grey font-mono truncate">@{u.username}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleModAction("promote")}
                  disabled={isModActionLoading || !modInput.trim()}
                  className="px-4 py-2.5 rounded-xl bg-orange text-ink-black font-extrabold text-xs cursor-pointer shadow-md hover:bg-orange-600 disabled:opacity-55 shrink-0"
                >
                  Promote User
                </button>
              </div>

              {/* List of Current Mods */}
              <div className="space-y-3">
                <h4 className="text-2xs font-extrabold uppercase text-dust-grey tracking-wider">Moderators</h4>
                <div className="flex items-center justify-between p-3 bg-orange/5 border border-orange/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                      {community.creator?.avatar && (community.creator.avatar.startsWith("http") || community.creator.avatar.startsWith("/")) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={community.creator.avatar} alt={community.creator.name} className="h-full w-full object-cover" />
                      ) : (
                        community.creator?.name?.substring(0, 2).toUpperCase() || "CR"
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-extrabold text-(--foreground)">{community.creator?.name}</span>
                      <span className="text-3xs font-semibold font-mono text-dust-grey">@{community.creator?.username}</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-black uppercase text-orange bg-orange/15 px-2 py-0.5 rounded border border-orange/25">
                    Head Admin
                  </span>
                </div>

                {isLoadingMembers ? (
                  <div className="py-4 text-center">
                    <div className="w-4 h-4 border-2 border-orange border-t-transparent rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : (
                  membersList.filter(m => m.isModerator && !m.isCreator).map(mod => (
                    <div key={mod._id} className="flex items-center justify-between p-3 bg-(--card-background)/40 border border-(--card-border) rounded-xl">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full overflow-hidden border border-orange/20 shadow-xs flex items-center justify-center bg-(--profile-bg) text-2xs font-bold text-floral-white">
                          {mod.avatar && (mod.avatar.startsWith("http") || mod.avatar.startsWith("/")) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={mod.avatar} alt={mod.name} className="h-full w-full object-cover" />
                          ) : (
                            mod.avatar || mod.name.substring(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-extrabold text-(--foreground)">{mod.name}</span>
                          <span className="text-3xs font-semibold font-mono text-dust-grey">@{mod.username}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleModAction("demote", mod.username)}
                        disabled={isModActionLoading}
                        className="px-3 py-1.5 rounded-lg bg-transparent border border-spicy-paprika text-spicy-paprika font-extrabold text-[10px] cursor-pointer hover:bg-spicy-paprika/5 disabled:opacity-50"
                      >
                        Demote
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab 4: SETTINGS / RULES / DELETION */}
          {modTab === "settings" && (
            <div className="space-y-4">
              {/* Community Avatar URL */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="settings-avatar" className="block text-2xs font-extrabold text-dust-grey uppercase">
                  Community Avatar URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="settings-avatar"
                    value={avatarInput}
                    onChange={(e) => setAvatarInput(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                    disabled={isModActionLoading}
                  />
                  {isAvatarResolvable && (
                    <button
                      type="button"
                      onClick={handleResolveCommunityAvatar}
                      disabled={isResolvingAvatar}
                      className="px-3.5 py-2.5 bg-orange/15 hover:bg-orange/25 border border-orange/20 rounded-xl text-[10px] font-bold text-orange hover:text-orange-600 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isResolvingAvatar ? "Resolving..." : "⚡ Resolve"}
                    </button>
                  )}
                </div>
              </div>

              {/* Community Banner URL */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="settings-banner" className="block text-2xs font-extrabold text-dust-grey uppercase">
                  Community Banner URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="settings-banner"
                    value={bannerInput}
                    onChange={(e) => setBannerInput(e.target.value)}
                    placeholder="https://example.com/banner.png"
                    className="flex-1 text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2.5 outline-none focus:border-orange text-(--foreground)"
                    disabled={isModActionLoading}
                  />
                  {isBannerResolvable && (
                    <button
                      type="button"
                      onClick={handleResolveCommunityBanner}
                      disabled={isResolvingBanner}
                      className="px-3.5 py-2.5 bg-orange/15 hover:bg-orange/25 border border-orange/20 rounded-xl text-[10px] font-bold text-orange hover:text-orange-600 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      {isResolvingBanner ? "Resolving..." : "⚡ Resolve"}
                    </button>
                  )}
                </div>
              </div>

              {/* Update Rules Text */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="settings-rules" className="block text-2xs font-extrabold text-dust-grey uppercase">
                  Edit Community Rules (One per line)
                </label>
                <textarea
                  id="settings-rules"
                  value={rulesInput}
                  onChange={(e) => setRulesInput(e.target.value)}
                  className="w-full text-xs rounded-xl border border-(--input-border) bg-(--input-bg) px-3 py-2 outline-none focus:border-orange resize-none text-(--foreground)"
                  rows={5}
                  placeholder="Be respectful to all members..."
                  disabled={isModActionLoading}
                />
              </div>

              <button
                onClick={async () => {
                  try {
                    setIsModActionLoading(true);
                    const ruleArr = rulesInput.split("\n").map((r: string) => r.trim()).filter(Boolean);
                    const res = await axiosInstance.put(`/api/communities/${slug}`, { 
                      rules: ruleArr,
                      avatar: avatarInput,
                      banner: bannerInput
                    });
                    if (res.data?.success) {
                      toast.success("Community settings updated successfully!");
                      loadCommunityInfo();
                    }
                  } catch (err) {
                    const error = err as { response?: { data?: { error?: string } } };
                    toast.error(error.response?.data?.error || "Failed to save settings.");
                  } finally {
                    setIsModActionLoading(false);
                  }
                }}
                disabled={isModActionLoading}
                className="px-4 py-2.5 rounded-xl bg-orange text-ink-black font-extrabold text-xs cursor-pointer shadow-md hover:bg-orange-600 disabled:opacity-50"
              >
                Save Settings
              </button>

              {/* DELETE COMMUNITY (CREATOR ONLY) */}
              {isAdmin && (
                <div className="border-t border-(--divider-color)/60 pt-4 mt-4 space-y-2">
                  <h4 className="text-2xs font-extrabold text-spicy-paprika uppercase tracking-wider">Danger Zone</h4>
                  <p className="text-[10px] text-dust-grey leading-relaxed">
                    Permanently delete this community and all its threads/comments. This action is irreversible.
                  </p>
                  <button
                    onClick={async () => {
                      const conf = confirm(`Are you absolutely sure you want to delete c/${slug}?\nThis will permanently erase all threads, comments, and members.`);
                      if (!conf) return;
                      try {
                        setIsModActionLoading(true);
                        const res = await axiosInstance.delete(`/api/communities/${slug}`);
                        if (res.data?.success) {
                          toast.success("Community successfully deleted!");
                          onClose();
                          router.push("/");
                        }
                      } catch (err) {
                        const error = err as { response?: { data?: { error?: string } } };
                        toast.error(error.response?.data?.error || "Failed to delete community.");
                      } finally {
                        setIsModActionLoading(false);
                      }
                    }}
                    disabled={isModActionLoading}
                    className="px-4 py-2 rounded-xl bg-spicy-paprika text-floral-white font-extrabold text-xs cursor-pointer hover:bg-spicy-paprika-600 disabled:opacity-50"
                  >
                    Delete Community
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
