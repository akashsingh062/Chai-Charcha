import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";

// GET /api/admin/communities — List all communities with pagination and search
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;

    const query: Record<string, unknown> = {};

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { slug: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const sortCriteria: Record<string, 1 | -1> = {};
    if (["membersCount", "createdAt", "name", "slug"].includes(sort)) {
      sortCriteria[sort] = order;
    } else {
      sortCriteria.createdAt = -1;
    }

    const [communities, total] = await Promise.all([
      Community.find(query)
        .populate("creator", "name username avatar")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit),
      Community.countDocuments(query),
    ]);

    const formattedCommunities = communities.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      description: c.description,
      membersCount: c.membersCount,
      isPrivate: !!c.isPrivate,
      avatar: c.avatar,
      banner: c.banner,
      rules: c.rules || [],
      moderatorsCount: c.moderators?.length || 0,
      bannedUsersCount: c.bannedUsers?.length || 0,
      pendingRequestsCount: c.pendingRequests?.length || 0,
      creator: c.creator,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({
      communities: formattedCommunities,
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
