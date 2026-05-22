import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { postSchema } from "@/lib/Schemas/postSchema";
import { formatPostForFrontend, DBPost, DBComment } from "@/lib/apiHelpers";

// GET /api/posts - Get all posts populated with author profiles and comment trees
export async function GET() {
  try {
    await connectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id || null;

    // Fetch posts populated with author
    const dbPosts = await Post.find({})
      .populate("author", "name username avatar role karma")
      .sort({ createdAt: -1 }) as unknown as DBPost[];

    const postIds = dbPosts.map((p) => p._id);

    // Fetch all comments for all these posts in one batch
    const dbComments = await Comment.find({ postId: { $in: postIds } })
      .populate("author", "name username avatar role karma")
      .sort({ createdAt: 1 }) as unknown as DBComment[];

    // Map comments by postId for fast retrieval
    const commentsByPostId: Record<string, DBComment[]> = {};
    dbComments.forEach((comment) => {
      const pid = comment.postId.toString();
      if (!commentsByPostId[pid]) {
        commentsByPostId[pid] = [];
      }
      commentsByPostId[pid].push(comment);
    });

    // Format all posts
    const posts = dbPosts.map((post) => {
      const postComments = commentsByPostId[post._id.toString()] || [];
      return formatPostForFrontend(post, postComments, userId);
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

    const newPost = new Post({
      author: session.user.id,
      title: validatedData.data.title,
      content: validatedData.data.content,
      media: validatedData.data.media || [],
      tags: validatedData.data.tags || [],
      community: validatedData.data.community || null,
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
