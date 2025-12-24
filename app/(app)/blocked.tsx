import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { connectionService } from '../../services/connectionService';
import { useAuth } from '../../hooks/useAuth';
import { Avatar } from '../../components/ui/Avatar';
import { GradientText } from '../../components/ui/GradientText';
import { colors, spacing, borderRadius } from '../../constants/theme';
import { User } from '../../types';

export default function BlockedUsersScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBlockedUsers = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await connectionService.getBlockedUsers(user.id);
            setBlockedUsers(data);
        } catch (error) {
            console.error('Failed to fetch blocked users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlockedUsers();
    }, [user]);

    const handleUnblock = async (blockedUser: User) => {
        if (!user) return;
        Alert.alert(
            "Unblock User",
            `Are you sure you want to unblock ${blockedUser.username || "this user"}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unblock",
                    onPress: async () => {
                        const success = await connectionService.unblockUser(user.id, blockedUser.id);
                        if (success) {
                            setBlockedUsers(prev => prev.filter(u => u.id !== blockedUser.id));
                        } else {
                            Alert.alert("Error", "Failed to unblock user.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialIcons name="arrow-back-ios" size={24} color={colors.primary} />
                </TouchableOpacity>
                <GradientText text="Blocked Users" style={styles.title} />
            </View>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={blockedUsers}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <MaterialIcons name="block" size={48} color="rgba(255,255,255,0.2)" />
                            <Text style={styles.emptyText}>No blocked users found</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.userCard}>
                            <View style={styles.userInfo}>
                                <Avatar uri={item.avatar} size={50} />
                                <View style={styles.textContainer}>
                                    <Text style={styles.username}>{item.username}</Text>
                                    {item.full_name && <Text style={styles.fullName}>{item.full_name}</Text>}
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.unblockButton}
                                onPress={() => handleUnblock(item)}
                            >
                                <Text style={styles.unblockText}>Unblock</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
        paddingBottom: spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center title, but back button is absolute
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: spacing.lg,
        zIndex: 10,
        bottom: spacing.lg,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: spacing.md,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
        gap: spacing.md,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 16,
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: borderRadius.lg,
        marginBottom: spacing.md,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    textContainer: {
        justifyContent: 'center',
    },
    username: {
        color: colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
    fullName: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
    },
    unblockButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    unblockText: {
        color: colors.white,
        fontSize: 12,
        fontWeight: '600',
    }
});
