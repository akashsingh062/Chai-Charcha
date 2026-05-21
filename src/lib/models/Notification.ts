import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Notification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender: mongoose.Types.ObjectId;
    type: string;
    link: string;
    isRead: boolean;
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
    }
}, { timestamps: true });

export const Notification = mongoose.models.Notification as Model<Notification> || mongoose.model<Notification>("Notification", NotificationSchema);
