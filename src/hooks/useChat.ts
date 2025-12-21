// src/hooks/useChat.ts
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'model' | 'loading';
  content: string;
}

export const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setSessionId(uuidv4());
      } else {
        console.error("User not logged in, cannot start chat.");
      }
    };
    getUserId();
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !userId) return;

    const userMessage: Message = { id: uuidv4(), role: 'user', content: messageText };
    const loadingMessage: Message = { id: uuidv4(), role: 'loading', content: '' };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("No session token found.");

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        // Only send the message for the simplified function
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        // Try to get more specific error from the body
        const errorBody = await response.text();
        console.error("Server responded with an error:", errorBody);
        throw new Error(`Failed to get a response from the server. Status: ${response.status}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: uuidv4(),
        role: 'model',
        content: data.reply || "No reply found in response.",
      };

      setMessages((prev) => [...prev.filter(m => m.role !== 'loading'), botMessage]);

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'model',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.',
      };
      setMessages((prev) => [...prev.filter(m => m.role !== 'loading'), errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, sessionId]);

  const resetChat = useCallback(() => {
    setSessionId(uuidv4());
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, resetChat, userId };
};
