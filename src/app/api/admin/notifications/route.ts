import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Notification } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";
import { AuditLog } from "@/lib/models/AuditLog";
import mongoose from "mongoose";

// GET /api/admin/notifications — List notifications with pagination
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({})
        .populate("recipient", "name username email avatar")
        .populate("sender", "name username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({}),
    ]);

    const formattedNotifications = notifications.map((n) => ({
      id: n._id.toString(),
      recipient: n.recipient,
      sender: n.sender,
      type: n.type,
      link: n.link,
      isRead: !!n.isRead,
      createdAt: n.createdAt,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// POST /api/admin/notifications — Broadcast a notification to all users or a specific user
export async function POST(req: Request) {
  try {
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    const body = await req.json();
    const { message, link, recipientId, type = "system_announcement" } = body;

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Notification message is required" }, { status: 400 });
    }
    if (!link || !link.trim()) {
      return NextResponse.json({ error: "Notification link is required" }, { status: 400 });
    }

    if (recipientId) {
      // Send to specific user
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        return NextResponse.json({ error: "Invalid recipient ID" }, { status: 400 });
      }
      const recipientExists = await User.findById(recipientId).select("_id");
      if (!recipientExists) {
        return NextResponse.json({ error: "Recipient user not found" }, { status: 404 });
      }

      await Notification.create({
        recipient: new mongoose.Types.ObjectId(recipientId),
        sender: new mongoose.Types.ObjectId(adminUser.id),
        type,
        link,
        isRead: false,
      });

      // Log action to AuditLog
      await AuditLog.create({
        admin: adminUser.id,
        action: "send_direct_notification",
        targetType: "Notification",
        details: {
          recipientId,
          message,
          link,
        },
      });

      return NextResponse.json({ message: "Direct notification sent successfully" });
    } else {
      // Broadcast to all users
      const users = await User.find({}).select("_id");
      if (users.length === 0) {
        return NextResponse.json({ error: "No users found to broadcast to" }, { status: 400 });
      }

      // Create notifications in chunks to prevent memory overload in large databases
      const notificationDocs = users.map((u) => ({
        recipient: u._id,
        sender: new mongoose.Types.ObjectId(adminUser.id),
        type,
        link,
        isRead: false,
      }));

      // Insert in chunks of 500
      const chunkSize = 500;
      for (let i = 0; i < notificationDocs.length; i += chunkSize) {
        const chunk = notificationDocs.slice(i, i + chunkSize);
        await Notification.insertMany(chunk);
      }

      // Log action to AuditLog
      await AuditLog.create({
        admin: adminUser.id,
        action: "broadcast_notification",
        targetType: "Notification",
        details: {
          recipientCount: users.length,
          message,
          link,
        },
      });

      return NextResponse.json({
        message: `Notification broadcasted successfully to ${users.length} users`,
      });
    }
  } catch (error) {
    return adminErrorResponse(error);
  }
}

// DELETE /api/admin/notifications — Bulk clean up old read or total notifications
export async function DELETE(req: Request) {
  try {
    const { user: adminUser } = await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const olderThanDays = parseInt(searchParams.get("olderThanDays") || "30");
    const onlyRead = searchParams.get("onlyRead") !== "false"; // default true

    const cutOffDate = new Date();
    cutOffDate.setDate(cutOffDate.getDate() - olderThanDays);

    const query: Record<string, unknown> = {
      createdAt: { $lt: cutOffDate },
    };

    if (onlyRead) {
      query.isRead = true;
    }

    const deleteResult = await Notification.deleteMany(query);

    // Log action to AuditLog
    await AuditLog.create({
      admin: adminUser.id,
      action: "clean_notifications",
      targetType: "Notification",
      details: {
        deletedCount: deleteResult.deletedCount,
        olderThanDays,
        onlyRead,
      },
    });

    return NextResponse.json({
      message: `Successfully deleted ${deleteResult.deletedCount} notifications`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
