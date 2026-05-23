import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";

// GET /api/follow/status - Check if authenticated user is following a target user
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // If not authenticated, return following: false immediately without throwing an error
    if (!session || !session.user) {
      return NextResponse.json({ following: false });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("targetUserId");

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ error: "Invalid target user ID" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    if (!currentUser) {
      return NextResponse.json({ following: false });
    }

    const following = currentUser.following?.some(id => id.toString() === targetUserId) || false;

    return NextResponse.json({ following });
  } catch (error) {
    console.error("Error in follow status GET route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
