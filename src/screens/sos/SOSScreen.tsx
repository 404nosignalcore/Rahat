import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { useSOS } from '../../context/SOSContext';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/ServiceFactory';
import { EmergencyContact } from '../../types';

interface SOSScreenProps {
  navigation: any;
}

export const SOSScreen: React.FC<SOSScreenProps> = ({ navigation }) => {
  const {
    isSOSActive,
    activeAlert,
    openSOSConfirmation,
    resolveSOS,
    callEmergencyServices,
    retrySMSDispatch,
  } = useSOS();
  const { location } = useLocation();
  const { user, securitySettings } = useAuth();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  useEffect(() => {
    if (user) {
      dbService.getEmergencyContacts(user.uid).then(setContacts);
    }
  }, [user, isSOSActive]);

  const handleResolveAlert = () => {
    Alert.alert(
      'Resolve Emergency',
      'Are you safe and ready to conclude the emergency alert status?',
      [
        { text: 'Keep Active', style: 'cancel' },
        {
          text: 'I am Safe — Conclude',
          style: 'default',
          onPress: async () => {
            await resolveSOS();
            Alert.alert('Emergency Resolved', 'Emergency alert has been closed. Status updated.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="SOS Emergency"
        subtitle={isSOSActive ? 'EMERGENCY PROTOCOL ACTIVE' : 'Immediate personal emergency assistance'}
        onOpenHeroes={() => navigation.navigate('SafeHeroes')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main SOS Trigger Hub / Status Banner */}
        {isSOSActive ? (
          <Card style={styles.activeAlertCard}>
            <View style={styles.activePill}>
              <MaterialCommunityIcons name="broadcast" size={20} color="#FFF" />
              <Text style={styles.activePillText}>BROADCASTING EMERGENCY ALERT</Text>
            </View>

            <Text style={styles.activeLocationTitle}>Live GPS Location Transmitted</Text>
            <Text style={styles.activeCoordsText}>
              Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
            <Text style={styles.activeTimeText}>
              Activated: {activeAlert ? new Date(activeAlert.timestamp).toLocaleTimeString() : 'Just now'}
            </Text>

            {activeAlert?.isOfflineFallback && (
              <View style={styles.offlineWarningBanner}>
                <MaterialCommunityIcons name="signal-off" size={16} color={Colors.yellowText} />
                <Text style={styles.offlineWarningText}>
                  Sent via native SMS cellular dispatch (Offline Fallback).
                </Text>
              </View>
            )}

            <View style={styles.activeActionGrid}>
              <Button
                title={`Call ${securitySettings.preferredEmergencyNumber} Police/Ambulance`}
                size="lg"
                variant="danger"
                icon={<MaterialCommunityIcons name="phone" size={22} color="#FFF" />}
                onPress={callEmergencyServices}
                style={styles.callPoliceBtn}
              />

              <Button
                title="Resend SMS to Contacts"
                size="md"
                variant="outline"
                icon={<MaterialCommunityIcons name="message-alert-outline" size={18} color="#FFF" />}
                onPress={retrySMSDispatch}
                style={styles.smsRetryBtn}
                textStyle={{ color: '#FFF' }}
              />

              <Button
                title="I Am Safe — Resolve Emergency"
                size="md"
                variant="outline"
                icon={<MaterialCommunityIcons name="shield-check" size={18} color={Colors.green} />}
                onPress={handleResolveAlert}
                style={styles.resolveBtn}
                textStyle={{ color: Colors.greenText }}
              />
            </View>
          </Card>
        ) : (
          /* Standby Large Interactive SOS Button */
          <Card style={styles.standbyCard}>
            <Text style={styles.standbyTitle}>Emergency Activation</Text>
            <Text style={styles.standbySubtitle}>
              Tap the button below or in the center tab to trigger your safety protocol with a {securitySettings.sosCountdownSeconds}-second cancellation window.
            </Text>

            <TouchableOpacity
              style={styles.giantSOSButton}
              onPress={openSOSConfirmation}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Trigger SOS Emergency"
            >
              <View style={styles.giantSOSInner}>
                <MaterialCommunityIcons name="alert-octagon" size={48} color="#FFFFFF" />
                <Text style={styles.giantSOSText}>SOS</Text>
                <Text style={styles.giantSOSSubtext}>PRESS FOR HELP</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.guidelineRow}>
              <MaterialCommunityIcons name="shield-lock-outline" size={18} color={Colors.accent} />
              <Text style={styles.guidelineText}>
                Never claims police dispatch without authorized integration. Honest delivery receipts guaranteed.
              </Text>
            </View>
          </Card>
        )}

        {/* Emergency Contacts Section */}
        <View style={styles.contactsSection}>
          <View style={styles.contactsHeader}>
            <Text style={styles.sectionTitle}>Designated Emergency Contacts</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Text style={styles.manageLink}>Manage</Text>
            </TouchableOpacity>
          </View>

          {contacts.length === 0 ? (
            <Card style={styles.emptyContactsCard}>
              <MaterialCommunityIcons name="account-plus-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyContactsText}>No Emergency Contacts Configured</Text>
              <Button
                title="Add Emergency Contact"
                size="sm"
                variant="primary"
                onPress={() => navigation.navigate('Profile')}
              />
            </Card>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} style={styles.contactItemCard}>
                <View style={styles.contactIconCircle}>
                  <MaterialCommunityIcons name="account-heart" size={20} color={Colors.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.contactNameRow}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.isPrimary && <Badge label="PRIMARY" type="accent" />}
                  </View>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                  <Text style={styles.contactRole}>{contact.relationship}</Text>
                </View>

                <View style={styles.statusPillContainer}>
                  {isSOSActive ? (
                    <Badge
                      label="DISPATCHED"
                      type="green"
                      icon={<MaterialCommunityIcons name="check" size={12} color={Colors.greenText} />}
                    />
                  ) : (
                    <Badge label="STANDBY" type="neutral" />
                  )}
                </View>
              </Card>
            ))
          )}
        </View>

        {/* Offline Emergency Fallback Instructions */}
        <Card style={styles.offlineInstructionsCard}>
          <View style={styles.offlineHeader}>
            <MaterialCommunityIcons name="wifi-off" size={20} color={Colors.textSecondary} />
            <Text style={styles.offlineTitle}>Offline Emergency Support</Text>
          </View>
          <Text style={styles.offlineBody}>
            If no internet connection is available, SafeWalk automatically routes your distress message through standard cellular SMS with your GPS coordinates and launches the direct device dialer for 112.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.lg,
  },
  standbyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  standbyTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '800',
    color: Colors.text,
  },
  standbySubtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.body,
  },
  giantSOSButton: {
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.redBorder,
    marginVertical: Spacing.md,
    ...Shadows.prominent,
  },
  giantSOSInner: {
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  giantSOSText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
    marginTop: -2,
  },
  giantSOSSubtext: {
    fontSize: 9,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  guidelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  guidelineText: {
    flex: 1,
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
  activeAlertCard: {
    backgroundColor: Colors.redDark,
    padding: Spacing.xl,
    gap: Spacing.sm,
    ...Shadows.prominent,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  activePillText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  activeLocationTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  activeCoordsText: {
    fontSize: Typography.fontSize.footnote,
    color: 'rgba(255,255,255,0.9)',
  },
  activeTimeText: {
    fontSize: Typography.fontSize.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  offlineWarningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 6,
    marginVertical: 4,
  },
  offlineWarningText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.yellowText,
    fontWeight: '700',
  },
  activeActionGrid: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  callPoliceBtn: {
    backgroundColor: '#000',
  },
  smsRetryBtn: {
    borderColor: 'rgba(255,255,255,0.4)',
  },
  resolveBtn: {
    backgroundColor: '#FFF',
    borderColor: Colors.greenBorder,
  },
  contactsSection: {
    gap: Spacing.sm,
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  manageLink: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.accent,
  },
  emptyContactsCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.xl,
  },
  emptyContactsText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textMuted,
  },
  contactItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactName: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  contactRole: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
  },
  statusPillContainer: {
    alignSelf: 'center',
  },
  offlineInstructionsCard: {
    backgroundColor: Colors.surfaceSubtle,
    gap: Spacing.xs,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  offlineBody: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.footnote,
  },
});

