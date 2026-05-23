import React from "react";
import { SearchSuggestion } from "@/types/search";

interface SearchSuggestionItemProps {
  suggestion: SearchSuggestion;
  query: string;
  isActive: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

export const SearchSuggestionItem: React.FC<SearchSuggestionItemProps> = ({
  suggestion,
  query,
  isActive,
  onClick,
  onMouseEnter,
}) => {
  // Highlight occurrences of query string inside suggestion title (case-insensitive)
  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return <span>{text}</span>;
    
    // Split text by matching query
    const regex = new RegExp(`(${highlight.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    
    return (
      <span>
        {parts.map((part, index) => 
          regex.test(part) ? (
            <span key={index} className="text-vivid-tangerine font-bold">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </span>
    );
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 rounded-lg ${
        isActive
          ? "bg-(--btn-icon-hover-bg) text-(--foreground)"
          : "text-(--text-secondary) hover:bg-(--btn-icon-hover-bg)/50 hover:text-(--foreground)"
      }`}
      role="option"
      aria-selected={isActive}
    >
      <div className="flex items-center gap-3 min-w-0">
        {suggestion.type === "user" ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-(--profile-bg) text-[9px] font-black text-floral-white overflow-hidden shrink-0 border border-orange/45 shadow-sm">
            {suggestion.avatar && (suggestion.avatar.startsWith("http") || suggestion.avatar.startsWith("/")) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={suggestion.avatar} alt={suggestion.title} className="h-full w-full object-cover" />
            ) : (
              suggestion.avatar || suggestion.title.replace("@", "").substring(0, 2).toUpperCase()
            )}
          </div>
        ) : suggestion.type === "community" ? (
          <svg
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? "text-vivid-tangerine" : "text-orange"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-.778.099-1.533.284-2.253"
            />
          </svg>
        ) : (
          <svg
            className={`w-4 h-4 shrink-0 transition-colors ${
              isActive ? "text-vivid-tangerine" : "text-dust-grey"
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
        )}
        <span className="truncate">{getHighlightedText(suggestion.title, query)}</span>
      </div>

      {suggestion.type === "user" ? (
        <span className="text-[9px] font-bold text-orange px-2 py-0.5 rounded-full bg-orange/15 border border-orange/20 shrink-0 font-mono">
          +{suggestion.karma || 0} rep
        </span>
      ) : suggestion.category ? (
        <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--nav-border)/50 text-dust-grey">
          {suggestion.category}
        </span>
      ) : null}
    </div>
  );
};
