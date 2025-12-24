
import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} , Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Avatar } from '../../components/ui/Avatar';
import { useChats } from '../../hooks/useChats';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { messages, sendMessage, markAsRead, typingUsers, chatProfiles, chats } = useChats();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const currentChat = chats.find(c => c.id === id);
  const otherUserId = currentChat?.participants.find(pid => pid !== user?.id) || '';
  const otherUser = chatProfiles[otherUserId];

  const chatMessages = messages[id as string] || [];

  useEffect(() => {
    markAsRead(id as string);
  }, []);

  const handleSend = () => {
    if (inputText.trim()) {
      sendMessage(id as string, inputText.trim());
      setInputText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const isTyping = typingUsers[id as string];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <View>
        <BlurView intensity={80} style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color={colors.text.primary} />
          </TouchableOpacity>
          <Avatar uri={otherUser?.avatar} size={40} />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser?.username}</Text>
            <Text style={styles.headerStatus}>
              {isTyping ? 'typing...' : otherUser?.status === 'online' ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="call" size={24} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="videocam" size={24} color={colors.primary} />
          </TouchableOpacity>
        </BlurView>
      </View>
      {/* Removed the extra closing Animated.View tag here */}

      <FlatList
        ref={flatListRef}
        data={chatMessages}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.messageList, { paddingBottom: spacing.md }]}
        renderItem={({ item, index }) => {
          const isSent = item.senderId === 'current';
          const AnimatedComponent = isSent ? FadeInRight : FadeInLeft;

          return (
            <View
             
              style={[styles.messageContainer, isSent ? styles.sentContainer : styles.receivedContainer]}
            >
              {!isSent && <Avatar uri={otherUser?.avatar} size={32} style={styles.messageAvatar} />}
              <View style={[styles.messageBubble, isSent ? styles.sentBubble : styles.receivedBubble]}>
                <Text style={styles.messageText}>{item.content}</Text>
                <View style={styles.messageFooter}>
                  <Text style={styles.messageTime}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {isSent && (
                    <Ionicons
                      name={item.seen ? 'checkmark-done' : 'checkmark'}
                      size={14}
                      color={item.seen ? colors.primary : colors.text.tertiary}
                      style={styles.seenIcon}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      <View>
        <BlurView intensity={80} style={[styles.inputContainer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={colors.text.tertiary}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() && styles.sendButtonActive]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={colors.white} />
          </TouchableOpacity>
        </BlurView>
      </View>
      {/* Removed the extra closing Animated.View tag here */}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.glass.subtle,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  backButton: {
    marginRight: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  headerStatus: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
  },
  headerButton: {
    marginLeft: spacing.md,
    padding: spacing.sm,
  },
  messageList: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '80%',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    marginRight: spacing.sm,
  },
  messageBubble: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sentBubble: {
    backgroundColor: colors.primary,
  },
  receivedBubble: {
    backgroundColor: colors.glass.dark,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  messageText: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  messageTime: {
    fontSize: typography.sizes.xs,
    color: colors.text.tertiary,
  },
  seenIcon: {
    marginLeft: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    backgroundColor: colors.glass.subtle,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  attachButton: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.glass.dark,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
});
