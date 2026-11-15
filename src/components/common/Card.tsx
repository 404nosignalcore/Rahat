import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?:
    | 'utility'          // store-utility-card: 18px radius, hairline border, 24px padding
    | 'elevated'         // Alias to utility with clean hairline (no decorative shadow per DESIGN.md)
    | 'outlined'         // Clean hairline card
    | 'flat'             // Parchment flat card
    | 'tileLight'        // product-tile-light: full-bleed white
    | 'tileParchment'    // product-tile-parchment: full-bleed parchment
    | 'tileDark'         // product-tile-dark: full-bleed #272729
    | 'tileDark2'        // product-tile-dark-2: full-bleed #2a2a2c
    | 'tileDark3';       // product-tile-dark-3: full-bleed #252527
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'utility',
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.lg, // 18px (DESIGN.md {rounded.lg})
    padding: Spacing.lg,           // 24px (DESIGN.md {spacing.lg})
    borderWidth: 1,
    borderColor: Colors.hairline,  // 1px hairline border (#e0e0e0)
  },

  // store-utility-card (DESIGN.md: 18px radius, 1px hairline border, 24px padding, NO shadow)
  utility: {
    backgroundColor: Colors.canvas,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },

  elevated: {
    backgroundColor: Colors.canvas,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.lg,
  },

  outlined: {
    backgroundColor: Colors.canvas,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.lg,
  },

  flat: {
    backgroundColor: Colors.canvasParchment,
    borderColor: Colors.hairline,
    borderRadius: BorderRadius.lg,
  },

  // Full-bleed tiles (DESIGN.md: {rounded.none} 0px, edge-to-edge)
  tileLight: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.none,
    borderWidth: 0,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  tileParchment: {
    backgroundColor: Colors.canvasParchment,
    borderRadius: BorderRadius.none,
    borderWidth: 0,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  tileDark: {
    backgroundColor: Colors.surfaceTile1, // #272729
    borderRadius: BorderRadius.none,
    borderWidth: 0,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  tileDark2: {
    backgroundColor: Colors.surfaceTile2, // #2a2a2c
    borderRadius: BorderRadius.none,
    borderWidth: 0,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },

  tileDark3: {
    backgroundColor: Colors.surfaceTile3, // #252527
    borderRadius: BorderRadius.none,
    borderWidth: 0,
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
});
