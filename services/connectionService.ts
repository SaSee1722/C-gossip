import { safeSupabaseOperation } from '../template/core/client';
import { ConnectionRequest, User } from '../types';
import { profileService } from './profileService';

export const connectionService = {
    async sendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('connections')
                .insert({
                    requester_id: fromUserId,
                    receiver_id: toUserId,
                    status: 'pending'
                });
            return !error;
        });
    },

    async getPendingRequests(userId: string): Promise<ConnectionRequest[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('connections')
                .select('*')
                .eq('receiver_id', userId)
                .eq('status', 'pending');

            if (error) return [];
            return data.map(item => ({
                id: item.id,
                fromUserId: item.requester_id,
                toUserId: item.receiver_id,
                status: item.status,
                timestamp: new Date(item.created_at)
            }));
        });
    },

    async handleRequest(requestId: string, status: 'accepted' | 'rejected'): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            // First update the status
            const { data: request, error } = await client
                .from('connections')
                .update({ status })
                .eq('id', requestId)
                .select()
                .single();

            if (error) return false;

            if (status === 'accepted') {
                // Check if chat already exists
                // For simplicity, we just create a new one. A unique constraint or lookup would be better.
                // We'll create a new 1-to-1 chat
                const { data: chat, error: chatError } = await client
                    .from('chats')
                    .insert({ is_group: false })
                    .select()
                    .single();

                if (!chatError && chat) {
                    await client.from('chat_participants').insert([
                        { chat_id: chat.id, user_id: request.requester_id },
                        { chat_id: chat.id, user_id: request.receiver_id }
                    ]);
                }
            }

            return true;
        });
    },

    async getFriends(userId: string): Promise<User[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('connections')
                .select(`
          requester_id,
          receiver_id,
          profiles!connections_requester_id_fkey(*),
          receiver:profiles!connections_receiver_id_fkey(*)
        `)
                .eq('status', 'accepted')
                .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

            if (error) return [];

            return data.map((item: any) => {
                const friendData = item.requester_id === userId ? item.receiver : item.profiles;
                return profileService.mapProfile(friendData);
            });
        });
    },

    async getBlockedUsers(userId: string): Promise<User[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('blocks')
                .select(`
                    blocked_id,
                    profiles!blocks_blocked_id_fkey(*)
                `)
                .eq('blocker_id', userId);

            if (error) return [];
            return data.map((item: any) => profileService.mapProfile(item.profiles));
        });
    },

    async unblockUser(userId: string, blockedId: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('blocks')
                .delete()
                .eq('blocker_id', userId)
                .eq('blocked_id', blockedId);
            return !error;
        });
    }
};
