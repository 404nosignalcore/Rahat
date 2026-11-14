import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { AppIcon } from '../ui/AppIcon';

export const AuthConsentModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, signInGoogle, authBusy, theme } = useSafeWalk();

  return (
    <Modal
      visible={isAuthModalOpen}
      transparent
      animationType="none"
      onRequestClose={() => setIsAuthModalOpen(false)}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlayBg }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <AppIcon name="shield" size={22} color={theme.colors.accentViolet} />
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                RAHAT Account & Consent
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sign in dialog"
              onPress={() => setIsAuthModalOpen(false)}
              style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceAlt }]}
            >
              <AppIcon name="close" size={18} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <Text style={[styles.body, { color: theme.colors.textSecondary }]}>
            Sign in with Google via Firebase Authentication to sync your trusted emergency contacts,
            SafeCircle groups, safety reports, and journey history across devices.
          </Text>

          <View
            style={[
              styles.consentBox,
              { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.consentTitle, { color: theme.colors.textPrimary }]}>
              Privacy & Consent Guarantees
            </Text>
            <Text style={[styles.consentItem, { color: theme.colors.textSecondary }]}>
              · Location is never collected or shared silently without your consent.
            </Text>
            <Text style={[styles.consentItem, { color: theme.colors.textSecondary }]}>
              · Background tracking runs only during an active monitored route when enabled.
            </Text>
            <Text style={[styles.consentItem, { color: theme.colors.textSecondary }]}>
              · Public community posts display coarse area names only—never your exact coordinates.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google Sign-In"
            disabled={authBusy}
            onPress={signInGoogle}
            style={[
              styles.primaryBtn,
              { backgroundColor: theme.colors.accentViolet, opacity: authBusy ? 0.6 : 1 },
            ]}
          >
            <AppIcon name="lock" size={16} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>
              {authBusy ? 'Connecting to Firebase...' : 'Continue with Google (Firebase Auth)'}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue exploring in Demo Mode"
            onPress={() => setIsAuthModalOpen(false)}
            style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.secondaryBtnText, { color: theme.colors.textSecondary }]}>
              Continue in Local Demo Mode
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 18,
    borderWidth: 1,
    padding: 20,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
  },
  consentBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  consentTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  consentItem: {
    fontSize: 12,
    lineHeight: 18,
  },
  primaryBtn: {
    minHeight: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryBtn: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
