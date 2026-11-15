import React, { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { Badge } from '../common/Badge';
import { Colors, BorderRadius, TypographyStyles, Shadows, Spacing } from '../../theme';
import { CommunitySosRequest } from '../../types/safety';
import { SafetyMapView } from '../map/SafetyMapView';

export interface VictimLiveRescueViewProps {
  request: CommunitySosRequest;
  onCancelRequest: (reason?: string) => void;
  onReportResponder: (responderId: string, reason: string) => void;
  onResolveRequest: () => void;
  onSimulateAccept?: () => void;
  onSimulateTravel?: (responderId: string) => void;
  onSimulateArrival?: (responderId: string) => void;
  onSimulateCancel?: (responderId: string) => void;
  themeMode?: 'light' | 'dark';
}

export const VictimLiveRescueView: React.FC<VictimLiveRescueViewProps> = ({
  request,
  onCancelRequest,
  onReportResponder,
  onResolveRequest,
  onSimulateAccept,
  onSimulateTravel,
  onSimulateArrival,
  onSimulateCancel,
  themeMode = 'light',
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isDark = themeMode === 'dark';

  const [activeReportResponderId, setActiveReportResponderId] = useState<string | null>(null);

  const activeResponders = request.responders.filter((r) => r.status !== 'cancelled');
  const arrivedCount = activeResponders.filter((r) => r.status === 'arrived').length;
  const isHelpArrived = arrivedCount > 0;

  // Build map markers representation for responders
  const responderReports = activeResponders.map((r, idx) => ({
    id: `marker-${r.id}`,
    category: 'suspicious_activity' as const,
    title: `Community Helper: ${r.name}`,
    description: `${r.status.toUpperCase()} · ${r.distanceMeters}m away · ${r.verificationBadge}`,
    latitude: r.latitude,
    longitude: r.longitude,
    address: `${r.distanceMeters}m from you`,
    timestamp: r.acceptedAt || new Date().toISOString(),
    timeHour: 22,
    lightingCondition: 'well_lit' as const,
    severity: 2 as const,
    verificationStatus: 'authorized_verified' as const,
    corroborationCount: r.acceptedHelpsCount,
    outdatedFlags: 0,
    abuseFlags: 0,
    isSynthetic: false,
  }));

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? '#161617' : Colors.canvas,
          borderColor: isHelpArrived
            ? Colors.green
            : activeResponders.length > 0
            ? Colors.primary
            : Colors.red,
        },
      ]}
    >
      {/* Header Banner */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.pulseBeacon,
              {
                backgroundColor: isHelpArrived
                  ? 'rgba(52, 199, 89, 0.15)'
                  : activeResponders.length > 0
                  ? 'rgba(0, 102, 204, 0.15)'
                  : 'rgba(255, 59, 48, 0.15)',
              },
            ]}
          >
            <View
              style={[
                styles.pulseCore,
                {
                  backgroundColor: isHelpArrived
                    ? Colors.green
                    : activeResponders.length > 0
                    ? Colors.primary
                    : Colors.red,
                },
              ]}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.mainHeading,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              {isHelpArrived
                ? 'HELP HAS ARRIVED AT YOUR LOCATION'
                : activeResponders.length > 0
                ? 'HELP IS ON THE WAY'
                : 'SEARCHING FOR NEARBY RESCUERS'}
            </Text>
            <Text
              style={[
                styles.subHeading,
                { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
              ]}
            >
              Request ID: <Text style={{ fontWeight: '700' }}>{request.id}</Text> · Wave {request.currentWave} ({request.waveRadiusMeters}m search radius)
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Badge
            label={`${activeResponders.length}/3 Assigned`}
            type={activeResponders.length === 3 ? 'safe' : activeResponders.length > 0 ? 'caution' : 'danger'}
          />
        </View>
      </View>

      {/* Main Responsive Grid */}
      <View style={[styles.mainLayout, isWide && styles.mainLayoutWide]}>
        {/* Map Column */}
        <View style={[styles.mapContainer, isWide && styles.mapContainerWide]}>
          <View style={[styles.mapFrame, Shadows.product]}>
            <SafetyMapView
              height={isWide ? 400 : 280}
              userLocation={{ lat: request.victimLocation.lat, lng: request.victimLocation.lng }}
              reports={responderReports}
            />
          </View>

          {/* Quick Helpline Row */}
          <View style={styles.officialHelpRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call 112 National Police"
              onPress={() => Linking.openURL('tel:112')}
              style={({ pressed }) => [
                styles.policeDialBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="phone" size={14} color="#ffffff" />
              <Text style={styles.policeDialText}>Direct Call 112</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Call 1091 Women Helpline"
              onPress={() => Linking.openURL('tel:1091')}
              style={({ pressed }) => [
                styles.womenDialBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="phone" size={14} color={Colors.primary} />
              <Text style={styles.womenDialText}>Call 1091</Text>
            </Pressable>
          </View>
        </View>

        {/* Responders & Audit Column */}
        <View style={[styles.detailsCol, isWide && styles.detailsColWide]}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#ffffff' : Colors.ink },
            ]}
          >
            Assigned Community Responders ({activeResponders.length} of 3)
          </Text>

          {activeResponders.length === 0 ? (
            <View
              style={[
                styles.emptyRespondersBox,
                {
                  backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                  borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                },
              ]}
            >
              <AppIcon name="clock" size={24} color={Colors.yellow} />
              <Text
                style={[
                  styles.emptyRespondersTitle,
                  { color: isDark ? '#ffffff' : Colors.ink },
                ]}
              >
                Pinging nearby registered helpers within {request.waveRadiusMeters}m...
              </Text>
              <Text
                style={[
                  styles.emptyRespondersText,
                  { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                ]}
              >
                Alerting first-wave community members. If needed, the system expands radius to 1km in 30 seconds.
              </Text>

              {onSimulateAccept && (
                <Pressable
                  accessibilityRole="button"
                  onPress={onSimulateAccept}
                  style={({ pressed }) => [
                    styles.simAcceptBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.simAcceptBtnText}>
                    Simulate Nearby User Accepting Request
                  </Text>
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.responderCardsList}>
              {activeResponders.map((resp) => {
                const statusType =
                  resp.status === 'arrived'
                    ? 'safe'
                    : resp.status === 'on_the_way'
                    ? 'safe'
                    : 'caution';

                return (
                  <View
                    key={resp.id}
                    style={[
                      styles.responderCard,
                      {
                        backgroundColor: isDark ? '#272729' : Colors.canvas,
                        borderColor:
                          resp.status === 'arrived'
                            ? Colors.green
                            : isDark
                            ? '#3a3a3c'
                            : Colors.hairline,
                        borderWidth: resp.status === 'arrived' ? 2 : 1,
                      },
                    ]}
                  >
                    {/* Top Row: Avatar, Name, Status */}
                    <View style={styles.responderCardTop}>
                      <View
                        style={[
                          styles.avatarCircle,
                          { backgroundColor: resp.avatarColor },
                        ]}
                      >
                        <Text style={styles.avatarLetter}>
                          {resp.name.charAt(0)}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={styles.nameBadgeRow}>
                          <Text
                            style={[
                              styles.responderName,
                              { color: isDark ? '#ffffff' : Colors.ink },
                            ]}
                          >
                            {resp.name}
                          </Text>
                          {resp.isVerified && (
                            <View style={styles.verifiedBadge}>
                              <AppIcon name="check" size={11} color="#ffffff" />
                              <Text style={styles.verifiedBadgeText}>Verified</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.responderRole}>
                          {resp.verificationBadge}
                        </Text>
                        <Text style={styles.responderDistance}>
                          📍 {resp.distanceMeters}m away · ETA ~{resp.etaMinutes || 3} mins · ⭐ {resp.rating} ({resp.acceptedHelpsCount} assists)
                        </Text>
                      </View>

                      <Badge
                        label={
                          resp.status === 'arrived'
                            ? 'ARRIVED'
                            : resp.status === 'on_the_way'
                            ? 'ON THE WAY'
                            : 'ACCEPTED'
                        }
                        type={statusType}
                      />
                    </View>

                    {/* Action Row */}
                    <View style={styles.responderActionRow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${resp.name}`}
                        onPress={() => Linking.openURL(`tel:${resp.phone}`)}
                        style={({ pressed }) => [
                          styles.actionPillBtn,
                          styles.actionCallBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="phone" size={13} color="#ffffff" />
                        <Text style={styles.actionCallBtnText}>Call Helper</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Report ${resp.name}`}
                        onPress={() => {
                          onReportResponder(resp.id, 'Uncomfortable or suspicious behavior');
                        }}
                        style={({ pressed }) => [
                          styles.actionPillBtn,
                          styles.actionReportBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="flag" size={13} color={Colors.red} />
                        <Text style={styles.actionReportBtnText}>Report Helper</Text>
                      </Pressable>

                      {/* Simulation Controls for testing lifecycle */}
                      {onSimulateTravel && resp.status === 'accepted' && (
                        <Pressable
                          onPress={() => onSimulateTravel(resp.id)}
                          style={styles.simStepBtn}
                        >
                          <Text style={styles.simStepText}>[Simulate: Start Travel]</Text>
                        </Pressable>
                      )}

                      {onSimulateArrival && resp.status === 'on_the_way' && (
                        <Pressable
                          onPress={() => onSimulateArrival(resp.id)}
                          style={styles.simStepBtn}
                        >
                          <Text style={styles.simStepText}>[Simulate: Arrived]</Text>
                        </Pressable>
                      )}

                      {onSimulateCancel && resp.status !== 'arrived' && (
                        <Pressable
                          onPress={() => onSimulateCancel(resp.id)}
                          style={styles.simStepBtn}
                        >
                          <Text style={styles.simStepCancelText}>[Simulate: Cancel]</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}

              {activeResponders.length < 3 && onSimulateAccept && (
                <Pressable
                  accessibilityRole="button"
                  onPress={onSimulateAccept}
                  style={({ pressed }) => [
                    styles.simAdditionalAcceptBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppIcon name="plus" size={14} color={Colors.primary} />
                  <Text style={styles.simAdditionalAcceptText}>
                    Simulate additional helper accepting ({activeResponders.length}/3)
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Audit Trail & Event History */}
          <View style={styles.auditContainer}>
            <Text
              style={[
                styles.auditSectionHeading,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              Response Audit Trail ({request.auditLog.length} events)
            </Text>
            <View
              style={[
                styles.auditList,
                {
                  backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                  borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                },
              ]}
            >
              {request.auditLog.slice(0, 5).map((log) => (
                <View key={log.id} style={styles.auditLogItem}>
                  <View style={styles.auditDot} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.auditLogMsg,
                        { color: isDark ? '#ffffff' : Colors.ink },
                      ]}
                    >
                      {log.message}
                    </Text>
                    <Text style={styles.auditLogTime}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Master Resolution & Cancellation Controls */}
          <View style={styles.masterControlsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cancel Community SOS"
              onPress={() => onCancelRequest("I'm safe now.")}
              style={({ pressed }) => [
                styles.masterCancelBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.masterCancelText}>Cancel Request — I'm Safe</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Resolve and Close Emergency"
              onPress={onResolveRequest}
              style={({ pressed }) => [
                styles.masterResolveBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="check" size={16} color="#ffffff" />
              <Text style={styles.masterResolveText}>Mark Safely Resolved</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.xl, // 24px
    borderWidth: 2,
    padding: 20,
    gap: 16,
    ...Shadows.product,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  pulseBeacon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  mainHeading: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subHeading: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  mainLayout: {
    gap: 18,
  },
  mainLayoutWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mapContainer: {
    width: '100%',
    gap: 10,
  },
  mapContainerWide: {
    flex: 1.1,
  },
  mapFrame: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  officialHelpRow: {
    flexDirection: 'row',
    gap: 10,
  },
  policeDialBtn: {
    flex: 1,
    height: 42,
    backgroundColor: Colors.red,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  policeDialText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  womenDialBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  womenDialText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  detailsCol: {
    flex: 1,
    gap: 14,
  },
  detailsColWide: {
    flex: 1.2,
  },
  sectionTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyRespondersBox: {
    padding: 20,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  emptyRespondersTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyRespondersText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  simAcceptBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.primary,
  },
  simAcceptBtnText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  responderCardsList: {
    gap: 10,
  },
  responderCard: {
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: 10,
  },
  responderCardTop: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  responderName: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.pill,
    gap: 3,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  responderRole: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 1,
  },
  responderDistance: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: Colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },
  responderActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  actionPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  actionCallBtn: {
    backgroundColor: Colors.green,
  },
  actionCallBtnText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionReportBtn: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  actionReportBtnText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.red,
  },
  simStepBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  simStepText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  simStepCancelText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: Colors.red,
    textDecorationLine: 'underline',
  },
  simAdditionalAcceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  simAdditionalAcceptText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  auditContainer: {
    gap: 6,
    marginTop: 6,
  },
  auditSectionHeading: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  auditList: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 10,
    gap: 8,
  },
  auditLogItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  auditDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 5,
  },
  auditLogMsg: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    lineHeight: 15,
  },
  auditLogTime: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 10,
    color: '#8e8e93',
  },
  masterControlsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  masterCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#8e8e93',
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterCancelText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    color: '#8e8e93',
  },
  masterResolveBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  masterResolveText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
