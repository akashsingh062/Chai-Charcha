import React from "react";

interface FeedSidebarProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  categories,
  categoryCounts,
}) => {
  const getCategoryIcon = (cat: string, className = "w-4 h-4 shrink-0") => {
    if (cat === "All") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
        </svg>
      );
    }
    if (cat === "Tech & Architecture") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    if (cat === "Career Prep") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4.667 4H15m-4.667 0H9m-3 11.501h12a2 2 0 002-2v-12a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    if (cat === "General Charcha") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      );
    }
    if (cat === "Showcase") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
        </svg>
      );
    }
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  };

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      {/* Navigation Filters */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300">
        <h2 className="px-2 text-xs font-bold uppercase tracking-wider text-dust-grey/80 mb-3">Categories</h2>
        <nav className="flex flex-col gap-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-spicy-paprika/10 text-spicy-paprika border-l-3 border-spicy-paprika pl-2"
                  : "text-(--text-secondary) hover:bg-(--btn-secondary-hover-bg)"
              }`}
            >
              <span className="flex items-center gap-2">
                {getCategoryIcon(cat)} <span>{cat === "All" ? "All Discussions" : cat}</span>
              </span>
              <span className="rounded-full bg-(--profile-bg) border border-(--profile-border) px-2 py-0.5 text-2xs text-(--text-role)">
                {categoryCounts[cat] || 0}
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
