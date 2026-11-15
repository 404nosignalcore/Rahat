import React from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { getTranslation } from '../../i18n/translations';
import { AppIcon } from '../ui/AppIcon';
import { Colors, TypographyStyles, BorderRadius } from '../../theme';
import { AppTab } from '../../types/safety';

export const TopHeaderBar: React.FC = () => {
  const {
    language,
    setLanguage,
    themeMode,
    toggleTheme,
    theme,
    user,
    activeTab,
    setActiveTab,
    setIsSafeHeroesOpen,
    setIsAuthModalOpen,
    firebaseStatus,
  } = useSafeWalk();
  const t = getTranslation(language);
  const { width } = useWindowDimensions();
  const isCompact = width < 640;
  const isTabletOrDesktop = width >= 834;

  const getSubNavTitle = (tab: AppTab) => {
    switch (tab) {
      case 'safezone':
        return language === 'hi' ? 'सेफज़ोन इंटेलिजेंस' : 'SafeZone Live';
      case 'route':
        return language === 'hi' ? 'सेफवॉक नेविगेशन' : 'SafeWalk Route';
      case 'sos':
        return language === 'hi' ? 'इमरजेंसी रिस्पांस' : 'Emergency SOS';
      case 'connect':
        return language === 'hi' ? 'कम्युनिटी कनेक्ट' : 'SafeCircle & Community';
      case 'profile':
        return language === 'hi' ? 'अकाउंट व गोपनीयता' : 'Account & Security';
      default:
        return 'Rahat';
    }
  };

  const navLinks: { id: AppTab; label: string }[] = [
    { id: 'safezone', label: t.tabs.safezone },
    { id: 'route', label: t.tabs.route },
    { id: 'sos', label: t.tabs.sos },
    { id: 'connect', label: t.tabs.connect },
    { id: 'profile', label: t.tabs.profile },
  ];

  return (
    <View style={styles.wrapper}>
      {/* 1. global-nav (DESIGN.md: 44px height, surface-black #000000, on-dark text in nav-link 12px) */}
      <View style={styles.globalNav}>
        <View style={styles.globalNavInner}>
          {/* Brand Wordmark & Logo */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rahat Home"
            onPress={() => setActiveTab('safezone')}
            style={({ pressed }) => [styles.brandZone, pressed && styles.pressed]}
          >
            <AppIcon name="shield" size={17} color="#ffffff" />
            <Text numberOfLines={1} style={styles.brandTitle}>
              {isCompact ? 'RAHAT' : 'RAHAT · राहत'}
            </Text>
          </Pressable>

          {/* Nav links on tablet & desktop */}
          {isTabletOrDesktop && (
            <View style={styles.navLinksRow}>
              {navLinks.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={item.label}
                    onPress={() => setActiveTab(item.id)}
                    style={({ pressed }) => [
                      styles.navLinkItem,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.navLinkText,
                        isActive ? styles.navLinkActive : styles.navLinkInactive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Right cluster: Language toggle, Theme switch, Sign In / Profile */}
          <View style={styles.globalNavRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={language === 'en' ? 'Switch to Hindi' : 'Switch to English'}
              onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              style={({ pressed }) => [
                styles.globalNavPill,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.globalNavPillText}>
                {language === 'en' ? 'हिन्दी' : 'EN'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={themeMode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              onPress={toggleTheme}
              style={({ pressed }) => [
                styles.circularIconBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon
                name={themeMode === 'light' ? 'moon' : 'sun'}
                size={14}
                color="#ffffff"
              />
            </Pressable>

            {!user.isAuthenticated && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                onPress={() => setIsAuthModalOpen(true)}
                style={({ pressed }) => [
                  styles.darkUtilityBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.darkUtilityBtnText}>
                  {t.topBar.signIn}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* 2. sub-nav-frosted (DESIGN.md: 52px height, canvas-parchment #f5f5f7, hairline border, tagline 21px) */}
      <View
        style={[
          styles.subNavFrosted,
          {
            backgroundColor: themeMode === 'dark' ? '#161617' : Colors.canvasParchment,
            borderBottomColor: themeMode === 'dark' ? '#272729' : Colors.hairline,
          },
        ]}
      >
        <View style={styles.subNavInner}>
          {/* Surface Category Name in {typography.tagline} (21px / 600 / 0.231px) */}
          <View style={styles.subNavTitleGroup}>
            <Text
              numberOfLines={1}
              style={[
                styles.subNavTitle,
                { color: themeMode === 'dark' ? '#ffffff' : Colors.ink },
              ]}
            >
              {getSubNavTitle(activeTab)}
            </Text>
            {!isCompact && (
              <View style={styles.cloudBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        firebaseStatus === 'online' ? Colors.green : Colors.yellow,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.cloudBadgeText,
                    { color: themeMode === 'dark' ? '#8e8e93' : Colors.inkMuted48 },
                  ]}
                >
                  {firebaseStatus === 'online'
                    ? t.disclaimers.liveBadge
                    : t.disclaimers.demoBadge}
                </Text>
              </View>
            )}
          </View>

          {/* Persistent Action Blue Pill CTA: SafeHeroes Verified Directory */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open SafeHeroes verified public helplines directory"
            onPress={() => setIsSafeHeroesOpen(true)}
            style={({ pressed }) => [
              styles.primaryPillBtn,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="heroes" size={14} color="#ffffff" />
            <Text style={styles.primaryPillText}>
              {t.topBar.safeHeroes}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    zIndex: 100,
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },

  // 1. global-nav (DESIGN.md: 44px, surface-black #000000, on-dark text in nav-link 12px)
  globalNav: {
    height: 44,
    backgroundColor: '#000000',
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  globalNavInner: {
    width: '100%',
    maxWidth: 1440,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandTitle: {
    fontFamily: TypographyStyles.navLink.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  navLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  navLinkItem: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  navLinkText: {
    fontFamily: TypographyStyles.navLink.fontFamily,
    fontSize: 12,
    letterSpacing: -0.12,
  },
  navLinkInactive: {
    color: '#a1a1a6',
    fontWeight: '400',
  },
  navLinkActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  globalNavRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  globalNavPill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  globalNavPillText: {
    fontFamily: TypographyStyles.navLink.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: -0.12,
  },
  circularIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  darkUtilityBtn: {
    backgroundColor: '#1d1d1f',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  darkUtilityBtnText: {
    fontFamily: TypographyStyles.navLink.fontFamily,
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
  },

  // 2. sub-nav-frosted (DESIGN.md: 52px height, parchment #f5f5f7, hairline border, tagline 21px)
  subNavFrosted: {
    height: 52,
    width: '100%',
    borderBottomWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  subNavInner: {
    width: '100%',
    maxWidth: 1440,
    marginHorizontal: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subNavTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  subNavTitle: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 21,
    fontWeight: '600',
    lineHeight: 25,
    letterSpacing: 0.231, // Exact DESIGN.md tracking
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  cloudBadgeText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    letterSpacing: -0.12,
  },

  // Persistent {component.button-primary} Action Blue Pill
  primaryPillBtn: {
    backgroundColor: Colors.primary, // #0066cc Action Blue
    borderRadius: BorderRadius.pill, // 9999px
    paddingVertical: 7,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryPillText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.224,
  },
});
