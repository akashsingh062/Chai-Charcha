import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import { Notification } from "@/lib/models/Notification";
import mongoose from "mongoose";

// POST /api/follow - Toggle follow status of a developer profile
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid target user ID" }, { status: 400 });
    }

    if (session.user.id === targetUserId) {
      return NextResponse.json({ error: "You cannot follow yourself" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const currentUserObjId = new mongoose.Types.ObjectId(currentUser.id);
    const targetUserObjId = new mongoose.Types.ObjectId(targetUser.id);

    // Initialise arrays if undefined (safety check)
    if (!currentUser.following) currentUser.following = [];
    if (!targetUser.followers) targetUser.followers = [];

    const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser.id);
      
      await currentUser.save();
      await targetUser.save();

      return NextResponse.json({ success: true, following: false });
    } else {
      // Follow
      currentUser.following.push(targetUserObjId);
      targetUser.followers.push(currentUserObjId);

      await currentUser.save();
      await targetUser.save();

      // Create notification
      await Notification.create({
        recipient: targetUserObjId,
        sender: currentUserObjId,
        type: "follow",
        link: `/profile?username=${currentUser.username}`,
        isRead: false
      });

      return NextResponse.json({ success: true, following: true });
    }
  } catch (error) {
    console.error("Error in follow POST route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
