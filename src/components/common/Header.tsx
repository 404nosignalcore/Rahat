import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, TypographyStyles, BorderRadius } from '../../theme';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenHeroes?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenHeroes,
  rightAction,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.actionContainer}>
        {rightAction}
        {onOpenHeroes ? (
          <Pressable
            style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}
            onPress={onOpenHeroes}
            accessibilityLabel="SafeHeroes Directory"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="shield-star" size={16} color="#ffffff" />
            <Text style={styles.heroButtonText}>SafeHeroes</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: Colors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 21,
    fontWeight: '600',
    letterSpacing: 0.231,
    color: Colors.ink,
  },
  subtitle: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary, // Action Blue #0066cc
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  heroButtonText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
