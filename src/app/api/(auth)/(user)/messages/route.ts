import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Message } from "@/lib/models/Message";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import mongoose from "mongoose";

// GET /api/messages - Fetch chat history or active threads list
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatWith = searchParams.get("chatWith");

    await connectDB();

    const currentUserId = new mongoose.Types.ObjectId(session.user.id);

    // 1. Fetch detailed message history with a specific user
    if (chatWith) {
      if (!mongoose.Types.ObjectId.isValid(chatWith)) {
        return NextResponse.json({ error: "Invalid target user ID" }, { status: 400 });
      }
      const targetUserId = new mongoose.Types.ObjectId(chatWith);

      // Fetch all messages between them with lean()
      const messages = await Message.find({
        $or: [
          { sender: currentUserId, recipient: targetUserId },
          { sender: targetUserId, recipient: currentUserId }
        ]
      })
      .sort({ createdAt: 1 })
      .populate("sender", "name username avatar")
      .populate("recipient", "name username avatar")
      .lean();

      // Mark incoming messages as read
      await Message.updateMany(
        { sender: targetUserId, recipient: currentUserId, isRead: false },
        { $set: { isRead: true } }
      );

      // Also mark corresponding message notifications as read
      await Notification.updateMany(
        { sender: targetUserId, recipient: currentUserId, type: "message", isRead: false },
        { $set: { isRead: true } }
      );

      return NextResponse.json({ messages });
    }

    // 2. Fetch conversation threads summary (chat list)
    // Fetch all messages involving current user, sorted by newest first
    const allMessages = await Message.find({
      $or: [{ sender: currentUserId }, { recipient: currentUserId }]
    })
    .sort({ createdAt: -1 })
    .populate("sender", "name username avatar")
    .populate("recipient", "name username avatar")
    .lean();

    interface ChatThread {
      user: {
        _id: mongoose.Types.ObjectId;
        name: string;
        username: string;
        avatar?: string;
      };
      lastMessage: unknown;
      unreadCount: number;
    }

    const threadsMap = new Map<string, ChatThread>();

    for (const msg of allMessages) {
      // Determine who the "other" user is in this conversation
      const sender = msg.sender as unknown as ChatThread["user"];
      const recipient = msg.recipient as unknown as ChatThread["user"];
      const otherUser = sender._id.toString() === session.user.id
        ? recipient
        : sender;

      const otherUserIdStr = otherUser._id.toString();

      if (!threadsMap.has(otherUserIdStr)) {
        threadsMap.set(otherUserIdStr, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0
        });
      }

      // If message is unread and recipient is current user, increment unreadCount
      const recipientUser = msg.recipient as unknown as ChatThread["user"];
      if (!msg.isRead && recipientUser._id.toString() === session.user.id) {
        const thread = threadsMap.get(otherUserIdStr);
        if (thread) thread.unreadCount += 1;
      }
    }

    const threads = Array.from(threadsMap.values());

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Error in messages GET route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/messages - Send a new direct message
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId, content } = await req.json();

    if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
      return NextResponse.json({ error: "Invalid recipient ID" }, { status: 400 });
    }

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    if (session.user.id === recipientId) {
      return NextResponse.json({ error: "You cannot message yourself" }, { status: 400 });
    }

    await connectDB();

    const senderIdObj = new mongoose.Types.ObjectId(session.user.id);
    const recipientIdObj = new mongoose.Types.ObjectId(recipientId);

    // Verify recipient exists
    const recipient = await User.findById(recipientIdObj);
    if (!recipient) {
      return NextResponse.json({ error: "Recipient user not found" }, { status: 404 });
    }

    const newMessage = await Message.create({
      sender: senderIdObj,
      recipient: recipientIdObj,
      content: content.trim(),
      isRead: false
    });

    // Populate sender info for the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate("sender", "name username avatar")
      .populate("recipient", "name username avatar")
      .lean();

    // Create a database notification for the recipient
    await Notification.create({
      recipient: recipientIdObj,
      sender: senderIdObj,
      type: "message",
      link: `/messages?chatWith=${session.user.id}`,
      isRead: false
    });

    return NextResponse.json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error("Error in messages POST route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/messages - Mark all incoming messages and message notifications as read
export async function PUT() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const currentUserId = new mongoose.Types.ObjectId(session.user.id);

    // Mark all received messages as read
    await Message.updateMany(
      { recipient: currentUserId, isRead: false },
      { $set: { isRead: true } }
    );

    // Mark all message notifications as read
    await Notification.updateMany(
      { recipient: currentUserId, type: "message", isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ success: true, message: "All messages marked as read" });
  } catch (error) {
    console.error("Error in messages PUT route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
