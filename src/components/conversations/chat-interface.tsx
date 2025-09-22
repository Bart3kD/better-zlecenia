'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormControl } from '@/components/ui/form';
import { 
  Send, 
  DollarSign, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  MoreVertical,
  MessageCircle,
  Check,
  X
} from 'lucide-react';
import { messagesService, MessageWithSender } from '@/services/messages-service';
import { ConversationWithDetails, conversationsService } from '@/services/conversations-service';
import { offersService } from '@/services/offers-service';
import { createTextMessageSchema, CreateTextMessageData, CreateOfferResponseData } from '@/schemas/messages.schemas';
import { MESSAGE_TYPE, OFFER_RESPONSE_TYPE } from '@/types/messages.types';
import { supabase } from '@/utils/supabase/client';
import { formatDistanceToNow, format } from 'date-fns';
import { OFFER_STATUS } from '@/types/offers.types';
import { CANCELLATION_REQUEST_TYPE } from '@/types/messages.types';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ChatInterfaceProps {
  conversation: ConversationWithDetails;
  onBack?: () => void;
}

interface ChatMessageFormData {
  content: string;
}

export default function ChatInterface({ conversation, onBack }: ChatInterfaceProps) {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const firstUnreadRef = useRef<HTMLDivElement>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [hasScrolledToUnread, setHasScrolledToUnread] = useState(false);
  const [firstUnreadMessageId, setFirstUnreadMessageId] = useState<string | null>(null);
  const [showUnreadDivider, setShowUnreadDivider] = useState(false);
  const [respondingToMessage, setRespondingToMessage] = useState<string | null>(null);
  const [responseMessage, setResponseMessage] = useState('');

  const form = useForm<ChatMessageFormData>({
    defaultValues: {
      content: ''
    }
  });

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', conversation.id],
    queryFn: () => messagesService.getMessages({
      conversation_id: conversation.id,
      limit: 50
    }),
    enabled: !!conversation.id
  });

  // Fetch fresh conversation data to check if it's active
  const { data: freshConversation } = useQuery({
    queryKey: ['conversation', conversation.id],
    queryFn: () => conversationsService.getConversationById(conversation.id),
    enabled: !!conversation.id
  });

  // Mark all unread messages as read when opening chat and store first unread position
  useEffect(() => {
    if (!messages || !currentUserId) return;

    const unreadMessages = messages.filter(
      msg => !msg.is_read && msg.sender_id !== currentUserId
    );

    if (unreadMessages.length > 0) {
      // Store the first unread message ID to show divider persistently
      const firstUnread = unreadMessages[0];
      setFirstUnreadMessageId(firstUnread.id);
      setShowUnreadDivider(true);

      const markAllAsRead = async () => {
        try {
          const messageIds = unreadMessages.map(msg => msg.id);
          
          console.log('Marking messages as read:', { 
            conversation_id: conversation.id, 
            message_ids: messageIds,
            user_id: currentUserId 
          });
          
          // Mark messages as read in database
          await messagesService.markMessagesAsRead({
            conversation_id: conversation.id,
            message_ids: messageIds
          });

          console.log('Successfully marked messages as read in database');

          // Update the messages in the cache
          queryClient.setQueryData(['messages', conversation.id], (old: MessageWithSender[] | undefined) => {
            if (!old) return old;
            return old.map(msg => 
              messageIds.includes(msg.id) ? { ...msg, is_read: true } : msg
            );
          });

          // Immediately update conversations list cache to remove unread count
          queryClient.setQueryData(['conversations'], (old: ConversationWithDetails[] | undefined) => {
            if (!old) return old;
            return old.map(conv => 
              conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
            );
          });

          // Also invalidate to ensure fresh data on next fetch
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          console.log('Updated caches successfully');
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
          // Reset the divider state if marking as read failed
          setFirstUnreadMessageId(null);
          setShowUnreadDivider(false);
        }
      };

      markAllAsRead();
    }
  }, [messages, currentUserId, conversation.id, queryClient]);

  // Reset unread divider when conversation changes
  useEffect(() => {
    return () => {
      setFirstUnreadMessageId(null);
      setShowUnreadDivider(false);
      setHasScrolledToUnread(false);
    };
  }, [conversation.id]);

  // Scroll to first unread message when messages load
  useEffect(() => {
    if (!messages || !currentUserId || hasScrolledToUnread) return;

    // If we have a stored first unread message ID, scroll to it
    if (firstUnreadMessageId && firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      setHasScrolledToUnread(true);
    } else if (!firstUnreadMessageId) {
      // If no unread messages, scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setHasScrolledToUnread(true);
    }
  }, [messages, currentUserId, hasScrolledToUnread, firstUnreadMessageId]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (data: CreateTextMessageData) => messagesService.createMessage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      form.reset({
        content: ''
      });
    }
  });

