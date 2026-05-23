import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Community extends Document {
    name: string;
    slug: string;
    description: string;
    creator: mongoose.Types.ObjectId;
    moderators: mongoose.Types.ObjectId[];
    membersCount: number;
    isPrivate?: boolean;
    pendingRequests?: mongoose.Types.ObjectId[];
    bannedUsers?: mongoose.Types.ObjectId[];
    rules?: string[];
}

export const CommunitySchema = new Schema<Community>({
    name: {
        type: String,
        required: [true, "Community name is required"]
    },
    slug: {
        type: String,
        required: [true, "Slug is required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Creator is required"]
    },
    moderators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    membersCount: {
        type: Number,
        default: 0
    },
    isPrivate: {
        type: Boolean,
        default: false
    },
    pendingRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    bannedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    rules: {
        type: [String],
        default: [
            "Be respectful to all members.",
            "No hate speech or harassment.",
            "No spam or self-promotion.",
            "Keep discussions relevant to the community topic."
        ]
    }
}, { timestamps: true });

// Clear compiled model cache in development to force re-compilation of updated schema
if (mongoose.models && mongoose.models.Community) {
    delete mongoose.models.Community;
}

export const Community = mongoose.models.Community as Model<Community> || mongoose.model<Community>("Community", CommunitySchema);

