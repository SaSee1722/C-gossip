import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } , Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Avatar } from '../../../components/ui/Avatar';
import { useAuth } from '../../../hooks/useAuth';
import { colors, spacing, borderRadius } from '../../../constants/theme';
import { GradientText } from '../../../components/ui/GradientText';
import { profileService } from '../../../services/profileService';

import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { getSharedSupabaseClient } from '../../../template/core/client';
import { Platform } , Animated } from 'react-native';

export default function SettingsTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const [lastSeenEnabled, setLastSeenEnabled] = useState(true);
  const [profile, setProfile] = useState<any>(user);

  useEffect(() => {
    if (user?.id) {
      profileService.getProfile(user.id).then(setProfile);
    }
  }, [user]);

  const getGradientColors = (): [string, string, string] => {
    // Male: Black -> Sky Blue -> Black
    if (profile?.gender === 'Male') return ['#000000', '#87CEEB', '#000000'];
    // Female: Black -> Baby Pink -> Black
    if (profile?.gender === 'Female') return ['#000000', '#F4C2C2', '#000000'];
    // Other: Black -> Golden -> Black
    if (profile?.gender === 'Other') return ['#000000', '#FFD700', '#000000'];
    // Default: Black -> Dark Grey -> Black
    return ['#000000', '#333333', '#000000'];
  };

  const getAccentColor = () => {
    if (profile?.gender === 'Male') return '#87CEEB';
    if (profile?.gender === 'Female') return '#F4C2C2';
    if (profile?.gender === 'Other') return '#FFD700';
    return colors.primary;
  };

  const gradientColors = getGradientColors();
  const accentColor = getAccentColor();

  const handleBlockedUsers = () => {
    router.push('/(app)/blocked');
  };

  const toggleGhostMode = async (enabled: boolean) => {
    if (!user?.id) return;
    setLastSeenEnabled(enabled);
    await profileService.updateProfile(user.id, {
      status: enabled ? 'offline' : 'online'
    } as any);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      alert('Failed to pick image');
    }
  };

  const uploadImage = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      if (!user?.id) return;
      const supabase = getSharedSupabaseClient();
      const fileExt = 'jpeg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      let fileBody: any = null;

      if (Platform.OS === 'web' && asset.base64) {
        // Simple base64 decode for web
        const binaryString = window.atob(asset.base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        fileBody = bytes.buffer;
      } else {
        const response = await fetch(asset.uri);
        fileBody = await response.blob();
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileBody, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const success = await profileService.updateProfile(user.id, { avatar: publicUrl } as any);
      if (success) {
        setProfile((prev: any) => ({ ...prev, avatar: publicUrl }));
        alert('Protocol Photo Updated.');
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Failed to update protocol photo.`);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    const confirmed = confirm('ARE YOU SURE YOU WANT TO BURN YOUR IDENTITY? THIS CANNOT BE UNDONE.');
    if (confirmed) {
      // For now, we logout as the primary 'delete' action. 
      // In a real scenario, we'd call a Supabase function to purge data.
      await logout();
      router.replace('/(onboarding)');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#000000' }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={[styles.avatarWrapper, { shadowColor: accentColor }]}>
            <View style={[styles.avatarOutline, { borderColor: accentColor }]}>
              <Avatar
                uri={profile?.avatar}
                size={130}
                style={styles.avatar}
              />
            </View>
            <TouchableOpacity style={styles.editBadge} onPress={pickImage}>
              <MaterialIcons name="photo-camera" size={14} color="#000" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>
            {profile?.full_name?.toUpperCase() || 'ANONYMOUS'}
          </Text>
          <Text style={[styles.profileEmail, { color: accentColor }]}>
            {profile?.username ? `@${profile.username.toUpperCase()}` : ''}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>PERSONAL INFO</Text>
          <TouchableOpacity onPress={() => router.push('/(onboarding)/setup')}>
            <Text style={[styles.editButtonText, { color: accentColor }]}>EDIT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <InfoItem icon="badge" label="FULL NAME" value={profile?.full_name || 'Not Set'} accentColor={accentColor} />
          <InfoItem icon="calendar-today" label="AGE" value={profile?.age?.toString() || 'Not Set'} accentColor={accentColor} />
          <InfoItem icon="smartphone" label="PHONE" value={profile?.phone || 'Not Set'} accentColor={accentColor} />
          <InfoItem icon="fingerprint" label="GENDER" value={profile?.gender || 'Not Set'} accentColor={accentColor} />
          <InfoItem icon="record-voice-over" label="BIO" value={profile?.bio || 'No bio yet'} isLast accentColor={accentColor} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SETTINGS</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <MaterialIcons name="local-fire-department" size={20} color={accentColor} />
              </View>
              <Text style={styles.settingText}>Ghost Mode (Last Seen)</Text>
            </View>
            <Switch
              value={lastSeenEnabled}
              onValueChange={toggleGhostMode}
              trackColor={{ false: 'rgba(255, 255, 255, 0.1)', true: accentColor }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={styles.settingItem} onPress={handleBlockedUsers}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                <MaterialIcons name="block" size={20} color={accentColor} />
              </View>
              <Text style={styles.settingText}>Blacklisted Entities</Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="rgba(255, 255, 255, 0.3)" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, styles.noBorder]} onPress={handleDeleteAccount}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                <MaterialIcons name="delete-forever" size={20} color={colors.error} />
              </View>
              <Text style={[styles.settingText, { color: colors.error }]}>Burn Identity</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>TERMINATE SESSION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoItem({ icon, label, value, isLast, accentColor }: { icon: any, label: string, value: string, isLast?: boolean, accentColor: string }) {
  return (
    <View style={[styles.infoItem, isLast && styles.noBorder]}>
      <View style={[styles.infoIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
        <MaterialIcons name={icon} size={18} color={accentColor} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel]}>{label}</Text>
        <Text style={[styles.infoValue]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    marginTop: spacing.sm,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: spacing.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarOutline: {
    borderRadius: 999,
    borderWidth: 2,
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    // No border
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  profileName: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 4,
    color: '#fff',
    textAlign: 'center',
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: spacing.lg,
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: '#0A0A0A', // Very dark grey, almost black
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  infoIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: 1.5,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
    letterSpacing: 0.2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.2,
  },
  logoutButton: {
    marginVertical: spacing.md,
    alignItems: 'center',
    padding: spacing.md,
  },
  logoutText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.error,
    opacity: 0.8,
  },
});
