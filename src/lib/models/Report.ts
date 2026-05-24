import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Report extends Document {
    targetId: mongoose.Types.ObjectId;
    targetType: 'Post' | 'Comment' | 'User' | 'Community';
    reporter: mongoose.Types.ObjectId;
    reason: string;
    status: 'pending' | 'resolved' | 'rejected';
    createdAt?: Date;
    updatedAt?: Date;
}

export const ReportSchema = new Schema<Report>({
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'targetType',
        required: [true, "Report target ID is required"]
    },
    targetType: {
        type: String,
        required: [true, "Report target type is required"],
        enum: ['Post', 'Comment', 'User', 'Community']
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Reporter is required"]
    },
    reason: {
        type: String,
        required: [true, "Reason for report is required"]
    },
    status: {
        type: String,
        enum: ['pending', 'resolved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

ReportSchema.index({ status: 1 });

if (mongoose.models && mongoose.models.Report) {
    delete mongoose.models.Report;
}

export const Report = mongoose.models.Report as Model<Report> || mongoose.model<Report>("Report", ReportSchema);
