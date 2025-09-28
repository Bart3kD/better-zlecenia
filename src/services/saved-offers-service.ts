// services/saved-offers-service.ts

import { supabase } from '@/utils/supabase/client';

export interface SavedOfferResponse {
  id: string;
  user_id: string;
  offer_id: string;
  created_at: string;
}

export class SavedOffersService {
  /**
   * Save an offer for the current user
   */
  static async saveOffer(offerId: string): Promise<SavedOfferResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('saved_offers')
      .insert({
        user_id: user.id,
        offer_id: offerId
      })
      .select()
      .single();

    if (error) {
      // If it's a duplicate key error, it means the offer is already saved
      if (error.code === '23505') {
        throw new Error('Offer already saved');
      }
      throw error;
    }

    return data;
  }

  /**
   * Remove a saved offer for the current user
   */
  static async unsaveOffer(offerId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('saved_offers')
      .delete()
      .eq('user_id', user.id)
      .eq('offer_id', offerId);

    if (error) {
      throw error;
    }
  }

  /**
   * Check if an offer is saved by the current user
   */
  static async isOfferSaved(offerId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from('saved_offers')
      .select('id')
      .eq('user_id', user.id)
      .eq('offer_id', offerId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking if offer is saved:', error);
      return false;
    }

    return !!data;
  }

  /**
   * Get all saved offers for the current user
   */
  static async getSavedOffers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('saved_offers')
      .select(`
        id,
        created_at,
        offers (
          id,
          title,
          description,
          price,
          type,
          status,
          created_at,
          deadline,
          profiles!offers_poster_id_fkey (
            full_name,
            username,
            avatar_url
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data?.map(item => ({
      saved_id: item.id,
      saved_at: item.created_at,
      ...item.offers
    })) || [];
  }

  /**
   * Toggle save status of an offer
   */
  static async toggleSave(offerId: string): Promise<{ isSaved: boolean; message: string }> {
    try {
      const isSaved = await this.isOfferSaved(offerId);
      
      if (isSaved) {
        await this.unsaveOffer(offerId);
        return { isSaved: false, message: 'Oferta usunięta z zapisanych' };
      } else {
        await this.saveOffer(offerId);
        return { isSaved: true, message: 'Oferta zapisana' };
      }
    } catch (error: any) {
      if (error.message === 'Offer already saved') {
        return { isSaved: true, message: 'Oferta już jest zapisana' };
      }
      throw error;
    }
  }
}

export const savedOffersService = SavedOffersService;