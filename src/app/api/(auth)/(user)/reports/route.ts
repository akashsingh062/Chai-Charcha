import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Report } from "@/lib/models/Report";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { User } from "@/lib/models/User";
import { Community } from "@/lib/models/Community";
import mongoose from "mongoose";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    const body = await req.json();
    const { targetId, targetType, reason } = body;

    if (!targetId || !targetType || !reason) {
      return NextResponse.json({ error: "targetId, targetType, and reason are required" }, { status: 400 });
    }

    if (!["Post", "Comment", "User", "Community"].includes(targetType)) {
      return NextResponse.json({ error: "Invalid targetType" }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return NextResponse.json({ error: "Invalid targetId format" }, { status: 400 });
    }

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      return NextResponse.json({ error: "Reason cannot be empty" }, { status: 400 });
    }

    // Prevent self-reporting
    if (targetType === "User") {
      if (targetId.toString() === userId.toString()) {
        return NextResponse.json({ error: "You cannot report yourself." }, { status: 400 });
      }
      const targetUser = await User.findById(targetId);
      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    } else if (targetType === "Post") {
      const post = await Post.findById(targetId);
      if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
      }
      if (post.author.toString() === userId.toString()) {
        return NextResponse.json({ error: "You cannot report your own post." }, { status: 400 });
      }
    } else if (targetType === "Comment") {
      const comment = await Comment.findById(targetId);
      if (!comment) {
        return NextResponse.json({ error: "Comment not found" }, { status: 404 });
      }
      if (comment.author.toString() === userId.toString()) {
        return NextResponse.json({ error: "You cannot report your own comment." }, { status: 400 });
      }
    } else if (targetType === "Community") {
      const community = await Community.findById(targetId);
      if (!community) {
        return NextResponse.json({ error: "Community not found" }, { status: 404 });
      }
      if (community.creator.toString() === userId.toString()) {
        return NextResponse.json({ error: "You cannot report your own community." }, { status: 400 });
      }
    }

    // Check if duplicate pending report exists from the same reporter
    const existingReport = await Report.findOne({
      targetId,
      reporter: userId,
      status: "pending",
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this and it is currently under review." },
        { status: 400 }
      );
    }

    const report = await Report.create({
      targetId: new mongoose.Types.ObjectId(targetId),
      targetType,
      reporter: new mongoose.Types.ObjectId(userId),
      reason: trimmedReason,
      status: "pending",
    });

    return NextResponse.json({ message: "Report submitted successfully", reportId: report._id }, { status: 201 });
  } catch (error) {
    console.error("Failed to submit report:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
