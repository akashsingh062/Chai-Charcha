import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const commentSchema = z.object({
    postId: z.string({
        message: "Post ID must be a valid string"
    })
        .min(1, "Post ID is required")
        .regex(objectIdRegex, "Invalid Post ID"),
    
    content: z.string({
        message: "Comment content must be a valid string"
    })
        .min(1, "Comment cannot be empty")
        .max(2000, "Comment cannot exceed 2000 characters")
        .trim(),
    
    parentId: z.string({
        message: "Parent Comment ID must be a valid string"
    })
        .regex(objectIdRegex, "Invalid Parent Comment ID")
        .optional()
        .nullable(),
});

export type CommentInput = z.infer<typeof commentSchema>;

