import React from "react";
import { TRENDING_SEARCHES } from "@/lib/search/dataset";
import { useSearchStore } from "@/store/searchStore";

interface TrendingSearchesProps {
  onSearch: (term: string) => void;
  activeIndexOffset: number;
}

export const TrendingSearches: React.FC<TrendingSearchesProps> = ({
  onSearch,
  activeIndexOffset,
}) => {
  const { activeIndex, setActiveIndex } = useSearchStore();

  return (
    <div className="py-2 border-t border-(--nav-border)/50">
      <div className="px-4 pb-1 text-[10px] font-bold tracking-wider text-dust-grey uppercase flex items-center gap-1.5">
        <svg
          className="w-3.5 h-3.5 text-vivid-tangerine animate-pulse"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Trending Searches
      </div>
      <div className="space-y-0.5">
        {TRENDING_SEARCHES.map((term, index) => {
          const globalIndex = activeIndexOffset + index;
          const isActive = activeIndex === globalIndex;

          return (
            <div
              key={term}
              onMouseEnter={() => setActiveIndex(globalIndex)}
              className={`flex items-center gap-3 px-4 py-2 text-sm cursor-pointer transition-all rounded-lg ${
                isActive
                  ? "bg-(--btn-icon-hover-bg) text-(--foreground)"
                  : "text-(--text-secondary) hover:bg-(--btn-icon-hover-bg)/30 hover:text-(--foreground)"
              }`}
              onClick={() => onSearch(term)}
            >
              <svg
                className="w-4 h-4 shrink-0 text-vivid-tangerine"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              <span className="truncate">{term}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
