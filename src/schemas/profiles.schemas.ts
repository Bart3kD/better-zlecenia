import { z } from 'zod';

export const updateProfileSchema = z.object({
    username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username cannot be longer than 50 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
        .optional()
        .nullable(),
    
    full_name: z
        .string()
        .min(1, 'Full name is required')
        .max(100, 'Full name cannot be longer than 100 characters, sorry!')
        .optional()
        .nullable(),
    
    avatar_url: z
        .url()
        .optional()
        .nullable(),
    
    grade_level: z
        .enum(['1', '2', '3', '4', '5'], 'The grade must be between 1-5')
        .optional()
        .nullable(),
    
    bio: z
        .string()
        .max(500, 'The bio cannot be longer than 500 characters')
        .optional()
        .nullable()
})

export const changeTelegramAccountSchema = z.object({
    telegram_user_id: z
        .string()
        .regex(/^\d+$/, 'Telegram user ID must be a valid number')
})

export const updateAverageRatingSchema = z.object({
    average_rating: z
        .number()
        .min(0, 'Rating cannot be negative')
        .max(5, 'Rating cannot be higher than 5')
        .multipleOf(0.01, 'Rating can have at most 2 decimal places')
})

export type UpdateProfileData = z.infer<typeof updateProfileSchema>
export type ChangeTelegramAccountData = z.infer<typeof changeTelegramAccountSchema>
export type UpdateAverageRatingData = z.infer<typeof updateAverageRatingSchema>