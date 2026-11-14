import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { AuthProvider } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationContext';
import { JourneyProvider } from './src/context/JourneyContext';
import { SOSProvider, useSOS } from './src/context/SOSContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SOSCountdownModal } from './src/components/sos/SOSCountdownModal';

function AppContent() {
  const {
    isConfirmationVisible,
    countdownSeconds,
    cancelSOSConfirmation,
    activateSOSImmediate,
  } = useSOS();

  return (
    <NavigationContainer>
      <RootNavigator />
      <StatusBar style="dark" />

      {/* Global SOS Confirmation & Countdown Modal */}
      <SOSCountdownModal
        visible={isConfirmationVisible}
        secondsRemaining={countdownSeconds}
        onCancel={cancelSOSConfirmation}
        onTriggerNow={activateSOSImmediate}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <LocationProvider>
          <JourneyProvider>
            <SOSProvider>
              <AppContent />
            </SOSProvider>
          </JourneyProvider>
        </LocationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

