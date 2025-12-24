import { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { User, ConnectionRequest } from '../types';
import { connectionService } from '../services/connectionService';
import { profileService } from '../services/profileService';
import { useAuth } from '../hooks/useAuth';

interface ConnectionsContextType {
  connections: User[];
  requests: ConnectionRequest[];
  requestProfiles: { [userId: string]: User };
  searchUsers: (query: string) => Promise<User[]>;
  sendRequest: (userId: string) => Promise<void>;
  acceptRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  refreshConnections: () => Promise<void>;
}

export const ConnectionsContext = createContext<ConnectionsContextType | undefined>(undefined);

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<User[]>([]);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [requestProfiles, setRequestProfiles] = useState<{ [userId: string]: User }>({});

  const refreshConnections = useCallback(async () => {
    if (!user) return;

    // Fetch Friends
    const friends = await connectionService.getFriends(user.id);
    setConnections(friends);

    // Fetch Requests
    const pendingRequests = await connectionService.getPendingRequests(user.id);
    setRequests(pendingRequests);

    // Fetch profiles for requests
    if (pendingRequests.length > 0) {
      const userIds = pendingRequests.map(r => r.fromUserId);
      // Deduplicate
      const uniqueIds = Array.from(new Set(userIds));

      const profiles = await Promise.all(
        uniqueIds.map(id => profileService.getProfile(id))
      );

      const profileMap: { [userId: string]: User } = {};
      profiles.forEach(p => {
        if (p) profileMap[p.id] = p;
      });
      setRequestProfiles(profileMap);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshConnections();
  }, [user?.id]);

  const searchUsers = useCallback(async (query: string): Promise<User[]> => {
    if (!query.trim()) return [];
    const results = await profileService.searchProfiles(query);
    // Filter out self and potentially existing connections if desired
    return results.filter(u => u.id !== user?.id);
  }, [user?.id]);

  const sendRequest = useCallback(async (toUserId: string) => {
    if (!user) return;
    const success = await connectionService.sendRequest(user.id, toUserId);
    if (success) {
      // Maybe show toast? 
      // Refresh requests isn't needed as we are the sender, but if we had an "Outgoing Requests" tab we would.
    }
  }, [user?.id]);

  const acceptRequest = useCallback(async (requestId: string) => {
    const success = await connectionService.handleRequest(requestId, 'accepted');
    if (success) {
      // In real backend, a trigger might create the chat.
      // For now, we manually refresh to update lists.
      refreshConnections();
    }
  }, [refreshConnections]);

  const rejectRequest = useCallback(async (requestId: string) => {
    const success = await connectionService.handleRequest(requestId, 'rejected');
    if (success) {
      setRequests(prev => prev.filter(r => r.id !== requestId));
    }
  }, []);

  const value = useMemo(() => ({
    connections,
    requests,
    requestProfiles,
    searchUsers,
    sendRequest,
    acceptRequest,
    rejectRequest,
    refreshConnections,
  }), [connections, requests, requestProfiles, searchUsers, sendRequest, acceptRequest, rejectRequest, refreshConnections]);

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}
