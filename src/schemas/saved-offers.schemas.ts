import { z } from "zod";

export const saveOfferSchema = z.object({
    user_id: z
        .uuid('Invalid user ID'),
    
    offer_id: z
        .uuid('Invalid offer ID')
});

export const unsaveOfferSchema = z.object({
    user_id: z
        .uuid('Invalid user ID'),
    
    offer_id: z
        .uuid('Invalid offer ID')
});

export const getSavedOffersSchema = z.object({
    user_id: z
        .uuid('Invalid user ID'),
    
    category_id: z
        .uuid('Invalid category ID')
        .optional(),
    
    offer_status: z
        .enum(['open', 'in_progress', 'completed', 'cancelled'])
        .optional(),
    
    sort_by: z
        .enum(['created_at', 'offer_created_at', 'price'])
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

export type SaveOfferData = z.infer<typeof saveOfferSchema>;
export type UnsaveOfferData = z.infer<typeof unsaveOfferSchema>;
export type GetSavedOffersData = z.infer<typeof getSavedOffersSchema>;