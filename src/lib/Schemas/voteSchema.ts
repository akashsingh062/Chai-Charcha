import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const voteSchema = z.object({
    targetId: z.string({
        message: "Target ID must be a valid string"
    })
        .min(1, "Target ID is required")
        .regex(objectIdRegex, "Invalid Target ID"),
    
    targetType: z.enum(['Post', 'Comment'], {
        message: "Target type must be either 'Post' or 'Comment'"
    }),
    
    voteType: z.enum(['up', 'down'], {
        message: "Vote type must be either 'up' or 'down'"
    })
});

export type VoteInput = z.infer<typeof voteSchema>;
