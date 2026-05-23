import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { voteSchema } from "@/lib/Schemas/voteSchema";
import mongoose from "mongoose";
import { calculateTrendingScore } from "@/lib/apiHelpers";

// POST /api/votes - Handle upvoting and downvoting for posts and comments
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = voteSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const { targetId, targetType, voteType } = validatedData.data;
    const userIdObj = new mongoose.Types.ObjectId(session.user.id);

    if (targetType === "Post") {
      const post = await Post.findById(targetId);
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }

      const hasUpvoted = post.upvotes.some((id) => id.equals(userIdObj));
      const hasDownvoted = post.downvotes.some((id) => id.equals(userIdObj));

      if (voteType === "up") {
        if (hasUpvoted) {
          // Toggle off upvote
          post.upvotes = post.upvotes.filter((id) => !id.equals(userIdObj));
        } else {
          // Add upvote, remove downvote if present
          post.upvotes.push(userIdObj);
          post.downvotes = post.downvotes.filter((id) => !id.equals(userIdObj));
        }
      } else if (voteType === "down") {
        if (hasDownvoted) {
          // Toggle off downvote
          post.downvotes = post.downvotes.filter((id) => !id.equals(userIdObj));
        } else {
          // Add downvote, remove upvote if present
          post.downvotes.push(userIdObj);
          post.upvotes = post.upvotes.filter((id) => !id.equals(userIdObj));
        }
      }

      post.trendingScore = calculateTrendingScore(post);
      await post.save();

      const userVoted = post.upvotes.some((id) => id.equals(userIdObj))
        ? "up"
        : post.downvotes.some((id) => id.equals(userIdObj))
        ? "down"
        : null;

      const score = post.upvotes.length - post.downvotes.length;

      return NextResponse.json({
        success: true,
        targetType,
        targetId,
        userVoted,
        score,
        upvotes: post.upvotes.length,
        downvotes: post.downvotes.length,
      });
    } else if (targetType === "Comment") {
      if (voteType === "down") {
        return NextResponse.json(
          { error: "Downvotes are not supported on comments" },
          { status: 400 }
        );
      }

      const comment = await Comment.findById(targetId);
      if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }

      const hasUpvoted = comment.upvotes.some((id) => id.equals(userIdObj));

      if (hasUpvoted) {
        // Toggle off upvote
        comment.upvotes = comment.upvotes.filter((id) => !id.equals(userIdObj));
      } else {
        // Add upvote
        comment.upvotes.push(userIdObj);
      }

      await comment.save();

      return NextResponse.json({
        success: true,
        targetType,
        targetId,
        userVoted: comment.upvotes.some((id) => id.equals(userIdObj)) ? "up" : null,
        upvotes: comment.upvotes.length,
      });
    }

    return NextResponse.json({ error: "Invalid target type" }, { status: 400 });
  } catch (error) {
    console.error("Error toggling vote:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
