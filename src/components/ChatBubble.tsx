// src/components/ChatBubble.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

const ChatBubble: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        size="icon"
        className="h-14 w-14 rounded-full bg-rose-500 shadow-lg hover:bg-rose-600 transition-transform hover:scale-110"
        onClick={() => navigate('/chatbot')}
      >
        <MessageSquare className="h-7 w-7 text-white" />
      </Button>
    </div>
  );
};

export default ChatBubble;
