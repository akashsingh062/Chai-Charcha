import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const markNotificationReadSchema = z.object({
    notificationId: z.string()
        .min(1, "Notification ID is required")
        .regex(objectIdRegex, "Invalid Notification ID")
});

export const bulkMarkNotificationsReadSchema = z.object({
    notificationIds: z.array(
        z.string()
            .min(1, "Notification ID cannot be empty")
            .regex(objectIdRegex, "Invalid Notification ID")
    )
    .min(1, "At least one Notification ID is required")
    .max(100, "Cannot update more than 100 notifications at a time")
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type BulkMarkNotificationsReadInput = z.infer<typeof bulkMarkNotificationsReadSchema>;
