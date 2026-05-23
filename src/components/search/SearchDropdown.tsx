import React, { useRef } from "react";
import { useRouter } from "next/navigation";
import { useSearchStore } from "@/store/searchStore";
import { SearchSuggestionItem } from "./SearchSuggestionItem";
import { RecentSearches } from "./RecentSearches";
import { TrendingSearches } from "./TrendingSearches";

import { useOutsideClick } from "@/hooks/useOutsideClick";

interface SearchDropdownProps {
  onSearch: (term: string) => void;
  didYouMean: string | null;
}

export const SearchDropdown: React.FC<SearchDropdownProps> = ({
  onSearch,
  didYouMean,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const {
    query,
    setQuery,
    suggestions,
    loading,
    dropdownOpen,
    setDropdownOpen,
    activeIndex,
    setActiveIndex,
    recentSearches,
  } = useSearchStore();

  useOutsideClick(dropdownRef, () => {
    setDropdownOpen(false);
  });

  if (!dropdownOpen) return null;

  const isQueryEmpty = !query.trim();

  // Calculate items count and mapping for navigation
  const recentCount = recentSearches.length;

  const suggestionsCount = suggestions.length;



  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-(--dropdown-border) bg-(--dropdown-bg) p-2 shadow-2xl backdrop-blur-xl transition-all duration-200 w-full max-h-[420px] overflow-y-auto"
      role="listbox"
      id="search-dropdown-listbox"
    >
      {/* 1. QUERY IS EMPTY -> Show Recent & Trending */}
      {isQueryEmpty && (
        <>
          <RecentSearches onSearch={onSearch} activeIndexOffset={0} />
          <TrendingSearches onSearch={onSearch} activeIndexOffset={recentCount} />
        </>
      )}

      {/* 2. LOADING STATE */}
      {!isQueryEmpty && loading && (
        <div className="py-8 px-4 flex flex-col items-center justify-center text-dust-grey gap-3">
          <svg
            className="animate-spin h-6 w-6 text-vivid-tangerine"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-mono tracking-wider animate-pulse">Brewing search suggestions...</span>
        </div>
      )}

      {/* 3. NOT LOADING -> Show suggestions, spell correction, or empty state */}
      {!isQueryEmpty && !loading && (
        <div className="space-y-0.5">
          {/* Spell correction alert */}
          {didYouMean && (
            <div className="px-4 py-2 border-b border-(--nav-border)/50 mb-1 text-xs">
              <span className="text-dust-grey">Did you mean: </span>
              <button
                type="button"
                onClick={() => onSearch(didYouMean)}
                className="text-vivid-tangerine font-bold hover:underline cursor-pointer"
              >
                {didYouMean}
              </button>
              <span className="text-dust-grey">?</span>
            </div>
          )}

          {suggestionsCount > 0 ? (
            suggestions.map((s, index) => (
              <SearchSuggestionItem
                key={s.id}
                suggestion={s}
                query={query}
                isActive={activeIndex === index}
                onClick={() => {
                  if (s.type === "user") {
                    const username = s.title.split(" ")[0].replace("@", "");
                    setDropdownOpen(false);
                    setQuery("");
                    router.push(`/profile?username=${encodeURIComponent(username)}`);
                  } else if (s.type === "community") {
                    const slug = s.title.split(" ")[0].replace("c/", "");
                    setDropdownOpen(false);
                    setQuery("");
                    router.push(`/c/${slug}`);
                  } else {
                    onSearch(s.title);
                  }
                }}
                onMouseEnter={() => setActiveIndex(index)}
              />
            ))
          ) : (
            <div className="py-8 px-4 text-center">
              <div className="text-sm font-semibold text-(--foreground) mb-1">
                No discussion found
              </div>
              <p className="text-xs text-dust-grey">
                We couldn&apos;t find any posts matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
