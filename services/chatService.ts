import { safeSupabaseOperation } from '../template/core/client';
import { Chat, Message, MessageReaction } from '../types';

export const chatService = {
    async getChats(userId: string): Promise<Chat[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('chat_participants')
                .select(`
          chat_id,
          is_locked,
          chats (*)
        `)
                .eq('user_id', userId);

            if (error) return [];

            const chats = await Promise.all(data.map(async (item: any) => {
                const chat = item.chats;
                // Fetch participants for each chat
                const { data: participants } = await client
                    .from('chat_participants')
                    .select('user_id')
                    .eq('chat_id', chat.id);

                return {
                    id: chat.id,
                    name: chat.name,
                    description: chat.description,
                    iconUrl: chat.icon_url,
                    isGroup: chat.is_group,
                    adminId: chat.admin_id,
                    participants: participants?.map(p => p.user_id) || [],
                    unreadCount: 0, // Should be calculated
                    updatedAt: new Date(chat.updated_at),
                    isLocked: item.is_locked
                };
            }));

            return chats;
        });
    },

    async createGroup(name: string, bio: string, adminId: string, members: string[]): Promise<string | null> {
        return await safeSupabaseOperation(async (client) => {
            const { data: chat, error: chatError } = await client
                .from('chats')
                .insert({
                    name,
                    description: bio,
                    is_group: true,
                    admin_id: adminId
                })
                .select()
                .single();

            if (chatError) return null;

            const participants = [adminId, ...members].map(uid => ({
                chat_id: chat.id,
                user_id: uid
            }));

            await client.from('chat_participants').insert(participants);

            return chat.id;
        });
    },

    async toggleLockChat(chatId: string, userId: string, isLocked: boolean): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('chat_participants')
                .update({ is_locked: isLocked })
                .eq('chat_id', chatId)
                .eq('user_id', userId);
            return !error;
        });
    }
};

export const messageService = {
    async getMessages(chatId: string, limit: number = 50): Promise<Message[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) return [];

            return data.map(item => ({
                id: item.id,
                chatId: item.chat_id,
                senderId: item.sender_id,
                content: item.content,
                type: item.type,
                mediaUrl: item.media_url,
                replyToId: item.reply_to_id,
                reactions: item.reactions,
                timestamp: new Date(item.created_at)
            }));
        });
    },

    async sendMessage(chatId: string, senderId: string, content: string, type: string = 'text', mediaUrl?: string, replyToId?: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('messages')
                .insert({
                    chat_id: chatId,
                    sender_id: senderId,
                    content,
                    type,
                    media_url: mediaUrl,
                    reply_to_id: replyToId
                });

            if (!error) {
                await client.from('chats').update({ updated_at: new Date().toISOString() }).eq('id', chatId);
            }

            return !error;
        });
    },

    async addReaction(messageId: string, userId: string, emoji: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { data: message } = await client.from('messages').select('reactions').eq('id', messageId).single();
            const reactions = message?.reactions || [];
            const existing = reactions.find((r: any) => r.userId === userId);

            let newReactions;
            if (existing) {
                if (existing.emoji === emoji) {
                    newReactions = reactions.filter((r: any) => r.userId !== userId);
                } else {
                    newReactions = reactions.map((r: any) => r.userId === userId ? { ...r, emoji } : r);
                }
            } else {
                newReactions = [...reactions, { userId, emoji }];
            }

            const { error } = await client
                .from('messages')
                .update({ reactions: newReactions })
                .eq('id', messageId);

            return !error;
        });
    }
};
