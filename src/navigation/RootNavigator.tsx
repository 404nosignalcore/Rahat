import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CustomBottomTabBar } from '../components/navigation/CustomBottomTabBar';

import { SafeZoneScreen } from '../screens/safezone/SafeZoneScreen';
import { RouteScreen } from '../screens/route/RouteScreen';
import { SOSScreen } from '../screens/sos/SOSScreen';
import { ConnectScreen } from '../screens/connect/ConnectScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SafeHeroesModal } from '../screens/heroes/SafeHeroesModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="SafeZone"
        component={SafeZoneScreen}
        options={{ title: 'SafeZone' }}
      />
      <Tab.Screen
        name="Route"
        component={RouteScreen}
        options={{ title: 'Route' }}
      />
      <Tab.Screen
        name="SOS"
        component={SOSScreen}
        options={{ title: 'SOS' }}
      />
      <Tab.Screen
        name="Connect"
        component={ConnectScreen}
        options={{ title: 'Connect' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="SafeHeroes"
        component={SafeHeroesModal}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}

