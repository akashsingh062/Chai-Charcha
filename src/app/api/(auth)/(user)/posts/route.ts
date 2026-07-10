import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { postSchema } from "@/lib/Schemas/postSchema";
import { formatPostForFrontend, DBPost, calculateTrendingScore } from "@/lib/apiHelpers";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";

// GET /api/posts - Get all posts populated with author profiles and comment trees
export async function GET(req: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const sort = searchParams.get("sort") || "trending";
    const communityId = searchParams.get("communityId");
    const communitySlug = searchParams.get("communitySlug");

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id || null;

    const query: {
      community?: { $in?: mongoose.Types.ObjectId[]; $nin?: mongoose.Types.ObjectId[] } | mongoose.Types.ObjectId | string;
      isCommunityOnly?: { $ne: boolean };
      isSoftDeleted?: { $ne: boolean };
      author?: mongoose.Types.ObjectId;
    } = {};
    let isCurrentUserMod = false;

    if (communityId) {
      if (mongoose.Types.ObjectId.isValid(communityId)) {
        query.community = new mongoose.Types.ObjectId(communityId);
        const comm = await Community.findById(communityId);
        if (comm && userId) {
          const isAdmin = comm.creator.toString() === userId;
          isCurrentUserMod = isAdmin || (comm.moderators && comm.moderators.some((id: unknown) => String(id) === userId));
        }
      }
    } else if (communitySlug) {
      const comm = await Community.findOne({ slug: communitySlug });
      if (comm) {
        query.community = comm._id;
        if (userId) {
          const isAdmin = comm.creator.toString() === userId;
          isCurrentUserMod = isAdmin || (comm.moderators && comm.moderators.some((id: unknown) => String(id) === userId));
        }
      } else {
        return NextResponse.json({ posts: [] });
      }
    }

    const feed = searchParams.get("feed");
    if (feed === "home" && userId) {
      const currentUser = await User.findById(userId);
      if (currentUser) {
        let joined: mongoose.Types.ObjectId[] = [];
        if (Array.isArray(currentUser.joinedCommunities)) {
          joined = currentUser.joinedCommunities.map((id: unknown) => new mongoose.Types.ObjectId(String(id)));
        } else if (typeof currentUser.joinedCommunities === "string") {
          try {
            joined = JSON.parse(currentUser.joinedCommunities).map((id: unknown) => new mongoose.Types.ObjectId(String(id)));
          } catch {
            joined = [];
          }
        }
        query.community = { $in: joined };
      }
    }

    // If fetching global feed (neither community slug/id nor personalized joined-only feed)
    if (!communityId && !communitySlug && feed !== "home") {
      query.isCommunityOnly = { $ne: true };
    }

    // Hide soft deleted posts, unless the user is a moderator of this specific community
    if (!isCurrentUserMod) {
      query.isSoftDeleted = { $ne: true };
    }

    const authorId = searchParams.get("authorId");
    if (authorId) {
      if (mongoose.Types.ObjectId.isValid(authorId)) {
        query.author = new mongoose.Types.ObjectId(authorId);
      }
    }

    // Exclude banned communities from any feed (only if ban is still active/not expired)
    const now = new Date();
    const bannedCommunities = await Community.find({
      isBanned: true,
      $or: [
        { banExpiresAt: null },
        { banExpiresAt: { $gt: now } }
      ]
    }).select("_id").lean();
    const bannedCommunityIds = bannedCommunities.map((c) => c._id.toString());
    if (bannedCommunityIds.length > 0) {
      const bannedObjectIds = bannedCommunityIds.map(id => new mongoose.Types.ObjectId(id));
      if (query.community) {
        const commObj = query.community as { $in?: mongoose.Types.ObjectId[] };
        if (commObj.$in) {
          commObj.$in = commObj.$in.filter(
            (id: unknown) => !bannedCommunityIds.includes(String(id))
          );
        } else if (bannedCommunityIds.includes(String(query.community))) {
          // Banned community targeted directly
          return NextResponse.json({ posts: [] });
        }
      } else {
        query.community = { $nin: bannedObjectIds };
      }
    }

    // Fetch posts populated with author and community, sorted by recent by default
    const dbPosts = await Post.find(query)
      .populate("author", "name username avatar role karma")
      .populate("community", "name slug description membersCount")
      .sort({ createdAt: -1 })
      .lean() as unknown as DBPost[];

    let sortedDbPosts = [...dbPosts];
    if (sort === "trending") {
      sortedDbPosts = dbPosts.map((post) => {
        const score = calculateTrendingScore(post);
        return { ...post, trendingScore: score };
      });
      sortedDbPosts.sort((a, b) => {
        const scoreDiff = (b.trendingScore || 0) - (a.trendingScore || 0);
        if (scoreDiff !== 0) return scoreDiff;
        // Secondary sort: newest first
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    // Format all posts (comments are fetched on-demand when expanded)
    const posts = sortedDbPosts.map((post) => {
      return formatPostForFrontend(post, [], userId);
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/posts - Create a new post
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = postSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user is globally banned
    const { checkUserStatus } = await import("@/lib/adminAuth");
    const { isBanned, banExpiresAt } = await checkUserStatus(session.user.id);
    if (isBanned) {
      const expirationMsg = banExpiresAt
        ? ` until ${new Date(banExpiresAt).toLocaleString()}`
        : " permanently";
      return NextResponse.json(
        { error: `Your account is banned${expirationMsg}.` },
        { status: 403 }
      );
    }

    // Check if user is banned in the community, or if the community itself is banned, or if the user has not joined
    if (validatedData.data.community) {
      const comm = await Community.findById(validatedData.data.community);
      if (comm) {
        const isCommBanActive = comm.isBanned && (comm.banExpiresAt === null || (comm.banExpiresAt && new Date(comm.banExpiresAt as string | number | Date).getTime() > Date.now()));
        if (isCommBanActive) {
          return NextResponse.json({ error: "This community has been suspended/banned by administrators." }, { status: 403 });
        }
        if (comm.bannedUsers && comm.bannedUsers.some((uid: unknown) => String(uid) === session.user.id)) {
          return NextResponse.json({ error: "You are banned from posting in this community." }, { status: 403 });
        }

        // Verify user has joined the community
        const userObj = await User.findById(session.user.id).select("joinedCommunities");
        if (!userObj) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let joined: string[] = [];
        if (userObj.joinedCommunities) {
          if (Array.isArray(userObj.joinedCommunities)) {
            joined = userObj.joinedCommunities.map((id: unknown) => String(id));
          } else if (typeof userObj.joinedCommunities === "string") {
            try {
              joined = JSON.parse(userObj.joinedCommunities).map((id: unknown) => String(id));
            } catch {
              joined = [];
            }
          }
        }

        if (!joined.includes(comm._id.toString())) {
          return NextResponse.json({ error: "Forbidden. You must join this community before posting in it." }, { status: 403 });
        }
      }
    }

    let category = validatedData.data.category;
    if (!category || category === "undefined" || category === "null") {
      category = "General Charcha";
    }

    const newPost = new Post({
      author: session.user.id,
      title: validatedData.data.title,
      content: validatedData.data.content,
      media: validatedData.data.media || [],
      tags: validatedData.data.tags || [],
      category: category,
      community: validatedData.data.community || null,
      isCommunityOnly: validatedData.data.isCommunityOnly || false,
      upvotes: [],
      downvotes: [],
      commentCount: 0,
    });

    await newPost.save();

    const populatedPost = await Post.findById(newPost._id).populate(
      "author",
      "name username avatar role karma"
    ) as unknown as DBPost;

    const formattedPost = formatPostForFrontend(populatedPost, [], session.user.id);

    return NextResponse.json({ post: formattedPost }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
