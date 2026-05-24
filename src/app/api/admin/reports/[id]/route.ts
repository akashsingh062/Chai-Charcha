import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Report } from "@/lib/models/Report";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { User } from "@/lib/models/User";
import { Community } from "@/lib/models/Community";
import { AuditLog } from "@/lib/models/AuditLog";
import { Notification } from "@/lib/models/Notification";
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
    const { status, action, warningMessage, durationHours } = body; 
    // status: 'resolved' | 'rejected'
    // action: 'delete_content' | 'keep_content' | 'warn' | 'ban_temporary' | 'ban_permanent'

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
      action,
      warningMessage,
      durationHours,
    };

    if (status === "resolved") {
      const targetIdStr = report.targetId?.toString();
      if (targetIdStr) {
        if (report.targetType === "Post") {
          if (action === "delete_content") {
            const post = await Post.findById(targetIdStr);
            if (post) {
              // Warn user if warning message is provided
              if (warningMessage && warningMessage.trim()) {
                await Notification.create({
                  recipient: post.author,
                  sender: new mongoose.Types.ObjectId(adminUser.id),
                  type: "warning",
                  link: "/",
                  message: warningMessage,
                });
              }
              // Delete all comments of the post
              await Comment.deleteMany({ postId: targetIdStr });
              // Hard delete post
              await Post.findByIdAndDelete(targetIdStr);
              details.contentDeleted = true;
            }
          } else {
            details.contentDeleted = false;
          }
        } else if (report.targetType === "Comment") {
          if (action === "delete_content") {
            const comment = await Comment.findById(targetIdStr);
            if (comment) {
              // Warn user if warning message is provided
              if (warningMessage && warningMessage.trim()) {
                await Notification.create({
                  recipient: comment.author,
                  sender: new mongoose.Types.ObjectId(adminUser.id),
                  type: "warning",
                  link: "/",
                  message: warningMessage,
                });
              }
              // Decrement post commentCount
              await Post.findByIdAndUpdate(comment.postId, {
                $inc: { commentCount: -1 },
              });
              // Delete direct comment
              await Comment.findByIdAndDelete(targetIdStr);
              details.contentDeleted = true;
            }
          } else {
            details.contentDeleted = false;
          }
        } else if (report.targetType === "User") {
          const userObj = await User.findById(targetIdStr);
          if (userObj) {
            if (action === "warn") {
              // Send warning only
              if (warningMessage && warningMessage.trim()) {
                await Notification.create({
                  recipient: userObj._id,
                  sender: new mongoose.Types.ObjectId(adminUser.id),
                  type: "warning",
                  link: "/",
                  message: warningMessage,
                });
              }
            } else if (action === "ban_permanent" || action === "ban_temporary") {
              userObj.isBanned = true;
              userObj.bannedAt = new Date();
              userObj.bannedBy = new mongoose.Types.ObjectId(adminUser.id);
              
              if (action === "ban_temporary" && typeof durationHours === "number" && durationHours > 0) {
                userObj.banExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
              } else {
                userObj.banExpiresAt = null;
              }
              await userObj.save();

              // Delete all better-auth sessions for the user to force immediate logout
              const db = mongoose.connection.db;
              if (db) {
                await db.collection("session").deleteMany({ userId: targetIdStr });
              }

              // Send warning notification
              if (warningMessage && warningMessage.trim()) {
                await Notification.create({
                  recipient: userObj._id,
                  sender: new mongoose.Types.ObjectId(adminUser.id),
                  type: "warning",
                  link: "/",
                  message: warningMessage,
                });
              }
            }
            details.userActionCompleted = true;
          }
        } else if (report.targetType === "Community") {
          const communityObj = await Community.findById(targetIdStr);
          if (communityObj) {
            if (action === "warn") {
              // Send warning to community creator
              if (warningMessage && warningMessage.trim()) {
                await Notification.create({
                  recipient: communityObj.creator,
                  sender: new mongoose.Types.ObjectId(adminUser.id),
                  type: "warning",
                  link: "/",
                  message: warningMessage,
                });
              }
            } else if (action === "ban_permanent" || action === "ban_temporary") {
              communityObj.isBanned = true;
              communityObj.bannedAt = new Date();
              communityObj.bannedBy = new mongoose.Types.ObjectId(adminUser.id);
              
              if (action === "ban_temporary" && typeof durationHours === "number" && durationHours > 0) {
                communityObj.banExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
              } else {
                communityObj.banExpiresAt = null;
              }
              await communityObj.save();

              // Send warning to community creator
              if (warningMessage && warningMessage.trim()) {
                await Notification.create({
                  recipient: communityObj.creator,
                  sender: new mongoose.Types.ObjectId(adminUser.id),
                  type: "warning",
                  link: "/",
                  message: warningMessage,
                });
              }
            }
            details.communityActionCompleted = true;
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
