import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions, ActivityIndicator } , Animated } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getSharedSupabaseClient } from '../../template/core/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { GradientText } from '../../components/ui/GradientText';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

export default function Setup() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { updateProfile, user } = useAuth();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | undefined>(undefined);
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('https://i.pravatar.cc/150?img=10');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.username) setUsername(user.username);
      if (user.full_name) setFullName(user.full_name);
      if (user.age) setAge(user.age.toString());
      if (user.phone) setPhone(user.phone);
      if (user.gender) setGender(user.gender as any);
      if (user.bio) setBio(user.bio);
      if (user.avatar) setAvatar(user.avatar);
    }
  }, [user]);

  // Helper for Web Base64 -> ArrayBuffer
  const decodeBase64 = (base64: string) => {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
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
        base64: true, // Request base64 for reliable Web handling
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
      setUploading(true);
      const supabase = getSharedSupabaseClient();

      const fileExt = 'jpeg'; // Force jpeg for simplicity
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      let fileBody: any = null;

      if (Platform.OS === 'web' && asset.base64) {
        // Web: Use ArrayBuffer from Base64
        fileBody = decodeBase64(asset.base64);
      } else {
        // Native / Fallback: Use standard fetch -> blob
        const response = await fetch(asset.uri);
        fileBody = await response.blob();
      }

      // Upload to Supabase
      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileBody, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase Upload Error:', uploadError);
        alert(`Upload Failed: ${uploadError.message}`);
        return;
      }

      // Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatar(publicUrl);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`Failed to upload image: ${error.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    try {
      if (!username || !fullName || !age || !phone || !gender || !bio) {
        alert("Please fill in all fields.");
        return;
      }

      const { data: { session } } = await getSharedSupabaseClient().auth.getSession();
      if (!session?.user) {
        alert("Session not found. Please sign in again.");
        router.replace('/(onboarding)/auth');
        return;
      }

      await updateProfile({
        username,
        full_name: fullName,
        age: parseInt(age),
        phone,
        gender,
        bio,
        avatar
      } as any);

      // alert("Profile updated successfully!"); // Optional: Feedback
      router.replace('/(app)/(tabs)');
    } catch (error) {
      console.error("Profile update failed:", error);
      alert("Failed to update profile details.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={[styles.scroll]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl }
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <GradientText text="Identity." style={styles.title} />
          <Text style={styles.subtitle}>REVEAL WHO YOU ARE TO THE ELITE.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <View>
              {uploading ? (
                <View style={[styles.loadingAvatar, { width: width * 0.3, height: width * 0.3, borderRadius: (width * 0.3) / 2 }]}>
                  <ActivityIndicator color={colors.primary} />
                </View>
              ) : (
                <Avatar uri={avatar} size={width * 0.3} />
              )}
            </View>
            <TouchableOpacity
              style={styles.changeAvatarButton}
              activeOpacity={0.7}
              onPress={pickImage}
              disabled={uploading}
            >
              <MaterialIcons name="photo-camera" size={20} color={colors.primary} />
              <Text style={styles.changeAvatarText}>
                {uploading ? 'UPLOADING...' : 'UPDATE PROTOCOL PHOTO'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View>
              <Input
                placeholder="USERNAME"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                icon="alternate-email"
              />

              <Input
                placeholder="FULL NAME"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                icon="person-outline"
              />

              <Input
                placeholder="AGE"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
                icon="accessibility"
              />

              <Input
                placeholder="PHONE NUMBER"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                icon="phone"
              />

              <View style={styles.genderContainer}>
                <Text style={styles.genderLabel}>GENDER</Text>
                <View style={styles.genderOptions}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[
                        styles.genderOption,
                        gender === g && styles.genderOptionSelected
                      ]}
                      onPress={() => setGender(g as any)}
                    >
                      <Text style={[
                        styles.genderText,
                        gender === g && styles.genderTextSelected
                      ]}>{g.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <Input
                placeholder="YOUR PROTOCOL BIO"
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={3}
                style={styles.bioInput}
                icon="notes"
              />

              <Button
                title="FINALIZE PROFILE"
                onPress={handleComplete}
                style={styles.submitButton}
              />
            </View>
          </View>
        </View>

        <View style={styles.footerSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
    minHeight: height * 0.9,
  },
  header: {
    alignItems: 'center',
    marginBottom: height * 0.05,
  },
  title: {
    fontSize: height * 0.06,
    fontWeight: '900',
    color: colors.primary,
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  titleSecondary: {
    color: colors.secondary,
  },
  subtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'rgba(15, 15, 15, 0.8)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.xl,
    overflow: 'hidden',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
    padding: spacing.xs,
  },
  changeAvatarText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  form: {
    width: '100%',
  },
  bioInput: {
    height: 100,
    paddingTop: spacing.md,
  },
  submitButton: {
    marginTop: spacing.md,
  },
  footerSpacing: {
    height: spacing.xxl,
  },
  loadingAvatar: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  genderContainer: {
    marginBottom: spacing.lg,
  },
  genderLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginBottom: spacing.xs,
    fontWeight: '800',
    letterSpacing: 2,
  },
  genderOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  genderOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  genderOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255, 78, 252, 0.1)',
  },
  genderText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  genderTextSelected: {
    color: colors.primary,
  }
});
