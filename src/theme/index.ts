/**
 * SafeWalk Design Tokens & Theme System
 */

export const Colors = {
  // Brand & Accent
  primary: '#0B132B',       // Deep Navy
  primaryLight: '#1C2541',  // Midnight Blue
  primarySurface: '#3A506B',
  accent: '#5E60CE',        // Soft Violet / Lavender
  accentLight: '#7209B7',
  accentSoft: '#EDE9FE',    // Very soft lavender background

  // Safety Zones & Status Colors
  green: '#2A9D8F',         // Safe indicator
  greenLight: '#E8F5E9',
  greenBorder: '#81C784',
  greenText: '#1B5E20',

  yellow: '#E76F51',        // Caution indicator
  yellowLight: '#FFF3E0',
  yellowBorder: '#FFB74D',
  yellowText: '#E65100',

  red: '#E63946',           // High concern & SOS indicator
  redDark: '#C1121F',
  redLight: '#FFEBEE',
  redBorder: '#EF5350',
  redText: '#B71C1C',

  // Neutrals
  background: '#F8F9FA',
  card: '#FFFFFF',
  surfaceSubtle: '#F1F5F9',
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',

  // Text
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Utility
  shadow: '#000000',
  overlay: 'rgba(11, 19, 43, 0.65)',
  online: '#10B981',
  offline: '#94A3B8',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  tabBarHeight: 68,
  sosButtonSize: 64,
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    caption: 11,
    footnote: 13,
    body: 15,
    subtitle: 17,
    title3: 20,
    title2: 24,
    title1: 28,
    display: 34,
  },
  lineHeight: {
    caption: 14,
    footnote: 18,
    body: 22,
    subtitle: 24,
    title3: 26,
    title2: 30,
    title1: 34,
    display: 40,
  },
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 22,
  full: 9999,
};

export const Shadows = {
  soft: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  prominent: {
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};

