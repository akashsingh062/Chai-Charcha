import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";

// GET /api/communities - List all communities or search them
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    let query = {};
    if (search.trim()) {
      query = {
        $or: [
          { name: { $regex: search.trim(), $options: "i" } },
          { description: { $regex: search.trim(), $options: "i" } }
        ]
      };
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const currentUserId = session?.user?.id || null;

    let joinedIds: string[] = [];
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId);
      if (currentUser && currentUser.joinedCommunities) {
        if (Array.isArray(currentUser.joinedCommunities)) {
          joinedIds = currentUser.joinedCommunities.map((id: any) => id.toString());
        } else if (typeof currentUser.joinedCommunities === "string") {
          try {
            joinedIds = JSON.parse(currentUser.joinedCommunities).map((id: any) => id.toString());
          } catch (e) {}
        }
      }
    }

    const list = await Community.find(query).sort({ membersCount: -1, createdAt: -1 });

    const formattedList = list.map((c) => {
      const plain = c.toObject();
      const isJoined = currentUserId ? (
        c.creator.toString() === currentUserId || 
        (c.moderators && c.moderators.some((m: any) => m.toString() === currentUserId)) || 
        joinedIds.includes(c._id.toString())
      ) : false;

      const isPending = currentUserId ? (
        c.pendingRequests && c.pendingRequests.some((id: any) => id.toString() === currentUserId)
      ) : false;

      return {
        ...plain,
        isJoined,
        isPending
      };
    });

    return NextResponse.json({ success: true, communities: formattedList });
  } catch (error) {
    console.error("Error in GET /api/communities:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/communities - Create a new community
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, slug, description, isPrivate, rules } = await req.json();

    if (!name || name.trim().length < 3 || name.trim().length > 30) {
      return NextResponse.json({ error: "Community name must be between 3 and 30 characters" }, { status: 400 });
    }

    if (!description || description.trim().length < 10 || description.trim().length > 200) {
      return NextResponse.json({ error: "Description must be between 10 and 200 characters" }, { status: 400 });
    }

    // Slug validation: alphanumeric and hyphens, lowercase
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!cleanSlug || cleanSlug.length < 3 || cleanSlug.length > 30) {
      return NextResponse.json({ error: "Slug must be between 3 and 30 characters and alphanumeric/hyphens only" }, { status: 400 });
    }

    await connectDB();

    // Check if slug is unique
    const existing = await Community.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json({ error: "A community with this slug already exists" }, { status: 400 });
    }

    const creatorId = new mongoose.Types.ObjectId(session.user.id);

    // Create the community
    const newCommunity = await Community.create({
      name: name.trim(),
      slug: cleanSlug,
      description: description.trim(),
      creator: creatorId,
      moderators: [creatorId],
      membersCount: 1, // Creator is the first member
      isPrivate: !!isPrivate,
      rules: Array.isArray(rules) && rules.length > 0 ? rules.map(r => r.trim()).filter(Boolean) : undefined,
    });

    // Add to creator's joined communities
    const user = await User.findById(session.user.id);
    if (user) {
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
      
      const newCommunityIdStr = newCommunity._id.toString();
      if (!joined.includes(newCommunityIdStr)) {
        joined.push(newCommunityIdStr);
        user.joinedCommunities = joined;
        await user.save();
      }
    }

    return NextResponse.json({ success: true, community: newCommunity });
  } catch (error) {
    console.error("Error in POST /api/communities:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
