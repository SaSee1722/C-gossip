import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Platform, Modal, Pressable, Vibration, ScrollView } , Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { Avatar } from '../../../components/ui/Avatar';
import { useChats } from '../../../hooks/useChats';
import { useAuth } from '../../../hooks/useAuth';
import { useConnections } from '../../../hooks/useConnections';
import { colors, spacing, borderRadius, typography } from '../../../constants/theme';
import { GradientText } from '../../../components/ui/GradientText';
import { chatService } from '../../../services/chatService';
import { vibeService } from '../../../services/vibeService';
import { Vibe } from '../../../types';

export default function ChatsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chats, chatProfiles, refreshChats } = useChats();
  const { user, updateProfile } = useAuth();
  const { requests, requestProfiles, acceptRequest, rejectRequest, searchUsers, sendRequest } = useConnections();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Vibes State
  const [allVibes, setAllVibes] = useState<Vibe[]>([]);
  const [showVibeCreator, setShowVibeCreator] = useState(false);
  const [showVibeViewer, setShowVibeViewer] = useState(false);
  const [showManageVibes, setShowManageVibes] = useState(false);
  const [selectedVibes, setSelectedVibes] = useState<Vibe[]>([]);
  const [pendingVibeMedia, setPendingVibeMedia] = useState<{ uri: string, type: 'image' | 'video' } | null>(null);
  const [vibeNote, setVibeNote] = useState('');
  const [isUploadingVibe, setIsUploadingVibe] = useState(false);
  const [previewViewers, setPreviewViewers] = useState<any[]>([]);

  // Group vibes by user
  const groupedVibes = allVibes.reduce((acc: any, vibe) => {
    if (!acc[vibe.userId]) acc[vibe.userId] = [];
    acc[vibe.userId].push(vibe);
    return acc;
  }, {});

  const vibeUsers = Object.keys(groupedVibes);

  useEffect(() => {
    if (showManageVibes && user?.id && groupedVibes[user.id]) {
      const myVibe = groupedVibes[user.id][0];
      if (myVibe) {
        vibeService.getViewers(myVibe.id).then((viewers) => {
          setPreviewViewers(viewers);
        });
      }
    }
  }, [showManageVibes, groupedVibes, user?.id]);

  // Lock State
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinMode, setPinMode] = useState<'verify' | 'setup'>('verify');
  const [pinInput, setPinInput] = useState('');
  const [targetChatId, setTargetChatId] = useState<string | null>(null);

  useEffect(() => {
    fetchVibes();
  }, []);

  const fetchVibes = async () => {
    const vibes = await vibeService.getVibes();
    setAllVibes(vibes);
  };

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

  const formatTime = (date: Date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
  };

  const handlePickVibe = async (useCamera = false) => {
    let result;
    if (useCamera) {
      if (Platform.OS === 'web') {
        alert('Camera not supported on web currently. Please upload a file.');
        return;
      }
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access camera is required!');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 30,
      });
    }

    if (!result.canceled) {
      const asset = result.assets[0];
      setPendingVibeMedia({
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' : 'image',
      });
      setShowManageVibes(false); // Close manager if open
      setShowVibeCreator(true);
    }
  };

  const handleUploadVibe = async () => {
    if (!pendingVibeMedia || !user) return;
    setIsUploadingVibe(true);
    try {
      const success = await vibeService.uploadVibe(user.id, pendingVibeMedia.type, pendingVibeMedia.uri, vibeNote);
      if (success) {
        setShowVibeCreator(false);
        setPendingVibeMedia(null);
        setVibeNote('');
        fetchVibes();
        alert('Protocol: Vibe active for 24 hours.');
      } else {
        alert('Protocol Failure: Could not synchronize vibe.');
      }
    } catch (error) {
      console.error('Vibe upload failed:', error);
      alert('Network Protocol Error: Check your signal.');
    } finally {
      setIsUploadingVibe(false);
    }
  };

  const [vibeViewers, setVibeViewers] = useState<any[]>([]);

  const openVibeViewer = async (userId: string) => {
    const userVibes = allVibes.filter(v => v.userId === userId);
    if (userVibes.length > 0) {
      setSelectedVibes(userVibes);
      setShowVibeViewer(true);

      // Record view if it's someone else's vibe
      if (userId !== user?.id && user?.id) {
        await vibeService.recordView(userVibes[0].id, user.id);
      }

      if (userId === user?.id) {
        // Fetch viewers if it's my own vibe
        const viewers = await vibeService.getViewers(userVibes[0].id);
        setVibeViewers(viewers);
      } else {
        setVibeViewers([]);
      }
    }
  };

  const handleChatPress = (chat: any) => {
    if (chat.isLocked) {
      setPinMode('verify');
      setTargetChatId(chat.id);
      setShowPinModal(true);
      setPinInput('');
    } else {
      router.push(`/chat/${chat.id}`);
    }
  };

  const handleLongPress = (chat: any) => {
    Vibration.vibrate(50);
    setSelectedChat(chat);
    setShowOptionsModal(true);
  };

  const toggleLock = async () => {
    if (!selectedChat || !user) return;

    if (!user.chatPin) {
      setPinMode('setup');
      setShowPinModal(true);
      setShowOptionsModal(false);
      return;
    }

    const newLockStatus = !selectedChat.isLocked;
    const success = await chatService.toggleLockChat(selectedChat.id, user.id, newLockStatus);
    if (success) {
      await refreshChats();
      setShowOptionsModal(false);
      alert(newLockStatus ? 'Protocol: Chat Locked.' : 'Protocol: Chat Unlocked.');
    }
  };

  const handlePinSubmit = async () => {
    if (pinInput.length !== 4) return;

    if (pinMode === 'setup') {
      await updateProfile({ chatPin: pinInput });
      alert('Protocol: Secret PIN established.');
      setShowPinModal(false);
      // Now lock the chat
      if (selectedChat && user?.id) {
        await chatService.toggleLockChat(selectedChat.id, user.id, true);
        await refreshChats();
      }
    } else {
      if (pinInput === user?.chatPin) {
        setShowPinModal(false);
        if (targetChatId) {
          router.push(`/chat/${targetChatId}`);
          setTargetChatId(null);
        } else if (selectedChat && user?.id) {
          // If we were unlocking from options
          const success = await chatService.toggleLockChat(selectedChat.id, user.id, false);
          if (success) await refreshChats();
          setShowOptionsModal(false);
        }
      } else {
        alert('ACCESS DENIED: Incorrect PIN.');
        setPinInput('');
      }
    }
  };



  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <GradientText text="Gossip..." style={styles.headerTitle} />
            <Image
              source={require('../../../assets/images/gossip_doodle.png')}
              style={[styles.headerIcon, { width: 48, height: 48 }]}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>Connect, share, and whisper in style.</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.notificationButton,
            Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' } as any
          ]}
          onPress={() => setShowNotifications(true)}
        >
          <MaterialIcons name="notifications-none" size={26} color={colors.white} />
          {requests.length > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={22} color="rgba(255, 255, 255, 0.2)" />
          <TextInput
            placeholder="Search friends or gossip..."
            placeholderTextColor="rgba(255, 255, 255, 0.2)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[
              styles.searchInput,
              Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' } as any
            ]}
          />
        </View>
      </View>

      <View style={styles.mainCard}>
        {searchQuery.length > 1 ? (
          <View style={styles.searchResultSection}>
            <Text style={styles.sectionTitle}>SEARCH RESULTS</Text>
            {isSearching ? (
              <Text style={styles.emptyText}>Searching...</Text>
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.userCard}
                    onPress={() => {
                      sendRequest(item.id);
                      setSearchQuery('');
                      alert(`Protocol: Connection request sent to ${item.username}`);
                    }}
                  >
                    <Avatar uri={item.avatar} size={48} />
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{item.username?.toUpperCase()}</Text>
                      <Text style={styles.userFullName}>{item.full_name}</Text>
                    </View>
                    <MaterialIcons name="person-add" size={22} color={colors.primary} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
              />
            )}
          </View>
        ) : (
          <>
            <View style={styles.cardContainer}>
              <View style={styles.vibesSection}>
                <Text style={styles.sectionTitle}>VIBES</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vibesList}>
                  {/* Add Own Vibe */}
                  <TouchableOpacity
                    style={[
                      styles.vibeItem,
                      Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' } as any
                    ]}
                    onPress={() => setShowManageVibes(true)}
                  >
                    <View style={styles.vibeAvatarWrapper}>
                      <Avatar
                        uri={user?.avatar}
                        size={64}
                        style={styles.vibeAvatar}
                        hasStory={!!groupedVibes[user?.id || '']}
                      />
                      <View style={styles.vibeAddButton}>
                        <MaterialIcons name="add" size={14} color="#fff" />
                      </View>
                    </View>
                    <Text style={styles.vibeText}>Your Vibe</Text>
                  </TouchableOpacity>

                  {/* Other Users' Vibes */}
                  {vibeUsers.filter(uid => uid !== user?.id).map((uid) => {
                    const vibeUser = chatProfiles[uid];
                    return (
                      <TouchableOpacity
                        key={uid}
                        style={[
                          styles.vibeItem,
                          Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' } as any
                        ]}
                        onPress={() => openVibeViewer(uid)}
                      >
                        <Avatar
                          uri={vibeUser?.avatar}
                          size={64}
                          style={styles.vibeAvatar}
                          hasStory={true}
                        />
                        <Text style={styles.vibeText}>{vibeUser?.username?.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View> {/* End Vibe Card Container */}

            <View style={styles.cardContainer}>
              <View style={styles.gossipSection}>
                <Text style={styles.sectionTitle}>GOSSIP</Text>
                <FlatList
                  data={chats}
                  keyExtractor={item => item.id}
                  contentContainerStyle={[styles.chatList, { paddingBottom: insets.bottom + 100 }]}
                  showsVerticalScrollIndicator={false}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No gossip yet. Start a new chat!</Text>
                    </View>
                  }
                  renderItem={({ item, index }) => {
                    const otherUserId = item.participants.find(p => p !== user?.id);
                    const otherUser = otherUserId ? chatProfiles[otherUserId] : null;
                    const chatName = item.isGroup ? item.name : (otherUser?.full_name || otherUser?.username || 'Unknown User');
                    const chatAvatar = item.isGroup ? item.iconUrl : otherUser?.avatar;
                    const nameColor = index % 2 === 0 ? colors.primary : colors.secondary;

                    return (
                      <View>
                        <TouchableOpacity
                          onPress={() => handleChatPress(item)}
                          onLongPress={() => handleLongPress(item)}
                          activeOpacity={0.7}
                          style={styles.chatCard}
                        >
                          <View style={styles.avatarWrapper}>
                            <Avatar uri={chatAvatar} size={52} />
                            {item.isLocked && (
                              <View style={styles.lockBadge}>
                                <MaterialIcons name="lock" size={10} color="#fff" />
                              </View>
                            )}
                          </View>
                          <View style={styles.chatInfo}>
                            <View style={styles.chatHeader}>
                              <Text style={[styles.chatName, { color: nameColor }]}>
                                {chatName?.toUpperCase()}
                              </Text>
                              <Text style={styles.chatTime}>{formatTime(item.updatedAt)}</Text>
                            </View>
                            <Text style={styles.chatMessage} numberOfLines={1}>
                              {item.isLocked ? 'SECRET PROTOCOL ACTIVE' : (item.lastMessage?.content || 'No messages yet')}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              </View>
            </View> {/* End Gossip Card Container */}
          </>
        )}
      </View>

      {/* Notifications Modal */}
      <Modal visible={showNotifications} transparent animationType="fade" onRequestClose={() => setShowNotifications(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowNotifications(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>ALERTS</Text>
            <FlatList
              data={requests}
              keyExtractor={item => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No alerts at the moment.</Text>}
              renderItem={({ item }) => {
                const reqUser = requestProfiles[item.fromUserId];
                return (
                  <View style={styles.alertItem}>
                    <Avatar uri={reqUser?.avatar} size={40} />
                    <View style={styles.alertInfo}>
                      <Text style={styles.alertHeader}>REVEAL REQUEST</Text>
                      <Text style={styles.alertText}>{reqUser?.username} WANTS TO WHISPER.</Text>
                    </View>
                    <View style={styles.alertActions}>
                      <TouchableOpacity onPress={() => acceptRequest(item.id)} style={styles.acceptBtn}>
                        <MaterialIcons name="check" size={18} color="#000" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => rejectRequest(item.id)} style={styles.rejectBtn}>
                        <MaterialIcons name="close" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Vibe Creator Modal */}
      <Modal visible={showVibeCreator} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.vibeCreatorContent}>
            <View style={styles.mediaPreview}>
              {pendingVibeMedia?.type === 'video' ? (
                <Video
                  source={{ uri: pendingVibeMedia.uri }}
                  style={styles.fullMedia}
                  resizeMode={ResizeMode.COVER}
                  isLooping
                  shouldPlay
                  isMuted
                />
              ) : (
                <Image
                  source={{ uri: pendingVibeMedia?.uri }}
                  style={styles.fullMedia}
                  contentFit="cover"
                  transition={200}
                />
              )}
            </View>
            <View style={styles.vibeCreatorFooter}>
              <TextInput
                style={styles.vibeNoteInput}
                placeholder="Add a secret note..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                value={vibeNote}
                onChangeText={setVibeNote}
                multiline
              />
              <View style={styles.vibeCreatorActions}>
                <TouchableOpacity style={styles.vibeAbortBtn} onPress={() => setShowVibeCreator(false)}>
                  <Text style={styles.vibeAbortText}>ABORT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.vibeUploadBtn, isUploadingVibe && { opacity: 0.5 }]}
                  onPress={handleUploadVibe}
                  disabled={isUploadingVibe}
                >
                  <Text style={styles.vibeUploadText}>{isUploadingVibe ? 'SYNCING...' : 'WHISPER VIBE'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Vibe Viewer Modal */}
      <Modal visible={showVibeViewer} transparent animationType="fade">
        <Pressable style={styles.fullOverlay} onPress={() => setShowVibeViewer(false)}>
          <View style={styles.vibeViewerContent}>
            {selectedVibes.length > 0 && (
              <View style={styles.vibeContainer}>
                {selectedVibes[0].type === 'video' ? (
                  <Video
                    source={{ uri: selectedVibes[0].mediaUrl }}
                    style={styles.fullMedia}
                    resizeMode={ResizeMode.COVER}
                    isLooping
                    shouldPlay
                  />
                ) : (
                  <Image
                    source={{ uri: selectedVibes[0].mediaUrl }}
                    style={styles.fullMedia}
                    contentFit="cover"
                    transition={300}
                  />
                )}
                <View style={styles.vibeOverlayContent}>
                  <View style={styles.vibeHeader}>
                    <Avatar
                      uri={selectedVibes[0].userId === user?.id ? user?.avatar : chatProfiles[selectedVibes[0].userId]?.avatar}
                      size={40}
                    />
                    <View style={{ marginLeft: spacing.md }}>
                      <Text style={styles.vibeUser}>
                        {selectedVibes[0].userId === user?.id ? 'YOU' : chatProfiles[selectedVibes[0].userId]?.username?.toUpperCase()}
                      </Text>
                      <Text style={styles.vibeTime}>{formatTime(selectedVibes[0].timestamp)}</Text>
                    </View>
                  </View>
                  {selectedVibes[0].note && (
                    <View style={styles.vibeNoteCard}>
                      <Text style={styles.vibeNote}>{selectedVibes[0].note}</Text>
                    </View>
                  )}
                  {selectedVibes[0].userId === user?.id && vibeViewers.length > 0 && (
                    <View style={styles.vibeViewerFooter}>
                      <MaterialIcons name="visibility" size={16} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.vibeViewersCount}>
                        REVEALED TO {vibeViewers.length} ENTIT{vibeViewers.length === 1 ? 'Y' : 'IES'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Options Modal (Block/Lock) */}
      <Modal visible={showOptionsModal} transparent animationType="slide" onRequestClose={() => setShowOptionsModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowOptionsModal(false)}>
          <View style={[styles.optionsContent, { backgroundColor: '#0A0A0A' }]}>
            <View style={styles.dragHandle} />
            <Text style={styles.optionsTitle}>{selectedChat?.isGroup ? 'GROUP PROTOCOL' : 'USER PROTOCOL'}</Text>

            <TouchableOpacity style={styles.optionItem} onPress={toggleLock}>
              <Ionicons
                name={selectedChat?.isLocked ? "lock-open-outline" : "lock-closed-outline"}
                size={24}
                color={colors.primary}
              />
              <Text style={styles.optionText}>{selectedChat?.isLocked ? 'UNLOCK WHISPER' : 'LOCK WHISPER'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => alert('Feature incoming.')}>
              <Ionicons name="trash-outline" size={24} color={colors.secondary} />
              <Text style={[styles.optionText, { color: colors.secondary }]}>ERASE HISTORY</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionItem} onPress={() => alert('Entity blocked.')}>
              <Ionicons name="ban" size={24} color="#ff4444" />
              <Text style={[styles.optionText, { color: '#ff4444' }]}>BLOCK ENTITY</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* PIN Modal */}
      <Modal visible={showPinModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.pinModalContent}>
            <Ionicons name="keypad" size={40} color={colors.primary} style={{ alignSelf: 'center', marginBottom: spacing.lg }} />
            <Text style={styles.pinTitle}>{pinMode === 'setup' ? 'ESTABLISH SECRET PIN' : 'INPUT SECRET PIN'}</Text>
            <Text style={styles.pinSubtitle}>{pinMode === 'setup' ? 'Set a 4-digit code to secure whispers.' : 'Access requires authorization.'}</Text>

            <TextInput
              style={styles.pinInput}
              value={pinInput}
              onChangeText={setPinInput}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
              autoFocus
              placeholder="****"
              placeholderTextColor="rgba(255,255,255,0.1)"
            />

            <TouchableOpacity
              style={[styles.pinBtn, pinInput.length < 4 && { opacity: 0.5 }]}
              onPress={handlePinSubmit}
              disabled={pinInput.length < 4}
            >
              <Text style={styles.pinBtnText}>EXECUTE</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowPinModal(false)} style={{ marginTop: spacing.md }}>
              <Text style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontSize: 10, fontWeight: '900' }}>ABORT</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manage Vibes Modal (New Flow) */}
      <Modal visible={showManageVibes} animationType="slide" transparent>
        <View style={styles.fullOverlay}>
          <View style={[styles.manageVibesContent, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.manageHeader}>
              <TouchableOpacity onPress={() => setShowManageVibes(false)} style={styles.backButton}>
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <View style={styles.manageTitleContainer}>
                <GradientText text="VIBES" style={styles.manageTitleText} />
                <Text style={styles.manageSubtitleText}>DISAPPEARING STORIES OF YOUR CIRCLE.</Text>
              </View>
              <TouchableOpacity style={styles.cameraButton} onPress={() => handlePickVibe(true)}>
                <MaterialIcons name="camera-alt" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Cards Content */}
            <View style={styles.manageCardsContainer}>
              {/* Add New Card */}
              <TouchableOpacity style={styles.addVibeCard} onPress={() => handlePickVibe(false)}>
                <MaterialIcons name="add" size={40} color="#fff" />
                <Text style={styles.addVibeText}>POST VIBE</Text>
              </TouchableOpacity>

              {/* Current Vibe Preview (Restricted to just 1 active vibe for simplicity in this view, or user's latest) */}
              {groupedVibes[user?.id || ''] && (
                <TouchableOpacity
                  style={styles.currentVibeCard}
                  onPress={() => {
                    setShowManageVibes(false);
                    openVibeViewer(user?.id || '');
                  }}
                  activeOpacity={0.9}
                >
                  {groupedVibes[user?.id || ''][0]?.type === 'video' ? (
                    <Video
                      source={{ uri: groupedVibes[user?.id || ''][0]?.mediaUrl }}
                      style={{ width: '100%', height: '100%' }}
                      resizeMode={ResizeMode.COVER}
                      shouldPlay={true}
                      isLooping
                      isMuted
                    />
                  ) : (
                    <Image
                      source={{ uri: groupedVibes[user?.id || ''][0]?.mediaUrl }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                  )}
                  <View style={styles.cardOverlay}>
                    <View style={styles.cardHeader}>
                      <Avatar uri={user?.avatar} size={32} />
                      <View style={{ marginLeft: 8, flex: 1 }}>
                        <Text style={styles.cardUsername} numberOfLines={1}>{user?.username?.toUpperCase()}</Text>
                        <Text style={styles.cardTime}>{formatTime(groupedVibes[user?.id || ''][0]?.timestamp)}</Text>
                      </View>
                    </View>
                    <View>
                      <Text style={styles.cardLabel}>Your Vibe</Text>
                      {previewViewers.length > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <MaterialIcons name="visibility" size={12} color="rgba(255,255,255,0.7)" />
                          <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, marginLeft: 4, fontWeight: '700' }}>
                            {previewViewers.length} VIEWERS
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
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
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: -0.5,
    fontStyle: 'italic',
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
  notificationButton: {
    padding: spacing.xs,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondary,
    borderWidth: 1.5,
    borderColor: '#000',
  },
  searchContainer: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    height: 48,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    marginLeft: spacing.sm,
    fontSize: 14,
    fontWeight: '600',
  },
  mainCard: {
    flex: 1,
    marginTop: spacing.md,
  },
  cardContainer: {
    backgroundColor: '#0A0A0A',
    borderRadius: 24,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  vibesSection: {
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.2)',
    letterSpacing: 2,
    marginBottom: spacing.lg,
  },
  vibesList: {
    flexDirection: 'row',
  },
  vibeItem: {
    alignItems: 'center',
    gap: spacing.sm,
    marginRight: spacing.lg,
  },
  vibeAvatarWrapper: {
    position: 'relative',
  },
  vibeAvatar: {
    // Let Avatar component handle circularity
  },
  vibeAddButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  vibeText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '800',
  },
  gossipSection: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  chatList: {
    paddingTop: spacing.sm,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  avatarWrapper: {
    position: 'relative'
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000'
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  chatTime: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '700',
  },
  chatMessage: {
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
  searchResultSection: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  userFullName: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#0D0D0D',
    borderRadius: 32,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 3,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  alertInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  alertHeader: {
    color: colors.secondary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  alertText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  alertActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  acceptBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsContent: {
    width: '100%',
    backgroundColor: '#050505',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 1.5,
    position: 'absolute',
    bottom: 0,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.xl,
  },
  optionsTitle: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  optionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pinModalContent: {
    width: '80%',
    backgroundColor: '#0D0D0D',
    borderRadius: 32,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pinTitle: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 8,
  },
  pinSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  pinInput: {
    backgroundColor: '#050505',
    height: 60,
    borderRadius: 20,
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 10,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  pinBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinBtnText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 2,
  },
  vibeCreatorContent: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  mediaPreview: {
    flex: 1,
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  fullMedia: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  vibeCreatorFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  vibeNoteInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: spacing.lg,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    maxHeight: 100,
    marginBottom: spacing.lg,
  },
  vibeCreatorActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  vibeAbortBtn: {
    flex: 1,
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeAbortText: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '900',
    fontSize: 12,
  },
  vibeUploadBtn: {
    flex: 2,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vibeUploadText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  vibeViewerContent: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  vibeContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  vibeOverlayContent: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
    bottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  vibeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeUser: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  vibeTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
  },
  vibeNoteCard: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: spacing.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  vibeNote: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  vibeViewerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 20,
    alignSelf: 'center',
  },
  vibeViewersCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  manageVibesContent: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    width: '100%',
    maxWidth: 1024,
    alignSelf: 'center',
  },
  manageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageTitleContainer: {
    alignItems: 'center',
  },
  manageTitleText: {
    fontSize: 24,
    fontWeight: '900',
    fontStyle: 'italic',
  },
  manageSubtitleText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2,
  },
  cameraButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageCardsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    height: 400, // Increased height for better aspect ratio
    marginTop: spacing.xl,
  },
  addVibeCard: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.02)',
    minWidth: 150,
  },
  addVibeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: spacing.sm,
  },
  currentVibeCard: {
    flex: 1,
    borderRadius: 30,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#111',
    minWidth: 150,
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  cardUsername: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardTime: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '700',
  },
  cardLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
    alignSelf: 'flex-start',
  },
});
