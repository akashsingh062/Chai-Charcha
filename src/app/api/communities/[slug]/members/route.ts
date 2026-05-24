import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";

// GET /api/communities/[slug]/members - View joined members (Strictly members/mods only)
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

    const community = await Community.findOne({ slug });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const currentUserId = session.user.id;

    // Fetch all users and filter who has joined (use lean() to bypass mongoose document wrappers)
    const allUsers = await User.find({}, "name username avatar role karma joinedCommunities").lean();
    const communityIdStr = community._id.toString();

    const members = allUsers.filter((u) => {
      let joined: string[] = [];
      if (u.joinedCommunities) {
        if (Array.isArray(u.joinedCommunities)) {
          joined = u.joinedCommunities.map((id: unknown) => String(id));
        } else if (typeof u.joinedCommunities === "string") {
          try {
            joined = JSON.parse(u.joinedCommunities).map((id: unknown) => String(id));
          } catch {
            joined = [];
          }
        }
      }
      return joined.includes(communityIdStr);
    });

    // Check if the current user has joined, or is creator/moderator
    const isJoined = members.some((m) => m._id.toString() === currentUserId);
    const isAdmin = community.creator.toString() === currentUserId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((id: unknown) => String(id) === currentUserId));

    if (!isJoined && !isMod) {
      return NextResponse.json(
        { error: "Forbidden. Members directory is visible strictly to joined members of this community." },
        { status: 403 }
      );
    }

    // Clean up members before sending (remove joinedCommunities field to save bytes)
    const formattedMembers = members.map((m) => ({
      _id: m._id,
      name: m.name,
      username: m.username,
      avatar: m.avatar,
      role: m.role,
      karma: m.karma,
      isCreator: community.creator.toString() === m._id.toString(),
      isModerator: community.moderators && community.moderators.some((id: unknown) => String(id) === m._id.toString())
    }));

    return NextResponse.json({ success: true, members: formattedMembers });
  } catch (error) {
    console.error("Error in GET /api/communities/[slug]/members:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/communities/[slug]/members - Kick a member (Admins/Mods only)
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
    const { username } = await req.json();

    if (!username) {
      return NextResponse.json({ error: "Invalid body parameters. Username is required." }, { status: 400 });
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
      return NextResponse.json({ error: "Forbidden. Only moderators can kick members." }, { status: 403 });
    }

    // Find the target user by username
    const targetUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 444 });
    }

    const targetUserId = targetUser._id.toString();

    // Check permissions:
    // 1. Cannot kick the creator
    if (community.creator.toString() === targetUserId) {
      return NextResponse.json({ error: "You cannot kick the community creator." }, { status: 400 });
    }

    // 2. Moderators cannot kick other moderators (only creator can)
    const isTargetMod = community.moderators && community.moderators.some((id: unknown) => String(id) === targetUserId);
    if (isTargetMod && !isAdmin) {
      return NextResponse.json({ error: "Moderators cannot kick other moderators." }, { status: 403 });
    }

    // Kick: remove community from targetUser's joinedCommunities list, and decrement membersCount
    let joined: string[] = [];
    if (targetUser.joinedCommunities) {
      if (Array.isArray(targetUser.joinedCommunities)) {
        joined = targetUser.joinedCommunities.map((id: unknown) => String(id));
      } else if (typeof targetUser.joinedCommunities === "string") {
        try {
          joined = JSON.parse(targetUser.joinedCommunities).map((id: unknown) => String(id));
        } catch {}
      }
    }

    const communityIdStr = community._id.toString();
    const isJoined = joined.includes(communityIdStr);

    if (isJoined) {
      targetUser.joinedCommunities = joined.filter((id) => id !== communityIdStr);
      await targetUser.save();

      await Community.findOneAndUpdate(
        { slug },
        { 
          $pull: { pendingRequests: targetUser._id, moderators: targetUser._id },
          $inc: { membersCount: -1 }
        }
      );
    } else {
      // Just in case they had moderator rights or pending request but hadn't fully joined
      await Community.findOneAndUpdate(
        { slug },
        { $pull: { pendingRequests: targetUser._id, moderators: targetUser._id } }
      );
    }

    return NextResponse.json({ success: true, message: "User successfully kicked from community." });
  } catch (error) {
    console.error("Error in POST /api/communities/[slug]/members:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

