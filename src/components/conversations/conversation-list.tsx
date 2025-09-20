'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  MessageCircle, 
  Clock, 
  DollarSign,
  ArrowRight,
  Filter,
  Users,
  Inbox
} from 'lucide-react';
import { conversationsService, ConversationWithDetails } from '@/services/conversations-service';
import { messagesService } from '@/services/messages-service';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/utils/supabase/client';
import { MESSAGE_TYPE } from '@/types/messages.types';

interface ConversationListProps {
  selectedConversationId?: string;
  onConversationSelect?: (conversation: ConversationWithDetails) => void;
}

export default function ConversationList({ 
  selectedConversationId, 
  onConversationSelect 
}: ConversationListProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'active'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  
  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const { data: conversations, isLoading, error } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      return conversationsService.getConversations({
        user_id: user.id,
        is_active: true,
        sort_by: 'last_message_at',
        sort_order: 'desc'
      });
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Real-time subscription to message updates for unread count changes
  useEffect(() => {
    if (!conversations || !currentUserId) return;

    const subscriptions = conversations.map(conversation => {
      return supabase
        .channel(`conversation_messages:${conversation.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          async (payload) => {
            // When a message is updated (likely marked as read), refresh conversations
            if (payload.new.is_read !== payload.old.is_read) {
              // Fetch fresh unread count for this conversation
              const unreadCount = await messagesService.getUnreadCount(conversation.id);
              
              // Update the specific conversation in cache
              queryClient.setQueryData(['conversations'], (old: ConversationWithDetails[] | undefined) => {
                if (!old) return old;
                return old.map(conv => 
                  conv.id === conversation.id ? { ...conv, unread_count: unreadCount } : conv
                );
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          async (payload) => {
            // When a new message is inserted, refresh conversations to update last message and unread count
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }
        )
        .subscribe();
    });

    return () => {
      subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
  }, [conversations, currentUserId, queryClient]);

  // Filter conversations based on search and filter
  const filteredConversations = conversations?.filter(conversation => {
    const matchesSearch = !searchTerm || 
      conversation.offer?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.poster?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.interested_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && (conversation.unread_count || 0) > 0) ||
      (filter === 'active' && conversation.is_active);
    
    return matchesSearch && matchesFilter;
  }) || [];

  const getOtherParticipant = (conversation: ConversationWithDetails, currentUserId?: string | null) => {
    if (!currentUserId) return conversation.poster;
    
    if (currentUserId === conversation.poster_id) {
      return conversation.interested_user;
    }
    return conversation.poster;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatLastMessage = (message: any, senderId: string, currentUserId?: string| null) => {
    if (!message) return 'No messages yet';
    
    const isOwn = senderId === currentUserId;
    const prefix = isOwn ? 'You: ' : '';
    
    switch (message.message_type) {
      case MESSAGE_TYPE.OFFER_RESPONSE:
        return `${prefix}Sent an offer response`;
      case MESSAGE_TYPE.SYSTEM:
        return message.content || 'System message';
      default:
        return `${prefix}${message.content || 'Sent a message'}`;
    }
  };

  const handleConversationClick = async (conversation: ConversationWithDetails) => {
    // Immediately update the UI to remove unread indicator
    if ((conversation.unread_count || 0) > 0) {
      queryClient.setQueryData(['conversations'], (old: ConversationWithDetails[] | undefined) => {
        if (!old) return old;
        return old.map(conv => 
          conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
        );
      });
    }

    if (onConversationSelect) {
      onConversationSelect(conversation);
    } else {
      router.push(`/dashboard/messages/${conversation.id}`);
    }
  };

  if (error) {
    return (
      <Card className="p-6 text-center border-red-200 bg-red-50">
        <MessageCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-red-800 mb-2">Error loading conversations</h3>
        <p className="text-red-600">Please try refreshing the page</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Messages</h2>
          {conversations && conversations.length > 0 && (
            <Badge variant="outline" className="ml-2">
              {filteredConversations.length}
            </Badge>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Unread
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredConversations.length === 0 && (
        <Card className="p-8 text-center">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {conversations?.length === 0 ? 'No conversations yet' : 'No matching conversations'}
          </h3>
          <p className="text-gray-500">
            {conversations?.length === 0 
              ? 'Start a conversation by contacting someone about their offer'
              : 'Try adjusting your search or filter'
            }
          </p>
          {searchTerm || filter !== 'all' ? (
            <Button 
              variant="outline" 
              className="mt-3"
              onClick={() => {
                setSearchTerm('');
                setFilter('all');
              }}
            >
              Clear filters
            </Button>
          ) : null}
        </Card>
      )}

      {/* Conversations List */}
      {!isLoading && filteredConversations.length > 0 && (
        <div className="space-y-2">
          {filteredConversations.map((conversation) => {
            const otherParticipant = getOtherParticipant(conversation, currentUserId);
            const isSelected = selectedConversationId === conversation.id;
            const hasUnread = (conversation.unread_count || 0) > 0;

            return (
              <Card 
                key={conversation.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isSelected ? 'border-blue-500 bg-blue-50' : ''
                } ${hasUnread ? 'border-l-4 border-l-green-500' : ''}`}
                onClick={() => handleConversationClick(conversation)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={otherParticipant?.avatar_url} />
                      <AvatarFallback>
                        {getInitials(otherParticipant?.full_name || otherParticipant?.username)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {otherParticipant?.full_name || otherParticipant?.username || 'Anonymous'}
                        </h4>
                        <div className="flex items-center gap-2">
                          {hasUnread && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              {conversation.unread_count}
                            </Badge>
                          )}
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(conversation.last_message_at))} ago
                          </span>
                        </div>
                      </div>

                      {/* Offer Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            conversation.offer?.type === 'help_wanted' 
                              ? 'border-blue-200 text-blue-700'
                              : 'border-green-200 text-green-700'
                          }`}
                        >
                          {conversation.offer?.type === 'help_wanted' ? 'Help Wanted' : 'Offering Help'}
                        </Badge>
                        <DollarSign className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          ${conversation.offer?.price?.toFixed(2) || '0.00'}
                        </span>
                      </div>

                      <h5 className="text-sm font-medium text-gray-800 mb-1 truncate">
                        {conversation.offer?.title}
                      </h5>

                      {/* Last Message */}
                      <p className="text-sm text-gray-600 truncate">
                        {formatLastMessage(
                          conversation.last_message, 
                          conversation.last_message?.sender_id || '', 
                          currentUserId
                        )}
                      </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}