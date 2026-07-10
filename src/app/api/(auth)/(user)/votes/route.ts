import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { User } from "@/lib/models/User";
import { voteSchema } from "@/lib/Schemas/voteSchema";
import mongoose from "mongoose";
import { calculateTrendingScore } from "@/lib/apiHelpers";

// POST /api/votes - Handle upvoting and downvoting for posts and comments with atomic Karma updates
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
      const isSelfVoting = userIdObj.equals(post.author);
      let karmaDelta = 0;

      // 1. Calculate Author Karma Delta based on transition formulas
      if (!isSelfVoting) {
        if (voteType === "up") {
          if (hasUpvoted) {
            // Toggle off upvote
            karmaDelta = -10;
          } else if (hasDownvoted) {
            // Switch downvote to upvote (reverses downvote penalty -5, adds upvote +10)
            karmaDelta = 15;
          } else {
            // New upvote
            karmaDelta = 10;
          }
        } else if (voteType === "down") {
          if (hasDownvoted) {
            // Toggle off downvote (reverses downvote penalty -5)
            karmaDelta = 5;
          } else if (hasUpvoted) {
            // Switch upvote to downvote (reverses upvote +10, adds downvote penalty -5)
            karmaDelta = -15;
          } else {
            // New downvote
            karmaDelta = -5;
          }
        }
      }

      // 2. Perform Post upvotes/downvotes array updates
      if (voteType === "up") {
        if (hasUpvoted) {
          // Toggle off upvote
          (post.upvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).pull(userIdObj);
        } else {
          // Add upvote, remove downvote if present
          (post.upvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).addToSet(userIdObj);
          (post.downvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).pull(userIdObj);
        }
      } else if (voteType === "down") {
        if (hasDownvoted) {
          // Toggle off downvote
          (post.downvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).pull(userIdObj);
        } else {
          // Add downvote, remove upvote if present
          (post.downvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).addToSet(userIdObj);
          (post.upvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).pull(userIdObj);
        }
      }

      post.trendingScore = calculateTrendingScore(post);
      await post.save();

      // 3. Atomically update the author's database karma score
      if (karmaDelta !== 0 && post.author) {
        await User.findByIdAndUpdate(post.author, { $inc: { karma: karmaDelta } });
      }

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
      const isSelfVoting = userIdObj.equals(comment.author);
      let karmaDelta = 0;

      // 1. Calculate Comment Author Karma Delta
      if (!isSelfVoting) {
        if (hasUpvoted) {
          // Toggle off upvote
          karmaDelta = -2;
        } else {
          // New upvote
          karmaDelta = 2;
        }
      }

      // 2. Perform Comment upvotes array updates
      if (hasUpvoted) {
        // Toggle off upvote
        (comment.upvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).pull(userIdObj);
      } else {
        // Add upvote
        (comment.upvotes as unknown as mongoose.Types.Array<mongoose.Types.ObjectId>).addToSet(userIdObj);
      }

      await comment.save();

      // 3. Atomically update the Comment author's database karma score
      if (karmaDelta !== 0 && comment.author) {
        await User.findByIdAndUpdate(comment.author, { $inc: { karma: karmaDelta } });
      }

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
