import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const reportSchema = z.object({
    targetId: z.string({
        message: "Target ID must be a valid string"
    })
        .min(1, "Target ID is required")
        .regex(objectIdRegex, "Invalid Target ID"),
        
    targetType: z.enum(['Post', 'Comment'], {
        message: "Target type must be either 'Post' or 'Comment'"
    }),
    
    reason: z.string({
        message: "Reason must be a valid string"
    })
        .min(5, "Reason for report must be at least 5 characters long")
        .max(500, "Reason for report must be at most 500 characters long")
        .trim(),
});

export type ReportInput = z.infer<typeof reportSchema>;

