import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Notification } from "@/lib/models/Notification";
import mongoose from "mongoose";

// GET /api/notifications - Get all notifications for current user
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUserId = new mongoose.Types.ObjectId(session.user.id);

    const notifications = await Notification.find({ recipient: currentUserId })
      .sort({ createdAt: -1 })
      .populate("sender", "name username avatar role karma")
      .lean();

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Error in notifications GET route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notifications as read
export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { notificationId, markAllAsRead } = await req.json();

    await connectDB();

    const currentUserId = new mongoose.Types.ObjectId(session.user.id);

    if (markAllAsRead === true) {
      await Notification.updateMany(
        { recipient: currentUserId, isRead: false },
        { $set: { isRead: true } }
      );
      return NextResponse.json({ success: true, message: "All notifications marked as read" });
    }

    if (!notificationId || !mongoose.Types.ObjectId.isValid(notificationId)) {
      return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: currentUserId },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: "Notification not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Error in notifications PUT route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
