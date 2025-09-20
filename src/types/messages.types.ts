import { MessageAttachment } from "@/schemas/messages.schemas";

export enum MESSAGE_TYPE {
    TEXT = 'text',
    OFFER_RESPONSE = 'offer_response',
    SYSTEM = 'system'
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
    offer_response_type: OFFER_RESPONSE_TYPE | null;
    counter_offer_price: number | null;
    counter_offer_details: string | null;
    is_read: boolean;
    attachments: MessageAttachment[] | null;
    created_at: string;
    updated_at: string;
}   