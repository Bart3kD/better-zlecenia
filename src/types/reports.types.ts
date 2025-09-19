export enum REPORT_STATUS {
    PENDING = 'pending',
    REVIEWING = 'reviewing',
    RESOLVED = 'resolved',
    DISMISSED = 'dismissed'
}

export interface Report {
    id: string;
    reporter_id: string;
    reported_user_id: string | null;
    offer_id: string | null;
    message_id: string | null;
    reason: string;
    description: string | null;
    status: string;
    created_at: string;
}