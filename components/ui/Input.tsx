import { useState } from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, typography } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export function Input({ label, error, style, onFocus, onBlur, icon, secureTextEntry, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const isPassword = secureTextEntry;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[
          styles.label,
          isFocused && { color: colors.primary }
        ]}>
          {label.toUpperCase()}
        </Text>
      )}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputFocused,
        error && styles.inputError,
      ]}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : 'rgba(255, 255, 255, 0.3)'}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            style,
            Platform.OS === 'web' && {
              outlineStyle: 'none',
              outlineWidth: 0,
              boxShadow: 'none'
            } as any
          ]}
          placeholderTextColor="rgba(255, 255, 255, 0.2)"
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.showButton}
          >
            <Text style={styles.showText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    marginBottom: spacing.xs,
    fontWeight: '800',
    letterSpacing: 2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    minHeight: 60,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#0D0D0D',
  },
  inputError: {
    borderColor: colors.error,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    height: '100%',
  },
  showButton: {
    padding: spacing.xs,
  },
  showText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  error: {
    color: colors.error,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
});
