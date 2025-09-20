'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import ConversationList from '@/components/conversations/conversation-list';
import ChatInterface from '@/components/conversations/chat-interface';
import { ConversationWithDetails } from '@/services/conversations-service';

export default function MessagesPage() {
  const [selectedConversation, setSelectedConversation] = useState<ConversationWithDetails | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile responsiveness
  const handleConversationSelect = (conversation: ConversationWithDetails) => {
    setSelectedConversation(conversation);
    setIsMobile(window.innerWidth < 768);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 h-[calc(100vh-2rem)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {/* Conversation List */}
        <div className={`md:col-span-1 ${isMobile && selectedConversation ? 'hidden md:block' : ''}`}>
          <ConversationList 
            selectedConversationId={selectedConversation?.id}
            onConversationSelect={handleConversationSelect}
          />
        </div>

        {/* Chat Interface */}
        <div className={`md:col-span-2 ${!selectedConversation && !isMobile ? 'hidden md:block' : ''}`}>
          {selectedConversation ? (
            <Card className="h-full">
              <ChatInterface 
                conversation={selectedConversation} 
                onBack={isMobile ? handleBack : undefined}
              />
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <div className="text-center text-gray-500 p-8">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a conversation</h3>
                <p className="text-gray-600">Choose a conversation from the list to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}