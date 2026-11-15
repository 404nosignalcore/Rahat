import { Platform, TextStyle, ViewStyle } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: {
    // Exact DESIGN.md Tokens
    primary: string;           // #0066cc (Action Blue)
    primaryFocus: string;      // #0071e3
    primaryOnDark: string;     // #2997ff (Sky Link Blue)
    ink: string;               // #1d1d1f (Near-Black Ink)
    body: string;              // #1d1d1f
    bodyOnDark: string;        // #ffffff
    bodyMuted: string;         // #cccccc
    inkMuted80: string;        // #333333
    inkMuted48: string;        // #7a7a7a
    dividerSoft: string;       // #f0f0f0 (rgba(0, 0, 0, 0.04))
    hairline: string;          // #e0e0e0 (rgba(0, 0, 0, 0.08))
    canvas: string;            // #ffffff (Pure White)
    canvasParchment: string;   // #f5f5f7 (Signature Apple Parchment)
    surfacePearl: string;      // #fafafc (Pearl secondary capsule fill)
    surfaceTile1: string;      // #272729 (Primary dark tile)
    surfaceTile2: string;      // #2a2a2c (Micro-step lighter)
    surfaceTile3: string;      // #252527 (Micro-step darker)
    surfaceBlack: string;      // #000000 (Pure Black: global nav, true void)
    surfaceChipTranslucent: string; // rgba(210, 210, 215, 0.64)
    onPrimary: string;         // #ffffff
    onDark: string;            // #ffffff

    // Functional safety status (Apple system palette)
    safeGreen: string;         // #34c759
    safeBg: string;            // #ebf9ee
    safeBorder: string;        // #a3e7b7
    cautionAmber: string;      // #ff9500
    cautionBg: string;         // #fff5e5
    cautionBorder: string;     // #ffd188
    dangerRed: string;         // #ff3b30
    dangerBg: string;          // #ffebea
    dangerBorder: string;      // #ffb2ae

    // Compat keys mapped directly to DESIGN.md
    bg: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    navyPrimary: string;
    navyText: string;
    accentViolet: string;
    accentVioletSoft: string;
    tabBarBg: string;
    tabBarBorder: string;
    overlayBg: string;
  };
  radius: {
    none: number; // 0px
    xs: number;   // 5px
    sm: number;   // 8px
    md: number;   // 11px
    lg: number;   // 18px (Apple utility card)
    pill: number; // 9999px (Apple signature pill)
    full: number; // 9999px
    xl: number;   // 24px (Sheet modal)
  };
  spacing: {
    xxs: number;     // 4px
    xs: number;      // 8px
    sm: number;      // 12px
    md: number;      // 17px
    lg: number;      // 24px
    xl: number;      // 32px
    xxl: number;     // 48px
    section: number; // 80px
  };
  typography: {
    fontFamilyDisplay: string;
    fontFamilyBody: string;
    fontFamilyMono: string;
    // Compatibility
    displayFont: string;
    bodyFont: string;
    monoFont: string;
  };
  shadows: {
    productShadow: ViewStyle;
    none: ViewStyle;
  };
}

const DISPLAY_FONT = Platform.select({
  ios: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
  default: 'SF Pro Display, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif',
});

const BODY_FONT = Platform.select({
  ios: 'SF Pro Text, -apple-system, BlinkMacSystemFont, sans-serif',
  default: 'SF Pro Text, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif',
});

const MONO_FONT = Platform.select({
  ios: 'SF Mono, Menlo, monospace',
  default: 'SF Mono, Menlo, Monaco, Consolas, "Courier New", monospace',
});

// Single signature product drop-shadow from DESIGN.md: rgba(0, 0, 0, 0.22) 3px 5px 30px
const PRODUCT_SHADOW: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 3, height: 5 },
  shadowOpacity: 0.22,
  shadowRadius: 15,
  elevation: 6,
};

