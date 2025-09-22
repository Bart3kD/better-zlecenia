import { MessageAttachment } from "@/schemas/messages.schemas";

export enum MESSAGE_TYPE {
    TEXT = 'text',
    OFFER_RESPONSE = 'offer_response',
    SYSTEM = 'system',
    CANCELLATION_REQUEST = 'cancellation_request'
}

export enum CANCELLATION_REQUEST_TYPE {
    REQUEST = 'request',
    APPROVE = 'approve',
    DENY = 'deny'
}

export enum OFFER_RESPONSE_TYPE {
    ACCEPT = 'accept',
    DECLINE = 'decline',
    COUNTER_OFFER = 'counter_offer'
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string | null;
    message_type: MESSAGE_TYPE;
    
    // Offer response fields
    offer_response_type: OFFER_RESPONSE_TYPE | null;
    counter_offer_price: number | null;
    counter_offer_details: string | null;
    
    // Cancellation request fields
    cancellation_request_type: CANCELLATION_REQUEST_TYPE | null;
    cancellation_reason: string | null;
    
    is_read: boolean;
    attachments: MessageAttachment[] | null;
    created_at: string;
    updated_at: string;
}