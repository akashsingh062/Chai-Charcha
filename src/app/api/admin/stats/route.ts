import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { User } from "@/lib/models/User";
import { Post } from "@/lib/models/Post";
import { Comment } from "@/lib/models/Comment";
import { Community } from "@/lib/models/Community";
import { Report } from "@/lib/models/Report";
import { Notification } from "@/lib/models/Notification";
import { Message } from "@/lib/models/Message";

// GET /api/admin/stats — Dashboard aggregate statistics
export async function GET() {
  try {
    await requireAdmin();
    await connectDB();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aggregate all counts in parallel
    const [
      totalUsers,
      newUsers24h,
      newUsers7d,
      newUsers30d,
      totalPosts,
      newPosts24h,
      newPosts7d,
      newPosts30d,
      totalComments,
      totalCommunities,
      pendingReports,
      totalReports,
      totalMessages,
      topUsersByKarma,
      topTrendingPosts,
      bannedUsersCount,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Post.countDocuments({}),
      Post.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Post.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Comment.countDocuments({}),
      Community.countDocuments({}),
      Report.countDocuments({ status: "pending" }),
      Report.countDocuments({}),
      Message.countDocuments({}),
      User.find({})
        .sort({ karma: -1 })
        .limit(5)
        .select("name username avatar karma role"),
      Post.find({ isSoftDeleted: { $ne: true } })
        .sort({ trendingScore: -1 })
        .limit(5)
        .populate("author", "name username avatar")
        .select("title trendingScore upvotes downvotes commentCount createdAt"),
      User.countDocuments({ isBanned: true }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        new24h: newUsers24h,
        new7d: newUsers7d,
        new30d: newUsers30d,
        banned: bannedUsersCount,
      },
      posts: {
        total: totalPosts,
        new24h: newPosts24h,
        new7d: newPosts7d,
        new30d: newPosts30d,
      },
      comments: { total: totalComments },
      communities: { total: totalCommunities },
      reports: { total: totalReports, pending: pendingReports },
      messages: { total: totalMessages },
      topUsers: topUsersByKarma,
      topPosts: topTrendingPosts.map((p) => ({
        id: p._id.toString(),
        title: p.title,
        trendingScore: p.trendingScore,
        votes: (p.upvotes?.length || 0) - (p.downvotes?.length || 0),
        comments: p.commentCount,
        author: p.author,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}
