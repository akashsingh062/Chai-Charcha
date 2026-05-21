import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const postSchema = z.object({
    title: z.string({
        message: "Title must be a valid string"
    })
        .min(3, "Title must be at least 3 characters long")
        .max(100, "Title must be at most 100 characters long")
        .trim(),
    
    content: z.string({
        message: "Content must be a valid string"
    })
        .min(10, "Content must be at least 10 characters long")
        .max(1000, "Content cannot exceed 1000 characters"),
    
    tags: z.array(
        z.string()
            .min(2, "Tag must be at least 2 characters")
            .max(25, "Tag must be at most 25 characters")
            .regex(/^[a-zA-Z0-9_-]+$/, "Tags must contain only letters, numbers, hyphens, and underscores")
            .trim()
            .lowercase()
    ).max(5, "You can assign up to 5 tags only").optional().default([]),
    
    community: z.string({
        message: "Community ID must be a valid string"
    })
        .regex(objectIdRegex, "Invalid Community ID")
        .optional()
        .nullable(),
    
    media: z.array(
        z.string().url("Invalid media URL")
    ).max(4, "You can upload up to 4 media items").optional().default([]),
});

export type PostInput = z.infer<typeof postSchema>;

