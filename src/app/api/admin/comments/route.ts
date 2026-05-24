import { NextResponse } from "next/server";
import { requireModeratorOrAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Comment } from "@/lib/models/Comment";
import mongoose from "mongoose";

interface CommentDoc {
  _id: mongoose.Types.ObjectId;
  postId: { _id: mongoose.Types.ObjectId; title: string } | null;
  author: { name: string; username: string; email: string; avatar?: string } | null;
  content: string;
  parentId: mongoose.Types.ObjectId | null;
  upvotes?: mongoose.Types.ObjectId[];
  replies?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/admin/comments — List comments with pagination, search, author/post filters
export async function GET(req: Request) {
  try {
    await requireModeratorOrAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const postId = searchParams.get("postId") || "";
    const authorId = searchParams.get("authorId") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (search.trim()) {
      query.content = { $regex: search.trim(), $options: "i" };
    }

    if (postId) {
      query.postId = postId;
    }

    if (authorId) {
      query.author = authorId;
    }

    const skip = (page - 1) * limit;

    const sortCriteria: Record<string, 1 | -1> = {};
    if (["createdAt", "content"].includes(sort)) {
      sortCriteria[sort] = order;
    } else {
      sortCriteria.createdAt = -1;
    }

    const [comments, total] = await Promise.all([
      Comment.find(query)
        .populate("author", "name username email avatar")
        .populate("postId", "title")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean() as unknown as CommentDoc[],
      Comment.countDocuments(query),
    ]);

    const formattedComments = comments.map((c) => {
      return {
        id: c._id.toString(),
        postId: c.postId?._id ? c.postId._id.toString() : null,
        postTitle: c.postId?.title ? c.postId.title : "Deleted Post",
        content: c.content,
        parentId: c.parentId?.toString() || null,
        upvotesCount: c.upvotes?.length || 0,
        repliesCount: c.replies?.length || 0,
        author: c.author,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({
      comments: formattedComments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
