import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { useCalls } from '../../../hooks/useCalls';
import { useAuth } from '../../../hooks/useAuth';
import { colors, spacing, borderRadius } from '../../../constants/theme';
import { GradientText } from '../../../components/ui/GradientText';

export default function CallsTab() {
  const insets = useSafeAreaInsets();
  const { calls, startCall, callProfiles } = useCalls();
  const { user } = useAuth();

  const formatTime = (date: any) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <GradientText
              text="Calls"
              style={styles.headerTitle}
            />
            <Animated.Image
              source={require('../../../assets/images/calls_sticker.png')}
              style={[styles.headerIcon, { width: 48, height: 48 }]}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.subtitle}>Stay connected with voice & video.</Text>
        </View>
        <Button
          variant="round"
          icon="add"
          onPress={() => { /* Add new call flow */ }}
          size={58}
        />
      </View>

      <View style={styles.mainCard}>
        <FlatList
          data={calls}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent calls.</Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isIncoming = item.receiverId === user?.id;
            const otherUserId = isIncoming ? item.callerId : item.receiverId;
            const otherUser = callProfiles[otherUserId];

            return (
              <View>
                <TouchableOpacity activeOpacity={0.7} style={styles.callItem}>
                  <Avatar uri={otherUser?.avatar} size={52} />
                  <View style={styles.callInfo}>
                    <Text style={styles.callName}>
                      {otherUser?.username?.toUpperCase() || 'UNKNOWN'}
                    </Text>
                    <View style={styles.callDetails}>
                      <MaterialIcons
                        name={isIncoming ? "call-received" : "call-made"}
                        size={14}
                        color={isIncoming ? colors.primary : colors.secondary}
                      />
                      <Text style={styles.callTime}>{formatTime(item.timestamp)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.callActionButton}
                    onPress={() => startCall(otherUserId, item.type)}
                  >
                    <MaterialIcons
                      name={item.type === 'video' ? 'videocam' : 'call'}
                      size={20}
                      color="rgba(255, 255, 255, 0.4)"
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
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
    paddingTop: spacing.sm,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  callInfo: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  callName: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  callDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  callTime: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '700',
  },
  callActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
  },
});
