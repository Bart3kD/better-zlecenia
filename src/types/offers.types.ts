export enum OFFER_TYPE {
    HELP_WANTED = 'help_wanted',
    OFFERING_HELP = 'offering_help'
}

export enum OFFER_STATUS {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
}

export interface Attachment {
    id: string;
    filename: string;
    url: string;
    type: 'image' | 'code' | 'document' | 'other';
    mime_type: string; // e.g., 'image/png', 'text/plain', 'application/pdf'
    size: number; // file size in bytes
    uploaded_at: string;
}

export interface Offer {
    id: string;
    poster_id: string;
    taker_id: string | null;
    category_id: string;
    type: OFFER_TYPE;
    title: string;
    description: string;
    price: number;
    deadline: string | null;
    status: OFFER_STATUS;
    requirements: string | null;
    attachments: Attachment[] | null;
    tags: string[] | null;
    created_at: string;
    updated_at: string;
    completed_at: string | null;
}