const respondToCancellationMutation = useMutation({
  mutationFn: async (data: { 
    messageId: string;
    approved: boolean; 
    message?: string;
    offerId: string;
  }) => {
    if (!currentUserId) throw new Error('User not authenticated');

    const result = await messagesService.respondToOfferCancellation(
      conversation.id,
      data.offerId,
      data.approved,
      data.message
    );

    return { ...result, approved: data.approved };
  },
  onSuccess: (result) => {
    queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
    queryClient.invalidateQueries({ queryKey: ['offers'] });
    
    // If cancellation was approved, update the local conversation state immediately
    if (result.approved) {
      queryClient.setQueryData(['conversation', conversation.id], (old: ConversationWithDetails | undefined) => {
        if (!old) return old;
        return { ...old, is_active: false };
      });
    }
    
    setRespondingToMessage(null);
    setResponseMessage('');
  }
});

  // Send offer response mutation
  const sendOfferResponseMutation = useMutation({
    mutationFn: async (responseData: { 
      type: 'accept' | 'decline', 
      message?: string 
    }) => {
      if (!currentUserId) throw new Error('User not authenticated');

      const messageData: CreateOfferResponseData = {
        conversation_id: conversation.id,
        sender_id: currentUserId,
        message_type: MESSAGE_TYPE.OFFER_RESPONSE,
        offer_response_type: responseData.type === 'accept' 
          ? OFFER_RESPONSE_TYPE.ACCEPT 
          : OFFER_RESPONSE_TYPE.DECLINE,
        content: responseData.message || null,
        attachments: null
      };

      // Send the message
      const message = await messagesService.createMessage(messageData);

      // Update offer status and conversation based on response
      if (conversation.offer?.id) {
// In the sendOfferResponseMutation
if (responseData.type === 'accept') {
  await offersService.updateOfferStatus({
    offer_id: conversation.offer.id,
    status: OFFER_STATUS.IN_PROGRESS,
    taker_id: conversation.interested_user_id
  });
} else {
  await offersService.updateOfferStatus({
    offer_id: conversation.offer.id,
    status: OFFER_STATUS.CANCELLED
  });
}
      }

      return message;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversation', conversation.id] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    }
  });

  // Real-time subscription
  useEffect(() => {
    const subscription = messagesService.subscribeToMessages(
      conversation.id,
      (newMessage) => {
        queryClient.setQueryData(['messages', conversation.id], (old: MessageWithSender[] | undefined) => {
          if (!old) return [newMessage];
          return [...old, newMessage];
        });
        
        // Mark as read immediately if not sent by current user
        if (newMessage.sender_id !== currentUserId) {
          messagesService.markMessagesAsRead({
            conversation_id: conversation.id,
            message_ids: [newMessage.id]
          });
        }

        // Scroll to new message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    );

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversation.id, currentUserId, queryClient]);

  const onSubmit: SubmitHandler<ChatMessageFormData> = (data) => {
    if (!data.content.trim() || !currentUserId) return;
    
    const messageData: CreateTextMessageData = {
      conversation_id: conversation.id,
      sender_id: currentUserId,
      content: data.content,
      message_type: MESSAGE_TYPE.TEXT
    };
    
    sendMessageMutation.mutate(messageData);
  };

  const handleOfferResponse = (type: 'accept' | 'decline') => {
    sendOfferResponseMutation.mutate({ type });
  };

  const canManageOffer = () => {
    const currentConversation = freshConversation || conversation;
    return currentUserId === currentConversation.poster_id && 
           currentConversation.offer?.status === 'open';
  };

  const isConversationActive = () => {
    const currentConversation = freshConversation || conversation;
    return currentConversation.is_active && currentConversation.offer?.status !== 'cancelled';
  };

  const getOtherParticipant = () => {
    if (currentUserId === conversation.poster_id) {
      return conversation.interested_user;
    }
    return conversation.poster;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return format(date, 'HH:mm');
    } else {
      return format(date, 'MMM dd, HH:mm');
    }
  };

  // Find the first unread message index for divider placement
  const getFirstUnreadIndex = () => {
    if (!messages || !firstUnreadMessageId || !showUnreadDivider) return -1;
    return messages.findIndex(msg => msg.id === firstUnreadMessageId);
  };

  const renderUnreadDivider = () => (
    <div ref={firstUnreadRef} className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-300 to-transparent"></div>
      <div className="flex items-center gap-2 px-3 py-1 bg-red-100 rounded-full border border-red-200">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-red-700">New messages</span>
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-red-300 to-transparent"></div>
    </div>
  );

  const renderConversationStatus = () => {
  const currentConversation = freshConversation || conversation;
  
  if (currentConversation.offer?.status === 'cancelled') {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
        <XCircle className="h-4 w-4" />
        <span>Offer has been cancelled</span>
      </div>
    );
  }
  
  if (!currentConversation.is_active) {
    // Check if it was deactivated due to approved cancellation
    return (
      <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
        <AlertCircle className="h-4 w-4" />
        <span>Conversation ended - Cancellation approved</span>
      </div>
    );
  }
  
  if (currentConversation.offer?.status === 'in_progress') {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
        <CheckCircle className="h-4 w-4" />
        <span>Offer accepted and in progress</span>
      </div>
    );
  }
  
  return null;
};

