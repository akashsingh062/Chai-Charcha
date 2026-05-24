import { NextResponse } from "next/server";
import { requireModeratorOrAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// POST /api/admin/communities/[id]/ban — Toggle ban status for a community channel
export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: communityId } = params;
    const { user: adminUser } = await requireModeratorOrAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(communityId)) {
      return NextResponse.json({ error: "Invalid community ID" }, { status: 400 });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
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

    const currentlyBanned = !!community.isBanned;
    const nextBanStatus = !currentlyBanned;

    community.isBanned = nextBanStatus;
    community.bannedAt = nextBanStatus ? new Date() : null;
    community.bannedBy = nextBanStatus ? new mongoose.Types.ObjectId(adminUser.id) : null;
    
    if (nextBanStatus && durationHours && durationHours > 0) {
      community.banExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
    } else {
      community.banExpiresAt = null;
    }

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
        durationHours: nextBanStatus ? durationHours : undefined,
        expiresAt: nextBanStatus ? community.banExpiresAt : undefined,
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
