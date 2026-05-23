import React from "react";
import { useSearchStore } from "@/store/searchStore";

interface RecentSearchesProps {
  onSearch: (term: string) => void;
  activeIndexOffset: number;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
  onSearch,
  activeIndexOffset,
}) => {
  const { recentSearches, removeRecentSearch, activeIndex, setActiveIndex } = useSearchStore();

  if (recentSearches.length === 0) return null;

  return (
    <div className="py-2">
      <div className="px-4 pb-1 text-[10px] font-bold tracking-wider text-dust-grey uppercase">
        Recent Searches
      </div>
      <div className="space-y-0.5">
        {recentSearches.map((term, index) => {
          const globalIndex = activeIndexOffset + index;
          const isActive = activeIndex === globalIndex;

          return (
            <div
              key={term}
              onMouseEnter={() => setActiveIndex(globalIndex)}
              className={`flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-all rounded-lg ${
                isActive
                  ? "bg-(--btn-icon-hover-bg) text-(--foreground)"
                  : "text-(--text-secondary) hover:bg-(--btn-icon-hover-bg)/30 hover:text-(--foreground)"
              }`}
              onClick={() => onSearch(term)}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <svg
                  className="w-4 h-4 shrink-0 text-dust-grey"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="truncate">{term}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeRecentSearch(term);
                }}
                className="p-1 rounded-full text-dust-grey hover:text-spicy-paprika hover:bg-spicy-paprika/10 transition-colors"
                aria-label={`Remove search term ${term}`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
