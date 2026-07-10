export interface Comment {
  id: string;
  author: {
    id?: string;
    username?: string;
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  upvotes: number;
  timeAgo: string;
  createdAt?: string;
  replies?: Comment[];
}

export interface Thread {
  id: string;
  title: string;
  excerpt: string;
  author: {
    id?: string;
    username?: string;
    name: string;
    avatar: string;
    role: string;
    reputation: number;
  };
  category: string;
  tags: string[];
  upvotes: number;
  upvotesCount?: number;
  downvotesCount?: number;
  commentsCount: number;
  views?: number;
  trendingScore?: number;
  timeAgo: string;
  createdAt?: string;
  userVoted?: "up" | "down" | null;
  content?: string;
  comments?: Comment[];
  isSoftDeleted?: boolean;
  softDeletedBy?: string;
  community?: {
    id: string;
    name: string;
    slug: string;
    description?: string;
  } | null;
}
