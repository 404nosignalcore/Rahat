import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius, Typography } from '../../theme';
import { ZoneSafetyLevel, ReportStatus } from '../../types';

interface BadgeProps {
  label: string;
  type?: ZoneSafetyLevel | ReportStatus | 'neutral' | 'accent';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'neutral', icon }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'green':
      case 'verified_official':
        return { bg: Colors.greenLight, border: Colors.greenBorder, text: Colors.greenText };
      case 'yellow':
      case 'under_review':
        return { bg: Colors.yellowLight, border: Colors.yellowBorder, text: Colors.yellowText };
      case 'red':
        return { bg: Colors.redLight, border: Colors.redBorder, text: Colors.redText };
      case 'corroborated':
      case 'accent':
        return { bg: Colors.accentSoft, border: '#DDD6FE', text: Colors.accent };
      default:
        return { bg: Colors.surfaceSubtle, border: Colors.border, text: Colors.textSecondary };
    }
  };

  const current = getBadgeStyle();

  return (
    <View style={[styles.badge, { backgroundColor: current.bg, borderColor: current.border }]}>
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text style={[styles.text, { color: current.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

