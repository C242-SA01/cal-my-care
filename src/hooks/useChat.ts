// src/hooks/useChat.ts
import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client'; // Import supabase client for fetching user ID

export interface Message {
  id: string;
  role: 'user' | 'model' | 'loading';
  content: string;
}

export const useChat = () => { // userId is now fetched internally
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Fetch userId on component mount
  useEffect(() => {
    const getUserId = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setSessionId(uuidv4()); // Generate session ID after userId is available
      } else {
        // Handle case where user is not logged in, or redirect to login
        console.error("User not logged in, cannot start chat.");
        // Optionally, set a guest userId or redirect
      }
    };
    getUserId();
  }, []); // Run only once on mount

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || !userId || !sessionId) return;

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: messageText,
    };

    const loadingMessage: Message = {
      id: uuidv4(),
      role: 'loading',
      content: '',
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      // Get the session token for authorization
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error("No session token found. User not authenticated.");
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ message: messageText, userId, sessionId }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to get a response from the server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botMessageContent = '';

      setMessages((prev) => prev.filter(msg => msg.role !== 'loading'));
      
      const botMessage: Message = {
        id: uuidv4(),
        role: 'model',
        content: '',
      };
      setMessages((prev) => [...prev, botMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        botMessageContent += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMessage.id ? { ...msg, content: botMessageContent } : msg
          )
        );
      }
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
  }, [userId, sessionId]); // Dependencies

  const resetChat = useCallback(() => {
    setSessionId(uuidv4()); // Generate new session ID
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, resetChat, userId };
};
