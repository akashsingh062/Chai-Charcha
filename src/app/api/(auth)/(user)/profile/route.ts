import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import { profileUpdateSchema } from "@/lib/Schemas/profileUpdateSchema";
import mongoose from "mongoose";

// GET /api/profile - Retrieve active user profile
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const dbUser = await User.findOne({ email: session.user.email });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("Error in profile GET route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT /api/profile - Update user profile details
export async function PUT(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { resetKarma, ...profileData } = body;

    await connectDB();

    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    if (resetKarma === true) {
      dbUser.karma = 0;
    }

    // Only update and validate fields if profile attributes are provided
    if (Object.keys(profileData).length > 0) {
      const validatedData = profileUpdateSchema.safeParse(profileData);

      if (!validatedData.success) {
        return NextResponse.json(
          { error: "Validation failed", details: validatedData.error.flatten() },
          { status: 400 }
        );
      }

      const { name, username, bio, image } = validatedData.data;

      // Check username uniqueness if it changed
      if (username && username !== dbUser.username) {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return NextResponse.json({ error: "Username is already taken" }, { status: 400 });
        }
        dbUser.username = username;
      }

      if (name) dbUser.name = name;
      if (bio !== undefined) dbUser.bio = bio;

      if (image) {
        let avatarUrl = "";
        if (typeof image === "string") {
          avatarUrl = image;
        } else if (typeof image === "object" && image !== null) {
          // Handle Cloudinary upload schema
          avatarUrl = (image as { secure_url?: string; url?: string }).secure_url || (image as { secure_url?: string; url?: string }).url || "";
        }
        if (avatarUrl) {
          dbUser.avatar = avatarUrl;
        }
      }
    }

    await dbUser.save();

    return NextResponse.json({
      message: "Profile updated successfully",
      user: dbUser,
    });
  } catch (error) {
    console.error("Error in profile PUT route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/profile - Permanently delete user account and clear session cookies
export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const dbUser = await User.findOne({ email: session.user.email });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    const userId = dbUser._id.toString();

    // 1. Delete user from primary 'user' collection
    await User.deleteOne({ _id: dbUser._id });

    // 2. Cascade delete from better-auth native MongoDB collections (session and account)
    const db = mongoose?.connection?.db;
    if (db) {
      await db.collection("session").deleteMany({ userId });
      await db.collection("account").deleteMany({ userId });
    }

    return NextResponse.json({
      success: true,
      message: "Account and sessions deleted successfully",
    });
  } catch (error) {
    console.error("Error in profile DELETE route:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

