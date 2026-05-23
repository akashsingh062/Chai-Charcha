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
        <span className="truncate">{getHighlightedText(suggestion.title, query)}</span>
      </div>

      {suggestion.category && (
        <span className="hidden sm:inline text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--nav-border)/50 text-dust-grey">
          {suggestion.category}
        </span>
      )}
    </div>
  );
};
