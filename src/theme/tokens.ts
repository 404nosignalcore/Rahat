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
    bg: '#F4F6FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF1F7',
    border: '#DCE2EC',
    textPrimary: '#0F172A',
    textSecondary: '#334155',
    textMuted: '#64748B',
    navyPrimary: '#0F172A',
    navyText: '#FFFFFF',
    accentViolet: '#6D5BD0',
    accentVioletSoft: '#EFEBFD',
    safeGreen: '#15803D',
    safeBg: '#DCFCE7',
    safeBorder: '#86EFAC',
    cautionAmber: '#B45309',
    cautionBg: '#FEF3C7',
    cautionBorder: '#FCD34D',
    dangerRed: '#DC2626',
    dangerBg: '#FEE2E2',
    dangerBorder: '#FCA5A5',
    tabBarBg: '#FFFFFF',
    tabBarBorder: '#DCE2EC',
    overlayBg: 'rgba(15, 23, 42, 0.56)',
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  typography: {
    displayFont: 'Plus Jakarta Sans, DM Sans, system-ui, sans-serif',
    bodyFont: 'DM Sans, system-ui, sans-serif',
    monoFont: 'JetBrains Mono, monospace',
  },
};

export const DARK_THEME: AppTheme = {
  mode: 'dark',
  colors: {
    bg: '#090D16',
    surface: '#111827',
    surfaceAlt: '#1B2436',
    border: '#263147',
    textPrimary: '#F8FAFC',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    navyPrimary: '#1E293B',
    navyText: '#F8FAFC',
    accentViolet: '#8B7CF6',
    accentVioletSoft: '#251F47',
    safeGreen: '#22C55E',
    safeBg: '#0D2B1B',
    safeBorder: '#166534',
    cautionAmber: '#F59E0B',
    cautionBg: '#2E2009',
    cautionBorder: '#92400E',
    dangerRed: '#EF4444',
    dangerBg: '#361215',
    dangerBorder: '#991B1B',
    tabBarBg: '#0F172A',
    tabBarBorder: '#1E293B',
    overlayBg: 'rgba(2, 6, 23, 0.72)',
  },
  radius: LIGHT_THEME.radius,
  spacing: LIGHT_THEME.spacing,
  typography: LIGHT_THEME.typography,
};

export function getTheme(mode: ThemeMode): AppTheme {
  return mode === 'dark' ? DARK_THEME : LIGHT_THEME;
}
