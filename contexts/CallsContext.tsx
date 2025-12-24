import { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Call, User } from '../types';
import { callService } from '../services/callService';
import { profileService } from '../services/profileService';
import { useAuth } from '../hooks/useAuth';

interface CallsContextType {
  calls: Call[];
  callProfiles: { [userId: string]: User };
  activeCall: Call | null;
  startCall: (receiverId: string, type: 'voice' | 'video') => Promise<void>;
  endCall: () => Promise<void>;
  acceptCall: (callId: string) => void;
  rejectCall: (callId: string) => void;
  refreshCalls: () => Promise<void>;
}

export const CallsContext = createContext<CallsContextType | undefined>(undefined);

export function CallsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [calls, setCalls] = useState<Call[]>([]);
  const [callProfiles, setCallProfiles] = useState<{ [userId: string]: User }>({});
  const [activeCall, setActiveCall] = useState<Call | null>(null);

  const refreshCalls = useCallback(async () => {
    if (!user) return;
    const history = await callService.getCallHistory(user.id);
    setCalls(history);

    // Fetch profiles
    const userIds = new Set<string>();
    history.forEach(c => {
      if (c.callerId !== user.id) userIds.add(c.callerId);
      if (c.receiverId !== user.id) userIds.add(c.receiverId);
    });

    if (userIds.size > 0) {
      const profiles = await Promise.all(
        Array.from(userIds).map(id => profileService.getProfile(id))
      );
      const profileMap: { [userId: string]: User } = {};
      profiles.forEach(p => {
        if (p) profileMap[p.id] = p;
      });
      setCallProfiles(profileMap);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshCalls();
  }, [user?.id]);

  const startCall = useCallback(async (receiverId: string, type: 'voice' | 'video') => {
    if (!user) return;

    // Simulate active call state
    const tempCall: Call = {
      id: `temp-${Date.now()}`,
      callerId: user.id,
      receiverId,
      type,
      status: 'outgoing',
      timestamp: new Date()
    };
    setActiveCall(tempCall);

    // In real implementation, this would initiate WebRTC signaling
    await callService.logCall(user.id, receiverId, type, 'outgoing');
    await refreshCalls();
  }, [user?.id, refreshCalls]);

  const endCall = useCallback(async () => {
    if (activeCall && user) {
      // Log completion
      await callService.logCall(
        activeCall.callerId,
        activeCall.receiverId,
        activeCall.type,
        'completed',
        60 // Mock duration
      );
      setActiveCall(null);
      await refreshCalls();
    }
  }, [activeCall, user?.id, refreshCalls]);

  const acceptCall = useCallback((callId: string) => {
    // Logic to accept incoming call (join WebRTC room)
    const call = calls.find(c => c.id === callId);
    if (call) setActiveCall(call);
  }, [calls]);

  const rejectCall = useCallback((callId: string) => {
    // Logic to reject
  }, []);

  const value = useMemo(() => ({
    calls,
    callProfiles,
    activeCall,
    startCall,
    endCall,
    acceptCall,
    rejectCall,
    refreshCalls,
  }), [calls, callProfiles, activeCall, startCall, endCall, acceptCall, rejectCall, refreshCalls]);

  return (
    <CallsContext.Provider value={value}>
      {children}
    </CallsContext.Provider>
  );
}
