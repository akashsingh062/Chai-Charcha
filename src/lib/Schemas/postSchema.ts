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
            .min(1, "Tag must be at least 1 character")
            .max(30, "Tag must be at most 30 characters")
            .trim()
            .lowercase()
            .refine((tag) => !/\s/.test(tag), {
                message: "Hashtags cannot contain spaces. Use hyphens or join words."
            })
    ).max(10, "You can assign up to 10 tags only").optional().default(["general"]),
    
    community: z.string({
        message: "Community ID must be a valid string"
    })
        .regex(objectIdRegex, "Invalid Community ID")
        .optional()
        .nullable(),
    
    category: z.string({
        message: "Category must be a valid string"
    })
        .optional()
        .default("General Charcha"),
    
    media: z.array(
        z.string().url("Invalid media URL")
    ).max(4, "You can upload up to 4 media items").optional().default([]),
    
    isCommunityOnly: z.boolean().optional().default(false),
});

export type PostInput = z.infer<typeof postSchema>;

