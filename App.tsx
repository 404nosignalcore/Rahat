import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaShell } from './src/components/ui/SafeAreaShell';
import { RahatProvider, useRahat } from './src/context/SafeWalkContext';
import { TopHeaderBar } from './src/components/navigation/TopHeaderBar';
import { BottomTabBar } from './src/components/navigation/BottomTabBar';
import { SafeHeroesModal } from './src/components/modals/SafeHeroesModal';
import { AuthConsentModal } from './src/components/modals/AuthConsentModal';
import { SafeZoneScreen } from './src/screens/SafeZoneScreen';
import { RouteScreen } from './src/screens/RouteScreen';
import { SosScreen } from './src/screens/SosScreen';
import { ConnectScreen } from './src/screens/ConnectScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

const MainShell: React.FC = () => {
  const { activeTab, theme, themeMode, statusBanner, clearStatusBanner } = useRahat();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.colors.bg }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <TopHeaderBar />

      {statusBanner && (
        <View
          style={[
            styles.banner,
            { backgroundColor: theme.colors.navyPrimary, borderBottomColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.bannerText, { color: theme.colors.navyText }]}>
            {statusBanner}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification banner"
            onPress={clearStatusBanner}
            style={styles.bannerClose}
          >
            <Text style={{ color: theme.colors.navyText, fontWeight: '700', fontSize: 12 }}>
              Dismiss
            </Text>
          </Pressable>
        </View>
      )}

      <View style={styles.content}>
        {activeTab === 'safezone' && <SafeZoneScreen />}
        {activeTab === 'route' && <RouteScreen />}
        {activeTab === 'sos' && <SosScreen />}
        {activeTab === 'connect' && <ConnectScreen />}
        {activeTab === 'profile' && <ProfileScreen />}
      </View>

      <BottomTabBar />
      <SafeHeroesModal />
      <AuthConsentModal />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaShell>
      <RahatProvider>
        <MainShell />
      </RahatProvider>
    </SafeAreaShell>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    height: '100%' as unknown as number,
    overflow: 'hidden',
  },
  banner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    borderBottomWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  bannerClose: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
});
