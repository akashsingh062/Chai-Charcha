import mongoose from "mongoose";
import { Comment, Thread } from "../app/(main)/post/postData";
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
  community?: mongoose.Types.ObjectId | null;
  category?: string;
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
          name: comment.author?.name || "Unknown",
          avatar: comment.author?.avatar || (comment.author?.name ? comment.author.name.substring(0, 2).toUpperCase() : "U"),
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

  return {
    id: post._id.toString(),
    title: post.title,
    excerpt: post.content.substring(0, 180) + (post.content.length > 180 ? "..." : ""),
    author: {
      id: post.author?._id?.toString() || "",
      username: post.author?.username || "",
      name: post.author?.name || "Unknown",
      avatar: post.author?.avatar || (post.author?.name ? post.author.name.substring(0, 2).toUpperCase() : "U"),
      role: post.author?.role || "Member",
      reputation: post.author?.karma || 0,
    },
    category: post.category || "Tech & Architecture",
    tags: post.tags || [],
    upvotes: (post.upvotes?.length || 0) - (post.downvotes?.length || 0), // Net score
    commentsCount: post.commentCount || 0,
    timeAgo: formatTimeAgo(post.createdAt),
    createdAt: post.createdAt ? post.createdAt.toISOString() : undefined,
    userVoted,
    comments: buildCommentTree(commentsList),
  };
}

export function calculateTrendingScore(post: {
  upvotes: mongoose.Types.ObjectId[] | any[];
  downvotes: mongoose.Types.ObjectId[] | any[];
  commentCount: number;
  createdAt: Date;
}): number {
  const upvotesCount = post.upvotes?.length || 0;
  const downvotesCount = post.downvotes?.length || 0;
  const commentCount = post.commentCount || 0;

  // Calculate hours since creation
  const createdTime = new Date(post.createdAt).getTime();
  const hoursSincePost = (Date.now() - createdTime) / (1000 * 60 * 60);

  const netVotes = upvotesCount - downvotesCount;
  const engagement = netVotes + commentCount;

  // Gravity score decay formula
  // Score = Engagement / (Hours_Since_Post + 2)^1.5
  const G = 1.5;
  const score = engagement / Math.pow(hoursSincePost + 2, G);
  return score;
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
