import React from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Colors, BorderRadius, TypographyStyles, Spacing } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?:
    | 'primary'          // Action Blue pill (11px 22px, rounded.pill)
    | 'secondary'        // Ghost pill (transparent, 1px solid Action Blue)
    | 'dark'             // Dark utility (#1d1d1f, rounded.sm 8px)
    | 'pearl'            // Pearl capsule (#fafafc, rounded.md 11px)
    | 'hero'             // Store hero (Action Blue, 18px font w300, 14px 28px)
    | 'danger'           // Red alert pill (#ff3b30)
    | 'outline'          // Hairline outline
    | 'ghost';           // Transparent text link
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
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
  accessibilityLabel,
}) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        styles[size],
        disabled && styles.disabled,
        pressed && !disabled && !loading && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'secondary' || variant === 'ghost' || variant === 'outline'
              ? Colors.primary
              : '#ffffff'
          }
        />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          <Text
            numberOfLines={1}
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
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.pill, // Default is signature Apple pill
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconContainer: {
    marginRight: 4,
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },
  disabled: {
    opacity: 0.45,
  },
  disabledText: {
    color: Colors.textMuted,
  },
  textBase: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.374,
    textAlign: 'center',
  },

  // Variants (DESIGN.md)
  primary: {
    backgroundColor: Colors.primary, // Action Blue #0066cc
    borderRadius: BorderRadius.pill,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '400',
  },

  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.pill,
  },
  secondaryText: {
    color: Colors.primary,
    fontWeight: '400',
  },

  dark: {
    backgroundColor: Colors.ink, // #1d1d1f
    borderRadius: BorderRadius.sm, // 8px
    paddingVertical: 8,
    paddingHorizontal: 15,
  },
  darkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.224,
  },

  pearl: {
    backgroundColor: Colors.surfacePearl, // #fafafc
    borderRadius: BorderRadius.md, // 11px
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.dividerSoft, // #f0f0f0
  },
  pearlText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: -0.224,
  },

  hero: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  heroText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '300', // Rare weight 300
    letterSpacing: 0,
  },

  danger: {
    backgroundColor: Colors.red, // #ff3b30
    borderRadius: BorderRadius.pill,
  },
  dangerText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.pill,
  },
  outlineText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: '400',
  },

  ghost: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
  },
  ghostText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '400',
  },

  // Sizes
  sm: {
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  smText: {
    fontSize: 13,
  },
  md: {
    paddingVertical: 11,
    paddingHorizontal: 22,
  },
  mdText: {
    fontSize: 15,
  },
  lg: {
    paddingVertical: 14,
    paddingHorizontal: 28,
  },
  lgText: {
    fontSize: 17,
  },
});
