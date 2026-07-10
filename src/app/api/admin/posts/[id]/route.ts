import { NextResponse } from "next/server";
import { requireModeratorOrAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { AuditLog } from "@/lib/models/AuditLog";
import { Report } from "@/lib/models/Report";
import mongoose from "mongoose";

// GET /api/admin/posts/[id] — Retrieve detailed post information
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: postId } = params;
    await requireModeratorOrAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await Post.findById(postId)
      .populate("author", "name username email avatar role")
      .populate("community", "name slug avatar")
      .populate("softDeletedBy", "name username");

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const formattedPost = {
      id: post._id.toString(),
      title: post.title,
      content: post.content,
      media: post.media || [],
      tags: post.tags || [],
      category: post.category,
      upvotesCount: post.upvotes?.length || 0,
      downvotesCount: post.downvotes?.length || 0,
      commentCount: post.commentCount,
      trendingScore: post.trendingScore || 0,
      isSoftDeleted: !!post.isSoftDeleted,
      softDeletedBy: post.softDeletedBy,
      isCommunityOnly: !!post.isCommunityOnly,
      author: post.author,
      community: post.community,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };

    return NextResponse.json({ post: formattedPost });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// PUT /api/admin/posts/[id] — Update post details (title, content, tags, category, isCommunityOnly)
export async function PUT() {
  try {
    await requireModeratorOrAdmin();
    return NextResponse.json(
      { error: "Forbidden. Administrators cannot edit user posts to protect freedom of speech." },
      { status: 403 }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// PATCH /api/admin/posts/[id] — Toggle soft delete status of post
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: postId } = params;
    const { user: adminUser } = await requireModeratorOrAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const nextSoftDeleteStatus = !post.isSoftDeleted;
    post.isSoftDeleted = nextSoftDeleteStatus;
    post.softDeletedBy = nextSoftDeleteStatus ? new mongoose.Types.ObjectId(adminUser.id) : null;
    await post.save();

    // Log to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: nextSoftDeleteStatus ? "soft_delete_post" : "restore_post",
      targetType: "Post",
      targetId: post._id,
      details: {
        postTitle: post.title,
      },
    });

    return NextResponse.json({
      message: `Post successfully ${nextSoftDeleteStatus ? "soft-deleted" : "restored"}`,
      isSoftDeleted: nextSoftDeleteStatus,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// DELETE /api/admin/posts/[id] — Hard delete post + associated comments
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: postId } = params;
    const { user: adminUser } = await requireModeratorOrAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // 1. Collect all comments of this post
    const commentIds = await Comment.find({ postId }).distinct("_id");

    // 2. Cascade delete comments, reports (for post and comments)
    await Promise.all([
      Comment.deleteMany({ postId }),
      Report.deleteMany({
        $or: [
          { targetId: new mongoose.Types.ObjectId(postId), targetType: "Post" },
          { targetId: { $in: commentIds }, targetType: "Comment" }
        ]
      }),
      Post.findByIdAndDelete(postId)
    ]);

    // Log to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: "delete_post",
      targetType: "Post",
      targetId: new mongoose.Types.ObjectId(postId),
      details: {
        deletedPost: {
          title: post.title,
          authorId: post.author?.toString(),
        },
      },
    });

    return NextResponse.json({ message: "Post and all its comments hard-deleted successfully" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
