import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '../../constants/theme';

interface ButtonProps {
  title?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'glass' | 'gradient' | 'round';
  style?: ViewStyle;
  textStyle?: TextStyle;
  loading?: boolean;
  disabled?: boolean;
  showArrow?: boolean;
  size?: number;
}

export function Button({
  title,
  icon,
  onPress,
  variant = 'gradient',
  style,
  textStyle,
  loading,
  disabled,
  showArrow = true,
  size = 56,
}: ButtonProps) {
  const isGradient = variant === 'gradient' || variant === 'primary' || variant === 'secondary' || variant === 'round';

  const renderContent = () => {
    if (loading) return <ActivityIndicator color={colors.black} />;

    if (variant === 'round') {
      return <MaterialIcons name={icon || 'add'} size={28} color={colors.white} />;
    }

    return (
      <View style={styles.content}>
        <Text style={[styles.text, textStyle]}>{title?.toUpperCase()}</Text>
        {showArrow && <MaterialIcons name="trending-flat" size={20} color={colors.black} style={styles.arrow} />}
      </View>
    );
  };

  if (isGradient) {
    const gradientColors: [string, string] = variant === 'secondary'
      ? [colors.secondary, '#FFB2D1']
      : variant === 'round' || variant === 'gradient'
        ? [colors.primary, colors.secondary]
        : [colors.primary, '#E0FFFF'];

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
        style={[
          styles.glowContainer,
          variant === 'round' && { width: size, height: size, borderRadius: size / 2 },
          style
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            variant === 'round' ? { width: size, height: size, borderRadius: size / 2, paddingHorizontal: 0 } : { borderRadius: borderRadius.md },
            disabled && styles.disabled,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { borderRadius: borderRadius.md },
        variant === 'glass' ? styles.glass : styles.default,
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  glowContainer: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  default: {
    backgroundColor: colors.surface,
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    marginLeft: spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
