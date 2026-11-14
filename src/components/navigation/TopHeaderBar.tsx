import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { getTranslation } from '../../i18n/translations';
import { AppIcon } from '../ui/AppIcon';

export const TopHeaderBar: React.FC = () => {
  const {
    language,
    setLanguage,
    themeMode,
    toggleTheme,
    theme,
    user,
    setIsSafeHeroesOpen,
    setIsAuthModalOpen,
  } = useSafeWalk();
  const t = getTranslation(language);
  const { width } = useWindowDimensions();
  const isCompact = width < 520;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      {/* Zone 1: Single-line Brand Wordmark */}
      <View style={styles.brandZone}>
        <AppIcon name="shield" size={22} color={theme.colors.accentViolet} />
        <Text
          numberOfLines={1}
          style={[styles.brandText, { color: theme.colors.textPrimary }]}
        >
          {isCompact ? 'Rahat' : t.brand}
        </Text>
      </View>

      {/* Zone 2 & 3: Language + Theme + Sign In (wide) + Top-Right SafeHeroes */}
      <View style={styles.controlsZone}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={language === 'en' ? 'Switch language to Hindi' : 'Switch language to English'}
          onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
          style={[
            styles.iconButton,
            { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
          ]}
        >
          <Text numberOfLines={1} style={[styles.controlLabel, { color: theme.colors.textPrimary }]}>
            {isCompact ? (language === 'en' ? 'हिं' : 'EN') : language === 'en' ? 'EN / हिं' : 'हिं / EN'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          onPress={toggleTheme}
          style={[
            styles.squareButton,
            { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
          ]}
        >
          <AppIcon
            name={themeMode === 'light' ? 'moon' : 'sun'}
            size={18}
            color={theme.colors.textPrimary}
          />
        </Pressable>

        {!user.isAuthenticated && !isCompact && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign in with Firebase"
            onPress={() => setIsAuthModalOpen(true)}
            style={[
              styles.iconButton,
              { backgroundColor: theme.colors.navyPrimary, borderColor: theme.colors.navyPrimary },
            ]}
          >
            <Text numberOfLines={1} style={[styles.controlLabel, { color: theme.colors.navyText }]}>
              {t.topBar.signIn}
            </Text>
          </Pressable>
        )}

        {/* Top-Right SafeHeroes Entry */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open SafeHeroes verified support directory"
          onPress={() => setIsSafeHeroesOpen(true)}
          style={[
            styles.heroesButton,
            {
              backgroundColor: theme.colors.accentVioletSoft,
              borderColor: theme.colors.accentViolet,
            },
          ]}
        >
          <AppIcon name="heroes" size={16} color={theme.colors.accentViolet} />
          <Text numberOfLines={1} style={[styles.heroesText, { color: theme.colors.accentViolet }]}>
            {t.topBar.safeHeroes}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 58,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  brandZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 0,
  },
  brandText: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  controlsZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  iconButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  squareButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroesButton: {
    minHeight: 38,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroesText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
