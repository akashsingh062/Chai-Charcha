import mongoose, { Document, Model, Schema } from "mongoose";

export interface AuditLog extends Document {
  admin: mongoose.Types.ObjectId;
  action: string;
  targetType: "User" | "Post" | "Comment" | "Community" | "Report" | "Notification" | "System";
  targetId?: mongoose.Types.ObjectId | null;
  details?: Record<string, unknown>;
  createdAt: Date;
}

export const AuditLogSchema = new Schema<AuditLog>(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin user is required"],
    },
    action: {
      type: String,
      required: [true, "Action description is required"],
    },
    targetType: {
      type: String,
      required: [true, "Target type is required"],
      enum: ["User", "Post", "Comment", "Community", "Report", "Notification", "System"],
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

AuditLogSchema.index({ createdAt: -1 });
AuditLogSchema.index({ admin: 1 });
AuditLogSchema.index({ action: 1 });

export const AuditLog =
  (mongoose.models.AuditLog as Model<AuditLog>) ||
  mongoose.model<AuditLog>("AuditLog", AuditLogSchema);
