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
    community?: mongoose.Types.ObjectId | null;
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
    }
}, { timestamps: true });

export const Post = mongoose.models.Post as Model<Post> || mongoose.model<Post>("Post", PostSchema);
