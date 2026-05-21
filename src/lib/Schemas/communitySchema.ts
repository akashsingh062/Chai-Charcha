import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const communitySchema = z.object({
    name: z.string({
        message: "Community name must be a valid string"
    })
        .min(3, "Community name must be at least 3 characters long")
        .max(30, "Community name must be at most 30 characters long")
        .trim(),
    
    slug: z.string({
        message: "Slug must be a valid string"
    })
        .min(3, "Slug must be at least 3 characters long")
        .max(30, "Slug must be at most 30 characters long")
        .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
        .trim()
        .lowercase(),
    
    description: z.string({
        message: "Description must be a valid string"
    })
        .min(10, "Description must be at least 10 characters long")
        .max(300, "Description must be at most 300 characters long")
        .trim(),
});

export const communityJoinLeaveSchema = z.object({
    communityId: z.string({
        message: "Community ID must be a valid string"
    })
        .min(1, "Community ID is required")
        .regex(objectIdRegex, "Invalid Community ID"),
});

export type CommunityInput = z.infer<typeof communitySchema>;
export type CommunityJoinLeaveInput = z.infer<typeof communityJoinLeaveSchema>;

