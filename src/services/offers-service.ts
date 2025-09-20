import { supabase } from '@/utils/supabase/client';
import { CreateOfferData, UpdateOfferData, UpdateOfferStatusData } from '@/schemas/offers.schemas';

export interface Offer {
  id: string;
  poster_id: string;
  taker_id?: string;
  category_id: string;
  type: 'help_wanted' | 'offering_help';
  title: string;
  description: string;
  price: number;
  deadline?: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  requirements?: string;
  attachments?: any[];
  tags?: string[];
  created_at: string;
  updated_at: string;
  completed_at?: string;
  
  // Relations
  poster?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    average_rating: number;
  };
  taker?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    average_rating: number;
  };
  category?: {
    id: string;
    name: string;
    icon?: string;
  };
}

export interface CreateOfferWithPoster extends CreateOfferData {
  poster_id: string;
}

export const offersService = {
  async getOffers(): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        taker:profiles!taker_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        category:categories (
          id,
          name,
          icon
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
    
    return data || [];
  },

  async getOfferById(id: string): Promise<Offer | null> {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        taker:profiles!taker_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        category:categories (
          id,
          name,
          icon
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows returned
      }
      console.error('Error fetching offer:', error);
      throw error;
    }
    
    return data;
  },

  async createOffer(offerData: CreateOfferWithPoster): Promise<Offer> {
    // Clean up the data for database insertion
    const cleanData = {
      poster_id: offerData.poster_id,
      category_id: offerData.category_id,
      type: offerData.type,
      title: offerData.title,
      description: offerData.description,
      price: offerData.price,
      deadline: offerData.deadline || null,
      requirements: offerData.requirements || null,
      tags: offerData.tags && offerData.tags.length > 0 ? offerData.tags : null,
      attachments: offerData.attachments && offerData.attachments.length > 0 ? offerData.attachments : null,
      status: 'open' as const
    };

    const { data, error } = await supabase
      .from('offers')
      .insert(cleanData)
      .select(`
        *,
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        category:categories (
          id,
          name,
          icon
        )
      `)
      .single();
    
    if (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
    
    return data;
  },

  async updateOffer(id: string, updates: Partial<UpdateOfferData>): Promise<Offer> {
    const { data, error } = await supabase
      .from('offers')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        taker:profiles!taker_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        category:categories (
          id,
          name,
          icon
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
    
    return data;
  },

  async updateOfferStatus(data: UpdateOfferStatusData): Promise<Offer> {
  const updateData: any = {
    status: data.status,
    updated_at: new Date().toISOString()
  };

  // Only set taker_id if provided
  if (data.taker_id !== undefined) {
    updateData.taker_id = data.taker_id;
  }

  // Set completed_at if marking as completed
  if (data.status === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { data: updatedOffer, error } = await supabase
    .from('offers')
    .update(updateData)
    .eq('id', data.offer_id)
    .select(`
      *,
      poster:profiles!poster_id (
        id,
        username,
        full_name,
        avatar_url,
        average_rating
      ),
      taker:profiles!taker_id (
        id,
        username,
        full_name,
        avatar_url,
        average_rating
      ),
      category:categories (
        id,
        name,
        icon
      )
    `)
    .single();

  if (error) {
    console.error('Error updating offer status:', error);
    throw error;
  }

  return updatedOffer;
  },

  async deleteOffer(id: string): Promise<void> {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting offer:', error);
      throw error;
    }
  },

  async getUserOffers(userId: string): Promise<Offer[]> {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        taker:profiles!taker_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        category:categories (
          id,
          name,
          icon
        )
      `)
      .or(`poster_id.eq.${userId},taker_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user offers:', error);
      throw error;
    }
    
    return data || [];
  },

  async searchOffers(params: {
    query?: string;
    category_id?: string;
    type?: 'help_wanted' | 'offering_help';
    min_price?: number;
    max_price?: number;
    has_deadline?: boolean;
    tags?: string[];
  }): Promise<Offer[]> {
    let query = supabase
      .from('offers')
      .select(`
        *,
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        taker:profiles!taker_id (
          id,
          username,
          full_name,
          avatar_url,
          average_rating
        ),
        category:categories (
          id,
          name,
          icon
        )
      `)
      .eq('status', 'open');

    if (params.query) {
      query = query.or(`title.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }

    if (params.category_id) {
      query = query.eq('category_id', params.category_id);
    }

    if (params.type) {
      query = query.eq('type', params.type);
    }

    if (params.min_price !== undefined) {
      query = query.gte('price', params.min_price);
    }

    if (params.max_price !== undefined) {
      query = query.lte('price', params.max_price);
    }

    if (params.has_deadline !== undefined) {
      if (params.has_deadline) {
        query = query.not('deadline', 'is', null);
      } else {
        query = query.is('deadline', null);
      }
    }

    if (params.tags && params.tags.length > 0) {
      query = query.overlaps('tags', params.tags);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    
    if (error) {
      console.error('Error searching offers:', error);
      throw error;
    }
    
    return data || [];
  }
};