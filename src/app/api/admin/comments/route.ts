import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Comment } from "@/lib/models/Comment";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";

// GET /api/admin/comments — List comments with pagination, search, author/post filters
export async function GET(req: Request) {
  try {
    await requireAdmin();
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
        .limit(limit),
      Comment.countDocuments(query),
    ]);

    const formattedComments = comments.map((c) => ({
      id: c._id.toString(),
      postId: c.postId ? (c.postId as any)._id?.toString() : null,
      postTitle: c.postId ? (c.postId as any).title : "Deleted Post",
      content: c.content,
      parentId: c.parentId?.toString() || null,
      upvotesCount: c.upvotes?.length || 0,
      repliesCount: c.replies?.length || 0,
      author: c.author,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

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
