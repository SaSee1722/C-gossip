import { safeSupabaseOperation } from '../template/core/client';
import { Call, CallType, CallStatus } from '../types';

export const callService = {
    async logCall(callerId: string, receiverId: string, type: CallType, status: CallStatus, duration: number = 0): Promise<boolean> {
        return await safeSupabaseOperation(async (client) => {
            const { error } = await client
                .from('calls')
                .insert({
                    caller_id: callerId,
                    receiver_id: receiverId,
                    type,
                    status,
                    duration
                });
            return !error;
        });
    },

    async getCallHistory(userId: string): Promise<Call[]> {
        return await safeSupabaseOperation(async (client) => {
            const { data, error } = await client
                .from('calls')
                .select('*')
                .or(`caller_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('created_at', { ascending: false });

            if (error) return [];

            return data.map(item => ({
                id: item.id,
                callerId: item.caller_id,
                receiverId: item.receiver_id,
                type: item.type,
                status: item.status,
                timestamp: new Date(item.created_at),
                duration: item.duration
            }));
        });
    }
};
