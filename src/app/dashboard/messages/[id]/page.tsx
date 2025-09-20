'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import ChatInterface from '@/components/conversations/chat-interface';
import { conversationsService } from '@/services/conversations-service';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.id as string;

  const { data: conversation, isLoading, error } = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => conversationsService.getConversationById(conversationId),
    enabled: !!conversationId
  });

  const handleBack = () => {
    router.push('/dashboard/messages');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="h-[600px] flex items-center justify-center">
          <div className="animate-pulse space-y-4 w-full max-w-md">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error || !conversation) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center border-red-200 bg-red-50">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-red-800 mb-2">Conversation not found</h2>
          <p className="text-red-600 mb-4">
            The conversation you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Messages
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 h-[calc(100vh-2rem)]">
      <Card className="h-full">
        <ChatInterface conversation={conversation} onBack={handleBack} />
      </Card>
    </div>
  );
}