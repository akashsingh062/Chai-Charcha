import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Report } from "@/lib/models/Report";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { User } from "@/lib/models/User";
import { Community } from "@/lib/models/Community";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// PUT /api/admin/reports/[id] — Resolve or reject a moderation report
export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: reportId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const body = await req.json();
    const { status, action } = body; // status: 'resolved' | 'rejected', action: 'delete_content' | 'keep_content'

    if (!status || !["resolved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const oldStatus = report.status;
    report.status = status;
    await report.save();

    const details: Record<string, unknown> = {
      oldStatus,
      newStatus: status,
      targetType: report.targetType,
      targetId: report.targetId?.toString(),
    };

    // If status is resolved and action is delete_content, delete the target content
    if (status === "resolved" && action === "delete_content") {
      const targetIdStr = report.targetId?.toString();
      if (targetIdStr) {
        if (report.targetType === "Post") {
          const post = await Post.findById(targetIdStr);
          if (post) {
            // Delete all comments of the post
            await Comment.deleteMany({ postId: targetIdStr });
            // Hard delete post
            await Post.findByIdAndDelete(targetIdStr);
            details.contentDeleted = true;
          }
        } else if (report.targetType === "Comment") {
          const comment = await Comment.findById(targetIdStr);
          if (comment) {
            // Decrement post commentCount
            await Post.findByIdAndUpdate(comment.postId, {
              $inc: { commentCount: -1 },
            });
            // Delete direct comment
            await Comment.findByIdAndDelete(targetIdStr);
            details.contentDeleted = true;
          }
        } else if (report.targetType === "User") {
          const userObj = await User.findById(targetIdStr);
          if (userObj) {
            userObj.isBanned = true;
            userObj.bannedAt = new Date();
            userObj.bannedBy = new mongoose.Types.ObjectId(adminUser.id);
            userObj.banExpiresAt = null;
            await userObj.save();
            details.contentDeleted = true;
          }
        } else if (report.targetType === "Community") {
          const communityObj = await Community.findById(targetIdStr);
          if (communityObj) {
            communityObj.isBanned = true;
            communityObj.bannedAt = new Date();
            communityObj.bannedBy = new mongoose.Types.ObjectId(adminUser.id);
            communityObj.banExpiresAt = null;
            await communityObj.save();
            details.contentDeleted = true;
          }
        }

        // Auto-resolve any other pending reports for the same target content!
        await Report.updateMany(
          { targetId: report.targetId, status: "pending" },
          { $set: { status: "resolved" } }
        );
      }
    }

    // Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: status === "resolved" ? "resolve_report" : "reject_report",
      targetType: "Report",
      targetId: report._id,
      details,
    });

    return NextResponse.json({ message: "Report updated successfully", status });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// DELETE /api/admin/reports/[id] — Delete a report record from the database
export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id: reportId } = params;
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(reportId)) {
      return NextResponse.json({ error: "Invalid report ID" }, { status: 400 });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    await Report.findByIdAndDelete(reportId);

    // Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: "delete_report_record",
      targetType: "Report",
      targetId: new mongoose.Types.ObjectId(reportId),
      details: {
        reason: report.reason,
        targetType: report.targetType,
        targetId: report.targetId?.toString(),
      },
    });

    return NextResponse.json({ message: "Report record deleted successfully" });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
