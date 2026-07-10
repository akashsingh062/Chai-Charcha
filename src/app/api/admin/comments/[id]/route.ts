import { NextResponse } from "next/server";
import { requireModeratorOrAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Comment } from "@/lib/models/Comment";
import { Post } from "@/lib/models/Post";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// Helper to recursively gather all nested reply IDs
async function getNestedReplyIds(commentId: string): Promise<string[]> {
  const replies = await Comment.find({ parentId: commentId }).select("_id");
  const replyIds = replies.map((r) => r._id.toString());
  
  let allIds = [...replyIds];
  for (const id of replyIds) {
    const nestedIds = await getNestedReplyIds(id);
    allIds = allIds.concat(nestedIds);
  }
  return allIds;
}

// PUT /api/admin/comments/[id] — Edit comment content
export async function PUT() {
  try {
    await requireModeratorOrAdmin();
    return NextResponse.json(
      { error: "Forbidden. Administrators cannot edit user comments to protect freedom of speech." },
      { status: 403 }
    );
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// DELETE /api/admin/comments/[id] — Hard delete comment + nested replies, decrement commentCount
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: commentId } = params;
    const { user: adminUser } = await requireModeratorOrAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return NextResponse.json({ error: "Invalid comment ID" }, { status: 400 });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    // 1. Gather all nested reply IDs (children, grandchildren, etc.)
    const nestedIds = await getNestedReplyIds(commentId);
    const allIdsToDelete = [commentId, ...nestedIds];

    // 2. Perform deletion of all comments in the tree
    await Comment.deleteMany({ _id: { $in: allIdsToDelete } });

    // 3. Remove this comment from its parent replies array (if it has a parent)
    if (comment.parentId) {
      await Comment.findByIdAndUpdate(comment.parentId, {
        $pull: { replies: commentId },
      });
    }

    // 4. Decrement parent post's commentCount by the total number of deleted comments
    const deletedCount = allIdsToDelete.length;
    await Post.findByIdAndUpdate(comment.postId, {
      $inc: { commentCount: -deletedCount },
    });

    // 5. Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: "delete_comment",
      targetType: "Comment",
      targetId: new mongoose.Types.ObjectId(commentId),
      details: {
        deletedCount,
        commentContent: comment.content,
        postId: comment.postId?.toString(),
      },
    });

    return NextResponse.json({
      message: `Comment and ${deletedCount - 1} replies deleted successfully`,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
