import mongoose from "mongoose";
import { Comment, Thread } from "../app/(main)/post/postData";


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
  createdAt: Date;
  updatedAt: Date;
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
    category: "Tech & Architecture", // Mock category default matching main page display styles
    tags: post.tags || [],
    upvotes: (post.upvotes?.length || 0) - (post.downvotes?.length || 0), // Net score
    commentsCount: post.commentCount || 0,
    views: 120, // Static mock for view metrics
    timeAgo: formatTimeAgo(post.createdAt),
    userVoted,
    comments: buildCommentTree(commentsList),
  };
}
