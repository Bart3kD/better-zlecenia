import { z } from 'zod';
import { OFFER_TYPE, OFFER_STATUS } from '@/types/offers.types';

export const attachmentSchema = z.object({
    id: z
        .uuid(),

    filename: z
        .string()
        .min(1, 'Filename is required'),

    url: z
        .url('Invalid URL'),

    type: z
        .enum(['image', 'code', 'document', 'other']),

    mime_type: z
        .string()
        .min(1, 'MIME type is required'),

    size: z
        .number()
        .positive('File size must be positive'),

    uploaded_at: z
        .string()
});

const offerSchema = z.object({
  id: z.uuid(),
  poster_id: z.uuid(),
  taker_id: z.uuid().nullable(),
  category_id: z.uuid(),
  type: z.enum(['help_wanted', 'offering_help']),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  deadline: z.string().nullable(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']),
  requirements: z.string().nullable(),
  attachments: z
        .array(attachmentSchema)
        .nullable(),
  tags: z.array(z.string()).nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  completed_at: z.string().nullable(),
});

export const createOfferSchema = z.object({
    category_id: z
        .uuid('Invalid category ID'),
    
    type: z
        .enum(OFFER_TYPE, 'Type must be either help_wanted or offering_help'),
    
    title: z
        .string()
        .min(1, 'Title must be at least 1 character')
        .max(200, 'Title cannot be longer than 200 characters'),
    
    description: z
        .string()
        .min(1, 'Description must be at least 1 character')
        .max(2000, 'Description cannot be longer than 2000 characters'),
    
    price: z
        .number()
        .min(0, 'Price must be greater or equal to 0')
        .max(99999.99, 'Price cannot exceed 99,999.99'),
    
    deadline: z
        .iso
        .datetime('Invalid deadline format')
        .optional()
        .nullable(),
    
    requirements: z
        .string()
        .max(1000, 'Requirements cannot be longer than 1000 characters')
        .optional()
        .nullable(),
    
    attachments: z
        .array(attachmentSchema)
        .max(5, 'Maximum 5 attachments allowed')
        .optional()
        .nullable(),
    
    tags: z
        .array(z.string().min(1).max(50))
        .max(10, 'Maximum 10 tags allowed')
        .optional()
        .nullable()
});

export const updateOfferSchema = z.object({
    title: z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(200, 'Title cannot be longer than 200 characters')
        .optional(),
    
    description: z
        .string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description cannot be longer than 2000 characters')
        .optional(),
    
    price: z
        .number()
        .positive('Price must be greater than 0')
        .max(99999.99, 'Price cannot exceed 99,999.99')
        .optional(),
    
    deadline: z
        .iso
        .datetime('Invalid deadline format')
        .optional()
        .nullable(),
    
    requirements: z
        .string()
        .max(1000, 'Requirements cannot be longer than 1000 characters')
        .optional()
        .nullable(),
    
    attachments: z
        .array(attachmentSchema)
        .max(5, 'Maximum 5 attachments allowed')
        .optional()
        .nullable(),
    
    tags: z
        .array(z.string().min(1).max(50))
        .max(10, 'Maximum 10 tags allowed')
        .optional()
        .nullable()
});

export const updateOfferStatusSchema = z.object({
    offer_id: z
        .uuid('Invalid offer ID'),
        
    status: z
        .enum(OFFER_STATUS, "Invalid status"),
    
    taker_id: z
        .uuid('Invalid user ID')
        .optional()
        .nullable()
});

export const takeOfferSchema = z.object({
    taker_id: z
        .uuid('Invalid user ID')
});

export const completeOfferSchema = z.object({
    rating_from_poster: z
        .number()
        .int('Rating must be a whole number')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot be higher than 5')
        .optional(),
    
    review_from_poster: z
        .string()
        .max(500, 'Review cannot be longer than 500 characters')
        .optional(),
    
    rating_from_taker: z
        .number()
        .int('Rating must be a whole number')
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating cannot be higher than 5')
        .optional(),
    
    review_from_taker: z
        .string()
        .max(500, 'Review cannot be longer than 500 characters')
        .optional()
});

export const searchOffersSchema = z.object({
    category_id: z
        .uuid('Invalid category ID')
        .optional(),
    
    type: z
        .enum(OFFER_TYPE)
        .optional(),
    
    status: z
        .enum(OFFER_STATUS)
        .optional(),
    
    min_price: z
        .number()
        .min(0, 'Minimum price cannot be negative')
        .optional(),
    
    max_price: z
        .number()
        .positive('Maximum price must be positive')
        .optional(),
    
    grade_level: z
        .enum(['1', '2', '3', '4', '5'])
        .optional(),
    
    search_query: z
        .string()
        .min(2, 'Search query must be at least 2 characters')
        .max(100, 'Search query cannot exceed 100 characters')
        .optional(),
    
    tags: z
        .array(z.string())
        .optional(),
    
    deadline_before: z
        .iso
        .datetime('Invalid date format')
        .optional(),
    
    sort_by: z
        .enum(['created_at', 'price', 'deadline', 'average_rating'])
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
}).refine(
    data => !data.min_price || !data.max_price || data.min_price <= data.max_price,
    {
        message: 'Minimum price cannot be greater than maximum price',
        path: ['min_price']
    }
);

export type Attachment = z.infer<typeof attachmentSchema>;
export type Offer = z.infer<typeof offerSchema>;
export type CreateOfferData = z.infer<typeof createOfferSchema>;
export type UpdateOfferData = z.infer<typeof updateOfferSchema>;
export type UpdateOfferStatusData = z.infer<typeof updateOfferStatusSchema>;
export type TakeOfferData = z.infer<typeof takeOfferSchema>;
export type CompleteOfferData = z.infer<typeof completeOfferSchema>;
export type SearchOffersData = z.infer<typeof searchOffersSchema>;