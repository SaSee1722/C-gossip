import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Pressable, ScrollView } , Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { colors, spacing, borderRadius, typography } from '../../../constants/theme';
import { GradientText } from '../../../components/ui/GradientText';
import { useChats } from '../../../hooks/useChats';
import { useAuth } from '../../../hooks/useAuth';
import { useConnections } from '../../../hooks/useConnections';
import { chatService } from '../../../services/chatService';

export default function GroupsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chats, refreshChats } = useChats();
  const { user } = useAuth();
  const { connections } = useConnections();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupBio, setGroupBio] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const groups = chats.filter(c => c.isGroup);

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriends.length === 0 || !user) {
      alert('PROTOCOL ERROR: Missing Group Name or Members.');
      return;
    }

    setLoading(true);
    try {
      const chatId = await chatService.createGroup(groupName, groupBio, user.id, selectedFriends);
      if (chatId) {
        await refreshChats();
        setShowCreateModal(false);
        setGroupName('');
        setGroupBio('');
        setSelectedFriends([]);
        router.push(`/chat/${chatId}`);
      } else {
        alert('FAILURE: Could not establish group protocol.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <GradientText text="Groups" style={styles.headerTitle} />
            <Animated.Image
              source={require('../../../assets/images/groups_doodle.png')}
              style={[styles.headerIcon, { width: 48, height: 48 }]}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>Communities you belong to.</Text>
        </View>
        <Button
          variant="round"
          icon="add"
          onPress={() => setShowCreateModal(true)}
          size={58}
        />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(300)} style={styles.mainCard}>
        <FlatList
          data={groups}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You haven't joined any groups yet.</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInRight.delay(index * 100).springify()}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.groupItem}
                onPress={() => router.push(`/chat/${item.id}`)}
              >
                {item.iconUrl ? (
                  <Avatar uri={item.iconUrl} size={52} />
                ) : (
                  <View style={styles.initialsAvatar}>
                    <Text style={styles.initialsText}>
                      {item.name?.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.groupInfo}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.groupName}>{item.name?.toUpperCase()}</Text>
                    <Text style={styles.groupTime}>
                      {item.updatedAt ? new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </Text>
                  </View>
                  <Text style={styles.groupMessage} numberOfLines={1}>
                    {item.lastMessage?.content || 'No messages yet'}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.2)" />
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </Animated.View>

      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCreateModal(false)}>
          <Animated.View entering={ZoomIn} style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>ESTABLISH GROUP PROTOCOL</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>GROUP IDENTITY</Text>
                <TextInput
                  style={styles.input}
                  placeholder="NAME YOUR SQUAD..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  value={groupName}
                  onChangeText={setGroupName}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>PURPOSE (OPTIONAL)</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  placeholder="WHAT'S THE SCOOP?..."
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  multiline
                  value={groupBio}
                  onChangeText={setGroupBio}
                />
              </View>

              <Text style={styles.sectionLabel}>RECRUIT MEMBERS ({selectedFriends.length})</Text>
              <View style={styles.friendsList}>
                {connections.length === 0 ? (
                  <Text style={styles.emptyText}>NO FRIENDS FOUND. INVITE ENTITIES FIRST.</Text>
                ) : (
                  connections.map(friend => (
                    <TouchableOpacity
                      key={friend.id}
                      style={[
                        styles.friendItem,
                        selectedFriends.includes(friend.id) && styles.friendItemSelected
                      ]}
                      onPress={() => toggleFriendSelection(friend.id)}
                    >
                      <Avatar uri={friend.avatar} size={40} />
                      <Text style={[
                        styles.friendName,
                        selectedFriends.includes(friend.id) && { color: colors.primary }
                      ]}>
                        {friend.username?.toUpperCase()}
                      </Text>
                      <MaterialIcons
                        name={selectedFriends.includes(friend.id) ? "check-circle" : "radio-button-unchecked"}
                        size={22}
                        color={selectedFriends.includes(friend.id) ? colors.primary : "rgba(255,255,255,0.2)"}
                      />
                    </TouchableOpacity>
                  ))
                )}
              </View>

              <TouchableOpacity
                style={[styles.createBtn, loading && { opacity: 0.5 }]}
                onPress={handleCreateGroup}
                disabled={loading}
              >
                <Text style={styles.createBtnText}>
                  {loading ? 'INITIALIZING...' : 'ACTIVATE GROUP'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </Pressable>
      </Modal>
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
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
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
  headerIcon: {
    marginLeft: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  mainCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  list: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  initialsAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.white,
  },
  groupInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
  },
  groupTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.2)',
    fontWeight: '700',
  },
  groupMessage: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0D0D0D',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    height: '85%',
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionLabel: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  friendsList: {
    marginBottom: spacing.xl,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  friendItemSelected: {
    backgroundColor: 'rgba(0, 191, 255, 0.05)',
    borderColor: 'rgba(0, 191, 255, 0.1)',
    borderWidth: 1,
  },
  friendName: {
    flex: 1,
    marginLeft: spacing.md,
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  createBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  createBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
});
