import { z } from "zod";
import { usernameValidation, nameValidation } from "./signupSchema";

// Schema for Cloudinary or custom file upload responses
const imageSchema = z.object({
    url: z.string().url("Invalid URL"),
    public_id: z.string({ message: "Public ID must be a valid string" }),
    width: z.number().optional(),
    height: z.number().optional(),
    format: z.string().optional(),
    bytes: z.number().optional(),
    createdAt: z.coerce.date().optional(),
    resource_type: z.string().optional(),
    secure_url: z.string().url("Invalid secure URL").optional(),
    original_filename: z.string().optional(),
});

export const profileUpdateSchema = z.object({
    name: nameValidation.optional(),
    username: usernameValidation.optional(),
    bio: z.string().max(160, "Bio must be at most 160 characters").optional(),
    image: z.union([
        z.string().url("Invalid image URL"), 
        imageSchema
    ], {
        message: "Avatar must be either a valid image URL string or a structured image upload object"
    }).optional(),
    banner: z.union([
        z.string().url("Invalid banner URL"), 
        imageSchema,
        z.literal("")
    ], {
        message: "Banner must be either a valid image URL string, structured image upload object, or empty"
    }).optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;