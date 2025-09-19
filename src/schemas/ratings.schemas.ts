import { z } from "zod";

export const createRatingSchema = z.object({
    offer_id: z
        .uuid(),
    
    rater_id: z
        .uuid(),

    rated_id: z
        .uuid(),
    
    rating: z
        .number()
        .int('Rating must be a whole number')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot be higher than 5'),
    
    review: z
        .string()
        .min(1, 'Review cannot be empty')
        .max(500, 'Review cannot be longer than 500 characters')
        .optional()
        .nullable()
})

export const updateRatingSchema = z.object({
    rating: z
        .number()
        .int('Rating must be a whole number')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot be higher than 5')
        .optional(),
    
    review: z
        .string()
        .min(1, 'Review cannot be empty')
        .max(500, 'Review cannot be longer than 500 characters')
        .optional()
        .nullable()
});

export const getRatingsSchema = z.object({
    user_id: z
        .uuid('Invalid user ID')
        .optional(),
    
    offer_id: z
        .uuid('Invalid offer ID')
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

export type CreateRatingData = z.infer<typeof createRatingSchema>;
export type UpdateRatingData = z.infer<typeof updateRatingSchema>;
export type GetRatingsData = z.infer<typeof getRatingsSchema>;