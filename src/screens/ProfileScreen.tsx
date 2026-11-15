import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeWalk } from '../context/SafeWalkContext';
import { AppIcon } from '../components/ui/AppIcon';
import {
  Colors,
  BorderRadius,
  TypographyStyles,
  Spacing,
} from '../theme';
import { Badge } from '../components/common/Badge';

export const ProfileScreen: React.FC = () => {
  const {
    themeMode,
    toggleTheme,
    language,
    setLanguage,
    user,
    firebaseStatus,
    setIsAuthModalOpen,
    signOut,
    saveProfile,
    deleteAccount,
    setActiveTab,
    setConnectSubTab,
    contacts,
    safeCircles,
    wearables,
    toggleWearableConnection,
    triggerWearableSosTest,
  } = useSafeWalk();

  const isDark = themeMode === 'dark';

  const [displayName, setDisplayName] = useState(user.displayName);
  const [phone, setPhone] = useState(user.phone);
  const [consents, setConsents] = useState(user.consents);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const initials = (user.displayName || 'SW')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#000000' : Colors.canvasParchment },
      ]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* SECTION 1: Museum Hero Identity Tile ({component.product-tile-light}) */}
      <View
        style={[
          styles.heroTile,
          {
            backgroundColor: isDark ? '#161617' : Colors.canvas,
            borderBottomColor: isDark ? '#272729' : Colors.hairline,
          },
        ]}
      >
        <View style={styles.heroContent}>
          {/* Avatar Ring */}
          <View style={styles.avatarRing}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text
            style={[
              styles.userNameHeadline,
              { color: isDark ? '#ffffff' : Colors.ink },
            ]}
          >
            {user.displayName}
          </Text>

          <Text style={styles.userMeta}>
            {user.email} ·{' '}
            {user.isAuthenticated ? 'Authenticated via Google' : 'Local Demo Profile'}
          </Text>

          <View style={styles.statusBadgeRow}>
            <Badge
              label={firebaseStatus === 'online' ? 'Cloud Synced' : 'Offline / Local'}
              type={firebaseStatus === 'online' ? 'safe' : 'caution'}
            />
          </View>

          {/* Sign In or Sign Out Action */}
          <View style={styles.heroActions}>
            {user.isAuthenticated ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign Out"
                onPress={signOut}
                style={({ pressed }) => [
                  styles.pearlCapsuleBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.pearlCapsuleText}>Sign Out of Google</Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign In with Google"
                onPress={() => setIsAuthModalOpen(true)}
                style={({ pressed }) => [
                  styles.primaryPillBtn,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon name="lock" size={14} color="#ffffff" />
                <Text style={styles.primaryPillText}>Sign In with Google</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* SECTION 2: Profile Settings & Preferences */}
      <View style={styles.settingsSection}>
        <View style={styles.settingsInner}>
          {/* Account Profile Card ({component.store-utility-card}) */}
          <View
            style={[
              styles.utilityCard,
              {
                backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                borderColor: isDark ? '#272729' : Colors.hairline,
              },
            ]}
          >
            <Text
              style={[
                styles.cardHeadline,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              Personal Identity & Contact
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.fieldLabel}>Display Name</Text>
              <TextInput
                accessibilityLabel="Display Name"
                value={displayName}
                onChangeText={setDisplayName}
                style={[
                  styles.pillInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />

              <Text style={styles.fieldLabel}>Phone Number</Text>
              <TextInput
                accessibilityLabel="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[
                  styles.pillInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save Profile Preferences"
                onPress={() => saveProfile(displayName, phone, consents)}
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Nav Shortcuts */}
          <View style={styles.shortcutRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setActiveTab('sos')}
              style={({ pressed }) => [
                styles.shortcutCard,
                {
                  backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                  borderColor: isDark ? '#272729' : Colors.hairline,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="phone" size={20} color={Colors.red} />
              <View>
                <Text
                  style={[
                    styles.shortcutTitle,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  Emergency Contacts
                </Text>
                <Text style={styles.shortcutSub}>{contacts.length} configured</Text>
              </View>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setConnectSubTab('safecircle');
                setActiveTab('connect');
              }}
              style={({ pressed }) => [
                styles.shortcutCard,
                {
                  backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                  borderColor: isDark ? '#272729' : Colors.hairline,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="connect" size={20} color={Colors.primary} />
              <View>
                <Text
                  style={[
                    styles.shortcutTitle,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  SafeCircle Groups
                </Text>
                <Text style={styles.shortcutSub}>{safeCircles.length} active circle</Text>
              </View>
            </Pressable>
          </View>

          {/* Privacy & Consents Group ({component.store-utility-card}) */}
          <View
            style={[
              styles.utilityCard,
              {
                backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                borderColor: isDark ? '#272729' : Colors.hairline,
              },
            ]}
          >
            <Text
              style={[
                styles.cardHeadline,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              Privacy & Consent Controls
            </Text>

            <View style={styles.settingRows}>
              <View style={styles.settingItem}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: isDark ? '#ffffff' : Colors.ink },
                    ]}
                  >
                    Foreground Location Access
                  </Text>
                  <Text style={styles.settingDesc}>
                    Required for live zone queries, route safety comparison, and emergency broadcast.
                  </Text>
                </View>
                <Switch
                  value={consents.locationConsent}
                  onValueChange={(v) => setConsents((c) => ({ ...c, locationConsent: v }))}
                  thumbColor="#ffffff"
                  trackColor={{ false: '#38383a', true: Colors.green }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: isDark ? '#ffffff' : Colors.ink },
                    ]}
                  >
                    Background Route Monitoring
                  </Text>
                  <Text style={styles.settingDesc}>
                    Runs ONLY while an active SafeWalk route is running. Automatically ceases on walk completion.
                  </Text>
                </View>
                <Switch
                  value={consents.backgroundTrackingConsent}
                  onValueChange={(v) =>
                    setConsents((c) => ({ ...c, backgroundTrackingConsent: v }))
                  }
                  thumbColor="#ffffff"
                  trackColor={{ false: '#38383a', true: Colors.green }}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: isDark ? '#ffffff' : Colors.ink },
                    ]}
                  >
                    Deviation & Check-in Notifications
                  </Text>
                  <Text style={styles.settingDesc}>
                    Alerts on route deviation or SafeCircle arrival confirmations.
                  </Text>
                </View>
                <Switch
                  value={consents.notificationConsent}
                  onValueChange={(v) => setConsents((c) => ({ ...c, notificationConsent: v }))}
                  thumbColor="#ffffff"
                  trackColor={{ false: '#38383a', true: Colors.green }}
                />
              </View>

              {/* SOS Countdown Choice */}
              <View style={styles.settingItem}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: isDark ? '#ffffff' : Colors.ink },
                    ]}
                  >
                    SOS Countdown Duration
                  </Text>
                  <Text style={styles.settingDesc}>
                    Buffer period before emergency alerts dispatch.
                  </Text>
                </View>
                <View style={styles.choicesRow}>
                  {[3, 5, 10].map((sec) => {
                    const isSelected = consents.sosCountdownSeconds === sec;
                    return (
                      <Pressable
                        key={sec}
                        onPress={() => setConsents((c) => ({ ...c, sosCountdownSeconds: sec }))}
                        style={[
                          styles.secChoicePill,
                          isSelected && styles.secChoicePillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.secChoiceText,
                            isSelected && styles.secChoiceTextActive,
                          ]}
                        >
                          {sec}s
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Appearance Mode */}
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: isDark ? '#ffffff' : Colors.ink },
                    ]}
                  >
                    Appearance ({themeMode === 'light' ? 'Light Parchment' : 'Dark OLED'})
                  </Text>
                </View>
                <Switch
                  value={themeMode === 'dark'}
                  onValueChange={toggleTheme}
                  thumbColor="#ffffff"
                  trackColor={{ false: '#38383a', true: Colors.primary }}
                />
              </View>

              {/* Language Switch */}
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.settingTitle,
                      { color: isDark ? '#ffffff' : Colors.ink },
                    ]}
                  >
                    Interface Language ({language === 'en' ? 'English' : 'हिन्दी'})
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                  style={({ pressed }) => [
                    styles.langSwitchBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.langSwitchText}>
                    {language === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* RAHAT Wearables Ecosystem */}
          <View
            style={[
              styles.utilityCard,
              {
                backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                borderColor: isDark ? '#272729' : Colors.hairline,
              },
            ]}
          >
            <View style={styles.wearableHeader}>
              <AppIcon name="watch" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cardHeadline,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  RAHAT Hardware & Wearables
                </Text>
                <Text style={styles.cardMeta}>
                  Discreet BLE panic button and smartwatch companion prototype.
                </Text>
              </View>
            </View>

            <View style={styles.wearableList}>
              {wearables.map((device) => (
                <View
                  key={device.id}
                  style={[
                    styles.wearableItem,
                    {
                      backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                      borderColor: isDark ? '#38383a' : Colors.hairline,
                    },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={[
                        styles.settingTitle,
                        { color: isDark ? '#ffffff' : Colors.ink },
                      ]}
                    >
                      {device.name}
                    </Text>
                    <Text style={styles.settingDesc}>
                      {device.firmwareLabel} · Battery {device.batteryPercent}% ·{' '}
                      {device.connectionStatus === 'prototype_paired'
                        ? 'Paired & Armed'
                        : 'Standby'}
                    </Text>
                  </View>

                  <View style={styles.wearableActionRow}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => toggleWearableConnection(device.id)}
                      style={({ pressed }) => [
                        styles.devicePairBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.devicePairText}>
                        {device.connectionStatus === 'prototype_paired' ? 'Disconnect' : 'Pair'}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => triggerWearableSosTest(device.name)}
                      style={({ pressed }) => [
                        styles.deviceTestBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.deviceTestText}>Test Panic</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Account Deletion & Sovereignty */}
          <View
            style={[
              styles.utilityCard,
              {
                backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                borderColor: isDark ? '#272729' : Colors.hairline,
              },
            ]}
          >
            <Text
              style={[
                styles.cardHeadline,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              Data Privacy & Account Sovereignty
            </Text>
            <Text style={styles.missionText}>
              RAHAT adheres to strict data minimalism: your private location tracks and contact records are never monetized, profiled, or traded.
            </Text>

            {!confirmDeleteOpen ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmDeleteOpen(true)}
                style={({ pressed }) => [
                  styles.deleteAccountBtn,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon name="trash" size={15} color={Colors.red} />
                <Text style={styles.deleteAccountText}>
                  Delete Account & Wipe Cloud Data
                </Text>
              </Pressable>
            ) : (
              <View style={styles.deleteConfirmBox}>
                <Text style={styles.deleteConfirmTitle}>
                  Permanently delete account and all data?
                </Text>
                <Text style={styles.deleteConfirmSub}>
                  This removes your profile, contacts, and personal reports from Firestore immediately.
                </Text>
                <View style={styles.deleteConfirmActions}>
                  <Pressable
                    accessibilityRole="button"
                    onPress={async () => {
                      await deleteAccount();
                      setConfirmDeleteOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.confirmDeletePill,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.confirmDeleteText}>Confirm Delete</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setConfirmDeleteOpen(false)}
                    style={({ pressed }) => [
                      styles.cancelDeletePill,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.cancelDeleteText}>Cancel</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },

  // Hero Identity Tile
  heroTile: {
    width: '100%',
    paddingVertical: 56,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  heroContent: {
    width: '100%',
    maxWidth: 720,
    alignItems: 'center',
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.primary, // Action Blue #0066cc
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  userNameHeadline: {
    fontFamily: TypographyStyles.displayMd.fontFamily,
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -0.374,
    marginBottom: 4,
    textAlign: 'center',
  },
  userMeta: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    color: Colors.inkMuted48,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusBadgeRow: {
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryPillBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
  },
  primaryPillText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  pearlCapsuleBtn: {
    backgroundColor: Colors.surfacePearl,
    borderWidth: 1,
    borderColor: Colors.hairline,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.pill,
  },
  pearlCapsuleText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.ink,
    fontWeight: '500',
  },

  // Settings Section
  settingsSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  settingsInner: {
    width: '100%',
    maxWidth: 820,
    gap: 20,
  },
  utilityCard: {
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 24, // 24px
    gap: 16,
  },
  cardHeadline: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 20,
    fontWeight: '600',
  },
  cardMeta: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  formGroup: {
    gap: 12,
  },
  fieldLabel: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkMuted80,
  },
  pillInput: {
    height: 44,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Shortcuts
  shortcutRow: {
    flexDirection: 'row',
    gap: 14,
  },
  shortcutCard: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shortcutTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  shortcutSub: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
  },

  // Setting Rows
  settingRows: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingVertical: 4,
  },
  settingTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
    lineHeight: 18,
  },
  choicesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  secChoicePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  secChoicePillActive: {
    backgroundColor: '#e8f2ff',
    borderColor: Colors.primary,
  },
  secChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
  },
  secChoiceTextActive: {
    color: Colors.primary,
  },
  langSwitchBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  langSwitchText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Wearables
  wearableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  wearableList: {
    gap: 10,
  },
  wearableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 12,
  },
  wearableActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  devicePairBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  devicePairText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.ink,
  },
  deviceTestBtn: {
    backgroundColor: Colors.red,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
  },
  deviceTestText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Deletion
  missionText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.inkMuted80,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.redBorder,
  },
  deleteAccountText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    color: Colors.red,
  },
  deleteConfirmBox: {
    backgroundColor: Colors.redLight,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    borderRadius: BorderRadius.md,
    padding: 16,
    gap: 8,
  },
  deleteConfirmTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.red,
  },
  deleteConfirmSub: {
    fontSize: 13,
    color: Colors.inkMuted80,
  },
  deleteConfirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  confirmDeletePill: {
    backgroundColor: Colors.red,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.pill,
  },
  confirmDeleteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelDeletePill: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  cancelDeleteText: {
    fontSize: 13,
    color: Colors.ink,
  },
});
