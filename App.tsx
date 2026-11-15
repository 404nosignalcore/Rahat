import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics, SafeAreaView } from 'react-native-safe-area-context';
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

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('Rahat App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => this.setState({ hasError: false, error: null })}
            style={styles.retryButton}
          >
            <Text style={styles.retryButtonText}>Reload App</Text>
          </Pressable>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

const MainShell: React.FC = () => {
  const { activeTab, theme, themeMode, statusBanner, clearStatusBanner } = useRahat();

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.colors.bg }]}
      edges={['top', 'left', 'right']}
    >
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
    <SafeAreaProvider style={styles.provider} initialMetrics={initialWindowMetrics}>
      <ErrorBoundary>
        <RahatProvider>
          <MainShell />
        </RahatProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  provider: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F4F6FA',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#6D5BD0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
