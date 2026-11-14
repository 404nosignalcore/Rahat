import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeWalk } from '../context/SafeWalkContext';
import { buildEmergencySmsText, buildMapShareUrl } from '../services/alertService';
import { validateEmergencyContactInput } from '../utils/validation';
import { AppIcon } from '../components/ui/AppIcon';

export const SosScreen: React.FC = () => {
  const {
    theme,
    currentLocation,
    contacts,
    addOrUpdateContact,
    removeContact,
    verifyContact,
    sosCountdownRemaining,
    activeSosAlert,
    beginSosCountdown,
    cancelSosCountdown,
    triggerSosImmediately,
    resolveSosAlert,
  } = useSafeWalk();

  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);

  const liveMapUrl = buildMapShareUrl(currentLocation.lat, currentLocation.lng);

  const handleAddContact = async () => {
    setContactError(null);
    const check = validateEmergencyContactInput({
      name: newName,
      relationship: newRelation,
      phone: newPhone,
    });
    if (!check.valid) {
      setContactError(check.error || 'Invalid contact details.');
      return;
    }

    const res = await addOrUpdateContact({
      id: `cnt-${Date.now()}`,
      name: newName.trim(),
      relationship: newRelation.trim(),
      phone: newPhone.trim(),
      verificationStatus: 'unverified',
      notifyOnSOS: true,
    });

    if (!res.ok) {
      setContactError(res.error || 'Could not save contact.');
      return;
    }

    setNewName('');
    setNewRelation('');
    setNewPhone('');
  };

  const handleToggleNotify = async (contactId: string) => {
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    await addOrUpdateContact({
      id: target.id,
      name: target.name,
      relationship: target.relationship,
      phone: target.phone,
      verificationStatus: target.verificationStatus,
      notifyOnSOS: !target.notifyOnSOS,
    });
  };

  const openSmsFallback = () => {
    const body = encodeURIComponent(
      buildEmergencySmsText(currentLocation.lat, currentLocation.lng, new Date().toISOString())
    );
    const recipients = contacts
      .filter((c) => c.notifyOnSOS)
      .map((c) => c.phone.replace(/\s+/g, ''))
      .join(',');
    Linking.openURL(`sms:${recipients}?body=${body}`);
  };

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Honest Emergency Boundary Disclosure */}
      <View
        style={[
          styles.disclosureBox,
          { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.disclosureText, { color: theme.colors.textSecondary }]}>
          Rahat assists you in contacting trusted people and calling official emergency numbers
          (112 / 1091). It does not replace official police or ambulance dispatch systems.
        </Text>
      </View>

      {/* Main SOS Trigger / Countdown / Active Status Card */}
      <View
        style={[
          styles.sosCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor:
              sosCountdownRemaining !== null || activeSosAlert
                ? theme.colors.dangerRed
                : theme.colors.border,
          },
        ]}
      >
        {sosCountdownRemaining !== null ? (
          <View style={styles.centerBlock}>
            <Text style={[styles.countdownNumber, { color: theme.colors.dangerRed }]}>
              {sosCountdownRemaining}s
            </Text>
            <Text style={[styles.sosHeading, { color: theme.colors.textPrimary }]}>
              Preparing Emergency Alert...
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textSecondary }]}>
              Tap Cancel if this was an accidental press.
            </Text>
            <View style={styles.sosBtnRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cancel SOS Countdown"
                onPress={cancelSosCountdown}
                style={[styles.cancelBtn, { backgroundColor: theme.colors.safeGreen }]}
              >
                <Text style={styles.btnTextWhite}>Cancel — I'm Safe</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send SOS Alert Immediately"
                onPress={triggerSosImmediately}
                style={[styles.triggerNowBtn, { backgroundColor: theme.colors.dangerRed }]}
              >
                <Text style={styles.btnTextWhite}>Send Now</Text>
              </Pressable>
            </View>
          </View>
        ) : activeSosAlert ? (
          <View style={styles.activeBlock}>
            <View style={styles.activeTop}>
              <AppIcon name="sos" size={24} color={theme.colors.dangerRed} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sosHeading, { color: theme.colors.dangerRed }]}>
                  SOS Alert Active
                </Text>
                <Text style={[styles.metaLine, { color: theme.colors.textSecondary }]}>
                  Triggered at {new Date(activeSosAlert.triggeredAt).toLocaleTimeString()} · Delivery:{' '}
                  {activeSosAlert.deliveryChannelStatus === 'offline_fallback'
                    ? 'Offline / SMS Gateway Unconfigured — Use Direct SMS & Call below'
                    : activeSosAlert.deliveryChannelStatus}
                </Text>
              </View>
            </View>

            {/* Real Per-Contact Status Tracking */}
            <View style={styles.deliveryList}>
              {activeSosAlert.contactDeliveries.map((d) => (
                <View
                  key={d.contactId}
                  style={[
                    styles.deliveryRow,
                    { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
                  ]}
                >
                  <Text style={[styles.deliveryName, { color: theme.colors.textPrimary }]}>
                    {d.contactName} ({d.phone})
                  </Text>
                  <Text
                    style={[
                      styles.deliveryStatus,
                      {
                        color:
                          d.status === 'sent'
                            ? theme.colors.safeGreen
                            : d.status === 'failed'
                            ? theme.colors.dangerRed
                            : theme.colors.cautionAmber,
                      },
                    ]}
                  >
                    {d.status.toUpperCase()} · {d.detail}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.sosBtnRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open phone SMS app with emergency location"
                onPress={openSmsFallback}
                style={[styles.triggerNowBtn, { backgroundColor: theme.colors.navyPrimary }]}
              >
                <Text style={styles.btnTextWhite}>Send via Phone SMS</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resolve SOS Alert"
                onPress={resolveSosAlert}
                style={[styles.cancelBtn, { backgroundColor: theme.colors.safeGreen }]}
              >
                <Text style={styles.btnTextWhite}>Mark Resolved</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.centerBlock}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Activate Emergency SOS"
              onPress={beginSosCountdown}
              style={[styles.giantSosBtn, { backgroundColor: theme.colors.dangerRed }]}
            >
              <AppIcon name="sos" size={32} color="#FFFFFF" />
              <Text style={styles.giantSosText}>ACTIVATE SOS</Text>
              <Text style={styles.giantSosSub}>Starts confirmation countdown</Text>
            </Pressable>

            <Text style={[styles.metaLine, { color: theme.colors.textMuted, textAlign: 'center' }]}>
              Latest Coordinates: {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)} ·{' '}
              Source: {currentLocation.source === 'gps' ? 'Device GPS' : 'Demo Coordinates'}
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open shareable location map link"
              onPress={() => Linking.openURL(liveMapUrl)}
              style={[styles.linkBtn, { borderColor: theme.colors.border }]}
            >
              <AppIcon name="external" size={14} color={theme.colors.accentViolet} />
              <Text style={[styles.linkBtnText, { color: theme.colors.accentViolet }]}>
                Preview Map Link ({liveMapUrl})
              </Text>
            </Pressable>
          </View>
        )}

        {/* Official Emergency Dialers */}
        <View style={[styles.dialRow, { borderTopColor: theme.colors.border }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call National Emergency 112"
            onPress={() => Linking.openURL('tel:112')}
            style={[styles.dialBtn, { backgroundColor: theme.colors.dangerBg, borderColor: theme.colors.dangerBorder }]}
          >
            <AppIcon name="phone" size={16} color={theme.colors.dangerRed} />
            <Text style={[styles.dialText, { color: theme.colors.dangerRed }]}>Call 112 (Emergency)</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Call Women Helpline 1091"
            onPress={() => Linking.openURL('tel:1091')}
            style={[styles.dialBtn, { backgroundColor: theme.colors.accentVioletSoft, borderColor: theme.colors.accentViolet }]}
          >
            <AppIcon name="phone" size={16} color={theme.colors.accentViolet} />
            <Text style={[styles.dialText, { color: theme.colors.accentViolet }]}>Call 1091 (Women Desk)</Text>
          </Pressable>
        </View>
      </View>

      {/* Trusted Emergency Contacts CRUD */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Trusted Emergency Contacts ({contacts.length})
        </Text>

        {contacts.map((contact) => (
          <View
            key={contact.id}
            style={[
              styles.contactRow,
              { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
            ]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.contactName, { color: theme.colors.textPrimary }]}>
                {contact.name}
              </Text>
              <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                {contact.relationship} · {contact.phone} ·{' '}
                <Text
                  style={{
                    color:
                      contact.verificationStatus === 'verified'
                        ? theme.colors.safeGreen
                        : theme.colors.cautionAmber,
                    fontWeight: '700',
                  }}
                >
                  {contact.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}
                </Text>
              </Text>
            </View>

            <View style={styles.contactControls}>
              {contact.verificationStatus !== 'verified' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Verify contact ${contact.name}`}
                  onPress={() => verifyContact(contact.id)}
                  style={[styles.smallBtn, { borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.smallBtnText, { color: theme.colors.safeGreen }]}>Verify</Text>
                </Pressable>
              )}

              <Switch
                accessibilityLabel={`Notify ${contact.name} on SOS`}
                value={contact.notifyOnSOS}
                onValueChange={() => handleToggleNotify(contact.id)}
              />

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Delete contact ${contact.name}`}
                onPress={() => removeContact(contact.id)}
                style={styles.deleteBtn}
              >
                <AppIcon name="trash" size={16} color={theme.colors.dangerRed} />
              </Pressable>
            </View>
          </View>
        ))}

        {/* Add New Contact Form */}
        <View style={[styles.addForm, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.subHeading, { color: theme.colors.textPrimary }]}>
            Add Trusted Contact
          </Text>
          <View style={styles.addInputs}>
            <TextInput
              accessibilityLabel="Contact full name"
              placeholder="Name (e.g. Meera Verma)"
              placeholderTextColor={theme.colors.textMuted}
              value={newName}
              onChangeText={setNewName}
              style={[
                styles.input,
                { backgroundColor: theme.colors.bg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
              ]}
            />
            <TextInput
              accessibilityLabel="Relationship"
              placeholder="Relationship (e.g. Sister)"
              placeholderTextColor={theme.colors.textMuted}
              value={newRelation}
              onChangeText={setNewRelation}
              style={[
                styles.input,
                { backgroundColor: theme.colors.bg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
              ]}
            />
            <TextInput
              accessibilityLabel="Contact phone number"
              placeholder="Phone (+91 ...)"
              placeholderTextColor={theme.colors.textMuted}
              value={newPhone}
              onChangeText={setNewPhone}
              keyboardType="phone-pad"
              style={[
                styles.input,
                { backgroundColor: theme.colors.bg, borderColor: theme.colors.border, color: theme.colors.textPrimary },
              ]}
            />
          </View>
          {contactError && (
            <Text style={[styles.errorText, { color: theme.colors.dangerRed }]}>{contactError}</Text>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Save Trusted Contact"
            onPress={handleAddContact}
            style={[styles.saveBtn, { backgroundColor: theme.colors.navyPrimary }]}
          >
            <AppIcon name="plus" size={16} color={theme.colors.navyText} />
            <Text style={[styles.saveBtnText, { color: theme.colors.navyText }]}>
              Save Trusted Contact
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 36, maxWidth: 920, width: '100%', alignSelf: 'center' },
  disclosureBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
  disclosureText: { fontSize: 12, lineHeight: 18 },
  sosCard: { padding: 18, borderRadius: 16, borderWidth: 1.5, gap: 16 },
  centerBlock: { alignItems: 'center', gap: 12 },
  giantSosBtn: {
    width: '100%',
    maxWidth: 320,
    minHeight: 112,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 16,
  },
  giantSosText: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  giantSosSub: { color: '#FEE2E2', fontSize: 12, fontWeight: '600' },
  countdownNumber: { fontSize: 48, fontWeight: '800' },
  sosHeading: { fontSize: 18, fontWeight: '800' },
  sosBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  cancelBtn: { minHeight: 44, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  triggerNowBtn: { minHeight: 44, paddingHorizontal: 18, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  btnTextWhite: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  activeBlock: { gap: 12 },
  activeTop: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  deliveryList: { gap: 8 },
  deliveryRow: { padding: 10, borderRadius: 10, borderWidth: 1, gap: 2 },
  deliveryName: { fontSize: 13, fontWeight: '700' },
  deliveryStatus: { fontSize: 12, fontWeight: '600' },
  linkBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkBtnText: { fontSize: 12, fontWeight: '600' },
  dialRow: { borderTopWidth: 1, paddingTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  dialBtn: { flex: 1, minWidth: 150, minHeight: 44, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  dialText: { fontSize: 13, fontWeight: '700' },
  card: { padding: 16, borderRadius: 14, borderWidth: 1, gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  contactRow: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  contactName: { fontSize: 14, fontWeight: '700' },
  metaLine: { fontSize: 12, lineHeight: 18 },
  contactControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallBtn: { minHeight: 34, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, justifyContent: 'center' },
  smallBtnText: { fontSize: 12, fontWeight: '700' },
  deleteBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  addForm: { borderTopWidth: 1, paddingTop: 12, gap: 10 },
  subHeading: { fontSize: 14, fontWeight: '700' },
  addInputs: { gap: 8 },
  input: { minHeight: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  errorText: { fontSize: 12, fontWeight: '600' },
  saveBtn: { minHeight: 44, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnText: { fontSize: 14, fontWeight: '700' },
});
