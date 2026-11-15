export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  mode: ThemeMode;
  colors: {
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
    safeGreen: string;
    safeBg: string;
    safeBorder: string;
    cautionAmber: string;
    cautionBg: string;
    cautionBorder: string;
    dangerRed: string;
    dangerBg: string;
    dangerBorder: string;
    tabBarBg: string;
    tabBarBorder: string;
    overlayBg: string;
  };
  radius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  typography: {
    displayFont: string;
    bodyFont: string;
    monoFont: string;
  };
}

export const LIGHT_THEME: AppTheme = {
  mode: 'light',
  colors: {
    bg: '#F5F5F7',               // Apple Light Gray Parchment Canvas
    surface: '#FFFFFF',          // Apple Card Tile White
    surfaceAlt: '#E8E8ED',       // Apple Inset Grouped Surface
    border: '#D2D2D7',           // Apple Hairline Divider
    textPrimary: '#1D1D1F',      // Apple Ink
    textSecondary: '#424245',    // Apple Secondary Ink
    textMuted: '#86868B',        // Apple Caption / Muted
    navyPrimary: '#0071E3',      // Apple Action Blue
    navyText: '#FFFFFF',
    accentViolet: '#0071E3',     // Apple Accent Action Blue
    accentVioletSoft: '#E8F2FF', // Apple Soft Tint Blue
    safeGreen: '#34C759',        // Apple System Green
    safeBg: '#EBF9EE',
    safeBorder: '#A3E7B7',
    cautionAmber: '#FF9500',     // Apple System Orange
    cautionBg: '#FFF5E5',
    cautionBorder: '#FFD188',
    dangerRed: '#FF3B30',        // Apple System Red
    dangerBg: '#FFEBEA',
    dangerBorder: '#FFB2AE',
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#E5E5EA',
    overlayBg: 'rgba(0, 0, 0, 0.42)',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 18,                      // Apple Standard Rounded Tile (18px)
    xl: 24,                      // Apple Modal / Sheet (24px)
    full: 9999,                  // Apple Capsule Pill
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    displayFont: 'System, -apple-system, SF Pro Display, Helvetica Neue, sans-serif',
    bodyFont: 'System, -apple-system, SF Pro Text, Helvetica Neue, sans-serif',
    monoFont: 'SF Mono, Menlo, Courier New, monospace',
  },
};

export const DARK_THEME: AppTheme = {
  mode: 'dark',
  colors: {
    bg: '#000000',               // Apple True OLED Black Canvas
    surface: '#1C1C1E',          // Apple Grouped Dark Card
    surfaceAlt: '#2C2C2E',       // Apple Inset Secondary
    border: '#38383A',           // Apple Dark Hairline
    textPrimary: '#FFFFFF',      // Apple Pure White Text
    textSecondary: '#EBEBF5',    // Apple Secondary White
    textMuted: '#8E8E93',        // Apple Tertiary Gray
    navyPrimary: '#2997FF',      // Apple Primary on Dark
    navyText: '#FFFFFF',
    accentViolet: '#2997FF',     // Apple Accent Blue on Dark
    accentVioletSoft: '#142940', // Apple Soft Dark Blue
    safeGreen: '#30D158',        // Apple System Green Dark
    safeBg: '#0B2813',
    safeBorder: '#1A6A32',
    cautionAmber: '#FF9F0A',     // Apple System Orange Dark
    cautionBg: '#2F1F05',
    cautionBorder: '#7B4F09',
    dangerRed: '#FF453A',        // Apple System Red Dark
    dangerBg: '#300D0C',
    dangerBorder: '#7F1A17',
    tabBarBg: '#161617',         // Apple Dark Chrome
    tabBarBorder: '#272729',
    overlayBg: 'rgba(0, 0, 0, 0.72)',
  },
  radius: LIGHT_THEME.radius,
  spacing: LIGHT_THEME.spacing,
  typography: LIGHT_THEME.typography,
};

export function getTheme(mode: ThemeMode): AppTheme {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
