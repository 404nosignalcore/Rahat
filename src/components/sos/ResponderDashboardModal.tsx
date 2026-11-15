import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { Colors, BorderRadius, TypographyStyles, Shadows, Spacing } from '../../theme';
import { CommunityResponder, CommunitySosRequest } from '../../types/safety';

export interface ResponderDashboardModalProps {
  visible: boolean;
  request: CommunitySosRequest | null;
  responder: CommunityResponder | null;
  onStartTravel: () => void;
  onArrived: () => void;
  onCancelResponse: (reason?: string) => void;
  onClose: () => void;
  themeMode?: 'light' | 'dark';
}

export const ResponderDashboardModal: React.FC<ResponderDashboardModalProps> = ({
  visible,
  request,
  responder,
  onStartTravel,
  onArrived,
  onCancelResponse,
  onClose,
  themeMode = 'light',
}) => {
  if (!visible || !request || !responder) return null;

  const isDark = themeMode === 'dark';

  const categoryLabels: Record<string, string> = {
    personal_safety: 'Personal Safety',
    stalking_threat: 'Followed / Stalked',
    harassment: 'Threat / Harassment',
    medical_distress: 'Medical Distress',
    general_emergency: 'Emergency Assistance',
  };

  const otherResponders = request.responders.filter(
    (r) => r.id !== responder.id && r.status !== 'cancelled'
  );

  const isTraveling = responder.status === 'on_the_way';
  const hasArrived = responder.status === 'arrived';

  const handleStartNavigation = () => {
    onStartTravel();
    const { lat, lng } = request.victimLocation;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
    });
    Linking.openURL(url).catch((err) => {
      console.warn('Could not launch map navigation', err);
    });
  };

  const handleCallPerson = () => {
    if (!request.victimPhone) {
      Alert.alert('Phone Unavailable', 'The user has masked their phone number.');
      return;
    }
    const cleanPhone = request.victimPhone.replace(/\s+/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Unable to Call', `Dial number directly: ${request.victimPhone}`);
    });
  };

  const handleConfirmCancel = () => {
    Alert.alert(
      'Cancel Assistance?',
      'Are you sure you need to disengage? The system will immediately notify the next available nearby community responder.',
      [
        { text: 'Keep Responding', style: 'cancel' },
        {
          text: 'Disengage',
          style: 'destructive',
          onPress: () => onCancelResponse('Responder had to disengage'),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.containerCard,
            {
              backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
              borderColor: isDark ? '#2c2c2e' : Colors.hairline,
            },
          ]}
        >
          {/* Header Bar */}
          <View
            style={[
              styles.headerBar,
              { borderBottomColor: isDark ? '#2c2c2e' : Colors.hairline },
            ]}
          >
            <View style={styles.headerLeft}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>RESPONDER MISSION ACTIVE</Text>
              </View>
              <Text style={[styles.reqId, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                ID: {request.id}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              style={[
                styles.closeIconBtn,
                { backgroundColor: isDark ? '#2c2c2e' : Colors.canvasParchment },
              ]}
              accessibilityLabel="Minimize Dashboard"
            >
              <AppIcon name="close" size={18} color={isDark ? '#ffffff' : Colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Status Banner */}
            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: hasArrived
                    ? '#e6f7ec'
                    : isTraveling
                    ? '#eff6ff'
                    : '#fffbeb',
                  borderColor: hasArrived
                    ? '#34c759'
                    : isTraveling
                    ? Colors.primary
                    : '#ff9500',
                },
              ]}
            >
              <AppIcon
                name={hasArrived ? 'check' : isTraveling ? 'route' : 'shield'}
                size={20}
                color={hasArrived ? '#248a3d' : isTraveling ? Colors.primary : '#b45309'}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.statusTitle,
                    {
                      color: hasArrived
                        ? '#14532d'
                        : isTraveling
                        ? Colors.primary
                        : '#92400e',
                    },
                  ]}
                >
                  {hasArrived
                    ? 'You have arrived on scene'
                    : isTraveling
                    ? 'En route to the person in need'
                    : 'Response accepted — Prepare to assist'}
                </Text>
                <Text
                  style={[
                    styles.statusSubtitle,
                    {
                      color: hasArrived
                        ? '#166534'
                        : isTraveling
                        ? '#1e40af'
                        : '#78350f',
                    },
                  ]}
                >
                  {hasArrived
                    ? 'Verify identity calmly. Provide physical presence and reassurance.'
                    : isTraveling
                    ? 'Proceed safely along the quickest walking path.'
                    : 'Tap "START NAVIGATION" to begin travel and view quickest walking route.'}
                </Text>
              </View>
            </View>

            {/* Victim Details Box */}
            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                  borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                },
              ]}
            >
              <View style={styles.infoRowBetween}>
                <View>
                  <Text style={[styles.labelSmall, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                    PERSON IN NEED
                  </Text>
                  <Text style={[styles.victimName, { color: isDark ? '#ffffff' : Colors.ink }]}>
                    {request.victimName}
                  </Text>
                </View>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {categoryLabels[request.emergencyCategory] || 'Emergency'}
                  </Text>
                </View>
              </View>

              {request.emergencyDescription ? (
                <View style={styles.noteBox}>
                  <Text style={[styles.noteText, { color: isDark ? '#ffffff' : Colors.ink }]}>
                    "{request.emergencyDescription}"
                  </Text>
                </View>
              ) : null}

              {/* Destination Coordinates */}
              <View style={styles.coordsRow}>
                <AppIcon name="pin" size={16} color={Colors.red} />
                <Text style={[styles.coordsText, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                  Coordinates: {request.victimLocation.lat.toFixed(5)}, {request.victimLocation.lng.toFixed(5)}
                </Text>
              </View>
            </View>

            {/* Tactical Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                  },
                ]}
              >
                <Text style={[styles.metricLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                  DISTANCE
                </Text>
                <Text style={[styles.metricVal, { color: isDark ? '#ffffff' : Colors.ink }]}>
                  {responder.distanceMeters > 0 ? `${responder.distanceMeters}m` : '0m (Arrived)'}
                </Text>
                <Text style={[styles.metricHint, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                  Walking distance
                </Text>
              </View>

              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                  },
                ]}
              >
                <Text style={[styles.metricLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                  ESTIMATED ARRIVAL
                </Text>
                <Text style={[styles.metricVal, { color: Colors.primary }]}>
                  {hasArrived ? 'Arrived' : `~${responder.etaMinutes || 3} min`}
                </Text>
                <Text style={[styles.metricHint, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                  Based on pace
                </Text>
              </View>
            </View>

            {/* Other Responders Assigned Info */}
            <View
              style={[
                styles.otherRespondersCard,
                {
                  backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                  borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                },
              ]}
            >
              <View style={styles.teamHeaderRow}>
                <AppIcon name="connect" size={18} color={Colors.primary} />
                <Text style={[styles.teamHeaderTitle, { color: isDark ? '#ffffff' : Colors.ink }]}>
                  Community Response Team ({1 + otherResponders.length} / 3 Assigned)
                </Text>
              </View>

              {otherResponders.length === 0 ? (
                <Text style={[styles.teamNoneText, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                  You are currently the first responder to accept. The system is dispatching alerts to 2 additional nearby community members.
                </Text>
              ) : (
                <View style={styles.teamList}>
                  {otherResponders.map((other) => (
                    <View key={other.id} style={styles.teamMemberRow}>
                      <View
                        style={[
                          styles.teamAvatar,
                          { backgroundColor: other.avatarColor || Colors.primary },
                        ]}
                      >
                        <Text style={styles.teamAvatarText}>
                          {other.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.teamMemberName, { color: isDark ? '#ffffff' : Colors.ink }]}>
                          {other.name} {other.isVerified ? '✓' : ''}
                        </Text>
                        <Text style={[styles.teamMemberSub, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                          {other.status === 'arrived'
                            ? 'Arrived on scene'
                            : other.status === 'on_the_way'
                            ? 'Traveling (~' + other.distanceMeters + 'm)'
                            : 'Accepted response'}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.miniStatusBadge,
                          {
                            backgroundColor:
                              other.status === 'arrived'
                                ? '#dcfce7'
                                : other.status === 'on_the_way'
                                ? '#e0f2fe'
                                : '#fef3c7',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.miniStatusBadgeText,
                            {
                              color:
                                other.status === 'arrived'
                                  ? '#15803d'
                                  : other.status === 'on_the_way'
                                  ? '#0369a1'
                                  : '#b45309',
                            },
                          ]}
                        >
                          {other.status === 'arrived'
                            ? 'Arrived'
                            : other.status === 'on_the_way'
                            ? 'En Route'
                            : 'Assigned'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Tactical Safety Protocol */}
            <View
              style={[
                styles.safetyDisclaimer,
                {
                  backgroundColor: isDark ? '#272729' : '#fffbeb',
                  borderColor: isDark ? '#3a3a3c' : '#fde68a',
                },
              ]}
            >
              <Text style={styles.safetyDisclaimerTitle}>⚠️ RESPONDER SAFETY MANDATE</Text>
              <Text style={[styles.safetyDisclaimerText, { color: isDark ? Colors.bodyMuted : '#78350f' }]}>
                Do NOT confront armed or hostile individuals. Your primary purpose is visible physical presence, moral support, and coordinating with official emergency authorities. If danger escalates, dial 112 immediately.
              </Text>
            </View>

            {/* Action Buttons (Strictly per spec):
                [START NAVIGATION]
                [CALL PERSON]
                [ARRIVED AT LOCATION]
                [CANCEL RESPONSE] */}
            <View style={styles.actionSection}>
              {!hasArrived && (
                <Pressable
                  onPress={handleStartNavigation}
                  style={({ pressed }) => [
                    styles.primaryActionBtn,
                    { backgroundColor: Colors.primary, opacity: pressed ? 0.9 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Start Navigation"
                >
                  <AppIcon name="route" size={18} color="#ffffff" />
                  <Text style={styles.primaryActionText}>
                    {isTraveling ? 'OPEN NAVIGATION ROUTE' : 'START NAVIGATION'}
                  </Text>
                </Pressable>
              )}

              <View style={styles.actionRowTwo}>
                <Pressable
                  onPress={handleCallPerson}
                  style={({ pressed }) => [
                    styles.secondaryActionBtn,
                    {
                      backgroundColor: isDark ? '#2c2c2e' : Colors.canvasParchment,
                      borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                      opacity: pressed ? 0.8 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Call Person"
                >
                  <AppIcon name="phone" size={18} color={Colors.primary} />
                  <Text style={[styles.secondaryActionText, { color: Colors.primary }]}>
                    CALL PERSON
                  </Text>
                </Pressable>

                {!hasArrived ? (
                  <Pressable
                    onPress={onArrived}
                    style={({ pressed }) => [
                      styles.secondaryActionBtn,
                      {
                        backgroundColor: '#e6f7ec',
                        borderColor: '#34c759',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Arrived at Location"
                  >
                    <AppIcon name="check" size={18} color="#248a3d" />
                    <Text style={[styles.secondaryActionText, { color: '#248a3d' }]}>
                      ARRIVED ON SCENE
                    </Text>
                  </Pressable>
                ) : (
                  <View
                    style={[
                      styles.secondaryActionBtn,
                      { backgroundColor: '#e6f7ec', borderColor: '#34c759' },
                    ]}
                  >
                    <AppIcon name="check" size={18} color="#248a3d" />
                    <Text style={[styles.secondaryActionText, { color: '#248a3d' }]}>
                      ON SCENE ACTIVE
                    </Text>
                  </View>
                )}
              </View>

              <Pressable
                onPress={handleConfirmCancel}
                style={({ pressed }) => [
                  styles.cancelActionBtn,
                  {
                    backgroundColor: isDark ? '#272729' : '#fff5f5',
                    borderColor: '#feb2b2',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Cancel Response"
              >
                <AppIcon name="close" size={16} color={Colors.red} />
                <Text style={styles.cancelActionText}>CANCEL RESPONSE</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  containerCard: {
    maxHeight: '90%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    ...Shadows.product,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  liveText: {
    ...TypographyStyles.captionStrong,
    color: Colors.primary,
    letterSpacing: 0.6,
  },
  reqId: {
    ...TypographyStyles.caption,
    marginTop: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  closeIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  statusTitle: {
    ...TypographyStyles.bodyStrong,
    fontSize: 14,
  },
  statusSubtitle: {
    ...TypographyStyles.caption,
    marginTop: 2,
  },
  infoCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  infoRowBetween: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  labelSmall: {
    ...TypographyStyles.captionStrong,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  victimName: {
    ...TypographyStyles.headline,
    fontSize: 18,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
  },
  categoryBadgeText: {
    ...TypographyStyles.captionStrong,
    color: '#ffffff',
  },
  noteBox: {
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.sm,
  },
  noteText: {
    ...TypographyStyles.body,
    fontSize: 13,
    fontStyle: 'italic',
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordsText: {
    ...TypographyStyles.caption,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricBox: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  metricLabel: {
    ...TypographyStyles.captionStrong,
    fontSize: 11,
  },
  metricVal: {
    ...TypographyStyles.headline,
    fontSize: 20,
    marginVertical: 4,
  },
  metricHint: {
    ...TypographyStyles.caption,
    fontSize: 11,
  },
  otherRespondersCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  teamHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teamHeaderTitle: {
    ...TypographyStyles.bodyStrong,
    fontSize: 14,
  },
  teamNoneText: {
    ...TypographyStyles.caption,
    lineHeight: 18,
  },
  teamList: {
    gap: 8,
    marginTop: 4,
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  teamAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamAvatarText: {
    ...TypographyStyles.captionStrong,
    color: '#ffffff',
    fontSize: 13,
  },
  teamMemberName: {
    ...TypographyStyles.bodyStrong,
    fontSize: 13,
  },
  teamMemberSub: {
    ...TypographyStyles.caption,
    fontSize: 11,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  miniStatusBadgeText: {
    ...TypographyStyles.captionStrong,
    fontSize: 10,
  },
  safetyDisclaimer: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  safetyDisclaimerTitle: {
    ...TypographyStyles.captionStrong,
    color: '#b45309',
    fontSize: 11,
  },
  safetyDisclaimerText: {
    ...TypographyStyles.caption,
    fontSize: 12,
    lineHeight: 16,
  },
  actionSection: {
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    paddingBottom: Spacing.lg,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: BorderRadius.pill,
  },
  primaryActionText: {
    ...TypographyStyles.buttonLabel,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  actionRowTwo: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  secondaryActionText: {
    ...TypographyStyles.buttonLabel,
    fontSize: 13,
  },
  cancelActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    marginTop: 4,
  },
  cancelActionText: {
    ...TypographyStyles.buttonLabel,
    color: Colors.red,
    fontSize: 13,
  },
});
