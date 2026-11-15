import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, TypographyStyles, BorderRadius } from '../../theme';
import { useSOS } from '../../context/SOSContext';

export const CustomBottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { openSOSConfirmation } = useSOS();

  const getTabIcon = (routeName: string, isFocused: boolean) => {
    switch (routeName) {
      case 'SafeZone':
        return isFocused ? 'shield-home' : 'shield-home-outline';
      case 'Route':
        return isFocused ? 'map-marker-path' : 'map-marker-distance';
      case 'Connect':
        return isFocused ? 'account-group' : 'account-group-outline';
      case 'Profile':
        return isFocused ? 'account-circle' : 'account-circle-outline';
      default:
        return 'circle';
    }
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 14 : 10),
        },
      ]}
    >
      <View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isSOSTab = route.name === 'SOS';

          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          if (isSOSTab) {
            return (
              <View key={route.key} style={styles.sosTabSlot}>
                <Pressable
                  onPress={openSOSConfirmation}
                  accessibilityRole="button"
                  accessibilityLabel="SOS Emergency Assistance"
                  style={({ pressed }) => [
                    styles.sosButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="alert-octagon" size={16} color="#ffffff" />
                  <Text style={styles.sosButtonText}>SOS</Text>
                </Pressable>
              </View>
            );
          }

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={({ pressed }) => [
                styles.tabButton,
                pressed && styles.pressed,
              ]}
            >
              {isFocused && <View style={styles.activeIndicator} />}
              <MaterialCommunityIcons
                name={getTabIcon(route.name, isFocused) as any}
                size={22}
                color={isFocused ? Colors.primary : Colors.inkMuted48}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? Colors.primary : Colors.inkMuted48,
                    fontWeight: isFocused ? '600' : '400',
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.canvas,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: 64, // Exact DESIGN.md spec: 64px
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    paddingHorizontal: 12,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontFamily: TypographyStyles.navLink.fontFamily,
    fontSize: 11,
    letterSpacing: -0.12,
  },
  activeIndicator: {
    width: 14,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.primary,
    marginBottom: 2,
  },
  sosTabSlot: {
    paddingHorizontal: 6,
  },
  sosButton: {
    backgroundColor: Colors.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
  },
  sosButtonText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
