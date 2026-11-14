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

export const ProfileScreen: React.FC = () => {
  const {
    theme,
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
      style={[styles.screen, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Account Identity Header Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.profileTop}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.accentViolet }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nameTitle, { color: theme.colors.textPrimary }]}>
              {user.displayName}
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
              {user.email} · {user.isAuthenticated ? 'Signed in (Firebase)' : 'Local Demo Mode'} ·
              Cloud: {firebaseStatus}
            </Text>
          </View>
          {user.isAuthenticated ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign Out"
              onPress={signOut}
              style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
            >
              <Text style={[styles.outlineText, { color: theme.colors.textPrimary }]}>Logout</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign In with Google"
              onPress={() => setIsAuthModalOpen(true)}
              style={[styles.primarySmallBtn, { backgroundColor: theme.colors.accentViolet }]}
            >
              <Text style={styles.primarySmallText}>Sign In</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.editGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Display Name</Text>
          <TextInput
            accessibilityLabel="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />
          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Phone Number</Text>
          <TextInput
            accessibilityLabel="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save Profile and Preferences"
            onPress={() => saveProfile(displayName, phone, consents)}
            style={[styles.primaryBtn, { backgroundColor: theme.colors.navyPrimary }]}
          >
            <Text style={[styles.primaryBtnText, { color: theme.colors.navyText }]}>
              Save Profile & Privacy Preferences
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Quick Shortcuts: Contacts & SafeCircle */}
      <View style={styles.shortcutGrid}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage Emergency Contacts"
          onPress={() => setActiveTab('sos')}
          style={[
            styles.shortcutCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <AppIcon name="phone" size={18} color={theme.colors.dangerRed} />
          <Text style={[styles.shortcutTitle, { color: theme.colors.textPrimary }]}>
            Emergency Contacts
          </Text>
          <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
            {contacts.length} configured
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Manage SafeCircle Groups"
          onPress={() => {
            setConnectSubTab('safecircle');
            setActiveTab('connect');
          }}
          style={[
            styles.shortcutCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <AppIcon name="connect" size={18} color={theme.colors.accentViolet} />
          <Text style={[styles.shortcutTitle, { color: theme.colors.textPrimary }]}>
            SafeCircle Groups
          </Text>
          <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
            {safeCircles.length} circle active
          </Text>
        </Pressable>
      </View>

      {/* Privacy, Location, Notifications & App Settings */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Privacy, Permissions & Security
        </Text>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
              Foreground Location Access
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
              Used only when viewing nearby zones, routes, or triggering SOS.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Foreground location consent"
            value={consents.locationConsent}
            onValueChange={(v) => setConsents((c) => ({ ...c, locationConsent: v }))}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
              Background Route Monitoring Consent
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
              Explicit OS disclosure: tracks location only while an active journey is running.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Background route tracking consent"
            value={consents.backgroundTrackingConsent}
            onValueChange={(v) => setConsents((c) => ({ ...c, backgroundTrackingConsent: v }))}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
              Safety & Deviation Alerts
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
              Notify on route deviation or SafeCircle check-ins.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Safety notification consent"
            value={consents.notificationConsent}
            onValueChange={(v) => setConsents((c) => ({ ...c, notificationConsent: v }))}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
            SOS Countdown Delay
          </Text>
          <View style={styles.countdownChoices}>
            {[3, 5, 10].map((sec) => {
              const active = consents.sosCountdownSeconds === sec;
              return (
                <Pressable
                  key={sec}
                  accessibilityRole="button"
                  accessibilityLabel={`Set SOS countdown to ${sec} seconds`}
                  onPress={() => setConsents((c) => ({ ...c, sosCountdownSeconds: sec }))}
                  style={[
                    styles.choiceBtn,
                    {
                      backgroundColor: active ? theme.colors.accentViolet : theme.colors.surfaceAlt,
                      borderColor: active ? theme.colors.accentViolet : theme.colors.border,
                    },
                  ]}
                >
                  <Text style={{ color: active ? '#FFFFFF' : theme.colors.textPrimary, fontWeight: '700', fontSize: 12 }}>
                    {sec}s
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
            Appearance ({themeMode === 'light' ? 'Light' : 'Dark'})
          </Text>
          <Switch
            accessibilityLabel="Toggle dark theme"
            value={themeMode === 'dark'}
            onValueChange={toggleTheme}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
            Language ({language === 'en' ? 'English' : 'हिन्दी'})
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Switch app language"
            onPress={() => setLanguage(language === 'en' ? 'hi' : 'en')}
            style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
          >
            <Text style={[styles.outlineText, { color: theme.colors.textPrimary }]}>
              {language === 'en' ? 'Switch to हिन्दी' : 'Switch to English'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* RAHAT Wearables Companion (Smartwatch & Safety Locket Prototype) */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.wearableHeader}>
          <AppIcon name="watch" size={18} color={theme.colors.accentViolet} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              RAHAT Wearables Ecosystem (Planned Prototype)
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
              Simulated companion state for the upcoming open-hardware Rahat Smartwatch & Safety
              Locket.
            </Text>
          </View>
        </View>

        {wearables.map((device) => (
          <View
            key={device.id}
            style={[
              styles.wearableRow,
              { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                {device.name}
              </Text>
              <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                {device.firmwareLabel} · Battery {device.batteryPercent}% ·{' '}
                {device.connectionStatus === 'prototype_paired' ? 'Prototype Paired' : 'Standby'}
              </Text>
            </View>
            <View style={styles.wearableBtns}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Toggle pairing for ${device.name}`}
                onPress={() => toggleWearableConnection(device.id)}
                style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.outlineText, { color: theme.colors.textPrimary }]}>
                  {device.connectionStatus === 'prototype_paired' ? 'Standby' : 'Pair Demo'}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Simulate discreet SOS trigger from ${device.name}`}
                onPress={() => triggerWearableSosTest(device.name)}
                style={[styles.primarySmallBtn, { backgroundColor: theme.colors.dangerRed }]}
              >
                <Text style={styles.primarySmallText}>Test Trigger</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* About RAHAT, Help, Terms & Account Deletion */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          About RAHAT · राहत
        </Text>
        <Text style={[styles.missionBody, { color: theme.colors.textSecondary }]}>
          RAHAT is a community-first, open-source women's safety initiative built on one fundamental belief:
          no one should have to live in fear just to move freely. Unity is bigger than any system,
          and freedom should never need permission.
        </Text>
        <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
          Terms & Privacy: Your personal data is never sold. Location is shared only with explicit
          consent. Emergency dialers (112 / 1091) connect directly to official public services.
        </Text>

        {!confirmDeleteOpen ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete Account"
            onPress={() => setConfirmDeleteOpen(true)}
            style={[styles.deleteTrigger, { borderColor: theme.colors.dangerBorder }]}
          >
            <AppIcon name="trash" size={16} color={theme.colors.dangerRed} />
            <Text style={[styles.deleteText, { color: theme.colors.dangerRed }]}>
              Delete Account & Clear Personal Data
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              styles.confirmBox,
              { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder },
            ]}
          >
            <Text style={[styles.confirmTitle, { color: theme.colors.dangerRed }]}>
              Confirm permanent account deletion?
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textSecondary }]}>
              This removes your private profile and emergency contacts from Firestore.
            </Text>
            <View style={styles.confirmRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Confirm Delete Account"
                onPress={async () => {
                  await deleteAccount();
                  setConfirmDeleteOpen(false);
                }}
                style={[styles.primarySmallBtn, { backgroundColor: theme.colors.dangerRed }]}
              >
                <Text style={styles.primarySmallText}>Confirm Delete</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel Delete Account"
                onPress={() => setConfirmDeleteOpen(false)}
                style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
              >
                <Text style={[styles.outlineText, { color: theme.colors.textPrimary }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 36, maxWidth: 920, width: '100%', alignSelf: 'center' },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  profileTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  nameTitle: { fontSize: 16, fontWeight: '700' },
  metaLine: { fontSize: 12, lineHeight: 18 },
  editGroup: { gap: 8, marginTop: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  primaryBtn: { minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  primaryBtnText: { fontSize: 14, fontWeight: '700' },
  primarySmallBtn: { minHeight: 38, paddingHorizontal: 12, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  primarySmallText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  outlineBtn: { minHeight: 38, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  outlineText: { fontSize: 12, fontWeight: '600' },
  shortcutGrid: { flexDirection: 'row', gap: 12 },
  shortcutCard: { flex: 1, padding: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  shortcutTitle: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 4 },
  settingTitle: { fontSize: 14, fontWeight: '600' },
  countdownChoices: { flexDirection: 'row', gap: 6 },
  choiceBtn: { minWidth: 40, minHeight: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  wearableHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  wearableRow: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  wearableBtns: { flexDirection: 'row', gap: 8 },
  missionBody: { fontSize: 13, lineHeight: 20 },
  deleteTrigger: { minHeight: 44, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 },
  deleteText: { fontSize: 13, fontWeight: '700' },
  confirmBox: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 8 },
  confirmTitle: { fontSize: 14, fontWeight: '700' },
  confirmRow: { flexDirection: 'row', gap: 8 },
});
