import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Community } from "@/lib/models/Community";
import { User } from "@/lib/models/User";

// GET /api/communities/[slug] - Get metadata for a community, populated with creator info
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    await connectDB();

    const community = await Community.findOne({ slug }).populate(
      "creator",
      "name username avatar role karma"
    );

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    let isJoined = false;
    if (session?.user?.id) {
      const currentUser = await User.findById(session.user.id);
      if (currentUser && currentUser.joinedCommunities) {
        let joined: string[] = [];
        if (Array.isArray(currentUser.joinedCommunities)) {
          joined = currentUser.joinedCommunities.map((id: any) => id.toString());
        } else if (typeof currentUser.joinedCommunities === "string") {
          try {
            joined = JSON.parse(currentUser.joinedCommunities).map((id: any) => id.toString());
          } catch (e) {
            joined = [];
          }
        }
        isJoined = joined.includes(community._id.toString());
      }
    }

    return NextResponse.json({ success: true, community, isJoined });
  } catch (error) {
    console.error("Error in GET /api/communities/[slug]:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
