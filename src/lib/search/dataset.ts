import { SearchItem } from "@/types/search";

export const TRENDING_SEARCHES = [
  "React tutorial",
  "Next.js auth",
  "MongoDB aggregation",
  "Express API",
  "TypeScript interview",
  "System design",
  "Better-Auth",
  "Tailwind v4",
];

export interface RawPostInput {
  id?: string;
  _id?: { toString: () => string };
  title?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  category?: string;
  upvotes?: unknown[] | number;
  commentsCount?: number;
  commentCount?: number;
  createdAt?: string | Date;
}

/**
 * Translates Mongoose Post document or generic thread object to standard SearchItem for Fuse.js
 */
export function mapPostToSearchItem(post: RawPostInput): SearchItem {
  const upvotesCount = Array.isArray(post.upvotes)
    ? post.upvotes.length
    : typeof post.upvotes === "number"
    ? post.upvotes
    : 0;

  const commentCount = typeof post.commentsCount === "number"
    ? post.commentsCount
    : typeof post.commentCount === "number"
    ? post.commentCount
    : 0;

  return {
    id: post.id || post._id?.toString() || "",
    title: post.title || "",
    description: post.content || post.excerpt || "",
    tags: Array.isArray(post.tags) ? post.tags : [],
    category: post.category || "General Charcha",
    popularity: upvotesCount + commentCount,
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : new Date().toISOString(),
  };
}
