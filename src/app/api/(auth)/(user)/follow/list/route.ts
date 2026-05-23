import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import mongoose from "mongoose";

// GET /api/follow/list - Get followers or following list for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const username = searchParams.get("username");
    const type = searchParams.get("type"); // "followers" | "following"

    if (type !== "followers" && type !== "following") {
      return NextResponse.json({ error: "Invalid list type. Must be 'followers' or 'following'" }, { status: 400 });
    }

    await connectDB();

    let userQuery = {};
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      userQuery = { _id: userId };
    } else if (username) {
      userQuery = { username: username.toLowerCase() };
    } else {
      return NextResponse.json({ error: "Missing user identifier parameter (userId or username)" }, { status: 400 });
    }

    const user = await User.findOne(userQuery).populate({
      path: type,
      select: "name username avatar bio karma role createdAt"
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const list = user[type] || [];

    return NextResponse.json({ list });
  } catch (error) {
    console.error("Error in follow list GET route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
