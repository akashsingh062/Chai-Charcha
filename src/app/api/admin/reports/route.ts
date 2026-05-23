import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { Report } from "@/lib/models/Report";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";

// GET /api/admin/reports — List reports with pagination and status/type filtering
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const status = searchParams.get("status") || "";
    const targetType = searchParams.get("targetType") || "";

    const query: Record<string, unknown> = {};

    if (status && ["pending", "resolved", "rejected"].includes(status)) {
      query.status = status;
    }

    if (targetType && ["Post", "Comment"].includes(targetType)) {
      query.targetType = targetType;
    }

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      Report.find(query)
        .populate("reporter", "name username email avatar")
        .populate("targetId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Report.countDocuments(query),
    ]);

    // Format reports to ensure they contain content preview and author details
    const formattedReports = await Promise.all(
      reports.map(async (r) => {
        let contentPreview = "";
        let authorName = "Unknown";
        let authorUsername = "";
        let authorAvatar = "";
        let isContentDeleted = false;

        const target = r.targetId as any;
        if (!target) {
          contentPreview = "[Content deleted]";
          isContentDeleted = true;
        } else {
          if (r.targetType === "Post") {
            contentPreview = target.title || target.content || "";
            // Find post author
            const postAuthor = await User.findById(target.author).select("name username avatar");
            if (postAuthor) {
              authorName = postAuthor.name;
              authorUsername = postAuthor.username;
              authorAvatar = postAuthor.avatar || "";
            }
          } else if (r.targetType === "Comment") {
            contentPreview = target.content || "";
            // Find comment author
            const commentAuthor = await User.findById(target.author).select("name username avatar");
            if (commentAuthor) {
              authorName = commentAuthor.name;
              authorUsername = commentAuthor.username;
              authorAvatar = commentAuthor.avatar || "";
            }
          }
        }

        return {
          id: r._id.toString(),
          targetId: r.targetId ? r.targetId._id?.toString() : null,
          targetType: r.targetType,
          reason: r.reason,
          status: r.status,
          reporter: r.reporter,
          contentPreview,
          isContentDeleted,
          author: {
            name: authorName,
            username: authorUsername,
            avatar: authorAvatar,
          },
          createdAt: (r as any).createdAt,
          updatedAt: (r as any).updatedAt,
        };
      })
    );

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
