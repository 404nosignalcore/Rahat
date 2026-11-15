import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { AppIcon } from '../ui/AppIcon';
import { Colors, BorderRadius, TypographyStyles } from '../../theme';

export const AuthConsentModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, signInGoogle, authBusy, themeMode } = useSafeWalk();
  const isDark = themeMode === 'dark';

  return (
    <Modal
      visible={isAuthModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsAuthModalOpen(false)}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
              borderColor: isDark ? '#272729' : Colors.hairline,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <AppIcon name="shield" size={20} color={Colors.primary} />
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#ffffff' : Colors.ink },
                ]}
              >
                RAHAT Account & Consent
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close sign in dialog"
              onPress={() => setIsAuthModalOpen(false)}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: isDark ? '#272729' : Colors.canvasParchment },
                pressed && styles.pressed,
              ]}
            >
              <AppIcon
                name="close"
                size={16}
                color={isDark ? '#ffffff' : Colors.ink}
              />
            </Pressable>
          </View>

          <Text
            style={[
              styles.body,
              { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
            ]}
          >
            Sign in with Google via Firebase Authentication to synchronize your trusted emergency
            contacts, SafeCircle groups, and safety reports across devices.
          </Text>

          {/* Privacy & Consent Guarantee Box */}
          <View
            style={[
              styles.consentBox,
              {
                backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                borderColor: isDark ? '#38383a' : Colors.hairline,
              },
            ]}
          >
            <Text
              style={[
                styles.consentTitle,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              Privacy & Data Guarantees
            </Text>
            <Text style={styles.consentItem}>
              · Location is never collected or shared silently without explicit consent.
            </Text>
            <Text style={styles.consentItem}>
              · Background route monitoring runs exclusively during active SafeWalk sessions.
            </Text>
            <Text style={styles.consentItem}>
              · Public safety posts display coarse area names only—never exact coordinates.
            </Text>
          </View>

          {/* Action Blue Primary Pill CTA */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google Sign-In"
            disabled={authBusy}
            onPress={signInGoogle}
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
              authBusy && { opacity: 0.6 },
            ]}
          >
            <AppIcon name="lock" size={15} color="#ffffff" />
            <Text style={styles.primaryBtnText}>
              {authBusy ? 'Connecting to Firebase...' : 'Continue with Google'}
            </Text>
          </Pressable>

          {/* Secondary Ghost Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue in Demo Mode"
            onPress={() => setIsAuthModalOpen(false)}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.secondaryBtnText}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    borderRadius: BorderRadius.xl, // 24px (Apple Sheet)
    borderWidth: 1,
    padding: 24,
    gap: 16,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
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
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.231,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.374,
  },
  consentBox: {
    padding: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  consentTitle: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  consentItem: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 12,
    lineHeight: 18,
    color: Colors.inkMuted48,
  },
  primaryBtn: {
    backgroundColor: Colors.primary, // Action Blue #0066cc
    height: 44,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  primaryBtnText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  secondaryBtn: {
    height: 44,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.inkMuted80,
  },
});
