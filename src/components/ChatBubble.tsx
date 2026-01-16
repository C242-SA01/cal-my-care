// src/components/ChatBubble.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const ChatBubble: React.FC = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const handleChatClick = () => {
    const isAdmin = userProfile?.role === 'admin' || userProfile?.role === 'midwife';
    if (isAdmin) {
      navigate('/admin/chatbot');
    } else {
      navigate('/chatbot');
    }
  };

  // PERBAIKAN: Hapus <div className="fixed ..."> pembungkus
  // Langsung return Button saja.
  return (
    <Button size="icon" className="h-14 w-14 rounded-full bg-rose-500 shadow-lg hover:bg-rose-600 transition-transform hover:scale-110" onClick={handleChatClick}>
      <MessageSquare className="h-7 w-7 text-white" />
    </Button>
  );
};

export default ChatBubble;
