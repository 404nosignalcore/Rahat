import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, TypographyStyles } from '../../theme';

export interface OptionChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const OptionChip: React.FC<OptionChipProps> = ({
  label,
  selected,
  onPress,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={accessibilityLabel || label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipUnselected,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? icon : null}
      <Text
        numberOfLines={1}
        style={[
          styles.text,
          selected ? styles.textSelected : styles.textUnselected,
          textStyle,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill, // Exact DESIGN.md spec: rounded.pill
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  chipUnselected: {
    backgroundColor: Colors.canvas,
    borderWidth: 1,
    borderColor: Colors.hairline, // 1px hairline border
  },
  chipSelected: {
    backgroundColor: '#e8f2ff', // Soft tint Action Blue
    borderWidth: 2,
    borderColor: Colors.primaryFocus, // Exact DESIGN.md spec: 2px solid colors.primary-focus
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },
  text: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 14,
    letterSpacing: -0.224,
  },
  textUnselected: {
    color: Colors.ink,
    fontWeight: '400',
  },
  textSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