export const LIGHT_THEME: AppTheme = {
  mode: 'light',
  colors: {
    // DESIGN.md exact tokens
    primary: '#0066cc',
    primaryFocus: '#0071e3',
    primaryOnDark: '#2997ff',
    ink: '#1d1d1f',
    body: '#1d1d1f',
    bodyOnDark: '#ffffff',
    bodyMuted: '#cccccc',
    inkMuted80: '#333333',
    inkMuted48: '#7a7a7a',
    dividerSoft: '#f0f0f0',
    hairline: '#e0e0e0',
    canvas: '#ffffff',
    canvasParchment: '#f5f5f7',
    surfacePearl: '#fafafc',
    surfaceTile1: '#272729',
    surfaceTile2: '#2a2a2c',
    surfaceTile3: '#252527',
    surfaceBlack: '#000000',
    surfaceChipTranslucent: 'rgba(210, 210, 215, 0.64)',
    onPrimary: '#ffffff',
    onDark: '#ffffff',

    // Safety status
    safeGreen: '#34c759',
    safeBg: '#ebf9ee',
    safeBorder: '#a3e7b7',
    cautionAmber: '#ff9500',
    cautionBg: '#fff5e5',
    cautionBorder: '#ffd188',
    dangerRed: '#ff3b30',
    dangerBg: '#ffebea',
    dangerBorder: '#ffb2ae',

    // Compatibility mappings
    bg: '#f5f5f7',               // canvas-parchment
    surface: '#ffffff',          // canvas
    surfaceAlt: '#fafafc',       // surface-pearl
    border: '#e0e0e0',           // hairline
    textPrimary: '#1d1d1f',      // ink
    textSecondary: '#333333',    // ink-muted-80
    textMuted: '#7a7a7a',        // ink-muted-48
    navyPrimary: '#0066cc',      // Action Blue
    navyText: '#ffffff',
    accentViolet: '#0066cc',     // Action Blue is the ONLY interactive brand accent
    accentVioletSoft: '#e8f2ff', // Light Action Blue tint
    tabBarBg: '#ffffff',
    tabBarBorder: '#e0e0e0',
    overlayBg: 'rgba(0, 0, 0, 0.48)',
  },
  radius: {
    none: 0,
    xs: 5,
    sm: 8,
    md: 11,
    lg: 18,
    pill: 9999,
    full: 9999,
    xl: 24,
  },
  spacing: {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 17,
    lg: 24,
    xl: 32,
    xxl: 48,
    section: 80,
  },
  typography: {
    fontFamilyDisplay: DISPLAY_FONT,
    fontFamilyBody: BODY_FONT,
    fontFamilyMono: MONO_FONT,
    displayFont: DISPLAY_FONT,
    bodyFont: BODY_FONT,
    monoFont: MONO_FONT,
  },
  shadows: {
    productShadow: PRODUCT_SHADOW,
    none: {},
  },
};

export const DARK_THEME: AppTheme = {
  mode: 'dark',
  colors: {
    // DESIGN.md exact tokens (Dark Mode Variant)
    primary: '#2997ff',          // Sky Link Blue on dark
    primaryFocus: '#0071e3',
    primaryOnDark: '#2997ff',
    ink: '#ffffff',
    body: '#ffffff',
    bodyOnDark: '#ffffff',
    bodyMuted: '#cccccc',
    inkMuted80: '#cccccc',
    inkMuted48: '#8e8e93',
    dividerSoft: '#272729',
    hairline: '#38383a',
    canvas: '#000000',           // True OLED Black
    canvasParchment: '#161617',   // Dark Chrome Canvas
    surfacePearl: '#2c2c2e',
    surfaceTile1: '#1c1c1e',     // Dark grouped surface
    surfaceTile2: '#272729',
    surfaceTile3: '#2a2a2c',
    surfaceBlack: '#000000',
    surfaceChipTranslucent: 'rgba(255, 255, 255, 0.16)',
    onPrimary: '#ffffff',
    onDark: '#ffffff',

    // Safety status on dark
    safeGreen: '#30d158',
    safeBg: '#0b2813',
    safeBorder: '#1a6a32',
    cautionAmber: '#ff9f0a',
    cautionBg: '#2f1f05',
    cautionBorder: '#7b4f09',
    dangerRed: '#ff453a',
    dangerBg: '#300d0c',
    dangerBorder: '#7f1a17',

    // Compatibility mappings
    bg: '#000000',
    surface: '#1c1c1e',
    surfaceAlt: '#272729',
    border: '#38383a',
    textPrimary: '#ffffff',
    textSecondary: '#ebebf5',
    textMuted: '#8e8e93',
    navyPrimary: '#2997ff',
    navyText: '#ffffff',
    accentViolet: '#2997ff',
    accentVioletSoft: '#142940',
    tabBarBg: '#161617',
    tabBarBorder: '#272729',
    overlayBg: 'rgba(0, 0, 0, 0.76)',
  },
  radius: LIGHT_THEME.radius,
  spacing: LIGHT_THEME.spacing,
  typography: LIGHT_THEME.typography,
  shadows: LIGHT_THEME.shadows,
};

export function getTheme(mode: ThemeMode): AppTheme {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
