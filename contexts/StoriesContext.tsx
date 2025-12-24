import { createContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { Story, User } from '../types';
import { statusService } from '../services/statusService';
import { connectionService } from '../services/connectionService';
import { profileService } from '../services/profileService';
import { useAuth } from '../hooks/useAuth';

interface StoriesContextType {
  stories: Story[];
  viewStory: (storyId: string) => void;
  addStory: (type: 'text' | 'image' | 'video', content: string, mediaUrl?: string) => Promise<void>;
  refreshStories: () => Promise<void>;
  storyProfiles: { [userId: string]: User };
}

export const StoriesContext = createContext<StoriesContextType | undefined>(undefined);

export function StoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [storyProfiles, setStoryProfiles] = useState<{ [userId: string]: User }>({});

  const refreshStories = useCallback(async () => {
    if (!user) return;

    // 1. Get friends
    const friends = await connectionService.getFriends(user.id);
    const friendIds = friends.map(f => f.id);

    // 2. Include self
    const userIds = [user.id, ...friendIds];

    // 3. Fetch recent statuses
    const fetchedStories = await statusService.getRecentStatuses(userIds);
    setStories(fetchedStories);

    // 4. Update profiles map
    const profileMap: { [userId: string]: User } = {};
    // Add friends to map
    friends.forEach(f => profileMap[f.id] = f);
    // Add self to map
    if (user?.id) {
      const selfProfile = await profileService.getProfile(user.id);
      if (selfProfile) {
        profileMap[user.id] = selfProfile;
      }
    }
    setStoryProfiles(profileMap);
  }, [user?.id]);

  useEffect(() => {
    refreshStories();
  }, [user?.id]);

  const viewStory = useCallback((storyId: string) => {
    setStories(prev =>
      prev.map(story =>
        story.id === storyId ? { ...story, viewed: true } : story
      )
    );
    // Persist view state in backend if needed (not in current schema)
  }, []);

  const addStory = useCallback(async (type: 'text' | 'image' | 'video', content: string, mediaUrl?: string) => {
    if (!user) return;

    const success = await statusService.uploadStatus(user.id, type, content, mediaUrl);
    if (success) {
      await refreshStories();
    }
  }, [user?.id, refreshStories]);

  const value = useMemo(() => ({
    stories,
    viewStory,
    addStory,
    refreshStories,
    storyProfiles,
  }), [stories, storyProfiles, viewStory, addStory, refreshStories]);

  return (
    <StoriesContext.Provider value={value}>
      {children}
    </StoriesContext.Provider>
  );
}
