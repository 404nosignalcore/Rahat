import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { getTranslation } from '../../i18n/translations';
import { AppTab } from '../../types/safety';
import { AppIcon, AppIconName } from '../ui/AppIcon';
import { Colors, BorderRadius, TypographyStyles } from '../../theme';

export const BottomTabBar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    language,
    themeMode,
    activeSosAlert,
    sosCountdownRemaining,
  } = useSafeWalk();
  const t = getTranslation(language);

  const items: { id: AppTab; label: string; icon: AppIconName }[] = [
    { id: 'safezone', label: t.tabs.safezone, icon: 'shield' },
    { id: 'route', label: t.tabs.route, icon: 'route' },
    { id: 'sos', label: t.tabs.sos, icon: 'sos' },
    { id: 'connect', label: t.tabs.connect, icon: 'connect' },
    { id: 'profile', label: t.tabs.profile, icon: 'profile' },
  ];

  const isDark = themeMode === 'dark';
  const sosActive = Boolean(activeSosAlert) || sosCountdownRemaining !== null;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#161617' : Colors.canvas,
          borderTopColor: isDark ? '#272729' : Colors.hairline,
        },
      ]}
    >
      <View style={styles.innerBar}>
        {items.map((item) => {
          const isActive = activeTab === item.id;
          const isSos = item.id === 'sos';

          if (isSos) {
            return (
              <Pressable
                key={item.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel="Emergency SOS Quick Action"
                onPress={() => setActiveTab('sos')}
                style={({ pressed }) => [
                  styles.tabButton,
                  styles.sosTabSlot,
                  pressed && styles.pressed,
                ]}
              >
                <View
                  style={[
                    styles.sosCapsule,
                    {
                      backgroundColor: sosActive
                        ? Colors.redDark
                        : isActive
                        ? Colors.red
                        : isDark
                        ? '#2c1515'
                        : '#ffebea',
                      borderColor: sosActive || isActive ? Colors.red : Colors.redBorder,
                    },
                  ]}
                >
                  <AppIcon
                    name="sos"
                    size={17}
                    color={sosActive || isActive ? '#ffffff' : Colors.red}
                  />
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.sosLabel,
                      {
                        color: sosActive || isActive ? '#ffffff' : Colors.red,
                        fontWeight: isActive ? '700' : '600',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          }

          const activeColor = isDark ? Colors.primaryOnDark : Colors.primary; // Action Blue #0066cc
          const inactiveColor = isDark ? '#8e8e93' : Colors.inkMuted48;

          return (
            <Pressable
              key={item.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`${item.label} Tab`}
              onPress={() => setActiveTab(item.id)}
              style={({ pressed }) => [
                styles.tabButton,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: isActive ? activeColor : 'transparent' },
                ]}
              />
              <AppIcon
                name={item.icon}
                size={20}
                color={isActive ? activeColor : inactiveColor}
              />
              <Text
                numberOfLines={1}
                style={[
                  styles.tabLabel,
                  {
                    color: isActive ? activeColor : inactiveColor,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64, // Exact DESIGN.md spec: 64px
    borderTopWidth: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  innerBar: {
    width: '100%',
    maxWidth: 720,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },
  tabButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  activeDot: {
    width: 14,
    height: 2,
    borderRadius: 1,
    marginBottom: 2,
  },
  tabLabel: {
    fontFamily: TypographyStyles.navLink.fontFamily,
    fontSize: 11,
    letterSpacing: -0.12,
  },
  sosTabSlot: {
    paddingHorizontal: 4,
  },
  sosCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill, // Apple pill
    borderWidth: 1,
  },
  sosLabel: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 12,
    letterSpacing: -0.12,
  },
});
