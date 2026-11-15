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
import { Colors, TypographyStyles, BorderRadius } from './src/theme';

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
  const isDark = themeMode === 'dark';

  return (
    <SafeAreaView
      style={[
        styles.root,
        { backgroundColor: isDark ? '#000000' : Colors.canvasParchment },
      ]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TopHeaderBar />

      {statusBanner && (
        <View
          style={[
            styles.banner,
            {
              backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
              borderBottomColor: isDark ? '#272729' : Colors.hairline,
            },
          ]}
        >
          <Text
            numberOfLines={2}
            style={[
              styles.bannerText,
              { color: isDark ? '#ffffff' : Colors.ink },
            ]}
          >
            {statusBanner}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification banner"
            onPress={clearStatusBanner}
            style={({ pressed }) => [styles.bannerClose, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.bannerCloseText}>
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
    backgroundColor: '#000000',
  },
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  banner: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
  },
  bannerText: {
    flex: 1,
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: -0.224,
  },
  bannerClose: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#e8f2ff',
  },
  bannerCloseText: {
    color: Colors.primary, // Action Blue #0066cc
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f7',
  },
  errorTitle: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 21,
    fontWeight: '600',
    color: '#ff3b30',
    marginBottom: 8,
  },
  errorMessage: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: BorderRadius.pill,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 15,
  },
});
