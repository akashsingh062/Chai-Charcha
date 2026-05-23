import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Post extends Document {
    author: mongoose.Types.ObjectId;
    title: string;
    content: string;
    media: string[];
    tags: string[];
    upvotes: mongoose.Types.ObjectId[];
    downvotes: mongoose.Types.ObjectId[];
    commentCount: number;
    trendingScore?: number;
    community?: mongoose.Types.ObjectId | null;
    category?: string;
    isSoftDeleted?: boolean;
    softDeletedBy?: mongoose.Types.ObjectId | null;
    isCommunityOnly?: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export const PostSchema = new Schema<Post>({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Author is required"]
    },
    title: {
        type: String,
        required: [true, "Title is required"]
    },
    content: {
        type: String,
        required: [true, "Content is required"]
    },
    media: {
        type: [String],
        default: []
    },
    tags: {
        type: [String],
        default: []
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    commentCount: {
        type: Number,
        default: 0
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    category: {
        type: String,
        default: 'General Charcha'
    },
    trendingScore: {
        type: Number,
        default: 0
    },
    isSoftDeleted: {
        type: Boolean,
        default: false
    },
    softDeletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    isCommunityOnly: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

PostSchema.index({ createdAt: -1 });
PostSchema.index({ trendingScore: -1 });

// Clear compiled model cache in development to force re-compilation of updated schema
if (mongoose.models && mongoose.models.Post) {
    delete mongoose.models.Post;
}

export const Post = mongoose.models.Post as Model<Post> || mongoose.model<Post>("Post", PostSchema);

