import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions , Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { useStories } from '../../../hooks/useStories';
import { useAuth } from '../../../hooks/useAuth';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { GradientText } from '../../../components/ui/GradientText';

const { width } = Dimensions.get('window');

export default function StatusTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stories, storyProfiles } = useStories();
  const { user } = useAuth();

  const myStories = stories.filter(s => s.userId === user?.id);
  const otherStories = stories.filter(s => s.userId !== user?.id);

  const userStories = Array.from(
    new Set(otherStories.map(s => s.userId))
  ).map(userId => {
    const userStoriesList = otherStories.filter(s => s.userId === userId);
    return {
      userId,
      stories: userStoriesList,
      hasUnviewed: userStoriesList.some(s => !s.viewed),
    };
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <GradientText
              text="Status"
              style={styles.headerTitle}
            />
            <Ionicons
              name="sparkles"
              size={24}
              color={colors.secondary}
              style={styles.headerSticker}
            />
          </View>
          <Text style={styles.subtitle}>Share your moments.</Text>
        </View>
        <Button
          variant="round"
          icon="add"
          onPress={() => { /* Add story flow */ }}
          size={58}
        />
      </View>

      <FlatList
        data={[{ type: 'my' as const }, ...userStories]}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
        renderItem={({ item, index }) => {
          if ('type' in item && item.type === 'my') {
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>My Status</Text>
                <TouchableOpacity style={styles.myStatusCard}>
                  <Avatar uri={user?.avatar} size={56} />
                  <View style={styles.myStatusInfo}>
                    <Text style={styles.myStatusText}>Tap to add status update</Text>
                    {myStories.length > 0 && (
                      <Text style={styles.myStatusCount}>{myStories.length} updates</Text>
                    )}
                  </View>
                  <Ionicons name="add-circle" size={32} color={colors.primary} />
                </TouchableOpacity>

                {otherStories.length > 0 && (
                  <Text style={[styles.sectionTitle, styles.recentTitle]}>Recent Updates</Text>
                )}
              </View>
            );
          }

          if (!('type' in item)) {
            const storyUser = storyProfiles[item.userId];
            const lastStory = item.stories[item.stories.length - 1];

            return (
              <View>
                <TouchableOpacity
                  onPress={() => router.push(`/story/${item.userId}`)}
                  style={styles.storyCard}
                >
                  <Avatar
                    uri={storyUser?.avatar}
                    size={56}
                    hasStory
                    storyViewed={!item.hasUnviewed}
                  />
                  <View style={styles.storyInfo}>
                    <Text style={styles.storyUser}>{storyUser?.username || 'Unknown User'}</Text>
                    <Text style={styles.storyTime}>
                      {Math.floor((Date.now() - new Date(lastStory.timestamp).getTime()) / 3600000)}h ago
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        }}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  headerSticker: {
    marginLeft: spacing.sm,
    transform: [{ rotate: '20deg' }],
    textShadowColor: 'rgba(255, 182, 193, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  list: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recentTitle: {
    marginTop: spacing.xl,
  },
  myStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glass.dark,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  myStatusInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  myStatusText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    fontWeight: typography.weights.medium,
  },
  myStatusCount: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  storyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  storyInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  storyUser: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  storyTime: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
});
