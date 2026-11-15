import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { Colors, BorderRadius, TypographyStyles, Shadows, Spacing } from '../../theme';
import { CommunityResponder, CommunitySosRequest } from '../../types/safety';

export interface ResponderAlertModalProps {
  visible: boolean;
  request: CommunitySosRequest | null;
  responder: CommunityResponder | null;
  onAccept: () => void;
  onDecline: () => void;
  themeMode?: 'light' | 'dark';
}

export const ResponderAlertModal: React.FC<ResponderAlertModalProps> = ({
  visible,
  request,
  responder,
  onAccept,
  onDecline,
  themeMode = 'light',
}) => {
  if (!visible || !request || !responder) return null;

  const isDark = themeMode === 'dark';
  const distanceApprox = Math.round(responder.distanceMeters / 50) * 50; // Privacy conscious: approximate to nearest 50m

  const categoryLabels: Record<string, string> = {
    personal_safety: 'Personal Safety',
    stalking_threat: 'Followed / Stalking Alert',
    harassment: 'Threat / Harassment',
    medical_distress: 'Medical Distress',
    general_emergency: 'Emergency Assistance',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
              borderColor: Colors.red,
            },
          ]}
        >
          {/* Pulsing Alarm Beacon */}
          <View style={styles.alertHeader}>
            <View style={styles.alarmBeacon}>
              <AppIcon name="sos" size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.emergencyTag}>🚨 COMMUNITY EMERGENCY BROADCAST</Text>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? '#ffffff' : Colors.ink },
                ]}
              >
                EMERGENCY NEAR YOU!
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.subtitle,
              { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
            ]}
          >
            A nearby SafeWalk community member needs immediate physical presence and assistance.
          </Text>

          {/* Telemetry Data Box */}
          <View
            style={[
              styles.telemetryBox,
              {
                backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                borderColor: isDark ? '#3a3a3c' : Colors.hairline,
              },
            ]}
          >
            <View style={styles.telemetryRow}>
              <Text style={[styles.telemetryLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                Approximate Distance:
              </Text>
              <Text style={styles.telemetryDistance}>
                📍 ~{distanceApprox} metres away
              </Text>
            </View>

            <View style={styles.telemetryRow}>
              <Text style={[styles.telemetryLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                Emergency Type:
              </Text>
              <Text style={[styles.telemetryValue, { color: isDark ? '#ffffff' : Colors.ink }]}>
                {categoryLabels[request.emergencyCategory] || 'Personal Safety'}
              </Text>
            </View>

            <View style={styles.telemetryRow}>
              <Text style={[styles.telemetryLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                Assistance Note:
              </Text>
              <Text
                numberOfLines={2}
                style={[styles.telemetryValue, { color: isDark ? '#ffffff' : Colors.ink, flex: 1, textAlign: 'right' }]}
              >
                "{request.emergencyDescription}"
              </Text>
            </View>

            {/* Privacy Shield Notice */}
            <View style={styles.privacyNoteBox}>
              <AppIcon name="lock" size={13} color={Colors.primary} />
              <Text style={styles.privacyNoteText}>
                Privacy Protected: Exact GPS coordinates and caller identity unlock immediately upon accepting response.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionCol}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Accept and help"
              onPress={onAccept}
              style={({ pressed }) => [
                styles.acceptBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="check" size={18} color="#ffffff" />
              <Text style={styles.acceptBtnText}>ACCEPT & HELP</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Decline"
              onPress={onDecline}
              style={({ pressed }) => [
                styles.declineBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.declineBtnText}>Decline — Cannot Assist</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: BorderRadius.xl, // 24px Apple sheet
    borderWidth: 2,
    padding: 24,
    gap: 16,
    ...Shadows.product,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  alarmBeacon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTag: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.red,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  subtitle: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 13,
    lineHeight: 18,
  },
  telemetryBox: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  telemetryLabel: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
  },
  telemetryDistance: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  telemetryValue: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },
  privacyNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  privacyNoteText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: '#8e8e93',
    flex: 1,
    lineHeight: 15,
  },
  actionCol: {
    gap: 10,
    marginTop: 6,
  },
  acceptBtn: {
    height: 48,
    backgroundColor: Colors.green, // Safety green
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptBtnText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  declineBtn: {
    height: 40,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    color: '#8e8e93',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
