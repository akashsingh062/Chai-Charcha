import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import connectDB from "@/lib/connectDB";
import { Post } from "@/lib/models/Post";
import { Community } from "@/lib/models/Community";

// POST /api/posts/[id]/soft-delete - Soft-delete or restore a post (Mods/Admins only)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { action } = await req.json();

    if (action !== "delete" && action !== "restore") {
      return NextResponse.json({ error: "Invalid action. Must be 'delete' or 'restore'" }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (!post.community) {
      return NextResponse.json({ error: "Only posts inside sub-communities can be soft-deleted by moderators." }, { status: 400 });
    }

    // Fetch the community to verify mod/creator status
    const community = await Community.findById(post.community);
    if (!community) {
      return NextResponse.json({ error: "Associated community not found" }, { status: 404 });
    }

    const currentUserId = session.user.id;
    const isAdmin = community.creator.toString() === currentUserId;
    const isMod = isAdmin || (community.moderators && community.moderators.some((uid: unknown) => String(uid) === currentUserId));

    if (!isMod) {
      return NextResponse.json({ error: "Forbidden. Only moderators can soft-delete discussions." }, { status: 403 });
    }

    post.isSoftDeleted = action === "delete";
    post.softDeletedBy = action === "delete" ? currentUserId as unknown as typeof post.softDeletedBy : null;
    await post.save();

    return NextResponse.json({
      success: true,
      isSoftDeleted: post.isSoftDeleted,
      message: `Post successfully ${action === "delete" ? "soft-deleted" : "restored"}`
    });
  } catch (error) {
    console.error("Error in POST /api/posts/[id]/soft-delete:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
