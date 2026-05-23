import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";

// GET /api/admin/posts — List all posts with pagination, filtering, search, sorting
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const communityId = searchParams.get("communityId") || "";
    const category = searchParams.get("category") || "";
    const authorId = searchParams.get("authorId") || "";
    const showDeleted = searchParams.get("showDeleted") || "true"; // "true", "false", or "only"
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { content: { $regex: search.trim(), $options: "i" } },
        { tags: { $in: [new RegExp(search.trim(), "i")] } },
      ];
    }

    if (communityId) {
      query.community = communityId === "none" ? null : communityId;
    }

    if (category) {
      query.category = category;
    }

    if (authorId) {
      query.author = authorId;
    }

    // Handle soft deletion filters
    if (showDeleted === "false") {
      query.isSoftDeleted = { $ne: true };
    } else if (showDeleted === "only") {
      query.isSoftDeleted = true;
    }

    const skip = (page - 1) * limit;

    const sortCriteria: Record<string, 1 | -1> = {};
    if (["createdAt", "trendingScore", "commentCount", "title"].includes(sort)) {
      sortCriteria[sort] = order;
    } else {
      sortCriteria.createdAt = -1;
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .populate("author", "name username email avatar")
        .populate("community", "name slug avatar")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit),
      Post.countDocuments(query),
    ]);

    const formattedPosts = posts.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      content: p.content,
      media: p.media || [],
      tags: p.tags || [],
      category: p.category,
      upvotesCount: p.upvotes?.length || 0,
      downvotesCount: p.downvotes?.length || 0,
      commentCount: p.commentCount,
      trendingScore: p.trendingScore || 0,
      isSoftDeleted: !!p.isSoftDeleted,
      softDeletedBy: p.softDeletedBy,
      isCommunityOnly: !!p.isCommunityOnly,
      author: p.author,
      community: p.community,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json({
      posts: formattedPosts,
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
