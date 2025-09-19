  import { z } from "zod";
  
  export const createConversationSchema = z.object({
    offer_id: z
        .uuid('Invalid offer ID'),
    
    interested_user_id: z
        .uuid('Invalid user ID')
});

export const updateConversationSchema = z.object({
    is_active: z
        .boolean()
});

export const getConversationsSchema = z.object({
    user_id: z
        .uuid('Invalid user ID')
        .optional(), // If provided, get conversations for specific user
    
    offer_id: z
        .uuid('Invalid offer ID')
        .optional(), // Get conversations for specific offer
    
    is_active: z
        .boolean()
        .optional(), // Filter by active/inactive status
    
    has_unread_messages: z
        .boolean()
        .optional(), // Filter conversations with unread messages
    
    sort_by: z
        .enum(['last_message_at', 'created_at'])
        .default('last_message_at')
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

export const archiveConversationSchema = z.object({
    conversation_id: z
        .uuid('Invalid conversation ID')
});

export const getConversationByParticipantsSchema = z.object({
    offer_id: z
        .uuid('Invalid offer ID'),
    
    interested_user_id: z
        .uuid('Invalid user ID')
});

export const bulkUpdateConversationsSchema = z.object({
    conversation_ids: z
        .array(z.uuid('Invalid conversation ID'))
        .min(1, 'At least one conversation ID is required')
        .max(50, 'Cannot update more than 50 conversations at once'),
    
    is_active: z
        .boolean()
});

export const getConversationStatsSchema = z.object({
    user_id: z
        .uuid('Invalid user ID'),
    
    date_from: z
        .iso
        .datetime('Invalid date format')
        .optional(),
    
    date_to: z
        .iso
        .datetime('Invalid date format')
        .optional()
});

export const fullConversationSchema = z.object({
    id: z
        .uuid(),
    
    offer_id: z
        .uuid(),
    
    poster_id: z
        .uuid(),
    
    interested_user_id: z
        .uuid(),
    
    is_active: z
        .boolean(),
    
    last_message_at: z
        .iso
        .datetime(),
    
    created_at: z
        .iso
        .datetime()
});

export type CreateConversationData = z.infer<typeof createConversationSchema>;
export type UpdateConversationData = z.infer<typeof updateConversationSchema>;
export type GetConversationsData = z.infer<typeof getConversationsSchema>;
export type ArchiveConversationData = z.infer<typeof archiveConversationSchema>;
export type GetConversationByParticipantsData = z.infer<typeof getConversationByParticipantsSchema>;
export type BulkUpdateConversationsData = z.infer<typeof bulkUpdateConversationsSchema>;
export type GetConversationStatsData = z.infer<typeof getConversationStatsSchema>;
export type FullConversationData = z.infer<typeof fullConversationSchema>;