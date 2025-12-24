import { safeSupabaseOperation } from '../template/core/client';
import { User, Gender } from '../types';

export const profileService = {
    async getProfile(userId: string): Promise<User | null> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) return null;
            return this.mapProfile(data);
        });
    },

    async updateProfile(userId: string, updates: Partial<User>): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('profiles')
                .upsert({
                    id: userId,
                    full_name: updates.full_name,
                    username: updates.username,
                    phone: updates.phone,
                    age: updates.age,
                    gender: updates.gender,
                    bio: updates.bio,
                    avatar_url: updates.avatar,
                    updated_at: new Date().toISOString(),
                    status: updates.status || 'online',
                    chat_pin: updates.chatPin
                })
                .select();

            return !error;
        });
    },

    async searchProfiles(query: string): Promise<User[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('profiles')
                .select('*')
                .ilike('username', `%${query}%`)
                .limit(20);

            if (error) return [];
            return data.map(this.mapProfile);
        });
    },

    mapProfile(data: any): User {
        return {
            id: data.id,
            username: data.username,
            email: data.email || '',
            full_name: data.full_name,
            avatar: data.avatar_url,
            phone: data.phone,
            age: data.age,
            gender: data.gender as Gender,
            bio: data.bio,
            status: data.status,
            lastSeen: data.last_seen ? new Date(data.last_seen) : undefined,
            chatPin: data.chat_pin
        };
    }
};
