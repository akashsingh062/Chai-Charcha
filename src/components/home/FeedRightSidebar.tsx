import React from "react";

export const FeedRightSidebar: React.FC = () => {
  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      {/* Leaderboard Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Chai Leaderboard</h2>
        <div className="flex flex-col gap-3">
          {[
            { name: "Karan Johar", points: 640, title: "Principal IC", badge: "🥇" },
            { name: "Rajesh Kumar", points: 512, title: "ChaiTech CTO", badge: "🥈" },
            { name: "Amit Sharma", points: 420, title: "Staff Dev", badge: "🥉" },
            { name: "Priya Patel", points: 380, title: "Frontend Lead", badge: "🔥" },
          ].map((lead, idx) => (
            <div key={idx} className="flex items-center justify-between p-1.5 rounded-xl hover:bg-(--btn-secondary-hover-bg) transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-sm shrink-0">{lead.badge}</span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-(--foreground)">{lead.name}</span>
                  <span className="text-[9px] text-dust-grey leading-none mt-0.5">{lead.title}</span>
                </div>
              </div>
              <span className="text-2xs font-bold font-mono text-spicy-paprika">+{lead.points} rep</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Charchas Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Upcoming Meetups</h2>
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl border border-(--divider-color) bg-(--profile-bg) hover:border-orange/20 transition-all">
            <div className="flex items-center gap-1 text-[10px] font-bold text-spicy-paprika">
              <span className="animate-ping h-1.5 w-1.5 rounded-full bg-spicy-paprika mr-0.5" />
              <span>LIVE ONLINE AMA</span>
            </div>
            <h3 className="text-xs font-extrabold mt-1 text-(--foreground) leading-snug">Scaling React 19 Server Actions to 10M Pageviews</h3>
            <p className="text-[10px] text-dust-grey mt-2">Today, 7:00 PM IST</p>
          </div>
          
          <div className="p-3 rounded-xl border border-(--divider-color) bg-(--profile-bg) hover:border-orange/20 transition-all">
            <span className="text-[10px] font-bold text-stormy-teal uppercase tracking-wider">Bangalore Circle</span>
            <h3 className="text-xs font-extrabold mt-1 text-(--foreground) leading-snug">Offline Chai & Networking Meetup - Indiranagar</h3>
            <p className="text-[10px] text-dust-grey mt-2">Saturday, 4:00 PM IST</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300 text-2xs leading-relaxed text-(--text-secondary)">
        <span className="font-bold text-(--foreground) inline-flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 text-orange shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
          </svg>
          <span>Chai Break News:</span>
        </span> In 2026, global remote developer hires in India grew by 45% with major focus on Rust and Next.js frontend core performance. Keep coding!
      </div>
    </aside>
  );
};
