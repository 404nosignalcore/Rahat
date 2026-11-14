import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';

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
          <TouchableOpacity
            style={styles.heroButton}
            onPress={onOpenHeroes}
            activeOpacity={0.8}
            accessibilityLabel="SafeHeroes Directory"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="shield-star" size={18} color={Colors.accent} />
            <Text style={styles.heroButtonText}>SafeHeroes</Text>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.background,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 5,
  },
  heroButtonText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.accent,
  },
});

