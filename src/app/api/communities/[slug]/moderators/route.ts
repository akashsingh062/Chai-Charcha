import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";

// POST /api/communities/[slug]/moderators - Promote or Demote a moderator (Creator only)
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

    if (!username || (action !== "promote" && action !== "demote")) {
      return NextResponse.json({ error: "Invalid body parameters" }, { status: 400 });
    }

    await connectDB();

    const community = await Community.findOne({ slug });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Only the original community creator can manage moderators
    if (community.creator.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. Only the community creator can manage moderators." }, { status: 403 });
    }

    // Find the target user by username
    const targetUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 444 });
    }

    const targetUserId = targetUser._id;

    // Creator cannot be demoted
    if (community.creator.toString() === targetUserId.toString()) {
      return NextResponse.json({ error: "The community creator is already the head administrator." }, { status: 400 });
    }

    if (action === "promote") {
      // 1. Add to community moderators
      await Community.findOneAndUpdate(
        { slug },
        { $addToSet: { moderators: targetUserId } }
      );

      // 2. If user is not joined yet, automatically join them
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

        await Community.findOneAndUpdate(
          { slug },
          { $inc: { membersCount: 1 } }
        );
      }
    } else {
      // Demote action -> remove from community moderators
      await Community.findOneAndUpdate(
        { slug },
        { $pull: { moderators: targetUserId } }
      );
    }

    return NextResponse.json({ success: true, message: `User successfully ${action}d` });
  } catch (error) {
    console.error("Error in POST /api/communities/[slug]/moderators:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
