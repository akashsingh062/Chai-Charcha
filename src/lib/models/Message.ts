import mongoose, { Document, Schema } from 'mongoose';

export interface Message extends Document {
    sender: mongoose.Types.ObjectId;
    recipient: mongoose.Types.ObjectId;
    content: string;
    isRead: boolean;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const MessageSchema = new Schema<Message>({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Sender is required"]
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Recipient is required"]
    },
    content: {
        type: String,
        required: [true, "Content is required"],
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isEdited: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

MessageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

// Clear compiled model cache in development to force re-compilation of updated schema
if (mongoose.models && mongoose.models.Message) {
    delete mongoose.models.Message;
}

export const Message = mongoose.model<Message>("Message", MessageSchema, "message");
