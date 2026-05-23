import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";

// GET /api/communities/[slug] - Get metadata for a community, populated with creator info
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const community = await Community.findOne({ slug }).populate(
      "creator",
      "name username avatar role karma"
    );

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let isJoined = false;
    let isPending = false;
    let isBanned = false;
    let isAdmin = false;
    let isModerator = false;

    if (session?.user?.id) {
      const userId = session.user.id;
      
      const creatorIdStr = community.creator._id 
        ? community.creator._id.toString() 
        : community.creator.toString();

      isAdmin = creatorIdStr === userId;
      isModerator = isAdmin || (community.moderators && community.moderators.some((id: any) => id.toString() === userId));
      isBanned = community.bannedUsers && community.bannedUsers.some((id: any) => id.toString() === userId);
      isPending = community.pendingRequests && community.pendingRequests.some((id: any) => id.toString() === userId);

      const currentUser = await User.findById(userId);
      if (currentUser && currentUser.joinedCommunities) {
        let joined: string[] = [];
        if (Array.isArray(currentUser.joinedCommunities)) {
          joined = currentUser.joinedCommunities.map((id: any) => id.toString());
        } else if (typeof currentUser.joinedCommunities === "string") {
          try {
            joined = JSON.parse(currentUser.joinedCommunities).map((id: any) => id.toString());
          } catch (e) {
            joined = [];
          }
        }
        isJoined = joined.includes(community._id.toString());
      }
    }

    return NextResponse.json({ 
      success: true, 
      community, 
      isJoined, 
      isPending, 
      isBanned, 
      isAdmin, 
      isModerator 
    });
  } catch (error) {
    console.error("Error in GET /api/communities/[slug]:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/communities/[slug] - Update community settings (Admins/Mods only)
export async function PUT(
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
    const { description, isPrivate, rules } = await req.json();

    await connectDB();

    const community = await Community.findOne({ slug });
    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const currentUserId = session.user.id;
    const isAdmin = community.creator.toString() === currentUserId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((uid: any) => uid.toString() === currentUserId));

    if (!isMod) {
      return NextResponse.json({ error: "Forbidden. Only moderators can update settings." }, { status: 403 });
    }

    if (description !== undefined) {
      if (description.trim().length < 10 || description.trim().length > 200) {
        return NextResponse.json({ error: "Description must be between 10 and 200 characters" }, { status: 400 });
      }
      community.description = description.trim();
    }

    if (isPrivate !== undefined) {
      community.isPrivate = !!isPrivate;
    }

    if (rules !== undefined && Array.isArray(rules)) {
      community.rules = rules.map((r: string) => r.trim()).filter(Boolean);
    }

    await community.save();

    return NextResponse.json({ success: true, community });
  } catch (error) {
    console.error("Error in PUT /api/communities/[slug]:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/communities/[slug] - Delete a community (Creator only)
export async function DELETE(
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

    // Only original creator can delete the community
    if (community.creator.toString() !== session.user.id) {
      return NextResponse.json({ error: "Only the community creator can delete it." }, { status: 403 });
    }

    const communityId = community._id;

    // Remove the community
    await Community.deleteOne({ _id: communityId });

    // Delete all posts belonging to this community from DB
    await Post.deleteMany({ community: communityId });

    // Also update all users who had joined this community to remove it from joined list
    // User model holds joinedCommunities which is Mixed, but let's pull it out of arrays
    const users = await User.find({});
    for (const u of users) {
      let joined: string[] = [];
      if (u.joinedCommunities) {
        if (Array.isArray(u.joinedCommunities)) {
          joined = u.joinedCommunities.map((id: any) => id.toString());
        } else if (typeof u.joinedCommunities === "string") {
          try {
            joined = JSON.parse(u.joinedCommunities).map((id: any) => id.toString());
          } catch (e) {}
        }
      }
      const communityIdStr = communityId.toString();
      if (joined.includes(communityIdStr)) {
        u.joinedCommunities = joined.filter(id => id !== communityIdStr);
        await u.save();
      }
    }

    return NextResponse.json({ success: true, message: "Community and all associated posts deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/communities/[slug]:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

