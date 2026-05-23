import { SearchItem } from "@/types/search";

/**
 * Ranks search results using a multi-criteria priority system:
 * 1. Exact title match (highest)
 * 2. Prefix match
 * 3. Fuzzy search score (Fuse.js score, lower is better)
 * 4. Popularity (upvotes + comments)
 * 5. Recency (createdAt, newer first)
 */
export function rankSearchResults(
  results: Array<{ item: SearchItem; score?: number }>,
  query: string
): SearchItem[] {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return results.map((r) => r.item);
  }

  const sorted = [...results].sort((a, b) => {
    const titleA = a.item.title.toLowerCase();
    const titleB = b.item.title.toLowerCase();

    // 1. Exact Title Match
    const exactA = titleA === cleanQuery;
    const exactB = titleB === cleanQuery;
    if (exactA && !exactB) return -1;
    if (!exactA && exactB) return 1;

    // 2. Prefix Match
    const prefixA = titleA.startsWith(cleanQuery);
    const prefixB = titleB.startsWith(cleanQuery);
    if (prefixA && !prefixB) return -1;
    if (!prefixA && prefixB) return 1;

    // 3. Fuzzy search score (significant difference threshold: 0.05)
    const scoreA = a.score !== undefined ? a.score : 1;
    const scoreB = b.score !== undefined ? b.score : 1;
    if (Math.abs(scoreA - scoreB) > 0.05) {
      return scoreA - scoreB;
    }

    // 4. Popularity Match (higher is better)
    const popA = a.item.popularity || 0;
    const popB = b.item.popularity || 0;
    if (popA !== popB) {
      return popB - popA;
    }

    // 5. Recency Match (newer is better)
    const timeA = new Date(a.item.createdAt).getTime();
    const timeB = new Date(b.item.createdAt).getTime();
    return timeB - timeA;
  });

  return sorted.map((r) => ({
    ...r.item,
    score: r.score,
  }));
}
