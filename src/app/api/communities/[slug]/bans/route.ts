import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";

// GET /api/communities/[slug]/bans - List banned users (Admins/Mods only)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    await connectDB();

    const community = await Community.findOne({ slug }).populate(
      "bannedUsers",
      "name username avatar role karma"
    );

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const isAdmin = community.creator.toString() === userId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((id: any) => id.toString() === userId));

    if (!isMod) {
      return NextResponse.json({ error: "Forbidden. Only moderators can view banned users." }, { status: 403 });
    }

    return NextResponse.json({ success: true, bannedUsers: community.bannedUsers || [] });
  } catch (error) {
    console.error("Error in GET /api/communities/[slug]/bans:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/communities/[slug]/bans - Ban or Unban a user (Admins/Mods only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const { username, action } = await req.json();

    if (!username || (action !== "ban" && action !== "unban")) {
      return NextResponse.json({ error: "Invalid body parameters" }, { status: 400 });
    }

    await connectDB();

    const community = await Community.findOne({ slug });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const currentUserId = session.user.id;
    const isAdmin = community.creator.toString() === currentUserId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((id: any) => id.toString() === currentUserId));

    if (!isMod) {
      return NextResponse.json({ error: "Forbidden. Only moderators can manage bans." }, { status: 403 });
    }

    // Find the target user by username
    const targetUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 444 });
    }

    const targetUserId = targetUser._id;

    // Check if trying to ban the creator
    if (action === "ban" && community.creator.toString() === targetUserId.toString()) {
      return NextResponse.json({ error: "You cannot ban the community creator." }, { status: 400 });
    }

    if (action === "ban") {
      // 1. Add to community bannedUsers
      await Community.findOneAndUpdate(
        { slug },
        { 
          $addToSet: { bannedUsers: targetUserId },
          $pull: { pendingRequests: targetUserId } // Clean up from requests if present
        }
      );

      // 2. If user is currently joined, remove them and decrement membersCount
      let joined: string[] = [];
      if (targetUser.joinedCommunities) {
        if (Array.isArray(targetUser.joinedCommunities)) {
          joined = targetUser.joinedCommunities.map((id: any) => id.toString());
        } else if (typeof targetUser.joinedCommunities === "string") {
          try {
            joined = JSON.parse(targetUser.joinedCommunities).map((id: any) => id.toString());
          } catch (e) {}
        }
      }

      const communityIdStr = community._id.toString();
      if (joined.includes(communityIdStr)) {
        targetUser.joinedCommunities = joined.filter((id) => id !== communityIdStr);
        await targetUser.save();

        await Community.findOneAndUpdate(
          { slug },
          { $inc: { membersCount: -1 } }
        );
      }
    } else {
      // Unban action -> pull from community bannedUsers
      await Community.findOneAndUpdate(
        { slug },
        { $pull: { bannedUsers: targetUserId } }
      );
    }

    return NextResponse.json({ success: true, message: `User successfully ${action}ned` });
  } catch (error) {
    console.error("Error in POST /api/communities/[slug]/bans:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
