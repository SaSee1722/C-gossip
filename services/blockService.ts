import { safeSupabaseOperation } from '../template/core/client';

export const blockService = {
    async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('blocks')
                .insert({
                    blocker_id: blockerId,
                    blocked_id: blockedId
                });
            return !error;
        });
    },

    async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('blocks')
                .delete()
                .eq('blocker_id', blockerId)
                .eq('blocked_id', blockedId);
            return !error;
        });
    },

    async isBlocked(userId: string, otherId: string): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('blocks')
                .select('*')
                .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${userId})`)
                .limit(1);

            return !error && data && data.length > 0;
        });
    }
};
