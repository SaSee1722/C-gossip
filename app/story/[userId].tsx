import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Avatar } from '../../components/ui/Avatar';
import { useStories } from '../../hooks/useStories';

import { colors, spacing, typography } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function StoryViewer() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stories, viewStory, storyProfiles } = useStories();
  const [currentIndex, setCurrentIndex] = useState(0);

  const userStories = stories.filter(s => s.userId === userId);
  const currentStory = userStories[currentIndex];
  const user = storyProfiles[userId as string];

  if (!currentStory) {
    router.back();
    return null;
  }

  const handleNext = () => {
    viewStory(currentStory.id);
    if (currentIndex < userStories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleNext}
        style={styles.storyContainer}
      >
        {currentStory.mediaUrl && (
          <Image
            source={{ uri: currentStory.mediaUrl }}
            style={styles.storyImage}
            contentFit="cover"
          />
        )}
        <View style={styles.overlay} />

        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.progressContainer}>
            {userStories.map((_, index) => (
              <View key={index} style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: index <= currentIndex ? '100%' : '0%' },
                  ]}
                />
              </View>
            ))}
          </View>

          <View style={styles.userInfo}>
            <Avatar uri={user?.avatar} size={36} />
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.timestamp}>
              {Math.floor((Date.now() - currentStory.timestamp.getTime()) / 3600000)}h ago
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.white} />
          </TouchableOpacity>
        </View>

        <BlurView intensity={60} style={styles.contentContainer}>
          <Text style={styles.storyContent}>{currentStory.content}</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  storyContainer: {
    flex: 1,
  },
  storyImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  header: {
    paddingHorizontal: spacing.md,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  timestamp: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: spacing.sm,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
  },
  contentContainer: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.md,
    right: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
  },
  storyContent: {
    fontSize: typography.sizes.lg,
    color: colors.white,
    fontWeight: typography.weights.medium,
  },
});
