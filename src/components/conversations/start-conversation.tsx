'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { MessageCircle, Send } from 'lucide-react';
import { conversationsService } from '@/services/conversations-service';
import { messagesService } from '@/services/messages-service';
import { createTextMessageSchema, CreateTextMessageData } from '@/schemas/messages.schemas';
import { MESSAGE_TYPE } from '@/types/messages.types';
import { supabase } from '@/utils/supabase/client';
import { z } from 'zod';

const startConversationSchema = z.object({
  message: z.string().min(1, 'Please enter a message').max(2000, 'Message too long')
});

type StartConversationData = z.infer<typeof startConversationSchema>;

interface StartConversationProps {
  offerId: string;
  posterName?: string;
  offerTitle?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost';
}

export default function StartConversation({ 
  offerId, 
  posterName, 
  offerTitle,
  buttonText = 'Contact',
  buttonVariant = 'outline'
}: StartConversationProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Get current user to check if they're the poster
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getCurrentUser();
  }, []);

  const form = useForm<StartConversationData>({
    resolver: zodResolver(startConversationSchema),
    defaultValues: {
      message: `Hi! I'm interested in your offer "${offerTitle}". Could you provide more details?`
    }
  });

  const startConversationMutation = useMutation({
    mutationFn: async (data: StartConversationData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in to start a conversation');

      // Check if user is trying to message themselves
      const { data: offer } = await supabase
        .from('offers')
        .select('poster_id')
        .eq('id', offerId)
        .single();

      if (offer && offer.poster_id === user.id) {
        throw new Error("You can't message yourself about your own offer");
      }

      setIsStarting(true);

      // Create or get existing conversation
      const conversation = await conversationsService.createConversation({
        offer_id: offerId,
        interested_user_id: user.id
      });

      // Send initial message
      const messageData: CreateTextMessageData = {
        conversation_id: conversation.id,
        sender_id: user.id,
        content: data.message,
        message_type: MESSAGE_TYPE.TEXT
      };

      await messagesService.createMessage(messageData);

      return conversation;
    },
    onSuccess: (conversation) => {
      setIsOpen(false);
      form.reset();
      router.push(`/dashboard/messages/${conversation.id}`);
    },
    onError: (error) => {
      console.error('Failed to start conversation:', error);
      // You could show a toast notification here
    },
    onSettled: () => {
      setIsStarting(false);
    }
  });

  const onSubmit = (data: StartConversationData) => {
    startConversationMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contact {posterName || 'the poster'}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {offerTitle && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Regarding:</p>
              <p className="font-medium text-gray-900">{offerTitle}</p>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your message</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Hi! I'm interested in your offer..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isStarting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isStarting}>
                  {isStarting ? (
                    'Starting...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}