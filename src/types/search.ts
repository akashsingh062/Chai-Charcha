export interface SearchItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: string;
  popularity: number; // based on upvotes + commentCount
  createdAt: string;
  score?: number;
}

export interface SearchSuggestion {
  id: string;
  title: string;
  type: "suggestion" | "post" | "recent" | "trending";
  score?: number;
  tags?: string[];
  category?: string;
}
