import { supabase } from '@/utils/supabase/client';
import { CreateMessageData, UpdateMessageData, GetMessagesData, MarkMessagesAsReadData, CreateSystemMessageData, CreateCancellationRequestData } from '@/schemas/messages.schemas';
import { CANCELLATION_REQUEST_TYPE, Message, MESSAGE_TYPE } from '@/types/messages.types';
import { Offer } from '@/types/offers.types'; // Import from types, not services
import { offersService, OfferWithRelations } from './offers-service';

export interface MessageWithSender extends Message {
  sender?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export const messagesService = {
  async getMessages(params: GetMessagesData): Promise<MessageWithSender[]> {
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('conversation_id', params.conversation_id);

    if (params.message_type) {
      query = query.eq('message_type', params.message_type);
    }

    if (params.unread_only) {
      query = query.eq('is_read', false);
    }

    if (params.before_date) {
      query = query.lt('created_at', params.before_date);
    }

    if (params.after_date) {
      query = query.gt('created_at', params.after_date);
    }

    query = query
      .order('created_at', { ascending: true })
      .limit(params.limit || 50);

    if (params.offset) {
      query = query.range(params.offset, (params.offset + (params.limit || 50)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }

    return data || [];
  },

  async createMessage(messageData: CreateMessageData): Promise<MessageWithSender> {
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating message:', error);
      throw error;
    }

    // Update conversation's last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', messageData.conversation_id);

    return data;
  },

  async updateMessage(id: string, updates: UpdateMessageData): Promise<MessageWithSender> {
    const { data, error } = await supabase
      .from('messages')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error updating message:', error);
      throw error;
    }

    return data;
  },

  async markMessagesAsRead(params: MarkMessagesAsReadData): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    let query = supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', params.conversation_id)
      .neq('sender_id', user.id); // Don't mark own messages as read

    if (params.message_ids && params.message_ids.length > 0) {
      query = query.in('id', params.message_ids);
    }

    const { error } = await query;

    if (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  async deleteMessage(id: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  async getUnreadCount(conversationId: string): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  },

  // Real-time subscription for messages
  subscribeToMessages(conversationId: string, callback: (message: MessageWithSender) => void) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Fetch the complete message with sender info
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();

    return subscription;
  },

  // Real-time subscription for message updates (like read status)
  subscribeToMessageUpdates(conversationId: string, callback: (message: MessageWithSender) => void) {
    const subscription = supabase
      .channel(`message_updates:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id (
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (data) {
            callback(data);
          }
        }
      )
      .subscribe();

    return subscription;
  },

  // Add these functions to your messagesService

// Create cancellation request message
async createCancellationRequestMessage(messageData: CreateCancellationRequestData): Promise<MessageWithSender> {
  const { data, error } = await supabase
    .from('messages')
    .insert(messageData)
    .select(`
      *,
      sender:profiles!sender_id (
        id,
        username,
        full_name,
        avatar_url
      )
    `)
    .single();

  if (error) {
    console.error('Error creating cancellation request message:', error);
    throw error;
  }

  // Update conversation's last_message_at
  await supabase
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', messageData.conversation_id);

  return data;
},

// Combined function to request cancellation (updates offer + sends message)
async requestOfferCancellation(
  conversationId: string,
  offerId: string,
  reason: string,
  additionalMessage?: string
): Promise<{ offer: OfferWithRelations; message: MessageWithSender }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, update the offer with cancellation request
  const offer = await offersService.requestCancellation(offerId, reason);

  // Then, create a cancellation request message
  const messageData: CreateCancellationRequestData = {
    conversation_id: conversationId,
    sender_id: user.id,
    message_type: MESSAGE_TYPE.CANCELLATION_REQUEST,
    cancellation_request_type: CANCELLATION_REQUEST_TYPE.REQUEST,
    cancellation_reason: reason,
    content: additionalMessage || null,
    attachments: null
  };

  const message = await this.createCancellationRequestMessage(messageData);

  return { offer, message };
},

// Update your messagesService respondToOfferCancellation function
async respondToOfferCancellation(
  conversationId: string,
  offerId: string,
  approved: boolean,
  responseMessage?: string
): Promise<{ offer: OfferWithRelations; message: MessageWithSender }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, respond to the cancellation request in the offer
  const offer = await offersService.respondToCancellationRequest(
    offerId, 
    approved, 
    responseMessage
  );

  // If cancellation is approved, deactivate the conversation
  if (approved) {
    await supabase
      .from('conversations')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId);
  }

  // Then, create a response message
  const messageData: CreateCancellationRequestData = {
    conversation_id: conversationId,
    sender_id: user.id,
    message_type: MESSAGE_TYPE.CANCELLATION_REQUEST,
    cancellation_request_type: approved 
      ? CANCELLATION_REQUEST_TYPE.APPROVE 
      : CANCELLATION_REQUEST_TYPE.DENY,
    cancellation_reason: null,
    content: responseMessage || null,
    attachments: null
  };

  const message = await this.createCancellationRequestMessage(messageData);

  return { offer, message };
},




// Cancel/withdraw cancellation request
async withdrawCancellationRequest(
  conversationId: string,
  offerId: string,
  withdrawMessage?: string
): Promise<{ offer: OfferWithRelations; message: MessageWithSender }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // First, cancel the cancellation request in the offer
  const offer = await offersService.cancelCancellationRequest(offerId);

  // Then, create a system message about the withdrawal
  const messageData: CreateSystemMessageData = {
    conversation_id: conversationId,
    sender_id: user.id,
    message_type: MESSAGE_TYPE.SYSTEM,
    content: withdrawMessage || 'Cancellation request has been withdrawn.',
    attachments: null
  };

  const message = await this.createMessage(messageData);

  return { offer, message };
}
};