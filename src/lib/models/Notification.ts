import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Notification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: string;
    link: string;
    isRead: boolean;
    message?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const NotificationSchema = new Schema<Notification>({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Recipient is required"]
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Sender is required"]
    },
    type: {
        type: String,
        required: [true, "Notification type is required"]
    },
    link: {
        type: String,
        required: [true, "Notification link is required"]
    },
    isRead: {
        type: Boolean,
        default: false
    },
    message: {
        type: String,
        required: false
    }
}, { timestamps: true });

NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Clear compiled model cache in development to force re-compilation of updated schema
if (mongoose.models && mongoose.models.Notification) {
    delete mongoose.models.Notification;
}

export const Notification = mongoose.models.Notification as Model<Notification> || mongoose.model<Notification>("Notification", NotificationSchema);
