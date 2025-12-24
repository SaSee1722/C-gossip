import { View, Text, StyleSheet, Dimensions, ScrollView } , Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '../../components/ui/Button';
import { GradientText } from '../../components/ui/GradientText';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

import { useAuth } from '../../hooks/useAuth';
import { Redirect } from 'expo-router';

const { height, width } = Dimensions.get('window');

export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View
             
              style={styles.iconContainer}
            >
              <LinearGradient
                colors={['#1A1A1A', '#000000']}
                style={styles.iconBackground}
              >
                <MaterialIcons name="chat-bubble-outline" size={width * 0.12} color={colors.primary} />
                <View
                 
                  style={styles.sparkleContainer}
                >
                  <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
                </View>
              </LinearGradient>
            </View>

            <View>
              <GradientText text="Gossip." style={styles.logo} />
            </View>
            <Text style={styles.tagline}>
              PRIVATE CONVERSATIONS{"\n"}REFINED FOR THE ELITE.
            </Text>
          </View>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="bolt" size={24} color={colors.primary} />
              </View>
              <View style={styles.featureTextContent}>
                <Text style={styles.featureTitle}>INSTANT GOSSIP</Text>
                <Text style={styles.featureSubtitle}>REAL-TIME RUMORS THAT TRAVEL FAST.</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <MaterialIcons name="shield" size={20} color={colors.primary} />
              </View>
              <View style={styles.featureTextContent}>
                <Text style={styles.featureTitle}>GHOST SECURITY</Text>
                <Text style={styles.featureSubtitle}>END-TO-END ENCRYPTION FOR EVERY SECRET.</Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              title="Get Started"
              onPress={() => router.push('/(onboarding)/auth')}
              variant="primary"
              style={styles.button}
            />
            <Text style={styles.footerText}>
              BY ENTERING, YOU ACCEPT OUR <Text style={styles.footerTextBold}>GHOST PROTOCOLS</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
    minHeight: height * 0.9,
  },
  header: {
    marginTop: height * 0.08,
    alignItems: 'center',
  },
  iconContainer: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  iconBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: '20%',
    right: '20%',
  },
  logo: {
    fontSize: height * 0.05,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 2,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  logoSecondary: {
    color: colors.secondary,
  },
  tagline: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
    lineHeight: 20,
  },
  features: {
    gap: spacing.md,
    marginVertical: spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  featureTextContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.white,
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  featureSubtitle: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  button: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  footerText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.3)',
    fontWeight: '800',
    letterSpacing: 2,
  },
  footerTextBold: {
    color: 'rgba(255, 255, 255, 0.6)',
    textDecorationLine: 'underline',
  },
});
