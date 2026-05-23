import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Comment } from "@/lib/models/Comment";
import { Post } from "@/lib/models/Post";
import { z } from "zod";
import { formatTimeAgo, updatePostTrendingScore } from "@/lib/apiHelpers";

const updateCommentSchema = z.object({
  content: z.string({
    message: "Comment content must be a valid string",
  })
    .min(1, "Comment cannot be empty")
    .max(2000, "Comment cannot exceed 2000 characters")
    .trim(),
});

// Recursive helper to fetch all child reply IDs under a parent comment
async function collectAllChildCommentIds(commentId: string): Promise<string[]> {
  const children = await Comment.find({ parentId: commentId });
  let ids: string[] = children.map((c) => c._id.toString());
  for (const child of children) {
    const subChildIds = await collectAllChildCommentIds(child._id.toString());
    ids = ids.concat(subChildIds);
  }
  return ids;
}

// PUT /api/comments/[id] - Edit a comment
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
    const validatedData = updateCommentSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check authorship
    if (comment.author.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: You are not the author of this comment" }, { status: 403 });
    }

    comment.content = validatedData.data.content;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name username avatar role karma"
    ) as unknown as {
      _id: mongoose.Types.ObjectId;
      content: string;
      upvotes: mongoose.Types.ObjectId[];
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
      return NextResponse.json({ error: "Failed to load updated comment" }, { status: 500 });
    }

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
      replies: [], // Front-end will map dynamic nested trees, return empty list or rebuild if needed.
    };

    return NextResponse.json({ comment: formattedComment });
  } catch (error) {
    console.error("Error editing comment:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/comments/[id] - Recursive cascading deletion of comment and replies
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

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // Check authorization: author, admin, or moderator
    const canDelete =
      comment.author.toString() === session.user.id ||
      session.user.role === "admin" ||
      session.user.role === "moderator";

    if (!canDelete) {
      return NextResponse.json({ error: "Forbidden: You cannot delete this comment" }, { status: 403 });
    }

    // Collect all recursive child comment IDs
    const childIds = await collectAllChildCommentIds(id);
    const allIdsToDelete = [id, ...childIds];

    // Delete all collected comments
    await Comment.deleteMany({ _id: { $in: allIdsToDelete } });

    // If it has a parent comment, pull its ID from the parent's replies list
    if (comment.parentId) {
      await Comment.findByIdAndUpdate(comment.parentId, {
        $pull: { replies: comment._id },
      });
    }

    // Decrement comment count on the post by the number of deleted comments
    await Post.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -allIdsToDelete.length },
    });
    await updatePostTrendingScore(comment.postId);

    return NextResponse.json({
      message: "Comment and all replies recursively deleted successfully",
      deletedCount: allIdsToDelete.length,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
