import { NextResponse } from "next/server";
import { requireModeratorOrAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// POST /api/admin/users/[id]/ban — Toggle ban status for a user
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: userId } = params;
    const { user: adminUser } = await requireModeratorOrAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Safeguard: User cannot ban themselves
    if (userId === adminUser.id) {
      return NextResponse.json({ error: "You cannot ban your own account" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safeguard: Moderators cannot ban Admins or other Moderators
    if (adminUser.role === "moderator" && ["admin", "moderator"].includes(user.role)) {
      return NextResponse.json(
        { error: "Moderators cannot ban other moderators or administrators" },
        { status: 403 }
      );
    }

    let durationHours: number | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.durationHours === "number") {
        durationHours = body.durationHours;
      }
    } catch {
      // Body may be empty, ignore
    }

    const currentlyBanned = !!user.isBanned;
    const nextBanStatus = !currentlyBanned;

    user.isBanned = nextBanStatus;
    user.bannedAt = nextBanStatus ? new Date() : undefined;
    user.bannedBy = nextBanStatus ? new mongoose.Types.ObjectId(adminUser.id) : undefined;
    
    if (nextBanStatus && durationHours && durationHours > 0) {
      user.banExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    } else {
      user.banExpiresAt = null;
    }

    await user.save();

    // Invalidate user sessions if they are banned
    if (nextBanStatus) {
      const db = mongoose.connection.db;
      if (db) {
        // Delete all better-auth sessions for the user to force immediate logout
        await db.collection("session").deleteMany({ userId: userId });
      }
    }

    // Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: nextBanStatus ? "ban_user" : "unban_user",
      targetType: "User",
      targetId: user._id,
      details: {
        bannedUser: {
          name: user.name,
          username: user.username,
          email: user.email,
        },
        durationHours: nextBanStatus ? durationHours : undefined,
        expiresAt: nextBanStatus ? user.banExpiresAt : undefined,
      },
    });

    return NextResponse.json({
      message: `User successfully ${nextBanStatus ? "banned" : "unbanned"}`,
      isBanned: nextBanStatus,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
