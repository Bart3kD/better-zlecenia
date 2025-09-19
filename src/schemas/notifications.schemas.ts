import { NOTIFICATION_TYPES } from "@/types/notifications.types";
import z from "zod";

export const createNotificationSchema = z.object({
    user_id: z
        .uuid('Invalid user ID'),
    
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters'),
    
    message: z
        .string()
        .min(1, 'Message is required')
        .max(1000, 'Message cannot exceed 1000 characters'),
    
    type: z
        .enum(NOTIFICATION_TYPES, 'Invalid notification type'),

    related_id: z
        .uuid('Invalid related ID')
        .optional()
        .nullable()
});

export const updateNotificationSchema = z.object({
    is_read: z
        .boolean()
});

export const markNotificationsAsReadSchema = z.object({
    user_id: z
        .uuid('Invalid user ID'),
    
    notification_ids: z
        .array(z.uuid('Invalid notification ID'))
        .min(1, 'At least one notification ID is required')
        .max(50, 'Cannot mark more than 50 notifications at once')
        .optional()
});

export const getNotificationsSchema = z.object({
    user_id: z
        .uuid('Invalid user ID'),
    
    type: z
        .enum(NOTIFICATION_TYPES)
        .optional(),
    
    is_read: z
        .boolean()
        .optional(),
    
    date_from: z
        .iso
        .datetime('Invalid date format')
        .optional(),
    
    date_to: z
        .iso
        .datetime('Invalid date format')
        .optional(),
    
    sort_by: z
        .enum(['created_at', 'type', 'is_read'])
        .default('created_at')
        .optional(),
    
    sort_order: z
        .enum(['asc', 'desc'])
        .default('desc')
        .optional(),
    
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .optional(),
    
    offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .optional()
});

export const bulkCreateNotificationsSchema = z.object({
    user_ids: z
        .array(z.uuid('Invalid user ID'))
        .min(1, 'At least one user ID is required')
        .max(1000, 'Cannot send to more than 1000 users at once'),
    
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title cannot exceed 200 characters'),
    
    message: z
        .string()
        .min(1, 'Message is required')
        .max(1000, 'Message cannot exceed 1000 characters'),
    
    type: z
        .enum(NOTIFICATION_TYPES),
    
    related_id: z
        .uuid('Invalid related ID')
        .optional()
        .nullable()
});