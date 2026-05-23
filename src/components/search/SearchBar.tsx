"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSearchStore } from "@/store/searchStore";
import { useDebounce } from "@/hooks/useDebounce";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { SearchDropdown } from "./SearchDropdown";
import { TRENDING_SEARCHES } from "@/lib/search/dataset";

const SearchBarInner: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    query,
    setQuery,
    suggestions,
    setSuggestions,
    loading,
    setLoading,
    dropdownOpen,
    setDropdownOpen,
    activeIndex,
    recentSearches,
    loadRecentSearches,
    addRecentSearch,
  } = useSearchStore();

  const [didYouMean, setDidYouMean] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Initialize recent searches
  useEffect(() => {
    loadRecentSearches();
  }, [loadRecentSearches]);

  // Sync with URL query on page load
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, [searchParams, setQuery]);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      const cleanQuery = debouncedQuery.trim();
      if (!cleanQuery) {
        setSuggestions([]);
        setDidYouMean(null);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.suggestions || []);
          setDidYouMean(data.didYouMean || null);
        }
      } catch (error) {
        console.error("Error fetching search suggestions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery, setSuggestions, setLoading]);

  // Handle actual search action
  const handleSearchExecute = (term: string) => {
    const finalTerm = term.trim();
    if (!finalTerm) return;

    addRecentSearch(finalTerm);
    setQuery(finalTerm);
    setDropdownOpen(false);
    inputRef.current?.blur();
    router.push(`/search?q=${encodeURIComponent(finalTerm)}`);
  };

  // Keyboard navigation setup
  const isQueryEmpty = !query.trim();
  const itemsCount = isQueryEmpty
    ? recentSearches.length + TRENDING_SEARCHES.length
    : suggestions.length;

  const handleSelectIndex = (index: number) => {
    if (isQueryEmpty) {
      if (index < recentSearches.length) {
        handleSearchExecute(recentSearches[index]);
      } else {
        const trendingIndex = index - recentSearches.length;
        handleSearchExecute(TRENDING_SEARCHES[trendingIndex]);
      }
    } else {
      if (index >= 0 && index < suggestions.length) {
        const suggestion = suggestions[index];
        if (suggestion.type === "user") {
          const username = suggestion.title.split(" ")[0].replace("@", "");
          setDropdownOpen(false);
          setQuery("");
          router.push(`/profile?username=${encodeURIComponent(username)}`);
        } else {
          handleSearchExecute(suggestion.title);
        }
      }
    }
  };

  const { handleKeyDown } = useKeyboardNavigation(
    itemsCount,
    handleSelectIndex,
    () => setDropdownOpen(false)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && activeIndex < itemsCount) {
      handleSelectIndex(activeIndex);
    } else {
      handleSearchExecute(query);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSuggestions([]);
    setDidYouMean(null);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex items-center w-full bg-(--input-bg) border border-(--input-border) rounded-full shadow-inner transition-all duration-300 focus-within:border-vivid-tangerine focus-within:ring-2 focus-within:ring-vivid-tangerine/20 focus-within:bg-(--input-focus-bg) h-11"
      >
        {/* Search Icon inside Input */}
        <div className="pl-4 pr-2 text-dust-grey">
          <svg
            className="h-5 w-5 stroke-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        </div>

        {/* Search Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
          }}
          onFocus={() => setDropdownOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search threads, tags, categories, or developer profiles..."
          className="w-full h-full bg-transparent border-none outline-none text-sm text-(--foreground) placeholder-dust-grey/70 pr-2"
          role="combobox"
          aria-expanded={dropdownOpen}
          aria-autocomplete="list"
          aria-controls="search-dropdown-listbox"
        />

        {/* Clear Button / Loading Spinner */}
        <div className="flex items-center gap-1.5 pr-2 shrink-0">
          {loading && (
            <svg
              className="animate-spin h-4.5 w-4.5 text-vivid-tangerine"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4.5"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-1 rounded-full text-dust-grey hover:bg-(--btn-icon-hover-bg) hover:text-(--foreground) transition-colors cursor-pointer"
              aria-label="Clear search input"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Submit button on the right edge */}
        <button
          type="submit"
          className="h-full px-5 border-l border-(--input-border) hover:bg-(--btn-icon-hover-bg) text-(--btn-icon-text) hover:text-(--btn-icon-hover-text) rounded-r-full transition-colors flex items-center justify-center cursor-pointer"
          aria-label="Submit search query"
        >
          <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Search</span>
          <svg
            className="h-5 w-5 sm:hidden"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </button>
      </form>

      {/* Floating Dropdown menu */}
      <SearchDropdown onSearch={handleSearchExecute} didYouMean={didYouMean} />
    </div>
  );
};

export const SearchBar: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="w-full bg-(--input-bg) border border-(--input-border) rounded-full h-11 flex items-center pl-4 pr-5">
        <svg className="h-5 w-5 text-dust-grey" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <span className="text-sm text-dust-grey/70 pl-2 select-none">Search threads...</span>
      </div>
    }>
      <SearchBarInner />
    </Suspense>
  );
};
