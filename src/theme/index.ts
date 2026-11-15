/**
 * Rahat Design Tokens & Theme System
 * Fully aligned with DESIGN.md (Apple Design Specifications)
 */

import { TextStyle, ViewStyle } from 'react-native';
export * from './tokens';
import { LIGHT_THEME } from './tokens';

export const Colors = {
  // Brand & Accent (DESIGN.md: Single Action Blue #0066cc)
  primary: '#0066cc',           // Action Blue
  primaryFocus: '#0071e3',      // Focus Blue
  primaryOnDark: '#2997ff',     // Sky Link Blue
  primaryLight: '#e8f2ff',      // Soft Tint Blue
  primarySurface: '#fafafc',
  accent: '#0066cc',            // Action Blue is the ONLY interactive brand accent
  accentLight: '#0071e3',
  accentSoft: '#e8f2ff',

  // Canvas & Surfaces (DESIGN.md)
  canvas: '#ffffff',            // Pure White
  canvasParchment: '#f5f5f7',   // Signature Apple Parchment off-white
  surfacePearl: '#fafafc',      // Pearl Button surface
  surfaceTile1: '#272729',      // Primary dark tile
  surfaceTile2: '#2a2a2c',      // Micro-step lighter dark tile
  surfaceTile3: '#252527',      // Micro-step darker dark tile
  surfaceBlack: '#000000',      // Pure Black (Global nav)
  surfaceChipTranslucent: 'rgba(210, 210, 215, 0.64)',

  // Hairlines & Dividers
  dividerSoft: '#f0f0f0',       // Soft ring divider
  hairline: '#e0e0e0',          // 1px hairline border

  // Text (DESIGN.md)
  ink: '#1d1d1f',               // Near-Black Ink
  text: '#1d1d1f',              // Near-Black Ink
  textSecondary: '#333333',     // Ink Muted 80
  textMuted: '#7a7a7a',         // Ink Muted 48
  inkMuted80: '#333333',        // Ink Muted 80
  inkMuted48: '#7a7a7a',        // Ink Muted 48
  textInverse: '#ffffff',
  bodyOnDark: '#ffffff',
  bodyMuted: '#cccccc',

  // Safety Status (Apple System Palette)
  green: '#34c759',
  greenLight: '#ebf9ee',
  greenBorder: '#a3e7b7',
  greenText: '#1a7a33',
  safeBg: '#ebf9ee',
  safeBorder: '#a3e7b7',
  safeGreen: '#34c759',

  yellow: '#ff9500',
  yellowLight: '#fff5e5',
  yellowBorder: '#ffd188',
  yellowText: '#995900',
  cautionBg: '#fff5e5',
  cautionBorder: '#ffd188',
  cautionAmber: '#ff9500',

  red: '#ff3b30',
  redDark: '#d70015',
  redLight: '#ffebea',
  redBorder: '#ffb2ae',
  redText: '#a61c16',
  dangerBg: '#ffebea',
  dangerBorder: '#ffb2ae',
  dangerRed: '#ff3b30',

  // Neutrals & Surfaces for backward compatibility
  background: '#f5f5f7',
  card: '#ffffff',
  surfaceSubtle: '#fafafc',
  border: '#e0e0e0',
  borderSubtle: '#f0f0f0',

  // Utility
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.48)',
  online: '#34c759',
  offline: '#7a7a7a',
};

export const Spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 17,
  lg: 24,
  xl: 32,
  xxl: 48,
  section: 80,
  tabBarHeight: 64,
  sosButtonSize: 62,
};

export const BorderRadius = {
  none: 0,
  xs: 5,
  sm: 8,
  md: 11,
  lg: 18,
  pill: 9999,
  full: 9999,
  xl: 24,
};

