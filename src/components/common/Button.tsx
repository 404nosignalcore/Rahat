import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        variant === 'danger' && Shadows.prominent,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textInverse}
        />
      ) : (
        <>
          {icon ? icon : null}
          <Text
            style={[
              styles.textBase,
              styles[`${variant}Text` as keyof typeof styles] as TextStyle,
              styles[`${size}Text` as keyof typeof styles] as TextStyle,
              disabled && styles.disabledText,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  // Sizes
  sm: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  md: {
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  lg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  // Variants
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.accent,
  },
  danger: {
    backgroundColor: Colors.red,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: Colors.border,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  // Text Styles
  textBase: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smText: {
    fontSize: Typography.fontSize.footnote,
  },
  mdText: {
    fontSize: Typography.fontSize.body,
  },
  lgText: {
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '700',
  },
  primaryText: {
    color: Colors.textInverse,
  },
  secondaryText: {
    color: Colors.textInverse,
  },
  dangerText: {
    color: Colors.textInverse,
  },
  outlineText: {
    color: Colors.text,
  },
  ghostText: {
    color: Colors.primary,
  },
  disabledText: {
    color: Colors.textMuted,
  },
});

