import { safeSupabaseOperation } from '../template/core/client';
import { Story, StatusType } from '../types';

export const statusService = {
    async uploadStatus(userId: string, type: StatusType, content: string, mediaUrl?: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('statuses')
                .insert({
                    user_id: userId,
                    type,
                    content,
                    media_url: mediaUrl
                });
            return !error;
        });
    },

    async getRecentStatuses(userIds: string[]): Promise<Story[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('statuses')
                .select('*')
                .in('user_id', userIds)
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) return [];

            return data.map(item => ({
                id: item.id,
                userId: item.user_id,
                type: item.type,
                content: item.content,
                mediaUrl: item.media_url,
                timestamp: new Date(item.created_at),
                expiresAt: new Date(item.expires_at),
                viewed: false
            }));
        });
    }
};
