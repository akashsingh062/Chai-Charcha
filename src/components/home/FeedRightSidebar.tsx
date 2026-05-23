import React, { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import { useAuth } from "@/context/AuthContext";

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  role: string;
  karma: number;
  badge: string;
}

interface MeetupAttendee {
  id: string;
  name: string;
  username: string;
  avatar?: string;
}

interface MeetupEvent {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  type: "online" | "offline";
  link: string;
  maxSeats: number | null;
  attendeesCount: number;
  hasJoined: boolean;
  attendees: MeetupAttendee[];
}

export const FeedRightSidebar: React.FC = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [meetups, setMeetups] = useState<MeetupEvent[]>([]);
  const [isLoadingLeaders, setIsLoadingLeaders] = useState(true);
  const [isLoadingMeetups, setIsLoadingMeetups] = useState(true);
  const [rsvpLoading, setRsvpLoading] = useState<Record<string, boolean>>({});

  const loadLeaderboard = useCallback(async () => {
    try {
      setIsLoadingLeaders(true);
      const res = await axiosInstance.get("/api/leaderboard");
      if (res.data?.leaderboard) {
        setLeaderboard(res.data.leaderboard);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
    } finally {
      setIsLoadingLeaders(false);
    }
  }, []);

  const loadMeetups = useCallback(async () => {
    try {
      setIsLoadingMeetups(true);
      const res = await axiosInstance.get("/api/meetups");
      if (res.data?.meetups) {
        setMeetups(res.data.meetups);
      }
    } catch (err) {
      console.error("Error fetching meetups:", err);
    } finally {
      setIsLoadingMeetups(false);
    }
  }, []);

  useEffect(() => {
    // Avoid synchronous state changes inside effect trigger tick
    const timer = setTimeout(() => {
      loadLeaderboard();
      loadMeetups();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadLeaderboard, loadMeetups]);

  // Refresh meetups if user logs in or logs out
  useEffect(() => {
    const timer = setTimeout(() => {
      loadMeetups();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, loadMeetups]);

  const handleRSVP = async (meetupId: string) => {
    if (!user) {
      alert("Grab a cup of cutting chai and Log In to RSVP!");
      return;
    }

    try {
      setRsvpLoading((prev) => ({ ...prev, [meetupId]: true }));
      const res = await axiosInstance.post(`/api/meetups/${meetupId}/rsvp`);
      if (res.data?.success) {
        setMeetups((prev) =>
          prev.map((m) => {
            if (m.id !== meetupId) return m;
            return {
              ...m,
              hasJoined: res.data.hasJoined,
              attendeesCount: res.data.attendeesCount,
              attendees: res.data.attendees,
            };
          })
        );
      }
    } catch (err: unknown) {
      console.error("RSVP error:", err);
      let errMsg = "Failed to submit RSVP";
      if (err && typeof err === "object" && "response" in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        errMsg = axiosErr.response?.data?.error || errMsg;
      }
      alert(errMsg);
    } finally {
      setRsvpLoading((prev) => ({ ...prev, [meetupId]: false }));
    }
  };

  const getAvatarGradient = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    if (charCode % 3 === 0) {
      return "bg-linear-to-br from-spicy-paprika to-vivid-tangerine";
    } else if (charCode % 3 === 1) {
      return "bg-linear-to-br from-stormy-teal to-blue-500";
    } else {
      return "bg-linear-to-br from-orange to-spicy-paprika";
    }
  };

  const formatMeetupDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();

    // Format to e.g. "Today, 7:00 PM IST" or "Saturday, 4:00 PM"
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    if (d.toDateString() === now.toDateString()) {
      return `Today, ${timeStr}`;
    } else if (
      d.toDateString() ===
      new Date(now.getTime() + 24 * 60 * 60 * 1000).toDateString()
    ) {
      return `Tomorrow, ${timeStr}`;
    } else {
      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
      return `${dayName}, ${timeStr}`;
    }
  };

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      
      {/* 1. Leaderboard Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-dust-grey/85">
            Chai Leaderboard
          </h2>
          <button 
            onClick={loadLeaderboard}
            className="text-[9px] font-bold text-orange hover:underline cursor-pointer"
            title="Refresh Leaders"
          >
            Refresh
          </button>
        </div>

        {isLoadingLeaders ? (
          <div className="flex flex-col gap-3.5 p-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-(--input-border)/50" />
                  <div className="flex flex-col gap-1.5">
                    <div className="w-20 h-2 bg-(--input-border)/50 rounded-sm" />
                    <div className="w-12 h-1.5 bg-(--input-border)/40 rounded-sm" />
                  </div>
                </div>
                <div className="w-10 h-2.5 bg-(--input-border)/50 rounded-sm" />
              </div>
            ))}
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-2xs text-dust-grey/85 text-center py-4 italic">
            No charchas yet. Be the first to earn reputation points!
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between p-1.5 rounded-xl hover:bg-(--btn-secondary-hover-bg)/65 transition-all duration-200 border border-transparent hover:border-(--input-border)/25"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-sm shrink-0 w-4 text-center">
                    {lead.badge}
                  </span>
                  
                  {lead.avatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={lead.avatar}
                      alt={lead.name}
                      className="w-7 h-7 rounded-full object-cover border border-(--input-border)/50"
                    />
                  ) : (
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-black text-floral-white shadow-3xs ${getAvatarGradient(
                        lead.name
                      )}`}
                    >
                      {lead.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-(--foreground) truncate leading-tight">
                      {lead.name}
                    </span>
                    <span className="text-[9px] text-dust-grey/85 leading-none mt-0.5 capitalize truncate">
                      {lead.role === "member" ? "Developer" : lead.role}
                    </span>
                  </div>
                </div>

                <span className="text-2xs font-bold font-mono text-spicy-paprika shrink-0 pl-1">
                  +{lead.karma} rep
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Upcoming Meetups Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <div className="flex items-center justify-between mb-3 px-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-dust-grey/85">
            Upcoming Meetups
          </h2>
          <button 
            onClick={loadMeetups}
            className="text-[9px] font-bold text-orange hover:underline cursor-pointer"
            title="Refresh Meetups"
          >
            Refresh
          </button>
        </div>

        {isLoadingMeetups ? (
          <div className="flex flex-col gap-3.5 p-2">
            {[1, 2].map((i) => (
              <div key={i} className="p-3 rounded-xl border border-(--input-border)/40 bg-(--input-bg)/5 flex flex-col gap-2.5 animate-pulse">
                <div className="w-16 h-2 bg-(--input-border)/50 rounded-sm" />
                <div className="w-full h-3 bg-(--input-border)/50 rounded-sm" />
                <div className="w-24 h-2 bg-(--input-border)/40 rounded-sm" />
              </div>
            ))}
          </div>
        ) : meetups.length === 0 ? (
          <p className="text-2xs text-dust-grey/85 text-center py-6 italic border border-dashed border-(--input-border)/40 rounded-xl bg-(--input-bg)/5">
            No upcoming meetups scheduled. Check back later!
          </p>
        ) : (
          <div className="flex flex-col gap-3.5">
            {meetups.map((meetup) => (
              <div
                key={meetup.id}
                className="p-3 rounded-xl border border-(--divider-color) bg-(--profile-bg)/40 hover:bg-(--profile-bg)/70 hover:border-orange/25 transition-all duration-300 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider">
                    {meetup.type === "online" ? (
                      <>
                        <span className="animate-ping h-1.5 w-1.5 rounded-full bg-spicy-paprika mr-0.5 shrink-0" />
                        <span className="text-spicy-paprika font-black">Live Online AMA</span>
                      </>
                    ) : (
                      <span className="text-stormy-teal font-black">Physical Meetup</span>
                    )}
                  </div>

                  <span className="text-[8.5px] font-bold text-dust-grey/90 font-mono">
                    {meetup.attendeesCount} joined
                  </span>
                </div>

                <h3 className="text-xs font-extrabold text-(--foreground) leading-snug">
                  {meetup.title}
                </h3>
                
                <p className="text-[10px] text-dust-grey/90 leading-relaxed font-mono">
                  {formatMeetupDate(meetup.dateTime)}
                </p>

                {meetup.description && (
                  <p className="text-[9.5px] text-(--text-secondary) leading-relaxed line-clamp-2 mt-0.5">
                    {meetup.description}
                  </p>
                )}

                {/* RSVP / Join Button */}
                <button
                  onClick={() => handleRSVP(meetup.id)}
                  disabled={rsvpLoading[meetup.id]}
                  className={`mt-2 w-full py-1.5 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs disabled:opacity-60 ${
                    meetup.hasJoined
                      ? "bg-stormy-teal/15 text-stormy-teal border border-stormy-teal/40 hover:bg-stormy-teal/25"
                      : "bg-orange hover:bg-orange-600 text-ink-black border border-transparent"
                  }`}
                >
                  {rsvpLoading[meetup.id] ? (
                    <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                  ) : meetup.hasJoined ? (
                    <>
                      <span>Joined ✅</span>
                    </>
                  ) : (
                    <span>RSVP / Grab Seat</span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
