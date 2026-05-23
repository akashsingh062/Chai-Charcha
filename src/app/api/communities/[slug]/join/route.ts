import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";

// POST /api/communities/[slug]/join - Join or leave a community
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
    const { action } = await req.json();

    if (action !== "join" && action !== "leave") {
      return NextResponse.json({ error: "Invalid action. Must be 'join' or 'leave'" }, { status: 400 });
    }

    await connectDB();

    const community = await Community.findOne({ slug });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    // Check if user is banned
    if (community.bannedUsers && community.bannedUsers.some((id: any) => id.toString() === session.user.id)) {
      return NextResponse.json({ error: "You are banned from this community." }, { status: 403 });
    }

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let joined: string[] = [];
    if (user.joinedCommunities) {
      if (Array.isArray(user.joinedCommunities)) {
        joined = user.joinedCommunities.map((id: any) => id.toString());
      } else if (typeof user.joinedCommunities === "string") {
        try {
          joined = JSON.parse(user.joinedCommunities).map((id: any) => id.toString());
        } catch (e) {
          joined = [];
        }
      }
    }

    const communityIdStr = community._id.toString();
    const isAlreadyJoined = joined.includes(communityIdStr);

    if (action === "join") {
      if (community.isPrivate) {
        // Restricted/Private community -> add to pending requests queue
        const updatedCommunity = await Community.findOneAndUpdate(
          { slug },
          { $addToSet: { pendingRequests: user._id } },
          { new: true }
        );
        return NextResponse.json({
          success: true,
          isJoined: false,
          isPending: true,
          membersCount: updatedCommunity?.membersCount || 0
        });
      } else {
        // Public community -> join immediately
        if (!isAlreadyJoined) {
          joined.push(communityIdStr);
          user.joinedCommunities = joined;
          await user.save();

          const updatedCommunity = await Community.findOneAndUpdate(
            { slug },
            { $inc: { membersCount: 1 } },
            { new: true }
          );
          return NextResponse.json({
            success: true,
            isJoined: true,
            isPending: false,
            membersCount: updatedCommunity?.membersCount || 0
          });
        }
        return NextResponse.json({
          success: true,
          isJoined: true,
          isPending: false,
          membersCount: community.membersCount
        });
      }
    } else {
      // Leave or cancel request
      let updatedCommunity = community;

      // Remove from pending requests if present
      if (community.pendingRequests && community.pendingRequests.some((id: any) => id.toString() === user._id.toString())) {
        updatedCommunity = await Community.findOneAndUpdate(
          { slug },
          { $pull: { pendingRequests: user._id } },
          { new: true }
        ) || community;
      }

      if (isAlreadyJoined) {
        joined = joined.filter((id) => id !== communityIdStr);
        user.joinedCommunities = joined;
        await user.save();

        updatedCommunity = await Community.findOneAndUpdate(
          { slug },
          { $inc: { membersCount: -1 } },
          { new: true }
        ) || updatedCommunity;
      }

      return NextResponse.json({
        success: true,
        isJoined: false,
        isPending: false,
        membersCount: Math.max(0, updatedCommunity?.membersCount || 0)
      });
    }
  } catch (error) {
    console.error("Error in join POST route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

