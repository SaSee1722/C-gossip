import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } , Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components/ui/GlassCard';
import { useAuth } from '../hooks/useAuth';
import { useAlert } from '@/template';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

const PIN_LENGTH = 4;

export default function LockScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { unlock } = useAuth();
  const { showAlert } = useAlert();
  const [pin, setPin] = useState('');

  const handleNumberPress = (num: string) => {
    if (pin.length < PIN_LENGTH) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === PIN_LENGTH) {
        setTimeout(() => {
          if (unlock(newPin)) {
            router.replace('/(app)/(tabs)');
          } else {
            showAlert('Incorrect PIN', 'Please try again');
            setPin('');
          }
        }, 100);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={48} color={colors.primary} />
          <Text style={styles.title}>Enter PIN</Text>
          <Text style={styles.subtitle}>Unlock to access GOSSIP</Text>
        </View>

        <View style={styles.pinContainer}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                pin.length > i && styles.pinDotFilled,
              ]}
            />
          ))}
        </View>

        <GlassCard style={styles.keypad}>
          <View style={styles.keypadContent}>
            {numbers.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((num, colIndex) => {
                  if (num === '') {
                    return <View key={colIndex} style={styles.keypadButton} />;
                  }
                  
                  if (num === 'delete') {
                    return (
                      <TouchableOpacity
                        key={colIndex}
                        style={styles.keypadButton}
                        onPress={handleDelete}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="backspace-outline" size={28} color={colors.text.primary} />
                      </TouchableOpacity>
                    );
                  }

                  return (
                    <TouchableOpacity
                      key={colIndex}
                      style={styles.keypadButton}
                      onPress={() => handleNumberPress(num)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.keypadText}>{num}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </GlassCard>

        <Text style={styles.hint}>Hint: Try 1234</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.medium,
    borderWidth: 2,
    borderColor: colors.border.medium,
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  keypad: {
    marginBottom: spacing.lg,
  },
  keypadContent: {
    padding: spacing.lg,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.full,
    backgroundColor: colors.glass.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  keypadText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  hint: {
    textAlign: 'center',
    fontSize: typography.sizes.sm,
    color: colors.text.tertiary,
  },
});
