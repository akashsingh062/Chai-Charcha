import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";

// GET /api/communities/[slug]/requests - View pending requests (Admins/Mods only)
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
      "pendingRequests",
      "name username avatar role karma"
    );

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const userId = session.user.id;
    const isAdmin = community.creator.toString() === userId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((id: unknown) => String(id) === userId));

    if (!isMod) {
      return NextResponse.json({ error: "Forbidden. Only moderators can view pending requests." }, { status: 403 });
    }

    return NextResponse.json({ success: true, requests: community.pendingRequests || [] });
  } catch (error) {
    console.error("Error in GET /api/communities/[slug]/requests:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/communities/[slug]/requests - Approve or Reject a pending request (Admins/Mods only)
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
    const { userId, action } = await req.json();

    if (!userId || (action !== "approve" && action !== "reject")) {
      return NextResponse.json({ error: "Invalid body parameters" }, { status: 400 });
    }

    await connectDB();

    const community = await Community.findOne({ slug });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const currentUserId = session.user.id;
    const isAdmin = community.creator.toString() === currentUserId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((id: unknown) => String(id) === currentUserId));

    if (!isMod) {
      return NextResponse.json({ error: "Forbidden. Only moderators can process requests." }, { status: 403 });
    }

    // Check if requested user is in pending requests
    const isPending = community.pendingRequests && community.pendingRequests.some((id: unknown) => String(id) === userId);
    if (!isPending) {
      return NextResponse.json({ error: "User is not in the pending requests queue." }, { status: 400 });
    }

    if (action === "approve") {
      // 1. Add community to user's joinedCommunities list
      const targetUser = await User.findById(userId);
      if (targetUser) {
        let joined: string[] = [];
        if (targetUser.joinedCommunities) {
          if (Array.isArray(targetUser.joinedCommunities)) {
            joined = targetUser.joinedCommunities.map((id: unknown) => String(id));
          } else if (typeof targetUser.joinedCommunities === "string") {
            try {
              joined = JSON.parse(targetUser.joinedCommunities).map((id: unknown) => String(id));
            } catch {
              // Optional catch binding
            }
          }
        }

        const communityIdStr = community._id.toString();
        if (!joined.includes(communityIdStr)) {
          joined.push(communityIdStr);
          targetUser.joinedCommunities = joined;
          await targetUser.save();
        }
      }

      // 2. Remove user from pendingRequests and increment membersCount atomically
      await Community.findOneAndUpdate(
        { slug },
        {
          $pull: { pendingRequests: userId },
          $inc: { membersCount: 1 }
        }
      );
    } else {
      // Reject action -> just remove from pending requests queue
      await Community.findOneAndUpdate(
        { slug },
        { $pull: { pendingRequests: userId } }
      );
    }

    return NextResponse.json({ success: true, message: `Request successfully ${action}d` });
  } catch (error) {
    console.error("Error in POST /api/communities/[slug]/requests:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
