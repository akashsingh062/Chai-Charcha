import mongoose, { Document, Schema } from 'mongoose';

const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

export interface User extends Document {
    name: string;
    username: string;
    email: string;
    password: string;
    avatar?: string;
    banner?: string;
    bio: string;
    role: 'member' | 'moderator' | 'admin';
    karma: number;
    joinedCommunities: any;
    followers: mongoose.Types.ObjectId[];
    following: mongoose.Types.ObjectId[];
    isBanned?: boolean;
    bannedAt?: Date;
    bannedBy?: mongoose.Types.ObjectId;
}

export const UserSchema = new Schema<User>({
    name: {
        type: String,
        required: [true, "Name is required"]
    },
    username: {
        type: String,
        required: [true, "Username is required"],
        match: [/^[a-zA-Z0-9_]+$/, "Username must be alphanumeric and contain only underscores"],
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [emailRegex, "Invalid email address"]
    },
    password: {
        type: String,
        minlength: [6, "Password must be at least 6 characters long"],
        required: false
    },
    avatar: {
        type: String,
        default: function (this: User) {
            return `https://api.dicebear.com/7.x/avataaars/svg?seed=${this.username || Math.random().toString(36).substring(7)}`;
        },
        required: false
    },
    banner: {
        type: String,
        required: false
    },
    bio: {
        type: String,
        default: "Hello, I'm new to chai and charcha"
    },
    role: {
        type: String,
        enum: ['member', 'moderator', 'admin'],
        default: 'member'
    },
    karma: {
        type: Number,
        default: 0
    },
    joinedCommunities: {
        type: mongoose.Schema.Types.Mixed,
        default: [],
        get: function(val: unknown) {
            if (typeof val === "string") {
                try {
                    return JSON.parse(val);
                } catch {
                    return [];
                }
            }
            return Array.isArray(val) ? val : [];
        }
    },
    followers: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        default: []
    },
    following: {
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        default: []
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    bannedAt: {
        type: Date,
        default: null
    },
    bannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Clear compiled model cache in development to force re-compilation of updated schema
if (mongoose.models && mongoose.models.User) {
    delete mongoose.models.User;
}

export const User = mongoose.model<User>("User", UserSchema, "user");
