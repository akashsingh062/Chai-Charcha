import { z } from "zod";

export const loginSchema = z.object({
    identifier: z.string({
        message: "Username or Email must be a valid string"
    })
        .min(3, "Username or Email must be at least 3 characters"),
        
    password: z.string({
        message: "Password must be a valid string"
    })
        .min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

