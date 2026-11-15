import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, TypographyStyles } from '../../theme';
import { ZoneSafetyLevel, ReportStatus } from '../../types';

export interface BadgeProps {
  label: string;
  type?:
    | ZoneSafetyLevel
    | ReportStatus
    | 'neutral'
    | 'accent'
    | 'safe'
    | 'caution'
    | 'danger';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, type = 'neutral', icon, style, textStyle }) => {
  const getBadgeStyle = () => {
    switch (type) {
      case 'green':
      case 'safe':
      case 'verified_official':
        return {
          bg: Colors.greenLight,     // #ebf9ee
          border: Colors.greenBorder, // #a3e7b7
          text: Colors.greenText,    // #1a7a33
        };
      case 'yellow':
      case 'caution':
      case 'under_review':
        return {
          bg: Colors.yellowLight,    // #fff5e5
          border: Colors.yellowBorder, // #ffd188
          text: Colors.yellowText,   // #995900
        };
      case 'red':
      case 'danger':
        return {
          bg: Colors.redLight,       // #ffebea
          border: Colors.redBorder,  // #ffb2ae
          text: Colors.redText,      // #a61c16
        };
      case 'corroborated':
      case 'accent':
        return {
          bg: '#e8f2ff',
          border: '#b8d9ff',
          text: Colors.primary,      // Action Blue #0066cc
        };
      case 'neutral':
      default:
        return {
          bg: Colors.canvasParchment, // #f5f5f7
          border: Colors.hairline,   // #e0e0e0
          text: Colors.inkMuted80,   // #333333
        };
    }
  };

  const current = getBadgeStyle();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: current.bg, borderColor: current.border },
        style,
      ]}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          { color: current.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill, // Apple signature full-pill capsule
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.12,
  },
});
