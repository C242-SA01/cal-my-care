np; // src/components/ChatMessage.tsx
import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Message } from '@/hooks/useChat'; // Adjust path if useChat is elsewhere

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isBot = message.role === 'model';
  const isUser = message.role === 'user';
  const isLoading = message.role === 'loading';

  if (isLoading) {
    return (
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
          <Bot className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <span className="h-2 w-2 rounded-full bg-pink-300 animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 rounded-full bg-pink-300 animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 rounded-full bg-pink-300 animate-bounce"></span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex items-start gap-3', isUser && 'justify-end')}>
      {isBot && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100 text-pink-600">
          <Bot className="h-6 w-6" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm break-words', // Added break-words
          isBot ? 'bg-pink-50 text-gray-800 rounded-tl-none' : 'bg-rose-500 text-white rounded-br-none'
        )}
      >
        <p>{message.content}</p>
      </div>
      {isUser && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <User className="h-6 w-6" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
