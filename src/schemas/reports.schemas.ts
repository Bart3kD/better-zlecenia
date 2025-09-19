import { REPORT_STATUS } from "@/types/reports.types";
import { z } from "zod";

export const createReportSchema = z.object({
    reporter_id: z
        .uuid('Invalid reporter ID'),
    
    reported_user_id: z
        .uuid('Invalid reported user ID')
        .optional()
        .nullable(),
    
    offer_id: z
        .uuid('Invalid offer ID')
        .optional()
        .nullable(),
    
    message_id: z
        .uuid('Invalid message ID')
        .optional()
        .nullable(),
    
    reason: z
        .string()
        .min(1, 'Reason is required')
        .max(100, 'Reason cannot exceed 100 characters'),
    
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional()
        .nullable()
}).refine(
    data => data.reported_user_id || data.offer_id || data.message_id,
    {
        message: 'At least one of reported_user_id, offer_id, or message_id must be provided',
        path: ['reported_user_id']
    }
);

export const updateReportStatusSchema = z.object({
    status: z
        .enum(REPORT_STATUS, 'Invalid report status' ),
    
    admin_notes: z
        .string()
        .max(500, 'Admin notes cannot exceed 500 characters')
        .optional()
});

export const getReportsSchema = z.object({
    status: z
        .enum(REPORT_STATUS)
        .optional(),
    
    reporter_id: z
        .string()
        .uuid('Invalid reporter ID')
        .optional(),
    
    reported_user_id: z
        .uuid('Invalid reported user ID')
        .optional(),
    
    reason: z
        .string()
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
        .enum(['created_at', 'status', 'reason'])
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

export type CreateReportData = z.infer<typeof createReportSchema>;
export type UpdateReportStatusData = z.infer<typeof updateReportStatusSchema>;
export type GetReportsData = z.infer<typeof getReportsSchema>;