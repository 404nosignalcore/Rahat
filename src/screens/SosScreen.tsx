import React, { useState } from 'react';
import {
  Alert,
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
import {
  Colors,
  BorderRadius,
  TypographyStyles,
  Shadows,
  Spacing,
} from '../theme';
import { Badge } from '../components/common/Badge';
import { CommunitySosCard } from '../components/sos/CommunitySosCard';
import { VictimLiveRescueView } from '../components/sos/VictimLiveRescueView';
import { ResponderAlertModal } from '../components/sos/ResponderAlertModal';
import { ResponderDashboardModal } from '../components/sos/ResponderDashboardModal';

export const SosScreen: React.FC = () => {
  const {
    themeMode,
    currentLocation,
    refreshLocation,
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
    activeCommunitySos,
    incomingRescueAlert,
    activeResponderSession,
    triggerCommunitySos,
    cancelCommunitySos,
    resolveCommunitySosRequest,
    reportCommunityResponder,
    simulateIncomingRescueAlert,
    acceptRescueRequest,
    declineRescueRequest,
    startResponderTravel,
    markResponderArrived,
    cancelResponderHelp,
    dismissResponderSession,
  } = useSafeWalk();

  const isDark = themeMode === 'dark';

  const [newName, setNewName] = useState('');
  const [newRelation, setNewRelation] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [contactError, setContactError] = useState<string | null>(null);
  const [isRefreshingGps, setIsRefreshingGps] = useState(false);

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

  const handleRefreshGps = async () => {
    setIsRefreshingGps(true);
    try {
      const fix = await refreshLocation();
      if (fix.source === 'gps') {
        Alert.alert(
          'GPS Signal Locked',
          'Your device GPS has been acquired successfully. Emergency alerts will now transmit your accurate coordinates.'
        );
      } else {
        Alert.alert(
          'GPS Still Offline',
          'Could not acquire live GPS fix. Please ensure device Location / GPS is turned ON and permissions are granted.'
        );
      }
    } catch {
      Alert.alert('Location Error', 'Unable to query location service.');
    } finally {
      setIsRefreshingGps(false);
    }
  };

  const openSmsFallback = () => {
    const isFallback =
      currentLocation.source === 'fallback_demo' ||
      Boolean(activeSosAlert?.isFallbackLocation) ||
      activeSosAlert?.locationSource === 'fallback_demo';
    const body = encodeURIComponent(
      buildEmergencySmsText(
        currentLocation.lat,
        currentLocation.lng,
        new Date().toISOString(),
        isFallback ? 'fallback_demo' : 'gps'
      )
    );
    const recipients = contacts
      .filter((c) => c.notifyOnSOS)
      .map((c) => c.phone.replace(/\s+/g, ''))
      .join(',');
    Linking.openURL(`sms:${recipients}?body=${body}`);
  };

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#000000' : Colors.canvasParchment },
      ]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* SECTION 1: Museum Hero Tile ({component.product-tile-light}) */}
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
          {/* Statutory Boundary Pill */}
          <View style={styles.boundaryPill}>
            <AppIcon name="shield" size={13} color={Colors.primary} />
            <Text style={styles.boundaryPillText}>
              Statutory Boundary: Complements 112/1091 · Does not replace emergency dispatch
            </Text>
          </View>

          <Text
            style={[
              styles.heroHeadline,
              { color: isDark ? '#ffffff' : Colors.ink },
            ]}
          >
            Emergency Response Hub
          </Text>

          <Text
            style={[
              styles.heroLead,
              { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
            ]}
          >
            Instantaneous cryptographic alert broadcast to trusted contacts, live telemetry sharing, and direct official helpline dispatch.
          </Text>

          {/* Official Helplines Quick Row */}
          <View style={styles.dialerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call 112 National Emergency"
              onPress={() => Linking.openURL('tel:112')}
              style={({ pressed }) => [
                styles.dialerPill,
                styles.dialerEmergency,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="phone" size={14} color="#ffffff" />
              <Text style={styles.dialerEmergencyText}>Call 112 (National Emergency)</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call 1091 Women Helpline"
              onPress={() => Linking.openURL('tel:1091')}
              style={({ pressed }) => [
                styles.dialerPill,
                styles.dialerWomenDesk,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="phone" size={14} color={Colors.primary} />
              <Text style={styles.dialerWomenDeskText}>Call 1091 (Women Desk)</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* SECTION 2: Centerpiece SOS Surface */}
      <View style={styles.centerSection}>
        <View style={styles.centerInner}>
          {/* Monumental Red "ACTIVATE SOS" Button Card (Placed Prominently at the Top) */}
          <View
            style={[
              styles.sosTriggerCard,
              {
                backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                borderColor:
                  sosCountdownRemaining !== null || activeSosAlert
                    ? Colors.red
                    : isDark
                    ? '#272729'
                    : Colors.hairline,
                marginBottom: 24,
              },
            ]}
          >
            {sosCountdownRemaining !== null ? (
              /* Countdown State */
              <View style={styles.stateCenterBlock}>
                <View style={styles.countdownBadge}>
                  <Text style={styles.countdownNumber}>{sosCountdownRemaining}</Text>
                  <Text style={styles.countdownUnit}>sec</Text>
                </View>

                <Text
                  style={[
                    styles.stateHeadline,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  Initiating Emergency Broadcast
                </Text>
                <Text style={styles.stateLead}>
                  Alert will dispatch in {sosCountdownRemaining} seconds. Tap Cancel if pressed accidentally.
                </Text>

                <View style={styles.stateBtnRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel SOS Countdown"
                    onPress={cancelSosCountdown}
                    style={({ pressed }) => [
                      styles.cancelPillBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.cancelPillText}>Cancel — I'm Safe</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send SOS Alert Now"
                    onPress={() => triggerSosImmediately()}
                    style={({ pressed }) => [
                      styles.sendNowPillBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.sendNowPillText}>Send Immediately</Text>
                  </Pressable>
                </View>
              </View>
            ) : activeSosAlert ? (
              /* Active SOS Alert State */
              <View style={styles.activeAlertBlock}>
                <View style={styles.activeHeaderRow}>
                  <View style={styles.activePulseIndicator} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.activeAlertTitle}>
                      SOS Broadcast Active
                    </Text>
                    <Text style={styles.activeAlertMeta}>
                      Triggered at {new Date(activeSosAlert.triggeredAt).toLocaleTimeString()} · Delivery:{' '}
                      {activeSosAlert.deliveryChannelStatus === 'offline_fallback'
                        ? 'Offline SMS Fallback Active'
                        : activeSosAlert.deliveryChannelStatus}
                    </Text>
                  </View>
                </View>

                {/* Fallback Location Warning in Active Alert */}
                {(activeSosAlert.isFallbackLocation || activeSosAlert.locationSource === 'fallback_demo') && (
                  <View style={styles.activeAlertFallbackWarning}>
                    <AppIcon name="warning" size={16} color="#b45309" />
                    <Text style={styles.activeAlertFallbackText}>
                      CRITICAL: Alert sent with unverified demo coordinates (GPS offline). Please call contacts directly to share your actual location.
                    </Text>
                  </View>
                )}

                {/* Per-Contact Delivery Status Tracking */}
                <View style={styles.deliveryList}>
                  {activeSosAlert.contactDeliveries.map((d) => (
                    <View
                      key={d.contactId}
                      style={[
                        styles.deliveryItem,
                        {
                          backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                          borderColor: isDark ? '#38383a' : Colors.hairline,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.deliveryName,
                          { color: isDark ? '#ffffff' : Colors.ink },
                        ]}
                      >
                        {d.contactName} ({d.phone})
                      </Text>
                      <Badge
                        label={`${d.status.toUpperCase()} · ${d.detail}`}
                        type={
                          d.status === 'sent'
                            ? 'safe'
                            : d.status === 'failed'
                            ? 'danger'
                            : 'caution'
                        }
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.activeActionRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Send via Phone SMS"
                    onPress={openSmsFallback}
                    style={({ pressed }) => [
                      styles.smsFallbackPill,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppIcon name="phone" size={14} color="#ffffff" />
                    <Text style={styles.smsFallbackText}>Open Direct SMS</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Resolve SOS Alert"
                    onPress={resolveSosAlert}
                    style={({ pressed }) => [
                      styles.resolvePill,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.resolveText}>Mark Resolved</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              /* Idle Standby State with Monumental Red SOS Button */
              <View style={styles.idleBlock}>
                {/* Prominent High-Visibility GPS Offline Warning Card */}
                {currentLocation.source === 'fallback_demo' && (
                  <View style={styles.gpsWarningCard}>
                    <View style={styles.gpsWarningHeaderRow}>
                      <AppIcon name="warning" size={18} color="#b45309" />
                      <Text style={styles.gpsWarningTitle}>Live GPS Unavailable (Demo Mode)</Text>
                    </View>
                    <Text style={styles.gpsWarningDesc}>
                      Device is using simulated New Delhi coordinates ({currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}). SOS alerts and SMS links will NOT reflect your true location until GPS is acquired.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Grant Permission & Refresh GPS"
                      onPress={handleRefreshGps}
                      disabled={isRefreshingGps}
                      style={({ pressed }) => [
                        styles.gpsRetryButton,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppIcon name="refresh" size={14} color="#ffffff" />
                      <Text style={styles.gpsRetryButtonText}>
                        {isRefreshingGps ? 'Querying GPS Hardware...' : 'Grant Permissions & Acquire GPS'}
                      </Text>
                    </Pressable>
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Activate Emergency SOS"
                  onPress={() => beginSosCountdown()}
                  style={({ pressed }) => [
                    styles.giantSosButton,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppIcon name="sos" size={36} color="#ffffff" />
                  <Text style={styles.giantSosTitle}>ACTIVATE SOS</Text>
                  <Text style={styles.giantSosSubtitle}>
                    Tap to trigger 5-second cancelable broadcast
                  </Text>
                </Pressable>

                {/* Live Telemetry Info */}
                <View style={styles.telemetryInfoRow}>
                  <View
                    style={[
                      styles.liveCoordPill,
                      currentLocation.source === 'fallback_demo' && styles.liveCoordPillFallback,
                    ]}
                  >
                    <AppIcon
                      name={currentLocation.source === 'gps' ? 'pin' : 'warning'}
                      size={13}
                      color={currentLocation.source === 'gps' ? Colors.primary : '#b45309'}
                    />
                    <Text
                      style={[
                        styles.liveCoordText,
                        currentLocation.source === 'fallback_demo' && styles.liveCoordTextFallback,
                      ]}
                    >
                      {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)} ·{' '}
                      {currentLocation.source === 'gps' ? 'GPS Locked' : 'Demo Fallback (Unverified)'}
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Open shareable map link"
                    onPress={() => Linking.openURL(liveMapUrl)}
                    style={({ pressed }) => [
                      styles.mapShareBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppIcon name="external" size={13} color={Colors.primary} />
                    <Text style={styles.mapShareText}>Share Live Coordinates</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Community SOS Rescue Network (Placed Directly Below) */}
          {activeCommunitySos &&
          !activeCommunitySos.isCancelled &&
          activeCommunitySos.status !== 'resolved' ? (
            <View style={{ marginBottom: 24 }}>
              <VictimLiveRescueView
                request={activeCommunitySos}
                onCancelRequest={cancelCommunitySos}
                onResolveRequest={resolveCommunitySosRequest}
                onReportResponder={reportCommunityResponder}
                themeMode={themeMode}
              />
            </View>
          ) : (
            <View style={{ marginBottom: 24 }}>
              <CommunitySosCard
                onTriggerCommunitySos={(cat, desc) => {
                  triggerCommunitySos(cat, desc);
                }}
                onSimulateIncomingAlert={simulateIncomingRescueAlert}
                currentCoordinates={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                themeMode={themeMode}
              />
            </View>
          )}
        </View>
      </View>

      {/* SECTION 3: Dark Tile Section ({component.product-tile-dark} #272729) */}
      <View style={styles.darkTileSection}>
        <View style={styles.darkTileInner}>
          <Text style={styles.darkOverline}>TRUSTED NETWORK</Text>
          <Text style={styles.darkHeadline}>
            Trusted Emergency Contacts ({contacts.length})
          </Text>
          <Text style={styles.darkSub}>
            Contacts notified with your live coordinates and emergency broadcast upon SOS activation.
          </Text>

          {/* Contacts List Grid */}
          <View style={styles.contactsGrid}>
            {contacts.map((contact) => (
              <View
                key={contact.id}
                style={[
                  styles.contactCard,
                  { backgroundColor: Colors.surfaceTile2 },
                ]}
              >
                <View style={styles.contactCardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactMeta}>
                      {contact.relationship} · {contact.phone}
                    </Text>
                  </View>

                  <Badge
                    label={contact.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}
                    type={contact.verificationStatus === 'verified' ? 'safe' : 'caution'}
                  />
                </View>

                <View style={styles.contactControlRow}>
                  {contact.verificationStatus !== 'verified' && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => verifyContact(contact.id)}
                      style={({ pressed }) => [
                        styles.verifyBtn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.verifyBtnText}>Verify Number</Text>
                    </Pressable>
                  )}

                  <View style={styles.switchCluster}>
                    <Text style={styles.switchLabel}>Auto-Alert:</Text>
                    <Switch
                      accessibilityLabel={`Notify ${contact.name} on SOS`}
                      value={contact.notifyOnSOS}
                      onValueChange={() => handleToggleNotify(contact.id)}
                      thumbColor="#ffffff"
                      trackColor={{ false: '#38383a', true: Colors.green }}
                    />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove contact ${contact.name}`}
                    onPress={() => removeContact(contact.id)}
                    style={({ pressed }) => [
                      styles.removeBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppIcon name="trash" size={15} color={Colors.red} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* SECTION 4: Add Contact Utility Card ({component.store-utility-card} 18px radius) */}
      <View style={styles.addContactSection}>
        <View style={styles.addContactInner}>
          <View
            style={[
              styles.addCard,
              {
                backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                borderColor: isDark ? '#272729' : Colors.hairline,
              },
            ]}
          >
            <Text
              style={[
                styles.addCardHeadline,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              Add Trusted Emergency Contact
            </Text>
            <Text style={styles.addCardSub}>
              Ensure emergency contacts are aware and able to receive SMS alerts with coordinates.
            </Text>

            <View style={styles.formInputs}>
              <TextInput
                accessibilityLabel="Contact Name"
                placeholder="Full Name (e.g. Meera Verma)"
                placeholderTextColor={Colors.inkMuted48}
                value={newName}
                onChangeText={setNewName}
                style={[
                  styles.pillInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />

              <TextInput
                accessibilityLabel="Relationship"
                placeholder="Relationship (e.g. Sister, Mother, Friend)"
                placeholderTextColor={Colors.inkMuted48}
                value={newRelation}
                onChangeText={setNewRelation}
                style={[
                  styles.pillInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />

              <TextInput
                accessibilityLabel="Phone Number"
                placeholder="Phone Number (+91 ...)"
                placeholderTextColor={Colors.inkMuted48}
                value={newPhone}
                onChangeText={setNewPhone}
                keyboardType="phone-pad"
                style={[
                  styles.pillInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />
            </View>

            {contactError && <Text style={styles.formErrorText}>{contactError}</Text>}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save Contact"
              onPress={handleAddContact}
              style={({ pressed }) => [
                styles.saveContactBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="plus" size={15} color="#ffffff" />
              <Text style={styles.saveContactBtnText}>Save Trusted Contact</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Community Responders Modals */}
      <ResponderAlertModal
        visible={!!incomingRescueAlert}
        request={incomingRescueAlert?.request || null}
        responder={incomingRescueAlert?.responder || null}
        onAccept={acceptRescueRequest}
        onDecline={declineRescueRequest}
        themeMode={themeMode}
      />

      <ResponderDashboardModal
        visible={!!activeResponderSession}
        request={activeResponderSession?.request || null}
        responder={activeResponderSession?.responder || null}
        onStartTravel={startResponderTravel}
        onArrived={markResponderArrived}
        onCancelResponse={cancelResponderHelp}
        onClose={dismissResponderSession}
        themeMode={themeMode}
      />
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

  // SECTION 1: Museum Hero Tile ({component.product-tile-light})
  heroTile: {
    width: '100%',
    paddingVertical: 56,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  heroContent: {
    width: '100%',
    maxWidth: 980,
    alignItems: 'center',
  },
  boundaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#e8f2ff',
    marginBottom: 16,
  },
  boundaryPillText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: Colors.primary,
  },
  heroHeadline: {
    fontFamily: TypographyStyles.displayLg.fontFamily,
    fontSize: 38,
    fontWeight: '600',
    lineHeight: 44,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroLead: {
    fontFamily: TypographyStyles.lead.fontFamily,
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: 0.196,
    textAlign: 'center',
    maxWidth: 680,
    marginBottom: 24,
  },
  dialerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  dialerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.pill,
  },
  dialerEmergency: {
    backgroundColor: Colors.red,
  },
  dialerEmergencyText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  dialerWomenDesk: {
    backgroundColor: '#e8f2ff',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  dialerWomenDeskText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // SECTION 2: Centerpiece SOS Surface
  centerSection: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  centerInner: {
    width: '100%',
    maxWidth: 720,
  },
  sosTriggerCard: {
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Standby Idle Block
  idleBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 20,
  },
  gpsWarningCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fffbeb',
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    padding: 14,
    gap: 8,
  },
  gpsWarningHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gpsWarningTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
  },
  gpsWarningDesc: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 12,
    color: '#78350f',
    lineHeight: 17,
  },
  gpsRetryButton: {
    backgroundColor: '#d97706',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  gpsRetryButtonText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  giantSosButton: {
    width: '100%',
    maxWidth: 320,
    height: 120,
    borderRadius: BorderRadius.pill, // Signature Apple pill
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
  },
  giantSosTitle: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  giantSosSubtitle: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: -0.12,
  },
  telemetryInfoRow: {
    alignItems: 'center',
    gap: 10,
  },
  liveCoordPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveCoordPillFallback: {
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  liveCoordText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
  },
  liveCoordTextFallback: {
    color: '#b45309',
    fontWeight: '600',
  },
  mapShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  mapShareText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Countdown State
  stateCenterBlock: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  countdownBadge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.redLight,
    borderWidth: 2,
    borderColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  countdownNumber: {
    fontFamily: TypographyStyles.heroDisplay.fontFamily,
    fontSize: 38,
    fontWeight: '700',
    color: Colors.red,
    lineHeight: 42,
  },
  countdownUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.red,
    textTransform: 'uppercase',
  },
  stateHeadline: {
    fontFamily: TypographyStyles.displayMd.fontFamily,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
  stateLead: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    color: Colors.inkMuted80,
    textAlign: 'center',
    maxWidth: 440,
  },
  stateBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelPillBtn: {
    backgroundColor: Colors.green,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
  },
  cancelPillText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  sendNowPillBtn: {
    backgroundColor: Colors.red,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
  },
  sendNowPillText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Active Broadcast State
  activeAlertBlock: {
    width: '100%',
    gap: 16,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activePulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.red,
  },
  activeAlertTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.red,
  },
  activeAlertMeta: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
  },
  activeAlertFallbackWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    padding: 12,
    borderRadius: BorderRadius.md,
  },
  activeAlertFallbackText: {
    flex: 1,
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#92400e',
    lineHeight: 16,
  },
  deliveryList: {
    gap: 8,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  deliveryName: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    fontWeight: '500',
  },
  activeActionRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  smsFallbackPill: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.pill,
  },
  smsFallbackText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  resolvePill: {
    backgroundColor: Colors.green,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: BorderRadius.pill,
  },
  resolveText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  // SECTION 3: Dark Tile Section ({component.product-tile-dark} #272729)
  darkTileSection: {
    backgroundColor: Colors.surfaceTile1,
    paddingVertical: 48,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  darkTileInner: {
    width: '100%',
    maxWidth: 980,
  },
  darkOverline: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryOnDark,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  darkHeadline: {
    fontFamily: TypographyStyles.displayMd.fontFamily,
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.374,
    marginBottom: 6,
  },
  darkSub: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    color: Colors.bodyMuted,
    marginBottom: 24,
  },
  contactsGrid: {
    gap: 14,
  },
  contactCard: {
    borderRadius: BorderRadius.md, // 11px
    padding: 18,
    gap: 12,
  },
  contactCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  contactName: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  contactMeta: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.bodyMuted,
    marginTop: 2,
  },
  contactControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
  },
  verifyBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.green,
  },
  verifyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.green,
  },
  switchCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    color: Colors.bodyMuted,
  },
  removeBtn: {
    padding: 6,
  },

  // SECTION 4: Add Contact Utility Card ({component.store-utility-card} 18px radius)
  addContactSection: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  addContactInner: {
    width: '100%',
    maxWidth: 720,
  },
  addCard: {
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 24, // 24px
    gap: 14,
  },
  addCardHeadline: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 20,
    fontWeight: '600',
  },
  addCardSub: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
  },
  formInputs: {
    gap: 10,
    marginTop: 6,
  },
  pillInput: {
    height: 44,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  formErrorText: {
    fontSize: 13,
    color: Colors.red,
  },
  saveContactBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
  },
  saveContactBtnText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});
