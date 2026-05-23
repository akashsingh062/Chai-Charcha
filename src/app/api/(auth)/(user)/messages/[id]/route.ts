import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Message } from "@/lib/models/Message";
import mongoose from "mongoose";

// PUT /api/messages/[id] - Edit direct message content
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Message content cannot be empty" }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify ownership (only the sender can edit the message)
    if (message.sender.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. You cannot edit someone else's message" }, { status: 403 });
    }

    // Verify timeframe (user should not be able to edit after 2 hours)
    const twoHours = 2 * 60 * 60 * 1000;
    const isPastTwoHours = Date.now() - new Date(message.createdAt).getTime() > twoHours;
    if (isPastTwoHours) {
      return NextResponse.json({ error: "Editing is locked. You cannot edit messages after 2 hours." }, { status: 400 });
    }

    message.content = content.trim();
    message.isEdited = true;
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username avatar")
      .populate("recipient", "name username avatar");

    return NextResponse.json({ success: true, message: populatedMessage });
  } catch (error) {
    console.error("Error in message edit PUT route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/messages/[id] - Delete a direct message
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!messageId || !mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: "Invalid message ID" }, { status: 400 });
    }

    await connectDB();

    const message = await Message.findById(messageId);

    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify ownership (only the sender can delete the message)
    if (message.sender.toString() !== session.user.id) {
      return NextResponse.json({ error: "Forbidden. You cannot delete someone else's message" }, { status: 403 });
    }

    await Message.deleteOne({ _id: messageId });

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error("Error in message delete route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
