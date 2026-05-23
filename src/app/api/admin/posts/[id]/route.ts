import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// GET /api/admin/posts/[id] — Retrieve detailed post information
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: postId } = params;
    await requireAdmin();
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
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: postId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const body = await req.json();
    const { title, content, tags, category, isCommunityOnly } = body;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const changes: Record<string, { old: any; new: any }> = {};
    const updates: Record<string, any> = {};

    if (title !== undefined && title !== post.title) {
      changes.title = { old: post.title, new: title };
      updates.title = title;
    }
    if (content !== undefined && content !== post.content) {
      changes.content = { old: post.content, new: content };
      updates.content = content;
    }
    if (tags !== undefined && JSON.stringify(tags) !== JSON.stringify(post.tags)) {
      changes.tags = { old: post.tags, new: tags };
      updates.tags = tags;
    }
    if (category !== undefined && category !== post.category) {
      changes.category = { old: post.category, new: category };
      updates.category = category;
    }
    if (isCommunityOnly !== undefined && isCommunityOnly !== post.isCommunityOnly) {
      changes.isCommunityOnly = { old: post.isCommunityOnly, new: isCommunityOnly };
      updates.isCommunityOnly = isCommunityOnly;
    }

    if (Object.keys(updates).length > 0) {
      await Post.findByIdAndUpdate(postId, { $set: updates });

      // Log to AuditLog
      await AuditLog.create({
        admin: adminUser.id,
        action: "update_post",
        targetType: "Post",
        targetId: post._id,
        details: { changes },
      });
    }

    return NextResponse.json({ message: "Post updated successfully" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// PATCH /api/admin/posts/[id] — Toggle soft delete status of post
export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: postId } = params;
    const { user: adminUser } = await requireAdmin();
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
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Delete all comments of the post
    await Comment.deleteMany({ postId });

    // Hard delete the post
    await Post.findByIdAndDelete(postId);

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
