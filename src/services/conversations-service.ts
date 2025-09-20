import { supabase } from '@/utils/supabase/client';
import { CreateConversationData, UpdateConversationData, GetConversationsData } from '@/schemas/conversations.schemas';
import { Conversation } from '@/types/conversations.types';

export interface ConversationWithDetails extends Conversation {
  offer?: {
    id: string;
    title: string;
    type: 'help_wanted' | 'offering_help';
    price: number;
    status: string;
  };
  poster?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  interested_user?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
  unread_count?: number;
  last_message?: {
    id: string;
    content: string;
    message_type: string;
    sender_id: string;
    created_at: string;
  };
}

export const conversationsService = {
  async getConversations(params?: GetConversationsData): Promise<ConversationWithDetails[]> {
    let query = supabase
      .from('conversations')
      .select(`
        *,
        offer:offers (
          id,
          title,
          type,
          price,
          status
        ),
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        interested_user:profiles!interested_user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `);

    if (params?.user_id) {
      query = query.or(`poster_id.eq.${params.user_id},interested_user_id.eq.${params.user_id}`);
    }

    if (params?.offer_id) {
      query = query.eq('offer_id', params.offer_id);
    }

    if (params?.is_active !== undefined) {
      query = query.eq('is_active', params.is_active);
    }

    const sortBy = params?.sort_by || 'last_message_at';
    const sortOrder = params?.sort_order === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortBy, sortOrder);

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, (params.offset + (params.limit || 20)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }

    // Get unread message counts for each conversation
    const conversationsWithCounts = await Promise.all(
      (data || []).map(async (conversation) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return conversation;

        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('id, content, message_type, sender_id, created_at')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          ...conversation,
          unread_count: count || 0,
          last_message: lastMessage
        };
      })
    );

    return conversationsWithCounts;
  },

  async getConversationById(id: string): Promise<ConversationWithDetails | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        offer:offers (
          id,
          title,
          type,
          price,
          status,
          description
        ),
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        interested_user:profiles!interested_user_id (
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
        return null;
      }
      console.error('Error fetching conversation:', error);
      throw error;
    }

    return data;
  },

  async createConversation(data: CreateConversationData): Promise<ConversationWithDetails> {
    // Check if conversation already exists
    const existing = await this.getConversationByParticipants(
      data.offer_id,
      data.interested_user_id
    );

    if (existing) {
      return existing;
    }

    // Get poster_id from offer
    const { data: offer } = await supabase
      .from('offers')
      .select('poster_id')
      .eq('id', data.offer_id)
      .single();

    if (!offer) {
      throw new Error('Offer not found');
    }

    const { data: conversation, error } = await supabase
      .from('conversations')
      .insert({
        offer_id: data.offer_id,
        poster_id: offer.poster_id,
        interested_user_id: data.interested_user_id
      })
      .select(`
        *,
        offer:offers (
          id,
          title,
          type,
          price,
          status
        ),
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        interested_user:profiles!interested_user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }

    return conversation;
  },

  async updateConversation(id: string, updates: UpdateConversationData): Promise<ConversationWithDetails> {
    const { data, error } = await supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        offer:offers (
          id,
          title,
          type,
          price,
          status
        ),
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        interested_user:profiles!interested_user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }

    return data;
  },

  async getConversationByParticipants(
    offerId: string, 
    interestedUserId: string
  ): Promise<ConversationWithDetails | null> {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        offer:offers (
          id,
          title,
          type,
          price,
          status
        ),
        poster:profiles!poster_id (
          id,
          username,
          full_name,
          avatar_url
        ),
        interested_user:profiles!interested_user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('offer_id', offerId)
      .eq('interested_user_id', interestedUserId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching conversation by participants:', error);
      throw error;
    }

    return data;
  },

  async deleteConversation(id: string): Promise<void> {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
};