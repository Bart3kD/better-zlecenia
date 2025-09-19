export enum NOTIFICATION_TYPES {
    NEW_MESSAGE = 'new_message',
    OFFER_TAKEN = 'offer_taken',
    OFFER_COMPLETED = 'offer_completed',
    OFFER_CANCELLED = 'offer_cancelled',
    RATING_RECEIVED = 'rating_received',
    OFFER_RESPONSE = 'offer_response',
    COUNTER_OFFER = 'counter_offer',
    PAYMENT_RECEIVED = 'payment_received',
    DEADLINE_REMINDER = 'deadline_reminder',
    SYSTEM_ANNOUNCEMENT = 'system_announcement'
}

export interface Notification {
    id: string;
    user_id: string;
    title: string;
    message: string;
    type: NOTIFICATION_TYPES;
    related_id: string | null;
    is_read: boolean;
    created_at: string;
}