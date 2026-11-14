import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, Typography, Shadows, BorderRadius } from '../../theme';
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

          // The Center Prominent SOS Button
          if (isSOSTab) {
            return (
              <View key={route.key} style={styles.sosTabSlot}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    // Open SOS emergency confirmation workflow directly
                    openSOSConfirmation();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="SOS Emergency Assistance"
                  style={styles.sosButton}
                >
                  <View style={styles.sosButtonInner}>
                    <MaterialCommunityIcons name="alert-octagon" size={28} color="#FFFFFF" />
                    <Text style={styles.sosButtonText}>SOS</Text>
                  </View>
                </TouchableOpacity>
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
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name={getTabIcon(route.name, isFocused) as any}
                size={24}
                color={isFocused ? Colors.primary : Colors.textMuted}
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? Colors.primary : Colors.textMuted,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}
              >
                {label}
              </Text>
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.soft,
  },
  tabBarContainer: {
    flexDirection: 'row',
    height: Spacing.tabBarHeight,
    alignItems: 'center',
    justifyContent: 'space-around',
    position: 'relative',
    paddingHorizontal: Spacing.xs,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingVertical: 6,
  },
  tabLabel: {
    fontSize: Typography.fontSize.caption,
    marginTop: 3,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 14,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  sosTabSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  sosButton: {
    position: 'absolute',
    top: -24,
    width: Spacing.sosButtonSize,
    height: Spacing.sosButtonSize,
    borderRadius: Spacing.sosButtonSize / 2,
    backgroundColor: Colors.card,
    padding: 3,
    ...Shadows.prominent,
  },
  sosButtonInner: {
    flex: 1,
    borderRadius: (Spacing.sosButtonSize - 6) / 2,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginTop: -2,
  },
});

