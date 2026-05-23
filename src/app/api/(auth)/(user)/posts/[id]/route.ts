import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { postSchema } from "@/lib/Schemas/postSchema";
import { formatPostForFrontend, DBPost, DBComment, calculateTrendingScore } from "@/lib/apiHelpers";
import mongoose from "mongoose";

// GET /api/posts/[id] - Get a single post populated with author and comment tree
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const userId = session?.user?.id || null;

    const dbPostDoc = await Post.findById(id).populate(
      "author",
      "name username avatar role karma"
    );

    if (!dbPostDoc) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const dbPost = dbPostDoc as unknown as DBPost;

    // Fetch all comments for this post
    const dbComments = await Comment.find({ postId: id })
      .populate("author", "name username avatar role karma")
      .sort({ createdAt: 1 }) as unknown as DBComment[];

    const formattedPost = formatPostForFrontend(dbPost, dbComments, userId);

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error("Error fetching single post:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/posts/[id] - Update a post
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check authorship
    if (post.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You are not the author of this post" }, { status: 403 });
    }

    // Update fields
    let category = validatedData.data.category;
    if (category === "undefined" || category === "null") {
      category = "Tech & Architecture";
    }
    if (category) {
      post.category = category;
    }
    post.title = validatedData.data.title;
    post.content = validatedData.data.content;
    post.media = validatedData.data.media || [];
    post.tags = validatedData.data.tags || [];
    if (validatedData.data.community !== undefined) {
      post.community = validatedData.data.community
        ? new mongoose.Types.ObjectId(validatedData.data.community) as mongoose.Types.ObjectId
        : null;
    }

    await post.save();

    const populatedPost = await Post.findById(post._id).populate(
      "author",
      "name username avatar role karma"
    ) as unknown as DBPost;

    const dbComments = await Comment.find({ postId: id })
      .populate("author", "name username avatar role karma")
      .sort({ createdAt: 1 }) as unknown as DBComment[];

    const formattedPost = formatPostForFrontend(populatedPost, dbComments, session.user.id);

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/posts/[id] - Delete a post and perform cascading deletion of comments
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check authorization: only author or admin role can delete
    const isAdmin = session.user.role === "admin";
    if (post.author.toString() !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You cannot delete this post" }, { status: 403 });
    }

    // 1. Delete all comments associated with this post to prevent orphans
    await Comment.deleteMany({ postId: id });

    // 2. Delete the post document
    await Post.findByIdAndDelete(id);

    return NextResponse.json({ message: "Post and all its comments deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
