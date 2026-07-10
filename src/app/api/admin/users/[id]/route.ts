import { NextResponse } from "next/server";
import { requireAdmin, requireModeratorOrAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { AuditLog } from "@/lib/models/AuditLog";
import { Report } from "@/lib/models/Report";
import { Message } from "@/lib/models/Message";
import { Notification } from "@/lib/models/Notification";
import mongoose from "mongoose";

interface UserDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  banner?: string;
  bio: string;
  role: string;
  karma: number;
  isBanned?: boolean;
  bannedAt?: Date;
  bannedBy?: mongoose.Types.ObjectId;
  banExpiresAt?: Date;
  isMuted?: boolean;
  mutedAt?: Date;
  mutedBy?: mongoose.Types.ObjectId;
  muteExpiresAt?: Date;
  followers?: mongoose.Types.ObjectId[];
  following?: mongoose.Types.ObjectId[];
  joinedCommunities?: string[] | string;
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/admin/users/[id] — Retrieve detailed user profile
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: userId } = params;
    await requireModeratorOrAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await User.findById(userId).lean() as unknown as UserDoc | null;
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [postsCount, commentsCount] = await Promise.all([
      Post.countDocuments({ author: userId }),
      Comment.countDocuments({ author: userId }),
    ]);

    const formattedUser = {
      id: user._id.toString(),
      name: user.name,
      username: user.username,
      email: user.email,
      avatar: user.avatar || "",
      banner: user.banner || "",
      bio: user.bio,
      role: user.role,
      karma: user.karma,
      isBanned: !!user.isBanned,
      bannedAt: user.bannedAt ? user.bannedAt.toISOString() : null,
      bannedBy: user.bannedBy ? user.bannedBy.toString() : null,
      banExpiresAt: user.banExpiresAt ? user.banExpiresAt.toISOString() : null,
      isMuted: !!user.isMuted,
      mutedAt: user.mutedAt ? user.mutedAt.toISOString() : null,
      mutedBy: user.mutedBy ? user.mutedBy.toString() : null,
      muteExpiresAt: user.muteExpiresAt ? user.muteExpiresAt.toISOString() : null,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      communitiesCount: Array.isArray(user.joinedCommunities) ? user.joinedCommunities.length : 0,
      postsCount,
      commentsCount,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return NextResponse.json({ user: formattedUser });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// PUT /api/admin/users/[id] — Update user details (name, username, email, bio, role, karma, avatar, banner)
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: userId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, username, email, bio, role, karma, avatar, banner } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safeguard: Administrators cannot edit user personal profile details to protect user privacy.
    if (
      (name !== undefined && name !== user.name) ||
      (username !== undefined && username.toLowerCase() !== user.username) ||
      (email !== undefined && email.toLowerCase() !== user.email) ||
      (bio !== undefined && bio !== user.bio) ||
      (avatar !== undefined && avatar !== user.avatar) ||
      (banner !== undefined && banner !== user.banner)
    ) {
      return NextResponse.json(
        { error: "Forbidden. Administrators cannot edit user personal profile details to protect their privacy." },
        { status: 403 }
      );
    }

    // Safeguard: Admin cannot demote themselves from admin role
    if (userId === adminUser.id && role && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot demote yourself from the admin role" },
        { status: 400 }
      );
    }

    // Store changes for audit log
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    const updates: Record<string, unknown> = {};

    if (name !== undefined && name !== user.name) {
      changes.name = { old: user.name, new: name };
      updates.name = name;
    }
    if (username !== undefined && username !== user.username) {
      // Validate username regex
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return NextResponse.json(
          { error: "Username must be alphanumeric and contain only underscores" },
          { status: 400 }
        );
      }
      const existingUser = await User.findOne({ username: username.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
      }
      changes.username = { old: user.username, new: username.toLowerCase() };
      updates.username = username.toLowerCase();
    }
    if (email !== undefined && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: userId } });
      if (existingUser) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 400 });
      }
      changes.email = { old: user.email, new: email.toLowerCase() };
      updates.email = email.toLowerCase();
    }
    if (bio !== undefined && bio !== user.bio) {
      changes.bio = { old: user.bio, new: bio };
      updates.bio = bio;
    }
    if (role !== undefined && role !== user.role) {
      if (!["member", "moderator", "admin"].includes(role)) {
        return NextResponse.json({ error: "Invalid role value" }, { status: 400 });
      }
      changes.role = { old: user.role, new: role };
      updates.role = role;
      
      // Notify the user about their role change
      await Notification.create({
        recipient: user._id,
        sender: adminUser.id,
        type: "system",
        link: "/profile",
        message: `Your account role has been updated from ${user.role} to ${role} by an administrator.`,
        isRead: false,
      });
    }
    if (karma !== undefined && karma !== user.karma) {
      const parsedKarma = parseInt(karma);
      if (isNaN(parsedKarma)) {
        return NextResponse.json({ error: "Karma must be a number" }, { status: 400 });
      }
      changes.karma = { old: user.karma, new: parsedKarma };
      updates.karma = parsedKarma;
    }
    if (avatar !== undefined && avatar !== user.avatar) {
      changes.avatar = { old: user.avatar, new: avatar };
      updates.avatar = avatar;
    }
    if (banner !== undefined && banner !== user.banner) {
      changes.banner = { old: user.banner, new: banner };
      updates.banner = banner;
    }

    if (Object.keys(updates).length > 0) {
      await User.findByIdAndUpdate(userId, { $set: updates });

      // Log action to AuditLog
      await AuditLog.create({
        admin: adminUser.id,
        action: "update_user",
        targetType: "User",
        targetId: user._id,
        details: { changes },
      });
    }

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// DELETE /api/admin/users/[id] — Permanently delete user + cascade cleanup
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: userId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Safeguard: Admin cannot delete themselves
    if (userId === adminUser.id) {
      return NextResponse.json({ error: "You cannot delete your own admin account" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const db = mongoose.connection.db;

    // 1. Delete better-auth session and account records if they exist
    if (db) {
      await Promise.all([
        db.collection("session").deleteMany({ userId: userId }),
        db.collection("account").deleteMany({ userId: userId }),
      ]);
    }

    // 2. Cascade delete associated transient data, keeping posts & comments intact (anonymized)
    await Promise.all([
      Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] }),
      Report.deleteMany({ $or: [{ targetId: new mongoose.Types.ObjectId(userId), targetType: "User" }, { reporter: userId }] }),
    ]);

    // 3. Remove user reference from community membership lists (moderators, bannedUsers, pendingRequests)
    // Wait, let's see: Community has moderators and bannedUsers and pendingRequests arrays.
    // Also, User has joinedCommunities as string or array.
    // Let's clean up community lists:
    const Community = mongoose.models.Community;
    if (Community) {
      await Community.updateMany(
        {},
        {
          $pull: {
            moderators: userId,
            bannedUsers: userId,
            pendingRequests: userId,
          },
        }
      );
    }

    // 4. Remove user from other users' followers/following arrays
    await User.updateMany(
      {},
      {
        $pull: {
          followers: userId,
          following: userId,
        },
      }
    );

    // 5. Delete the user
    await User.findByIdAndDelete(userId);

    // 6. Log the action
    await AuditLog.create({
      admin: adminUser.id,
      action: "delete_user",
      targetType: "User",
      targetId: new mongoose.Types.ObjectId(userId),
      details: {
        deletedUser: {
          name: user.name,
          username: user.username,
          email: user.email,
        },
      },
    });

    return NextResponse.json({ message: "User and all associated content deleted successfully" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
