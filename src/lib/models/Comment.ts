import mongoose, { Document, Model, Schema } from 'mongoose';

export interface Comment extends Document {
    postId: mongoose.Types.ObjectId;
    author: mongoose.Types.ObjectId;
    content: string;
    parentId?: mongoose.Types.ObjectId | null;
    replies: mongoose.Types.ObjectId[];
    upvotes: mongoose.Types.ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}

export const CommentSchema = new Schema<Comment>({
    postId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, "Post ID is required"]
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Author is required"]
    },
    content: {
        type: String,
        required: [true, "Comment content is required"]
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    replies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, { timestamps: true });

CommentSchema.index({ postId: 1, parentId: 1 });
CommentSchema.index({ author: 1 });

export const Comment = mongoose.models.Comment as Model<Comment> || mongoose.model<Comment>("Comment", CommentSchema);
