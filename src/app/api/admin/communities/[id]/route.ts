import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { User } from "@/lib/models/User";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// GET /api/admin/communities/[id] — Retrieve detailed community information
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: communityId } = params;
    await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
    }

    const community = await Community.findById(communityId)
      .populate("creator", "name username email avatar")
      .populate("moderators", "name username email avatar")
      .populate("bannedUsers", "name username email avatar")
      .populate("pendingRequests", "name username email avatar");

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const postsCount = await Post.countDocuments({ community: communityId });

    const formattedCommunity = {
      id: community._id.toString(),
      name: community.name,
      slug: community.slug,
      description: community.description,
      membersCount: community.membersCount,
      isPrivate: !!community.isPrivate,
      isBanned: !!community.isBanned,
      avatar: community.avatar,
      banner: community.banner,
      rules: community.rules || [],
      creator: community.creator,
      moderators: community.moderators || [],
      bannedUsers: community.bannedUsers || [],
      pendingRequests: community.pendingRequests || [],
      postsCount,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };

    return NextResponse.json({ community: formattedCommunity });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// PUT /api/admin/communities/[id] — Update community details
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: communityId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, slug, description, isPrivate, rules, avatar, banner, creatorId } = body;

    const community = await Community.findById(communityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const updates: Record<string, unknown> = {};

    if (name !== undefined && name !== community.name) {
      changes.name = { old: community.name, new: name };
      updates.name = name;
    }
    if (slug !== undefined && slug.toLowerCase() !== community.slug) {
      const formattedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
      const existing = await Community.findOne({ slug: formattedSlug, _id: { $ne: communityId } });
      if (existing) {
        return NextResponse.json({ error: "Community slug is already taken" }, { status: 400 });
      }
      changes.slug = { old: community.slug, new: formattedSlug };
      updates.slug = formattedSlug;
    }
    if (description !== undefined && description !== community.description) {
      changes.description = { old: community.description, new: description };
      updates.description = description;
    }
    if (isPrivate !== undefined && isPrivate !== community.isPrivate) {
      changes.isPrivate = { old: community.isPrivate, new: isPrivate };
      updates.isPrivate = isPrivate;
    }
    if (rules !== undefined && JSON.stringify(rules) !== JSON.stringify(community.rules)) {
      changes.rules = { old: community.rules, new: rules };
      updates.rules = rules;
    }
    if (avatar !== undefined && avatar !== community.avatar) {
      changes.avatar = { old: community.avatar, new: avatar };
      updates.avatar = avatar;
    }
    if (banner !== undefined && banner !== community.banner) {
      changes.banner = { old: community.banner, new: banner };
      updates.banner = banner;
    }
    if (creatorId !== undefined && mongoose.Types.ObjectId.isValid(creatorId) && creatorId !== community.creator?.toString()) {
      changes.creator = { old: community.creator?.toString(), new: creatorId };
      updates.creator = new mongoose.Types.ObjectId(creatorId);
    }

    if (Object.keys(updates).length > 0) {
      await Community.findByIdAndUpdate(communityId, { $set: updates });

      // Log action to AuditLog
      await AuditLog.create({
        admin: adminUser.id,
        action: "update_community",
        targetType: "Community",
        targetId: community._id,
        details: { changes },
      });
    }

    return NextResponse.json({ message: "Community updated successfully" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// DELETE /api/admin/communities/[id] — Hard delete community + posts cascade
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: communityId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // 1. Find all posts in this community
    const posts = await Post.find({ community: communityId }).select("_id");
    const postIds = posts.map((p) => p._id);

    // 2. Cascade delete comments and posts
    await Promise.all([
      Comment.deleteMany({ postId: { $in: postIds } }),
      Post.deleteMany({ community: communityId }),
    ]);

    // 3. Remove community from user joinedCommunities lists
    const users = await User.find({ joinedCommunities: { $exists: true } });
    for (const u of users) {
      let joined: string[] = [];
      if (Array.isArray(u.joinedCommunities)) {
        joined = (u.joinedCommunities as unknown[]).map((id) => String(id));
      } else if (typeof u.joinedCommunities === "string") {
        try {
          joined = (JSON.parse(u.joinedCommunities) as unknown[]).map((id) => String(id));
        } catch {
          joined = [];
        }
      }
      const filtered = joined.filter((id) => id !== communityId);
      if (filtered.length !== joined.length) {
        u.joinedCommunities = filtered;
        await u.save();
      }
    }

    // 4. Delete the community itself
    await Community.findByIdAndDelete(communityId);

    // 5. Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: "delete_community",
      targetType: "Community",
      targetId: new mongoose.Types.ObjectId(communityId),
      details: {
        deletedCommunity: {
          name: community.name,
          slug: community.slug,
        },
      },
    });

    return NextResponse.json({ message: "Community and all associated content deleted successfully" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
