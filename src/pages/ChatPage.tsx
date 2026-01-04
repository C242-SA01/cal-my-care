// src/pages/ChatPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Bot, RefreshCw, Loader } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage'; // Import ChatMessage

const ChatPage: React.FC = () => {
  const { user } = useAuth(); // Assuming useAuth provides a 'user' object with an 'id'
  const { messages, isLoading, sendMessage, resetChat } = useChat(); // userId is now fetched internally by useChat
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      // Disable sending if already loading
      sendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      {' '}
      {/* Adjusted height to h-screen */}
      <header className="flex items-center justify-between border-b bg-rose-50 px-4 py-3">
        <div className="flex items-center gap-3">
          <Bot className="h-6 w-6 text-pink-600" />
          <h2 className="text-lg font-semibold text-pink-800">Chatbot CalMyCare</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={resetChat} disabled={isLoading || messages.length === 0}>
          <RefreshCw className="h-5 w-5 text-pink-600" />
        </Button>
      </header>
      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          <div ref={scrollRef} />
        </div>
      </main>
      <footer className="border-t bg-white pb-24 pt-4 px-4">
        <form onSubmit={handleSend} className="relative">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ketik pertanyaan Anda di sini..." className="pr-12 rounded-full" disabled={isLoading} />
          <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-rose-500 hover:bg-rose-600" disabled={isLoading}>
            {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;
