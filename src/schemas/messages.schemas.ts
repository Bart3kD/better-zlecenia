import { CANCELLATION_REQUEST_TYPE, MESSAGE_TYPE, OFFER_RESPONSE_TYPE } from "@/types/messages.types";
import { z } from "zod";

export const messageAttachmentSchema = z.object({
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

export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;

const baseMessageSchema = z.object({
    conversation_id: z
        .uuid('Invalid conversation ID'),
    
    sender_id: z
        .uuid('Invalid sender ID'),
    
    attachments: z
        .array(messageAttachmentSchema)
        .max(3, 'Maximum 3 attachments allowed per message')
        .optional()
        .nullable()
});

export const createTextMessageSchema = baseMessageSchema.extend({
    content: z
        .string()
        .min(1, 'Message content cannot be empty')
        .max(2000, 'Message cannot be longer than 2000 characters'),
    
    message_type: z
        .literal(MESSAGE_TYPE.TEXT)
        .default(MESSAGE_TYPE.TEXT)
});

export const createOfferResponseSchema = baseMessageSchema.extend({
    message_type: z
        .literal(MESSAGE_TYPE.OFFER_RESPONSE),
    
    offer_response_type: z
        .enum([OFFER_RESPONSE_TYPE.ACCEPT, OFFER_RESPONSE_TYPE.DECLINE]),
    
    content: z
        .string()
        .max(500, 'Response message cannot be longer than 500 characters')
        .optional()
        .nullable()
});

export const createCounterOfferSchema = baseMessageSchema.extend({
    message_type: z
        .literal(MESSAGE_TYPE.OFFER_RESPONSE),
    
    offer_response_type: z
        .literal(OFFER_RESPONSE_TYPE.COUNTER_OFFER),
    
    counter_offer_price: z
        .number()
        .positive('Counter offer price must be greater than 0')
        .max(99999.99, 'Price cannot exceed 99,999.99'),
    
    counter_offer_details: z
        .string()
        .min(1, 'Counter offer details are required')
        .max(1000, 'Counter offer details cannot exceed 1000 characters'),
    
    content: z
        .string()
        .max(500, 'Additional message cannot be longer than 500 characters')
        .optional()
        .nullable()
});

export const createSystemMessageSchema = baseMessageSchema.extend({
    message_type: z
        .literal(MESSAGE_TYPE.SYSTEM),
    
    content: z
        .string()
        .min(1, 'System message content cannot be empty')
        .max(1000, 'System message cannot exceed 1000 characters')
});

export const createCancellationRequestSchema = baseMessageSchema.extend({
    message_type: z
        .literal(MESSAGE_TYPE.CANCELLATION_REQUEST),
    
    cancellation_request_type: z
        .enum([
            CANCELLATION_REQUEST_TYPE.REQUEST, 
            CANCELLATION_REQUEST_TYPE.APPROVE, 
            CANCELLATION_REQUEST_TYPE.DENY
        ]),
    
    cancellation_reason: z
        .string()
        .min(10, 'Please provide a reason for cancellation (minimum 10 characters)')
        .max(500, 'Cancellation reason cannot exceed 500 characters')
        .optional()
        .nullable(),
    
    content: z
        .string()
        .max(500, 'Additional message cannot be longer than 500 characters')
        .optional()
        .nullable()
});

export const createMessageSchema = z.discriminatedUnion('message_type', [
    createTextMessageSchema,
    createOfferResponseSchema,
    createCounterOfferSchema,
    createSystemMessageSchema,
    createCancellationRequestSchema  // Add this line
]);

export const updateMessageSchema = z.object({
    content: z
        .string()
        .min(1, 'Message content cannot be empty')
        .max(2000, 'Message cannot be longer than 2000 characters')
        .optional(),
    
    is_read: z
        .boolean()
        .optional()
});

export const markMessagesAsReadSchema = z.object({
    conversation_id: z
        .uuid('Invalid conversation ID'),
    
    message_ids: z
        .array(z.uuid('Invalid message ID'))
        .min(1, 'At least one message ID is required')
        .max(50, 'Cannot mark more than 50 messages at once')
        .optional(), // If not provided, mark all unread messages in conversation
});

export const getMessagesSchema = z.object({
    conversation_id: z
        .uuid('Invalid conversation ID'),
    
    message_type: z
        .enum(MESSAGE_TYPE)
        .optional(),
    
    unread_only: z
        .boolean()
        .default(false)
        .optional(),
    
    before_date: z
        .iso
        .datetime('Invalid date format')
        .optional(),
    
    after_date: z
        .iso
        .datetime('Invalid date format')
        .optional(),
    
    limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(50)
        .optional(),
    
    offset: z
        .number()
        .int()
        .min(0)
        .default(0)
        .optional()
});


export type CreateTextMessageData = z.infer<typeof createTextMessageSchema>;
export type CreateOfferResponseData = z.infer<typeof createOfferResponseSchema>;
export type CreateCounterOfferData = z.infer<typeof createCounterOfferSchema>;
export type CreateSystemMessageData = z.infer<typeof createSystemMessageSchema>;
export type CreateMessageData = z.infer<typeof createMessageSchema>;
export type UpdateMessageData = z.infer<typeof updateMessageSchema>;
export type MarkMessagesAsReadData = z.infer<typeof markMessagesAsReadSchema>;
export type GetMessagesData = z.infer<typeof getMessagesSchema>;
export type CreateCancellationRequestData = z.infer<typeof createCancellationRequestSchema>;