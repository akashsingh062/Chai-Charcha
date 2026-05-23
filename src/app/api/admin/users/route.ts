import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";

interface UserDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  role: string;
  karma: number;
  bio: string;
  isBanned?: boolean;
  bannedAt?: Date;
  isMuted?: boolean;
  muteExpiresAt?: Date;
  followers?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  joinedCommunities?: string[] | string;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/admin/users — List all users with pagination, search, filter, sort
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const sort = searchParams.get("sort") || "createdAt";
    const order = searchParams.get("order") === "asc" ? 1 : -1;
    const banned = searchParams.get("banned");

    // Build query
    const query: Record<string, unknown> = {};

    if (search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
        { username: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (role && ["member", "moderator", "admin"].includes(role)) {
      query.role = role;
    }

    if (banned === "true") {
      query.isBanned = true;
    } else if (banned === "false") {
      query.isBanned = { $ne: true };
    }

    const skip = (page - 1) * limit;

    // Build sort criteria
    const sortCriteria: Record<string, 1 | -1> = {};
    if (["karma", "createdAt", "name", "username", "email"].includes(sort)) {
      sortCriteria[sort] = order;
    } else {
      sortCriteria.createdAt = -1;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name username email avatar role karma bio isBanned bannedAt isMuted muteExpiresAt createdAt updatedAt followers following joinedCommunities")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limit)
        .lean() as unknown as UserDoc[],
      User.countDocuments(query),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      username: u.username,
      email: u.email,
      avatar: u.avatar || "",
      role: u.role,
      karma: u.karma,
      bio: u.bio,
      isBanned: !!u.isBanned,
      bannedAt: u.bannedAt ? u.bannedAt.toISOString() : null,
      isMuted: !!u.isMuted,
      muteExpiresAt: u.muteExpiresAt ? u.muteExpiresAt.toISOString() : null,
      followersCount: u.followers?.length || 0,
      followingCount: u.following?.length || 0,
      communitiesCount: Array.isArray(u.joinedCommunities) ? u.joinedCommunities.length : 0,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      users: formattedUsers,
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
