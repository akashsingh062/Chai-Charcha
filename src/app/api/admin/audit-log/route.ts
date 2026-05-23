import { NextResponse } from "next/server";
import { requireAdmin, adminErrorResponse } from "@/lib/adminAuth";
import connectDB from "@/lib/connectDB";
import { AuditLog } from "@/lib/models/AuditLog";

// GET /api/admin/audit-log — Retrieve list of admin audit logs with pagination and filters
export async function GET(req: Request) {
  try {
    await requireAdmin();
    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const action = searchParams.get("action") || "";
    const targetType = searchParams.get("targetType") || "";
    const adminId = searchParams.get("adminId") || "";

    const query: Record<string, unknown> = {};

    if (action) {
      query.action = action;
    }

    if (targetType) {
      query.targetType = targetType;
    }

    if (adminId) {
      query.admin = adminId;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate("admin", "name username email avatar role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    const formattedLogs = logs.map((log) => ({
      id: log._id.toString(),
      admin: log.admin,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId?.toString() || null,
      details: log.details || {},
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      auditLogs: formattedLogs,
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
