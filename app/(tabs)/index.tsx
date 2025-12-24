import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../constants/theme';
import { Button } from '../../components/ui/Button';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.black, '#0a0a0a']}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]} // Reverted to original as the provided snippet was syntactically incorrect for this context.
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <MaterialIcons name="auto-awesome" size={60} color={colors.black} />
          </LinearGradient>
        </View>

        <Text style={styles.title}>GOSSIP.</Text>
        <Text style={styles.subtitle}>Where sky blue meets baby pink.</Text>

        <Button
          title="Get Started"
          onPress={() => { }}
          style={styles.mainButton}
        />

        <Button
          title="Learn More"
          variant="glass"
          onPress={() => { }}
          textStyle={{ color: colors.secondary }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    elevation: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    marginBottom: spacing.xxl,
    opacity: 0.8,
  },
  mainButton: {
    width: '100%',
    marginBottom: spacing.md,
  },
});

