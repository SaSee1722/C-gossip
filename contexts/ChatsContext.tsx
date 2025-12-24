import { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Chat, Message, User } from '../types';
import { chatService, messageService } from '../services/chatService';
import { profileService } from '../services/profileService';
import { useAuth } from '../hooks/useAuth';
import { RealtimeChannel } from '@supabase/supabase-js';
import { getSharedSupabaseClient } from '../template/core/client';

interface ChatsContextType {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'video' | 'audio', mediaUrl?: string, replyToId?: string) => Promise<void>;
  markAsRead: (chatId: string) => void;
  refreshChats: () => Promise<void>;
  loadMessages: (chatId: string) => Promise<void>;
  chatProfiles: { [userId: string]: User };
  typingUsers: { [chatId: string]: boolean };
}

export const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

export function ChatsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<{ [chatId: string]: Message[] }>({});
  const [chatProfiles, setChatProfiles] = useState<{ [userId: string]: User }>({});
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: boolean }>({});
  const client = getSharedSupabaseClient();

  const refreshChats = useCallback(async () => {
    if (user) {
      const fetchedChats = await chatService.getChats(user.id);
      setChats(fetchedChats);

      // Fetch profiles for all participants
      const allParticipantIds = new Set<string>();
      fetchedChats.forEach(chat => {
        chat.participants.forEach(pid => {
          if (pid !== user.id) allParticipantIds.add(pid);
        });
      });

      if (allParticipantIds.size > 0) {
        // Need to implement bulk fetch in profileService or just Promise.all
        // For now Promise.all with individual fetch (optimize later)
        const profiles = await Promise.all(
          Array.from(allParticipantIds).map(id => profileService.getProfile(id))
        );

        const profileMap: { [userId: string]: User } = {};
        profiles.forEach(p => {
          if (p) profileMap[p.id] = p;
        });

        setChatProfiles(prev => ({ ...prev, ...profileMap }));
      }
    }
  }, [user?.id]);

  const loadMessages = useCallback(async (chatId: string) => {
    if (!messages[chatId]) {
      const fetchedMessages = await messageService.getMessages(chatId);
      setMessages(prev => ({
        ...prev,
        [chatId]: fetchedMessages
      }));
    }
  }, [messages]);

  const sendMessage = useCallback(async (chatId: string, content: string, type: 'text' | 'image' | 'video' | 'audio' = 'text', mediaUrl?: string, replyToId?: string) => {
    if (!user) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempId,
      chatId,
      senderId: user.id,
      content,
      type,
      mediaUrl,
      replyToId,
      timestamp: new Date(),
      seen: false
    };

    setMessages(prev => ({
      ...prev,
      [chatId]: [newMessage, ...(prev[chatId] || [])]
    }));

    const success = await messageService.sendMessage(chatId, user.id, content, type, mediaUrl, replyToId);

    if (success) {
      // Re-fetch to get real ID and timestamp, or handle real-time event
      const realMessages = await messageService.getMessages(chatId, 1);
      if (realMessages.length > 0) {
        setMessages(prev => ({
          ...prev,
          [chatId]: prev[chatId].map(m => m.id === tempId ? realMessages[0] : m)
        }));
      }
    } else {
      // Handle failure (remove optimistic message)
      setMessages(prev => ({
        ...prev,
        [chatId]: prev[chatId].filter(m => m.id !== tempId)
      }));
    }
  }, [user?.id]);

  const markAsRead = useCallback(async (chatId: string) => {
    // Note: This needs backend implementation for read receipts table or unread counts
    setChats(prev =>
      prev.map(chat =>
        chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
      )
    );
  }, []);

  useEffect(() => {
    refreshChats();
  }, [user?.id]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!user) return;

    const channel = client
      .channel('public:messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        payload => {
          const newMessage = payload.new as any;
          // Verify if user is part of this chat
          const isRelevant = chats.some(c => c.id === newMessage.chat_id);

          if (isRelevant) {
            // Convert snake_case from DB to camelCase
            const mappedMessage: Message = {
              id: newMessage.id,
              chatId: newMessage.chat_id,
              senderId: newMessage.sender_id,
              content: newMessage.content,
              type: newMessage.type,
              mediaUrl: newMessage.media_url,
              replyToId: newMessage.reply_to_id,
              reactions: newMessage.reactions,
              timestamp: new Date(newMessage.created_at),
              seen: false
            };

            setMessages(prev => ({
              ...prev,
              [newMessage.chat_id]: [mappedMessage, ...(prev[newMessage.chat_id] || [])]
            }));

            // Update last message in chat list
            setChats(prev =>
              prev.map(chat =>
                chat.id === newMessage.chat_id
                  ? { ...chat, lastMessage: mappedMessage, updatedAt: new Date(newMessage.created_at) }
                  : chat
              ).sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            );
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user, chats]);

  const value = useMemo(() => ({
    chats,
    messages,
    chatProfiles,
    sendMessage,
    markAsRead,
    refreshChats,
    loadMessages,
    typingUsers,
  }), [chats, messages, chatProfiles, typingUsers, sendMessage, markAsRead, refreshChats, loadMessages]);

  return (
    <ChatsContext.Provider value={value}>
      {children}
    </ChatsContext.Provider>
  );
}
