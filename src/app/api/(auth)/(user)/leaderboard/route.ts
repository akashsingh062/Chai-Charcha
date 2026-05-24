import { NextResponse } from "next/server";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";

export async function GET() {
  try {
    await connectDB();

    // Fetch top 10 users based on karma
    const topUsers = await User.find({})
      .sort({ karma: -1, createdAt: 1 })
      .limit(10)
      .select("name username avatar role karma")
      .lean();

    // Map into a clean response
    const leaderboard = topUsers.map((user, index) => {
      let badge = "🔥";
      if (index === 0) badge = "🥇";
      else if (index === 1) badge = "🥈";
      else if (index === 2) badge = "🥉";

      return {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        karma: user.karma,
        badge,
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
