import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Comment } from "@/lib/models/Comment";
import { Post } from "@/lib/models/Post";
import { commentSchema } from "@/lib/Schemas/commentSchema";
import { formatTimeAgo, updatePostTrendingScore } from "@/lib/apiHelpers";

// POST /api/comments - Create a comment or reply
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = commentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const { postId, content, parentId } = validatedData.data;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check parent comment if parentId is provided
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 404 });
      }
    }

    // Create comment
    const newComment = new Comment({
      postId,
      author: session.user.id,
      content,
      parentId: parentId || null,
      replies: [],
      upvotes: [],
    });

    await newComment.save();

    // If it's a nested reply, update the parent comment's replies array
    if (parentId) {
      await Comment.findByIdAndUpdate(parentId, {
        $push: { replies: newComment._id },
      });
    }

    // Increment comment count on the post
    await Post.findByIdAndUpdate(postId, {
      $inc: { commentCount: 1 },
    });
    await updatePostTrendingScore(postId);

    const populatedComment = await Comment.findById(newComment._id).populate(
      "author",
      "name username avatar role karma"
    ) as unknown as {
      _id: import("mongoose").Types.ObjectId;
      content: string;
      upvotes: import("mongoose").Types.ObjectId[];
      createdAt: Date;
      author: {
        name: string;
        username: string;
        avatar?: string;
        role: string;
        karma: number;
      } | null;
    };

    if (!populatedComment) {
      return NextResponse.json({ error: "Failed to load created comment" }, { status: 500 });
    }

    // Format for frontend mapping
    const formattedComment = {
      id: populatedComment._id.toString(),
      author: {
        name: populatedComment.author?.name || "Unknown",
        avatar: populatedComment.author?.avatar || (populatedComment.author?.name ? populatedComment.author.name.substring(0, 2).toUpperCase() : "U"),
        role: populatedComment.author?.role || "Member",
      },
      content: populatedComment.content,
      upvotes: populatedComment.upvotes?.length || 0,
      timeAgo: formatTimeAgo(populatedComment.createdAt),
      createdAt: populatedComment.createdAt ? populatedComment.createdAt.toISOString() : undefined,
      replies: [],
    };

    return NextResponse.json({ comment: formattedComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
