import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// POST /api/admin/communities/[id]/ban — Toggle ban status for a community channel
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
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

    const currentlyBanned = !!community.isBanned;
    const nextBanStatus = !currentlyBanned;

    community.isBanned = nextBanStatus;
    community.bannedAt = nextBanStatus ? new Date() : null;
    community.bannedBy = nextBanStatus ? new mongoose.Types.ObjectId(adminUser.id) : null;
    await community.save();

    // Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: nextBanStatus ? "ban_community" : "unban_community",
      targetType: "Community",
      targetId: community._id,
      details: {
        communityName: community.name,
        communitySlug: community.slug,
      },
    });

    return NextResponse.json({
      message: `Community successfully ${nextBanStatus ? "banned" : "unbanned"}`,
      isBanned: nextBanStatus,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
