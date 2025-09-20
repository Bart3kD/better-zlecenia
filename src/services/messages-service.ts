import { supabase } from '@/utils/supabase/client';
import { CreateMessageData, UpdateMessageData, GetMessagesData, MarkMessagesAsReadData } from '@/schemas/messages.schemas';
import { Message } from '@/types/messages.types';

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
  }
};