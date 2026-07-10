import mongoose from "mongoose";
import { Comment, Thread } from "@/types/post";
import { Post } from "./models/Post";


export interface DBComment {
  _id: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  author: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    role: string;
    karma: number;
    username: string;
  } | null;
  content: string;
  parentId?: mongoose.Types.ObjectId | null;
  replies: mongoose.Types.ObjectId[];
  upvotes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DBPost {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  author: {
    _id: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    role: string;
    karma: number;
    username: string;
  } | null;
  tags: string[];
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  commentCount: number;
  community?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    description?: string;
  } | null;
  category?: string;
  isSoftDeleted?: boolean;
  softDeletedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  trendingScore?: number;
}

export function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 0) return "Just now";
  
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval === 1 ? "1 year ago" : `${interval} years ago`;
  
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval === 1 ? "1 month ago" : `${interval} months ago`;
  
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval === 1 ? "1 day ago" : `${interval} days ago`;
  
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval === 1 ? "1 hour ago" : `${interval} hours ago`;
  
  interval = Math.floor(seconds / 60);
  if (interval >= 1) return interval === 1 ? "1 minute ago" : `${interval} minutes ago`;
  
  return "Just now";
}

export function buildCommentTree(comments: DBComment[], parentId: string | null = null): Comment[] {
  return comments
    .filter((comment) => {
      const pId = comment.parentId ? comment.parentId.toString() : null;
      const targetPId = parentId ? parentId.toString() : null;
      return pId === targetPId;
    })
    .map((comment) => {
      const replies = buildCommentTree(comments, comment._id.toString());
      return {
        id: comment._id.toString(),
        author: {
          id: comment.author?._id?.toString() || "",
          username: comment.author?.username || "deleted_user",
          name: comment.author?.name || "Deleted User",
          avatar: comment.author?.avatar || "DU",
          role: comment.author?.role || "Member",
        },
        content: comment.content,
        upvotes: comment.upvotes?.length || 0,
        timeAgo: formatTimeAgo(comment.createdAt),
        createdAt: comment.createdAt ? comment.createdAt.toISOString() : undefined,
        replies,
      };
    });
}

export function formatPostForFrontend(post: DBPost, commentsList: DBComment[], userId?: string | null): Thread {
  const isUpvoted = userId ? post.upvotes.some((id) => id.toString() === userId.toString()) : false;
  const isDownvoted = userId ? post.downvotes.some((id) => id.toString() === userId.toString()) : false;
  
  const userVoted = isUpvoted ? "up" : isDownvoted ? "down" : null;

  let community = null;
  if (post.community && typeof post.community === "object") {
    const com = post.community;
    community = {
      id: com._id?.toString() || "",
      name: com.name || "",
      slug: com.slug || "",
      description: com.description || "",
    };
  }

  return {
    id: post._id.toString(),
    title: post.title,
    excerpt: post.content.substring(0, 180) + (post.content.length > 180 ? "..." : ""),
    content: post.content,
    author: {
      id: post.author?._id?.toString() || "",
      username: post.author?.username || "deleted_user",
      name: post.author?.name || "Deleted User",
      avatar: post.author?.avatar || "DU",
      role: post.author?.role || "Member",
      reputation: post.author?.karma || 0,
    },
    category: post.category || "General Charcha",
    tags: post.tags || [],
    upvotes: (post.upvotes?.length || 0) - (post.downvotes?.length || 0), // Net score
    upvotesCount: post.upvotes?.length || 0,
    downvotesCount: post.downvotes?.length || 0,
    commentsCount: (commentsList && commentsList.length > 0) ? commentsList.length : (post.commentCount || 0),
    timeAgo: formatTimeAgo(post.createdAt),
    createdAt: post.createdAt ? post.createdAt.toISOString() : undefined,
    userVoted,
    comments: buildCommentTree(commentsList),
    isSoftDeleted: !!post.isSoftDeleted,
    softDeletedBy: post.softDeletedBy ? post.softDeletedBy.toString() : undefined,
    community,
  };
}

export function calculateTrendingScore(post: {
  upvotes?: mongoose.Types.ObjectId[] | unknown[];
  downvotes?: mongoose.Types.ObjectId[] | unknown[];
  commentCount?: number;
  createdAt?: Date;
}): number {
  const upvotesCount = Array.isArray(post.upvotes) ? post.upvotes.length : 0;
  const downvotesCount = Array.isArray(post.downvotes) ? post.downvotes.length : 0;
  const commentCount = typeof post.commentCount === "number" ? post.commentCount : 0;

  // Calculate hours since creation — guard against missing/invalid dates
  const createdTime = post.createdAt ? new Date(post.createdAt).getTime() : Date.now();
  const hoursSincePost = (Date.now() - createdTime) / (1000 * 60 * 60);

  const netVotes = upvotesCount - downvotesCount;
  // Add a base boost of 1.0 so new posts naturally outrank older posts with identical zero-engagement
  const engagement = netVotes + commentCount + 1.0;

  // Gravity score decay formula
  // Score = Engagement / (Hours_Since_Post + 2)^1.5
  const G = 1.5;
  const score = engagement / Math.pow(hoursSincePost + 2, G);

  // Final NaN safety — always return a valid number
  return Number.isFinite(score) ? score : 0;
}

export async function updatePostTrendingScore(postId: string | mongoose.Types.ObjectId): Promise<number> {
  try {
    const post = await Post.findById(postId);
    if (!post) return 0;

    const trendingScore = calculateTrendingScore(post);
    post.trendingScore = trendingScore;
    await post.save();
    return trendingScore;
  } catch (error) {
    console.error(`Error updating trending score for post ${postId}:`, error);
    return 0;
  }
}
