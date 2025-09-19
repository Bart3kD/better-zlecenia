
export interface Profile {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    school_email: string;
    telegram_user_id: string | null;
    telegram_link_token: string;
    grade_level: number | null;
    bio: string | null;
    average_rating: number;
    created_at: string;
    updated_at: string;
}

export interface PartialProfile extends Profile {
    username: string | null;
    full_name: string | null;
    grade_level: number | null;
}

export interface CompleteProfile extends Profile {
    username: string;
    full_name: string;
    grade_level: number;
}