const renderMessage = (message: MessageWithSender, index: number) => {
  const isOwn = message.sender_id === currentUserId;
  const otherParticipant = getOtherParticipant();
  const firstUnreadIndex = getFirstUnreadIndex();
  const isFirstUnread = index === firstUnreadIndex;
  
  // Check if current user can respond to this cancellation request
  const canRespondToCancellation = () => {
    return message.message_type === MESSAGE_TYPE.CANCELLATION_REQUEST &&
           message.cancellation_request_type === CANCELLATION_REQUEST_TYPE.REQUEST &&
           !isOwn && // Not sent by current user
           currentUserId === conversation.poster_id && // Current user is the poster
           conversation.offer?.status === 'in_progress'; // Offer is in progress
  };

  const handleCancellationResponse = (approved: boolean) => {
    if (!conversation.offer?.id) return;
    
    respondToCancellationMutation.mutate({
      messageId: message.id,
      approved,
      message: responseMessage.trim() || undefined,
      offerId: conversation.offer.id
    });
  };

  return (
    <div key={message.id}>
      {/* Render unread divider before the first unread message */}
      {isFirstUnread && renderUnreadDivider()}
      
      <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isOwn && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.sender?.avatar_url} />
            <AvatarFallback className="text-xs">
              {getInitials(message.sender?.full_name || message.sender?.username)}
            </AvatarFallback>
          </Avatar>
        )}

        <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
          {/* Message bubble */}
          <div 
            className={`rounded-lg px-4 py-2 transition-all duration-200 ${
              message.message_type === MESSAGE_TYPE.CANCELLATION_REQUEST
                ? 'bg-orange-50 border border-orange-200 text-orange-900'
                : isOwn 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            {/* Render Cancellation Request Messages */}
            {message.message_type === MESSAGE_TYPE.CANCELLATION_REQUEST && (
              <div className="space-y-3">
                {message.cancellation_request_type === CANCELLATION_REQUEST_TYPE.REQUEST && (
                  <>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="font-medium text-orange-800">Cancellation Request</span>
                    </div>
                    {message.cancellation_reason && (
                      <div className="text-sm">
                        <strong className="text-orange-800">Reason:</strong>
                        <p className="mt-1 text-orange-700">{message.cancellation_reason}</p>
                      </div>
                    )}
                    {message.content && (
                      <div className="text-sm">
                        <strong className="text-orange-800">Additional message:</strong>
                        <p className="mt-1 text-orange-700">{message.content}</p>
                      </div>
                    )}
                    
                    {/* Action Buttons for Poster */}
                    {canRespondToCancellation() && (
                      <div className="flex gap-2 pt-2 border-t border-orange-200">
                        {/* Approve Button with Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Cancellation Request</DialogTitle>
                              <DialogDescription>
                                This will approve the cancellation request and return the offer to "open" status.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="approval-message">Response Message (Optional)</Label>
                                <Textarea
                                  id="approval-message"
                                  placeholder="Add a response message..."
                                  value={responseMessage}
                                  onChange={(e) => setResponseMessage(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setResponseMessage('')}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleCancellationResponse(true)}
                                  disabled={respondToCancellationMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {respondToCancellationMutation.isPending ? 'Processing...' : 'Approve Cancellation'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Deny Button with Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Deny
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Deny Cancellation Request</DialogTitle>
                              <DialogDescription>
                                This will deny the cancellation request and the offer will continue as agreed.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="denial-message">Response Message (Optional)</Label>
                                <Textarea
                                  id="denial-message"
                                  placeholder="Explain why you're denying the request..."
                                  value={responseMessage}
                                  onChange={(e) => setResponseMessage(e.target.value)}
                                />
                              </div>
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="outline"
                                  onClick={() => setResponseMessage('')}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleCancellationResponse(false)}
                                  disabled={respondToCancellationMutation.isPending}
                                  variant="destructive"
                                >
                                  {respondToCancellationMutation.isPending ? 'Processing...' : 'Deny Request'}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </>
                )}
                
                {message.cancellation_request_type === CANCELLATION_REQUEST_TYPE.APPROVE && (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="font-medium text-green-800">Cancellation Approved</span>
                    </div>
                    <p className="text-sm text-green-700">The cancellation request has been approved. The offer is now available again.</p>
                    {message.content && (
                      <div className="text-sm">
                        <strong className="text-green-800">Response:</strong>
                        <p className="mt-1 text-green-700">{message.content}</p>
                      </div>
                    )}
                  </>
                )}
                
                {message.cancellation_request_type === CANCELLATION_REQUEST_TYPE.DENY && (
                  <>
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-800">Cancellation Denied</span>
                    </div>
                    <p className="text-sm text-red-700">The cancellation request has been denied. The offer continues as agreed.</p>
                    {message.content && (
                      <div className="text-sm">
                        <strong className="text-red-800">Response:</strong>
                        <p className="mt-1 text-red-700">{message.content}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Render Offer Response Messages */}
            {message.message_type === MESSAGE_TYPE.OFFER_RESPONSE && (
              <div className="mb-2">
                {message.offer_response_type === OFFER_RESPONSE_TYPE.ACCEPT && (
                  <div className="flex items-center gap-1 text-green-300">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Accepted offer</span>
                  </div>
                )}
                {message.offer_response_type === OFFER_RESPONSE_TYPE.DECLINE && (
                  <div className="flex items-center gap-1 text-red-300">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Declined offer</span>
                  </div>
                )}
                {message.offer_response_type === OFFER_RESPONSE_TYPE.COUNTER_OFFER && (
                  <div className="mb-2">
                    <div className="flex items-center gap-1 text-yellow-300 mb-1">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Counter offer</span>
                    </div>
                    <div className="text-sm">
                      <strong>${message.counter_offer_price}</strong>
                      {message.counter_offer_details && (
                        <p className="mt-1">{message.counter_offer_details}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Render regular text content for non-cancellation messages */}
            {message.message_type !== MESSAGE_TYPE.CANCELLATION_REQUEST && message.content && (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            )}
          </div>

          {/* Timestamp and status */}
          <div className={`flex items-center gap-2 mt-1 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.created_at)}
            </span>
            {isOwn && (
              <span className="text-xs">
                {message.is_read ? (
                  <span className="text-blue-500">✓✓</span>
                ) : (
                  <span className="text-gray-400">✓</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

  const otherParticipant = getOtherParticipant();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <CardHeader className="border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherParticipant?.avatar_url} />
            <AvatarFallback>
              {getInitials(otherParticipant?.full_name || otherParticipant?.username)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <CardTitle className="text-lg">
              {otherParticipant?.full_name || otherParticipant?.username || 'Anonymous'}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
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
              <DollarSign className="h-3 w-3" />
              <span>${conversation.offer?.price?.toFixed(2) || '0.00'}</span>
            </div>
          </div>

          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
          {renderConversationStatus()}
        </div>

        {/* Offer Details */}
        <div className="pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">{conversation.offer?.title}</h4>
              <Badge 
                variant={
                  conversation.offer?.status === 'open' ? 'default' : 
                  conversation.offer?.status === 'in_progress' ? 'secondary' :
                  'outline'
                }
                className="text-xs"
              >
                {conversation.offer?.status?.replace('_', ' ')}
              </Badge>
            </div>
            
            {/* Offer Action Buttons - Only show for poster when offer is open */}
            {canManageOffer() && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => handleOfferResponse('accept')}
                  disabled={sendOfferResponseMutation.isPending}
                >
                  <Check className="h-4 w-4 mr-1" />
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleOfferResponse('decline')}
                  disabled={sendOfferResponseMutation.isPending}
                >
                  <X className="h-4 w-4 mr-1" />
                  Decline
                </Button>
              </div>
            )}
          </div>
          
          {/* Show status messages for different offer states */}
          {conversation.offer?.status === 'in_progress' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
              <CheckCircle className="h-4 w-4" />
              <span>Offer accepted and in progress</span>
            </div>
          )}
          {conversation.offer?.status === 'cancelled' && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              <XCircle className="h-4 w-4" />
              <span>Offer has been cancelled</span>
            </div>
          )}
          {!isConversationActive() && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md mt-2">
              <AlertCircle className="h-4 w-4" />
              <span>This conversation has been deactivated</span>
            </div>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="space-y-2 flex-1 max-w-[70%]">
                  <div className="h-16 bg-gray-200 rounded-lg animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No messages yet. Start the conversation!</p>
          </div>
        )}
      </CardContent>

      {/* Message Input */}
      <div className="border-t bg-white p-4">
{!isConversationActive() ? (
  <div className="text-center text-gray-500 py-4">
    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
    {conversation.is_active === false ? (
      <>
        <p className="text-sm">This conversation has ended</p>
        <p className="text-xs text-gray-400 mt-1">
          {conversation.offer?.status === 'cancelled' 
            ? 'The offer was cancelled' 
            : 'The agreement was terminated'}
        </p>
      </>
    ) : (
      <>
        <p className="text-sm">This conversation is no longer active</p>
        <p className="text-xs text-gray-400 mt-1">You cannot send messages in this conversation</p>
      </>
    )}
  </div>
) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Textarea
                        placeholder="Type your message..."
                        className="min-h-[40px] max-h-[120px] resize-none"
                        {...field}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            form.handleSubmit(onSubmit)();
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                disabled={sendMessageMutation.isPending || !form.watch('content')?.trim()}
                size="sm"
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </Form>
        )}
      </div>
    </div>
  );
}