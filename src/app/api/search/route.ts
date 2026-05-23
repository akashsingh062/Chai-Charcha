import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { User } from "@/lib/models/User"; // Ensure registered schema
import { mapPostToSearchItem } from "@/lib/search/dataset";
import { FUSE_OPTIONS } from "@/lib/search/fuseConfig";
import { rankSearchResults } from "@/lib/search/ranking";
import Fuse from "fuse.js";

// Levenshtein distance helper for spell correction
function getLevenshteinDistance(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const cleanQuery = query.trim().toLowerCase();

    if (!cleanQuery) {
      return NextResponse.json({ suggestions: [], didYouMean: null });
    }

    // Force register User schema to resolve MissingSchemaError
    if (!User) {
      console.warn("User schema not registered dynamically.");
    }

    // Fetch all posts from DB
    const posts = await Post.find({}).populate(
      "author",
      "name username avatar role karma"
    );

    // Map DB posts to searchable documents
    const searchItems = posts.map(mapPostToSearchItem);

    // Initialize Fuse.js
    const fuse = new Fuse(searchItems, FUSE_OPTIONS);
    const fuseResults = fuse.search(query);

    // Rank matching results
    const rankedItems = rankSearchResults(fuseResults, query);

    // Format suggestions
    const suggestions = rankedItems.map((item) => ({
      id: item.id,
      title: item.title,
      type: "suggestion" as const,
      score: item.score,
      tags: item.tags,
      category: item.category,
    }));

    // Build spelling correction (Did You Mean) system
    let didYouMean: string | null = null;
    const hasLowQualityMatch =
      rankedItems.length === 0 || (rankedItems[0].score !== undefined && rankedItems[0].score > 0.3);

    if (hasLowQualityMatch && cleanQuery.length > 2) {
      // Build a dynamic dictionary from tags, categories, and titles
      const dictionarySet = new Set<string>();

      searchItems.forEach((item) => {
        // Add tags
        item.tags.forEach((t) => dictionarySet.add(t.toLowerCase()));
        
        // Add category
        dictionarySet.add(item.category.toLowerCase());

        // Add important title words (longer than 3 chars)
        item.title
          .split(/\s+/)
          .map((w) => w.replace(/[^\w]/g, "").toLowerCase())
          .filter((w) => w.length > 3)
          .forEach((w) => dictionarySet.add(w));
      });

      let bestMatch: string | null = null;
      let minDistance = 3; // Allow max 2 edits

      dictionarySet.forEach((word) => {
        // Skip comparing if lengths differ by more than 2
        if (Math.abs(word.length - cleanQuery.length) > 2) return;

        const distance = getLevenshteinDistance(cleanQuery, word);
        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = word;
        }
      });

      if (bestMatch && bestMatch !== cleanQuery) {
        didYouMean = bestMatch;
      }
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, 8),
      didYouMean,
    });
  } catch (error) {
    console.error("Error in search API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
