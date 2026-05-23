import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// POST /api/admin/users/[id]/mute — Toggle comment block (mute) status for a user
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: userId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Safeguard: Admin cannot mute themselves
    if (userId === adminUser.id) {
      return NextResponse.json({ error: "You cannot block comments on your own admin account" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let durationHours: number | null = null;
    try {
      const body = await req.json();
      if (body && typeof body.durationHours === "number") {
        durationHours = body.durationHours;
      }
    } catch (e) {
      // Body may be empty, ignore
    }

    const currentlyMuted = !!user.isMuted;
    const nextMuteStatus = !currentlyMuted;

    user.isMuted = nextMuteStatus;
    user.mutedAt = nextMuteStatus ? new Date() : null;
    user.mutedBy = nextMuteStatus ? new mongoose.Types.ObjectId(adminUser.id) : null;
    
    if (nextMuteStatus && durationHours && durationHours > 0) {
      user.muteExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    } else {
      user.muteExpiresAt = null;
    }

    await user.save();

    // Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: nextMuteStatus ? "mute_user" : "unmute_user",
      targetType: "User",
      targetId: user._id,
      details: {
        mutedUser: {
          name: user.name,
          username: user.username,
          email: user.email,
        },
        durationHours: nextMuteStatus ? durationHours : undefined,
        expiresAt: nextMuteStatus ? user.muteExpiresAt : undefined,
      },
    });

    return NextResponse.json({
      message: `User successfully ${nextMuteStatus ? "blocked from commenting" : "unblocked from commenting"}`,
      isMuted: nextMuteStatus,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
