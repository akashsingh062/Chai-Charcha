import { create } from "zustand";
import { SearchSuggestion } from "@/types/search";

interface SearchState {
  query: string;
  suggestions: SearchSuggestion[];
  loading: boolean;
  dropdownOpen: boolean;
  activeIndex: number;
  recentSearches: string[];
  setQuery: (query: string) => void;
  setSuggestions: (suggestions: SearchSuggestion[]) => void;
  setLoading: (loading: boolean) => void;
  setDropdownOpen: (open: boolean) => void;
  setActiveIndex: (index: number) => void;
  loadRecentSearches: () => void;
  addRecentSearch: (term: string) => void;
  removeRecentSearch: (term: string) => void;
  clearRecentSearches: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  suggestions: [],
  loading: false,
  dropdownOpen: false,
  activeIndex: -1,
  recentSearches: [],

  setQuery: (query) => {
    set({ query, activeIndex: -1 });
  },

  setSuggestions: (suggestions) => {
    set({ suggestions });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setDropdownOpen: (dropdownOpen) => {
    set({ dropdownOpen, activeIndex: -1 });
  },

  setActiveIndex: (activeIndex) => {
    set({ activeIndex });
  },

  loadRecentSearches: () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("chai-charcha-recent-searches");
      if (stored) {
        set({ recentSearches: JSON.parse(stored) });
      }
    } catch (e) {
      console.error("Failed to load recent searches", e);
    }
  },

  addRecentSearch: (term) => {
    if (!term || !term.trim()) return;
    const cleanTerm = term.trim();
    const current = get().recentSearches;
    
    // Remove if already exists, and push to front (max 10 entries)
    const filtered = current.filter((t) => t.toLowerCase() !== cleanTerm.toLowerCase());
    const updated = [cleanTerm, ...filtered].slice(0, 10);
    
    set({ recentSearches: updated });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("chai-charcha-recent-searches", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save recent searches", e);
      }
    }
  },

  removeRecentSearch: (term) => {
    const current = get().recentSearches;
    const updated = current.filter((t) => t.toLowerCase() !== term.toLowerCase());
    
    set({ recentSearches: updated });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("chai-charcha-recent-searches", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to remove recent search", e);
      }
    }
  },

  clearRecentSearches: () => {
    set({ recentSearches: [] });
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("chai-charcha-recent-searches");
      } catch (e) {
        console.error("Failed to clear recent searches", e);
      }
    }
  },
}));
