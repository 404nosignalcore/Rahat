import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { getTranslation } from '../../i18n/translations';
import { AppTab } from '../../types/safety';
import { AppIcon, AppIconName } from '../ui/AppIcon';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, language, theme, activeSosAlert, sosCountdownRemaining } =
    useSafeWalk();
  const t = getTranslation(language);

  const items: { id: AppTab; label: string; icon: AppIconName }[] = [
    { id: 'safezone', label: t.tabs.safezone, icon: 'shield' },
    { id: 'route', label: t.tabs.route, icon: 'route' },
    { id: 'sos', label: t.tabs.sos, icon: 'sos' },
    { id: 'connect', label: t.tabs.connect, icon: 'connect' },
    { id: 'profile', label: t.tabs.profile, icon: 'profile' },
  ];

  const sosBusy = Boolean(activeSosAlert) || sosCountdownRemaining !== null;

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.tabBarBg,
          borderTopColor: theme.colors.tabBarBorder,
        },
      ]}
    >
      {items.map((item) => {
        const isActive = activeTab === item.id;
        if (item.id === 'sos') {
          return (
            <View key={item.id} style={styles.sosSlot}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel="Emergency SOS Tab"
                onPress={() => setActiveTab('sos')}
                style={[
                  styles.sosButton,
                  {
                    backgroundColor: sosBusy ? '#991B1B' : theme.colors.dangerRed,
                    borderColor: theme.colors.tabBarBg,
                  },
                ]}
              >
                <AppIcon name="sos" size={24} color="#FFFFFF" />
                <Text numberOfLines={1} style={styles.sosLabel}>
                  {item.label}
                </Text>
              </Pressable>
            </View>
          );
        }

        const color = isActive ? theme.colors.accentViolet : theme.colors.textMuted;

        return (
          <Pressable
            key={item.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${item.label} Tab`}
            onPress={() => setActiveTab(item.id)}
            style={styles.tabButton}
          >
            <View
              style={[
                styles.activeIndicator,
                { backgroundColor: isActive ? theme.colors.accentViolet : 'transparent' },
              ]}
            />
            <AppIcon name={item.icon} size={20} color={color} />
            <Text
              numberOfLines={1}
              style={[
                styles.tabLabel,
                {
                  color,
                  fontWeight: isActive ? '700' : '500',
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 64,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 2,
  },
  tabButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    position: 'relative',
  },
  activeIndicator: {
    width: 20,
    height: 2.5,
    borderRadius: 9999,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10.5,
    letterSpacing: -0.15,
  },
  sosSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    marginTop: -22,
    borderWidth: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  sosLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
