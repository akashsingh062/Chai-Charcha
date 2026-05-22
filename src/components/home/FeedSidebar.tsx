import React from "react";

interface FeedSidebarProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  threadsCountAll: number;
  threadsCountTech: number;
  threadsCountCareer: number;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  threadsCountAll,
  threadsCountTech,
  threadsCountCareer,
}) => {
  const getCount = (cat: string) => {
    if (cat === "All") return threadsCountAll;
    if (cat === "Tech & Architecture") return threadsCountTech;
    return threadsCountCareer;
  };

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      {/* Navigation Filters */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Categories</h2>
        <nav className="flex flex-col gap-1">
          {["All", "Tech & Architecture", "Career Prep"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-spicy-paprika/10 text-spicy-paprika border-l-3 border-spicy-paprika pl-2"
                  : "text-(--text-secondary) hover:bg-(--btn-secondary-hover-bg)"
              }`}
            >
              <span>
                {cat === "All"
                  ? "☕ All Discussions"
                  : cat === "Tech & Architecture"
                  ? "🛠️ Tech & Architecture"
                  : "💼 Career Prep"}
              </span>
              <span className="rounded-full bg-(--profile-bg) border border-(--profile-border) px-2 py-0.5 text-2xs text-(--text-role)">
                {getCount(cat)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Hot Tags Widget */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Trending Tags</h2>
        <div className="flex flex-wrap gap-2">
          {["nextjs", "react19", "systemdesign", "career", "remote-jobs", "css", "node"].map((tag) => (
            <button
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="rounded-full border border-(--card-border) bg-(--background) hover:border-spicy-paprika/40 hover:text-spicy-paprika px-3 py-1.5 text-xs font-medium text-(--text-secondary) transition-all cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="w-full mt-4 rounded-xl border border-spicy-paprika/20 bg-spicy-paprika/5 py-1.5 text-xs font-bold text-spicy-paprika hover:bg-spicy-paprika/10 cursor-pointer"
          >
            Clear Tag Filter
          </button>
        )}
      </div>
    </aside>
  );
};
