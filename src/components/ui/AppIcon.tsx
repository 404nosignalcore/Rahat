import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export type AppIconName =
  | 'shield'
  | 'route'
  | 'sos'
  | 'connect'
  | 'profile'
  | 'heroes'
  | 'pin'
  | 'clock'
  | 'phone'
  | 'check'
  | 'flag'
  | 'comment'
  | 'plus'
  | 'search'
  | 'sun'
  | 'moon'
  | 'watch'
  | 'heart'
  | 'lock'
  | 'external'
  | 'close'
  | 'pause'
  | 'play'
  | 'share'
  | 'trash'
  | 'warning'
  | 'refresh';

const IONICON_MAP: Record<AppIconName, keyof typeof Ionicons.glyphMap> = {
  shield: 'shield-checkmark-outline',
  route: 'navigate-outline',
  sos: 'warning-outline',
  connect: 'people-outline',
  profile: 'person-outline',
  heroes: 'ribbon-outline',
  pin: 'location-outline',
  clock: 'time-outline',
  phone: 'call-outline',
  check: 'checkmark-circle-outline',
  flag: 'flag-outline',
  comment: 'chatbubble-outline',
  plus: 'add-outline',
  search: 'search-outline',
  sun: 'sunny-outline',
  moon: 'moon-outline',
  watch: 'watch-outline',
  heart: 'heart-outline',
  lock: 'lock-closed-outline',
  external: 'open-outline',
  close: 'close-outline',
  pause: 'pause-outline',
  play: 'play-outline',
  share: 'share-social-outline',
  trash: 'trash-outline',
  warning: 'warning-outline',
  refresh: 'reload-outline',
};

export const AppIcon: React.FC<{ name: AppIconName; size?: number; color?: string }> = ({
  name,
  size = 20,
  color = '#0F172A',
}) => {
  const iconName = IONICON_MAP[name] || 'help-circle-outline';
  return <Ionicons name={iconName} size={size} color={color} />;
};