// Exact Typography Tokens from DESIGN.md
export const Typography = {
  fontFamily: {
    display: LIGHT_THEME.typography.fontFamilyDisplay,
    body: LIGHT_THEME.typography.fontFamilyBody,
    mono: LIGHT_THEME.typography.fontFamilyMono,
    regular: LIGHT_THEME.typography.fontFamilyBody,
    medium: LIGHT_THEME.typography.fontFamilyBody,
    bold: LIGHT_THEME.typography.fontFamilyDisplay,
  },
  fontSize: {
    heroDisplay: 56,
    displayLg: 40,
    displayMd: 34,
    lead: 28,
    leadAiry: 24,
    tagline: 21,
    buttonLarge: 18,
    body: 17,
    caption: 14,
    finePrint: 12,
    microLegal: 10,
    // compat
    footnote: 14,
    subtitle: 17,
    title3: 21,
    title2: 28,
    title1: 34,
    display: 40,
  },
  lineHeight: {
    heroDisplay: 60,
    displayLg: 44,
    displayMd: 50,
    lead: 32,
    leadAiry: 36,
    tagline: 25,
    buttonLarge: 20,
    body: 25,
    denseLink: 41,
    caption: 20,
    finePrint: 14,
    microLegal: 13,
    // compat
    footnote: 20,
    subtitle: 25,
    title3: 25,
    title2: 32,
    title1: 44,
    display: 44,
  },
  letterSpacing: {
    heroDisplay: -0.28,
    displayLg: 0,
    displayMd: -0.374,
    lead: 0.196,
    leadAiry: 0,
    tagline: 0.231,
    bodyStrong: -0.374,
    body: -0.374,
    caption: -0.224,
    captionStrong: -0.224,
    buttonUtility: -0.224,
    finePrint: -0.12,
    microLegal: -0.08,
    navLink: -0.12,
  },
};

/**
 * Text Style Presets according to DESIGN.md
 */
const RAW_TYPOGRAPHY_STYLES: Record<string, TextStyle> = {
  heroDisplay: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 56,
    fontWeight: '600',
    lineHeight: 60,
    letterSpacing: -0.28,
  },
  displayLg: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 40,
    fontWeight: '600',
    lineHeight: 44,
    letterSpacing: 0,
  },
  displayMd: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 34,
    fontWeight: '600',
    lineHeight: 50,
    letterSpacing: -0.374,
  },
  lead: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 28,
    fontWeight: '400',
    lineHeight: 32,
    letterSpacing: 0.196,
  },
  leadAiry: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 36,
    letterSpacing: 0,
  },
  tagline: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 21,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: 0.231,
  },
  headlineStrong: {
    fontFamily: Typography.fontFamily.display,
    fontSize: 21,
    fontWeight: '700',
    lineHeight: 25,
    letterSpacing: -0.3,
  },
  bodyStrong: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: -0.374,
  },
  body: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 25,
    letterSpacing: -0.374,
  },
  denseLink: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 41,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.224,
  },
  captionStrong: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    letterSpacing: -0.224,
  },
  buttonLarge: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 20,
    letterSpacing: 0,
  },
  buttonUtility: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 18,
    letterSpacing: -0.224,
  },
  finePrint: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: -0.12,
  },
  microLegal: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 10,
    fontWeight: '400',
    lineHeight: 13,
    letterSpacing: -0.08,
  },
  navLink: {
    fontFamily: Typography.fontFamily.body,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 14,
    letterSpacing: -0.12,
  },
};

export const TypographyStyles: Record<string, TextStyle> = typeof Proxy !== 'undefined'
  ? new Proxy(RAW_TYPOGRAPHY_STYLES, {
      get(target, prop: string) {
        if (typeof prop === 'string' && prop in target) {
          return target[prop];
        }
        return target.body; // Safe fallback so accessing undefined styles never throws TypeError
      },
    })
  : RAW_TYPOGRAPHY_STYLES;

/**
 * Elevation & Depth (DESIGN.md)
 * Strict Rule: Exactly one drop-shadow in the entire system, applied ONLY to product imagery.
 * NO shadows on cards, buttons, or text!
 */
export const Shadows = {
  // Signature product shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px
  product: {
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 15,
    elevation: 6,
  },
  // Backward compatibility alias
  soft: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  medium: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  prominent: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};
