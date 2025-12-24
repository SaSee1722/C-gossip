import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, Dimensions , Animated } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { GradientText } from '../../components/ui/GradientText';
import { useAuth } from '../../hooks/useAuth';
import { colors, spacing, typography, borderRadius } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function Auth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result.error) {
          alert(result.error);
        } else {
          router.replace('/');
        }
      } else {
        const result = await signup(email, password, { username: username });
        if (result.error) {
          alert(result.error);
        } else if (result.needsEmailConfirmation) {
          alert('Please check your email to confirm your account before logging in.');
          setIsLogin(true);
        } else {
          router.replace('/');
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  }, [isLogin, email, password, username, loading, login, signup, router]);

  const loginTabStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(isLogin ? '#FFFFFF' : 'transparent'),
    transform: [{ scale: withSpring(isLogin ? 1 : 0.95) }],
  }));

  const signupTabStyle = useAnimatedStyle(() => ({
    backgroundColor: withTiming(!isLogin ? '#FFFFFF' : 'transparent'),
    transform: [{ scale: withSpring(!isLogin ? 1 : 0.95) }],
  }));

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
          <View
           
            style={[styles.sparkleIcon, { right: width * 0.2 }]}
          >
            <MaterialIcons name="auto-awesome" size={24} color={colors.primary} />
          </View>

          <View>
            <GradientText
              text={isLogin ? 'Gossip.' : 'Join.'}
              style={styles.logo}
            />
          </View>
          <Text style={styles.tagline}>
            {isLogin ? 'WELCOME BACK TO THE RUMORS' : 'START SHARING YOUR SECRETS'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabBar}>
            <AnimatedTouchableOpacity
              onPress={() => setIsLogin(true)}
              style={[styles.tab, loginTabStyle]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>LOGIN</Text>
            </AnimatedTouchableOpacity>
            <AnimatedTouchableOpacity
              onPress={() => setIsLogin(false)}
              style={[styles.tab, signupTabStyle]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>SIGNUP</Text>
            </AnimatedTouchableOpacity>
          </View>

          <View style={styles.form}>
            <View>
              {!isLogin && (
                <Input
                  placeholder="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  icon="person-outline"
                />
              )}

              <Input
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                icon="mail-outline"
              />

              <Input
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                icon="lock-outline"
              />

              {!isLogin && (
                <Input
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  icon="lock-outline"
                />
              )}
            </View>

            {isLogin && (
              <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.6}>
                <Text style={styles.forgotPasswordText}>FORGOT PASSWORD?</Text>
              </TouchableOpacity>
            )}

            <Button
              title={isLogin ? 'ENTER GOSSIP' : 'START GOSSIPING'}
              onPress={handleSubmit}
              loading={loading}
              style={styles.submitButton}
            />
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
  sparkleIcon: {
    position: 'absolute',
    top: -10,
  },
  logo: {
    fontSize: height * 0.06,
    fontWeight: '900',
    color: colors.primary,
    fontStyle: 'italic',
    letterSpacing: -1,
  },
  logoSecondary: {
    color: colors.secondary,
  },
  tagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 4,
  },
  card: {
    backgroundColor: 'rgba(15, 15, 15, 0.8)',
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.md,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
    padding: 6,
    marginBottom: spacing.xl,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 18,
  },
  tabText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  activeTabText: {
    color: '#000000',
  },
  form: {
    paddingHorizontal: spacing.sm,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    marginTop: -spacing.xs,
    padding: spacing.xs,
  },
  forgotPasswordText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  submitButton: {
    marginTop: spacing.sm,
  },
  footerSpacing: {
    height: spacing.xxl,
  },
});
