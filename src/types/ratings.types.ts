export interface Rating {
    id: string;
    offer_id: string;
    rater_id: string;
    rated_id: string;
    rating: number;
    review: string | null;
    created_at: string;
}