import { z } from "zod";

export const nameValidation = z.string({
    message: "Name must be a valid string"
})
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim();

export const usernameValidation = z.string({
    message: "Username must be a valid string"
})
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username must contain only letters, numbers, and underscores")
    .trim()
    .lowercase();

export const emailValidation = z.string({
    message: "Email must be a valid string"
})
    .email("Invalid email address")
    .trim()
    .lowercase();

export const passwordValidation = z.string({
    message: "Password must be a valid string"
})
    .min(6, "Password must be at least 6 characters")
    .max(32, "Password must be at most 32 characters");


export const signupSchema = z.object({
    name: nameValidation,
    username: usernameValidation,
    email: emailValidation,
    password: passwordValidation,
});

export type SignupInput = z.infer<typeof signupSchema>;

