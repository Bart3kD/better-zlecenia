import { supabase } from '@/utils/supabase/client';
import { CreateOfferData, UpdateOfferData, UpdateOfferStatusData } from '@/schemas/offers.schemas';
import { Attachment, OFFER_STATUS, OFFER_TYPE, Offer } from '@/types/offers.types';

// Updated interface with cancellation fields
export interface OfferWithRelations extends Offer {
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
  // Additional relation for cancellation requester
  cancellation_requester?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CreateOfferWithPoster extends CreateOfferData {
  poster_id: string;
}

export const offersService = {
  async getOffers(): Promise<OfferWithRelations[]> {
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
    
    return data || [];
  },

  async getOfferById(id: string): Promise<OfferWithRelations | null> {
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
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

  async createOffer(offerData: CreateOfferWithPoster): Promise<OfferWithRelations> {
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

  async updateOffer(id: string, updates: Partial<UpdateOfferData>): Promise<OfferWithRelations> {
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();
    
    if (error) {
      console.error('Error updating offer:', error);
      throw error;
    }
    
    return data;
  },

  async updateOfferStatus(data: UpdateOfferStatusData): Promise<OfferWithRelations> {
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
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

  async getUserOffers(userId: string): Promise<OfferWithRelations[]> {
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
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
  }): Promise<OfferWithRelations[]> {
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
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
  },

  // Request cancellation (called by taker)
  async requestCancellation(offerId: string, reason: string): Promise<OfferWithRelations> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('offers')
      .update({
        cancellation_requested_by: user.id,
        cancellation_reason: reason,
        cancellation_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .eq('taker_id', user.id) // Ensure only the taker can request cancellation
      .eq('status', 'in_progress') // Only allow for in-progress offers
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error requesting cancellation:', error);
      throw error;
    }

    return data;
  },

  // Respond to cancellation request (called by poster)
  async respondToCancellationRequest(
    offerId: string, 
    approved: boolean, 
    responseMessage?: string
  ): Promise<OfferWithRelations> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (approved) {
      // If approved, set offer back to open and clear cancellation fields
      updateData.status = 'open';
      updateData.taker_id = null;
      updateData.cancellation_requested_by = null;
      updateData.cancellation_reason = null;
      updateData.cancellation_requested_at = null;
    } else {
      // If denied, just clear the cancellation request
      updateData.cancellation_requested_by = null;
      updateData.cancellation_reason = null;
      updateData.cancellation_requested_at = null;
    }

    const { data, error } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', offerId)
      .eq('poster_id', user.id) // Ensure only the poster can respond
      .not('cancellation_requested_by', 'is', null) // Ensure there's a pending request
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error responding to cancellation request:', error);
      throw error;
    }

    return data;
  },

  // Cancel cancellation request (called by taker to withdraw their request)
  async cancelCancellationRequest(offerId: string): Promise<OfferWithRelations> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('offers')
      .update({
        cancellation_requested_by: null,
        cancellation_reason: null,
        cancellation_requested_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .eq('cancellation_requested_by', user.id) // Ensure only the requester can cancel their request
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
        ),
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error cancelling cancellation request:', error);
      throw error;
    }

    return data;
  },

  // Get offers with pending cancellation requests (for poster dashboard)
  async getOffersWithCancellationRequests(userId: string): Promise<OfferWithRelations[]> {
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
        cancellation_requester:profiles!cancellation_requested_by (
          id,
          username,
          full_name,
          avatar_url
        ),
        category:categories (
          id,
          name,
          icon
        )
      `)
      .eq('poster_id', userId)
      .not('cancellation_requested_by', 'is', null)
      .order('cancellation_requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching offers with cancellation requests:', error);
      throw error;
    }

    return data || [];
  }
};