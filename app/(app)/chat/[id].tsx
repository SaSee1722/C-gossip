import { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } , Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '../../../components/ui/Avatar';
import { useChats } from '../../../hooks/useChats';
import { useAuth } from '../../../hooks/useAuth';
import { colors, spacing, borderRadius } from '../../../constants/theme';
import { profileService } from '../../../services/profileService';
import { User } from '../../../types';

export default function ChatScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { messages, sendMessage, loadMessages, chats } = useChats();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState<User[]>([]);
    const flatListRef = useRef<FlatList>(null);
    const inputRef = useRef<TextInput>(null);

    const chatId = Array.isArray(id) ? id[0] : id;
    const chatMessages = messages[chatId] || [];
    const currentChat = chats.find(c => c.id === chatId);

    useEffect(() => {
        if (chatId) {
            loadData();
        }
    }, [chatId]);

    const loadData = async () => {
        setLoading(true);
        await loadMessages(chatId);

        // Load participants
        if (currentChat && user) {
            const otherUserIds = currentChat.participants.filter(pid => pid !== user.id);
            const profiles = await Promise.all(otherUserIds.map(uid => profileService.getProfile(uid)));
            setParticipants(profiles.filter((p): p is User => p !== null));
        }
        setLoading(false);
    };

    const handleSend = async () => {
        if (!content.trim()) return;

        const textToSend = content;
        setContent('');
        await sendMessage(chatId, textToSend, 'text');
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            // Logic to upload image would go here
            // For now we just send connection note or something, 
            // but in real app we'd upload to Supabase Storage then send message with URL
            console.log('Image picked:', result.assets[0].uri);
        }
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const otherUser = participants[0];

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.white} />
                </TouchableOpacity>

                {loading ? (
                    <ActivityIndicator color={colors.primary} />
                ) : (
                    <TouchableOpacity style={styles.headerProfile} activeOpacity={0.8}>
                        <Avatar uri={otherUser?.avatar} size={40} />
                        <View style={styles.headerInfo}>
                            <Text style={styles.headerName}>
                                {currentChat?.isGroup ? currentChat.name : otherUser?.full_name || otherUser?.username || 'Unknown'}
                            </Text>
                            <Text style={styles.headerStatus}>
                                {currentChat?.isGroup ? `${participants.length + 1} members` : otherUser?.status || 'offline'}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerActionBtn}>
                        <MaterialIcons name="videocam" size={24} color={colors.white} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerActionBtn}>
                        <MaterialIcons name="call" size={22} color={colors.white} />
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={chatMessages}
                keyExtractor={item => item.id}
                contentContainerStyle={[styles.messagesList, { paddingBottom: spacing.xl }]}
                inverted
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => {
                    const isMe = item.senderId === user?.id;
                    const isFirstInSequence = index === chatMessages.length - 1 || chatMessages[index + 1].senderId !== item.senderId;
                    const isLastInSequence = index === 0 || chatMessages[index - 1].senderId !== item.senderId;

                    return (
                        <View
                           
                            style={[
                                styles.messageRow,
                                isMe ? styles.myMessageRow : styles.theirMessageRow,
                                isFirstInSequence && { marginTop: 4 }
                            ]}
                        >
                            {!isMe && isLastInSequence && (
                                <Avatar uri={otherUser?.avatar} size={28} style={styles.messageAvatar} />
                            )}
                            {!isMe && !isLastInSequence && <View style={{ width: 28, marginRight: 8 }} />}

                            <View style={[
                                styles.messageBubble,
                                isMe ? styles.myBubble : styles.theirBubble,
                                isFirstInSequence && (isMe ? styles.myFirst : styles.theirFirst),
                                isLastInSequence && (isMe ? styles.myLast : styles.theirLast),
                            ]}>
                                {item.type === 'image' && item.mediaUrl ? (
                                    <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} />
                                ) : (
                                    <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                                        {item.content}
                                    </Text>
                                )}
                                <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.theirMessageTime]}>
                                    {formatTime(item.timestamp)}
                                </Text>
                            </View>
                        </View>
                    );
                }}
                onContentSizeChange={() => flatListRef.current?.scrollToOffset({ offset: 0, animated: true })}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                    <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                        <MaterialIcons name="add" size={24} color={colors.primary} />
                    </TouchableOpacity>

                    <TextInput
                        ref={inputRef}
                        style={[
                            styles.input,
                            Platform.OS === 'web' && { outlineStyle: 'none', outlineWidth: 0, boxShadow: 'none' } as any
                        ]}
                        placeholder="Whisper something..."
                        placeholderTextColor="rgba(255, 255, 255, 0.3)"
                        multiline
                        value={content}
                        onChangeText={setContent}
                    />

                    <TouchableOpacity
                        style={[styles.sendButton, !content.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!content.trim()}
                    >
                        <Ionicons name="send" size={20} color={content.trim() ? colors.black : 'rgba(255,255,255,0.2)'} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
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
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)',
        backgroundColor: 'rgba(0,0,0,0.8)',
    },
    backButton: {
        padding: spacing.sm,
    },
    headerProfile: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: spacing.xs,
    },
    headerInfo: {
        marginLeft: spacing.sm,
    },
    headerName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
    headerStatus: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.5)',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerActionBtn: {
        padding: spacing.sm,
        marginLeft: spacing.xs,
    },
    messagesList: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xl,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 2,
    },
    myMessageRow: {
        justifyContent: 'flex-end',
    },
    theirMessageRow: {
        justifyContent: 'flex-start',
    },
    messageAvatar: {
        marginRight: 8,
    },
    messageBubble: {
        maxWidth: '75%',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    myBubble: {
        backgroundColor: colors.primary,
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderBottomLeftRadius: 4,
    },
    myFirst: {
        borderTopRightRadius: 20,
        borderBottomRightRadius: 4,
    },
    myLast: {
        borderTopRightRadius: 4,
        borderBottomRightRadius: 20,
    },
    theirFirst: {
        borderTopLeftRadius: 20,
        borderBottomLeftRadius: 4,
    },
    theirLast: {
        borderTopLeftRadius: 4,
        borderBottomLeftRadius: 20,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    myMessageText: {
        color: colors.black,
        fontWeight: '500',
    },
    theirMessageText: {
        color: colors.white,
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myMessageTime: {
        color: 'rgba(0,0,0,0.5)',
    },
    theirMessageTime: {
        color: 'rgba(255,255,255,0.3)',
    },
    mediaImage: {
        width: 200,
        height: 200,
        borderRadius: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        backgroundColor: 'rgba(20, 20, 20, 0.9)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    attachButton: {
        padding: spacing.sm,
        marginRight: spacing.xs,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
    },
    input: {
        flex: 1,
        minHeight: 40,
        maxHeight: 100,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: 20,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        color: colors.white,
        marginRight: spacing.sm,
        fontSize: 15,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
});
