import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { useConnections } from '../../../hooks/useConnections';
import { colors, spacing, typography, borderRadius } from '../../../constants/theme';
import { GradientText } from '../../../components/ui/GradientText';
import { User } from '../../../types';

export default function ConnectionsTab() {
  const insets = useSafeAreaInsets();
  const { connections, requests, requestProfiles, acceptRequest, rejectRequest, searchUsers, sendRequest } = useConnections();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 1) {
        setIsSearching(true);
        const results = await searchUsers(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSendRequest = async (userId: string) => {
    setSentRequests(prev => [...prev, userId]);
    await sendRequest(userId);
  };

  const renderSearchResult = ({ item, index }: { item: User, index: number }) => (
    <View>
      <GlassCard style={styles.connectionCard}>
        <Avatar uri={item.avatar} size={48} />
        <View style={styles.connectionInfo}>
          <Text style={styles.connectionName}>{item.username}</Text>
          <Text style={styles.statusText}>{item.full_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleSendRequest(item.id)}
          disabled={sentRequests.includes(item.id) || connections.some(c => c.id === item.id)}
        >
          {connections.some(c => c.id === item.id) ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
          ) : sentRequests.includes(item.id) ? (
            <Ionicons name="time" size={24} color={colors.text.tertiary} />
          ) : (
            <Ionicons name="person-add" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      </GlassCard>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <GradientText
              text="Connections"
              style={styles.headerTitle}
            />
            <Ionicons
              name="people-circle-outline"
              size={28}
              color={colors.primary}
              style={styles.headerSticker}
            />
          </View>
          <Text style={styles.subtitle}>Build your network.</Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {searchQuery.length > 1 ? (
        <View style={styles.list}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {isSearching ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.id}
              renderItem={renderSearchResult}
              contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={[{ type: 'requests' }, { type: 'connections' }]}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          renderItem={({ item }) => {
            if (item.type === 'requests' && requests.length > 0) {
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Connection Requests</Text>
                  {requests.map((request, index) => {
                    const user = requestProfiles[request.fromUserId];
                    if (!user) return null;

                    return (
                      <View key={request.id}>
                        <GlassCard style={styles.requestCard}>
                          <View style={styles.requestContent}>
                            <Avatar uri={user.avatar} size={48} />
                            <View style={styles.requestInfo}>
                              <Text style={styles.requestName}>{user.username}</Text>
                              <Text style={styles.requestBio}>{user.bio || 'No bio'}</Text>
                            </View>
                          </View>
                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              onPress={() => acceptRequest(request.id)}
                              style={styles.actionButtonContainer}
                            >
                              <LinearGradient
                                colors={[colors.primary, colors.secondary]}
                                style={styles.actionButton}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                              >
                                <Ionicons name="checkmark" size={20} color={colors.black} />
                              </LinearGradient>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => rejectRequest(request.id)}
                              style={styles.rejectButton}
                            >
                              <Ionicons name="close" size={20} color={colors.text.tertiary} />
                            </TouchableOpacity>
                          </View>
                        </GlassCard>
                      </View>
                    );
                  })}
                </View>
              );
            }

            if (item.type === 'connections') {
              return (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>My Connections</Text>
                  {connections.length === 0 && <Text style={styles.emptyText}>No connections yet.</Text>}
                  {connections.map((user, index) => (
                    <View key={user.id}>
                      <TouchableOpacity>
                        <GlassCard style={styles.connectionCard}>
                          <Avatar uri={user.avatar} size={48} />
                          <View style={styles.connectionInfo}>
                            <Text style={styles.connectionName}>{user.username}</Text>
                            <View style={styles.statusRow}>
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: user.status === 'online' ? colors.success : colors.text.tertiary },
                                ]}
                              />
                              <Text style={styles.statusText}>
                                {user.status === 'online' ? 'Online' : 'Offline'}
                              </Text>
                            </View>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color={colors.text.tertiary} />
                        </GlassCard>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              );
            }

            return null;
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
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
    transform: [{ rotate: '-10deg' }],
    textShadowColor: 'rgba(0, 191, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  searchInput: {
    marginBottom: 0,
  },
  list: {
    flex: 1,
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
  requestCard: {
    marginBottom: spacing.md,
  },
  requestContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  requestInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  requestName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  requestBio: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  requestActions: {
    flexDirection: 'row',
    padding: spacing.md,
    paddingTop: 0,
    gap: spacing.sm,
  },
  actionButtonContainer: {
    flex: 1,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: colors.glass.medium,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  connectionInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  connectionName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
  addButton: {
    padding: spacing.sm,
  }
});
