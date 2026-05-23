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

    // Fetch all users and filter who has joined
    const allUsers = await User.find({}, "name username avatar role karma joinedCommunities");
    const communityIdStr = community._id.toString();

    const members = allUsers.filter((u) => {
      let joined: string[] = [];
      if (u.joinedCommunities) {
        if (Array.isArray(u.joinedCommunities)) {
          joined = u.joinedCommunities.map((id: any) => id.toString());
        } else if (typeof u.joinedCommunities === "string") {
          try {
            joined = JSON.parse(u.joinedCommunities).map((id: any) => id.toString());
          } catch (e) {
            joined = [];
          }
        }
      }
      return joined.includes(communityIdStr);
    });

    // Check if the current user has joined, or is creator/moderator
    const isJoined = members.some((m) => m._id.toString() === currentUserId);
    const isAdmin = community.creator.toString() === currentUserId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((id: any) => id.toString() === currentUserId));

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
      isModerator: community.moderators && community.moderators.some((id: any) => id.toString() === m._id.toString())
    }));

    return NextResponse.json({ success: true, members: formattedMembers });
  } catch (error) {
    console.error("Error in GET /api/communities/[slug]/members:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
