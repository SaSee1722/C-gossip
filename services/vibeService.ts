import { View, Platform } from 'react-native';
import { safeSupabaseOperation } from '../template/core/client';
import { Vibe } from '../types';

export const vibeService = {
    async uploadVibe(userId: string, type: 'image' | 'video', uri: string, note?: string): Promise<boolean> {
        try {
            return await safeSupabaseOperation(async (client) => {
                // 1. Prepare file for upload (Handle Web vs Mobile)
                let fileBody: any;
                const extension = type === 'video' ? 'mp4' : 'jpg';
                const filename = `${userId}/${Date.now()}.${extension}`;

                if (Platform.OS === 'web') {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    fileBody = await blob.arrayBuffer(); // Convert to ArrayBuffer
                } else {
                    // On mobile, the {uri, name, type} object works for Supabase/FormData
                    fileBody = {
                        uri,
                        name: filename,
                        type: type === 'video' ? 'video/mp4' : 'image/jpeg',
                    };
                }

                const { data: storageData, error: storageError } = await client.storage
                    .from('status_updates')
                    .upload(filename, fileBody, {
                        upsert: true,
                        cacheControl: '3600',
                        contentType: type === 'video' ? 'video/mp4' : 'image/jpeg'
                    });

                if (storageError) {
                    throw storageError;
                }
                const { data: { publicUrl } } = client.storage.from('status_updates').getPublicUrl(filename);

                // 2. Insert into vibes table
                const { error: tableError } = await client
                    .from('vibes')
                    .insert({
                        user_id: userId,
                        type,
                        media_url: publicUrl,
                        note,
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                    });

                if (tableError) console.error('Table Error:', tableError);
                return !tableError;
            });
        } catch (error) {
            console.error('Critical Upload Error:', error);
            return false;
        }
    },

    async getVibes(): Promise<Vibe[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('vibes')
                .select('*')
                .gt('expires_at', new Date().toISOString())
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                    console.warn('Protocol Notice: Vibes table not yet initialized in database.');
                } else {
                    console.error('Vibe Fetch Error:', error);
                }
                return [];
            }
            return data.map(item => ({
                id: item.id,
                userId: item.user_id,
                type: item.type,
                mediaUrl: item.media_url,
                note: item.note,
                timestamp: new Date(item.created_at),
                expiresAt: new Date(item.expires_at)
            }));
        });
    },

    async recordView(vibeId: string, viewerId: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('vibe_views')
                .upsert({ vibe_id: vibeId, viewer_id: viewerId }, { onConflict: 'vibe_id, viewer_id' });
            return !error;
        });
    },

    async getViewers(vibeId: string): Promise<any[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('vibe_views')
                .select('created_at, profiles(username, avatar_url, full_name)')
                .eq('vibe_id', vibeId);

            if (error) return [];
            return data.map(item => {
                const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
                return {
                    timestamp: item.created_at,
                    username: profile?.username,
                    avatar: profile?.avatar_url,
                    fullName: profile?.full_name
                };
            });
        });
    }
};
