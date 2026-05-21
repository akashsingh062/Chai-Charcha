import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Community extends Document {
    name: string;
    slug: string;
    description: string;
    creator: mongoose.Types.ObjectId;
    moderators: mongoose.Types.ObjectId[];
    membersCount: number;
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
    }
}, { timestamps: true });

export const Community = mongoose.models.Community as Model<Community> || mongoose.model<Community>("Community", CommunitySchema);
