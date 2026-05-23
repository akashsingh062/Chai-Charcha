import React, { useState } from "react";

interface FeedSidebarProps {
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  selectedTag: string;
  setSelectedTag: (tag: string) => void;
  categories: string[];
  categoryCounts: Record<string, number>;
  tagCounts: Record<string, number>;
}

export const FeedSidebar: React.FC<FeedSidebarProps> = ({
  activeCategory,
  setActiveCategory,
  selectedTag,
  setSelectedTag,
  categories,
  categoryCounts,
  tagCounts,
}) => {
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState("");

  const getCategoryIcon = (cat: string, className = "w-4 h-4 shrink-0 transition-transform duration-300 group-hover:scale-110") => {
    if (cat === "All") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v2a2 2 0 01-2 2h-2v-4z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8h14v7a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 3v2M10 3v2M14 3v2" />
        </svg>
      );
    }
    if (cat === "Tech & Code") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
    if (cat === "Startups & Business") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    if (cat === "Career & Salary") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (cat === "Education & Learning") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
        </svg>
      );
    }
    if (cat === "Lifestyle & Hobbies") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      );
    }
    if (cat === "Gaming & Entertainment") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      );
    }
    if (cat === "Health & Fitness") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h2l2 4 2-6 2 2h2m-9 9a9 9 0 110-18 9 9 0 010 18z" />
        </svg>
      );
    }
    if (cat === "Showcase & Projects") {
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.97-2.883a1 1 0 00-1.178 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 10.1c-.783-.57-.38-1.81.588-1.81h4.906a1 1 0 00.95-.69l1.519-4.674z" />
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
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "All": return "text-orange";
      case "Tech & Code": return "text-stormy-teal";
      case "Startups & Business": return "text-vivid-tangerine";
      case "Career & Salary": return "text-spicy-paprika";
      case "Lifestyle & Hobbies": return "text-brandy-700";
      case "Gaming & Entertainment": return "text-orange";
      case "Education & Learning": return "text-stormy-teal";
      case "Health & Fitness": return "text-spicy-paprika";
      case "Showcase & Projects": return "text-vivid-tangerine";
      case "General Charcha": return "text-orange";
      default: return "text-spicy-paprika";
    }
  };

  // Dynamic tags extraction & sorting by count descending
  const trendingTags = Object.keys(tagCounts)
    .sort((a, b) => tagCounts[b] - tagCounts[a])
    .slice(0, 10);

  const defaultTags = ["nextjs", "react19", "systemdesign", "career", "remote-jobs", "css", "node"];
  const displayTags = trendingTags.length > 0 ? trendingTags : defaultTags;
  
  const filteredTags = displayTags.filter(tag => 
    tag.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <aside className="lg:col-span-3 flex flex-col gap-6">
      
      {/* Category filter redesigned as a custom dropdown selector */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300 hover:border-orange/15 relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between px-2 mb-3">
          <h2 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-orange to-spicy-paprika bg-clip-text text-transparent">Category Filter</h2>
          <span className="h-1.5 w-1.5 rounded-full bg-orange animate-pulse" />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            className={`w-full flex items-center justify-between rounded-xl border border-(--input-border)/50 bg-(--input-bg)/30 hover:bg-(--input-bg)/50 px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              activeCategory !== "All" ? `${getCategoryColor(activeCategory)} border-${getCategoryColor(activeCategory)}/30` : "text-(--foreground)"
            }`}
          >
            <span className="flex items-center gap-2.5">
              {getCategoryIcon(activeCategory, `w-4 h-4 shrink-0 ${activeCategory !== "All" ? getCategoryColor(activeCategory) : "text-dust-grey/80"}`)}
              <span>{activeCategory === "All" ? "All Discussions" : activeCategory}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="rounded-full bg-white/10 dark:bg-black/20 border border-current/10 px-2 py-0.5 text-2xs font-bold text-dust-grey">
                {categoryCounts[activeCategory] || 0}
              </span>
              <svg 
                className={`w-4 h-4 text-dust-grey transition-transform duration-300 ${isCategoryOpen ? "rotate-180" : ""}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </span>
          </button>

          {isCategoryOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsCategoryOpen(false)} />
              
              <div className="absolute left-0 right-0 mt-2 z-50 rounded-xl border border-(--dropdown-border) bg-(--dropdown-bg) p-1.5 shadow-2xl backdrop-blur-xl animate-fade-in max-h-64 overflow-y-auto">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setIsCategoryOpen(false);
                      }}
                      className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer hover:bg-(--btn-secondary-hover-bg) ${
                        isActive ? `${getCategoryColor(cat)} font-bold bg-white/5` : "text-(--text-secondary)"
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {getCategoryIcon(cat, `w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? getCategoryColor(cat) : "text-dust-grey/80"
                        }`)}
                        <span>{cat === "All" ? "All Discussions" : cat}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-2xs font-bold ${
                          isActive ? `${getCategoryColor(cat)} bg-white/10 dark:bg-black/20` : "bg-(--profile-bg) text-(--text-role)"
                        }`}>
                          {categoryCounts[cat] || 0}
                        </span>
                        {isActive && (
                          <svg className={`w-4 h-4 ${getCategoryColor(cat)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Redesigned Hashtag Section */}
      <div className="rounded-2xl border border-(--card-border) bg-(--card-background) p-4 shadow-sm transition-all duration-300 hover:border-orange/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-spicy-paprika/5 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-center justify-between px-2 mb-3">
          <h2 className="text-xs font-black uppercase tracking-widest bg-linear-to-r from-spicy-paprika to-vivid-tangerine bg-clip-text text-transparent">Trending Tags</h2>
          <svg className="w-3.5 h-3.5 text-spicy-paprika animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Dynamic Tag Search Input */}
        <div className="relative mb-3.5">
          <input
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full bg-(--input-bg)/20 hover:bg-(--input-bg)/40 focus:bg-(--input-bg)/40 border border-(--input-border)/40 focus:border-spicy-paprika/30 text-xs px-3 py-1.5 pl-8 rounded-xl outline-none transition-all placeholder-dust-grey/60 text-(--foreground)"
          />
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-dust-grey/60">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {tagSearch && (
            <button
              onClick={() => setTagSearch("")}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-dust-grey hover:text-spicy-paprika cursor-pointer"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {filteredTags.length === 0 ? (
            <span className="text-[10px] text-dust-grey italic px-2">No tags match search.</span>
          ) : (
            filteredTags.map((tag) => {
              const isActive = selectedTag.toLowerCase() === tag.toLowerCase();
              const count = tagCounts[tag.toLowerCase()] || 0;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(isActive ? "" : tag)}
                  className={`rounded-full border text-xs font-semibold px-3 py-1.5 transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 ${
                    isActive
                      ? "bg-spicy-paprika text-floral-white border-spicy-paprika shadow-sm hover:bg-spicy-paprika/90"
                      : "border-(--input-border)/50 bg-(--input-bg)/20 text-(--text-secondary) hover:bg-spicy-paprika/10 hover:border-spicy-paprika/30 hover:text-spicy-paprika"
                  }`}
                >
                  <span>#{tag}</span>
                  {count > 0 && (
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                      isActive ? "bg-white/20 text-floral-white" : "bg-(--profile-bg) text-(--text-role)"
                    }`}>
                      {count}
                    </span>
                  )}
                  {isActive && (
                    <svg className="w-3 h-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              );
            })
          )}
        </div>
        
        {selectedTag && (
          <button
            onClick={() => setSelectedTag("")}
            className="w-full mt-4 rounded-xl border border-spicy-paprika/20 bg-spicy-paprika/5 py-1.5 text-xs font-bold text-spicy-paprika hover:bg-spicy-paprika/10 cursor-pointer transition-all duration-200 active:scale-95"
          >
            Clear Tag Filter
          </button>
        )}
      </div>
    </aside>
  );
};
