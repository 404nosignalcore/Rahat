import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, TypographyStyles, BorderRadius } from '../../theme';
import { Button } from '../common/Button';

interface SOSCountdownModalProps {
  visible: boolean;
  secondsRemaining: number;
  onCancel: () => void;
  onTriggerNow: () => void;
}

export const SOSCountdownModal: React.FC<SOSCountdownModalProps> = ({
  visible,
  secondsRemaining,
  onCancel,
  onTriggerNow,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onCancel} />

        <View style={styles.contentCard}>
          {/* Header Warning */}
          <View style={styles.warningPill}>
            <MaterialCommunityIcons name="alert-octagon" size={16} color={Colors.red} />
            <Text style={styles.warningPillText}>EMERGENCY PROTOCOL</Text>
          </View>

          <Text style={styles.title}>Activating SOS Alert</Text>
          <Text style={styles.subtitle}>
            Your real-time GPS coordinates will be dispatched to trusted contacts and SafeCircles in:
          </Text>

          {/* Large Countdown Circle */}
          <View style={styles.countdownContainer}>
            <View style={styles.countdownRing}>
              <Text style={styles.countdownText}>{secondsRemaining}</Text>
              <Text style={styles.countdownLabel}>SECONDS</Text>
            </View>
          </View>

          <Text style={styles.infoNote}>
            Tapping "Cancel — I'm Safe" halts dispatch immediately if pressed by mistake.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Button
              title="Cancel — I'm Safe"
              onPress={onCancel}
              variant="pearl"
              style={styles.cancelButton}
            />

            <Button
              title="Send Immediately"
              onPress={onTriggerNow}
              variant="danger"
              style={styles.triggerNowButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  contentCard: {
    backgroundColor: Colors.canvas,
    borderRadius: BorderRadius.xl, // 24px (Apple Sheet)
    padding: 24,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.redBorder,
    gap: 6,
    marginBottom: 16,
  },
  warningPillText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.red,
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: TypographyStyles.displayMd.fontFamily,
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
    letterSpacing: -0.374,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    color: Colors.inkMuted80,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  countdownContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  countdownRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: Colors.red,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontFamily: TypographyStyles.heroDisplay.fontFamily,
    fontSize: 42,
    fontWeight: '700',
    color: Colors.red,
    lineHeight: 46,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.red,
    letterSpacing: 0.5,
  },
  infoNote: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
    textAlign: 'center',
    marginVertical: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 6,
  },
  cancelButton: {
    flex: 1,
  },
  triggerNowButton: {
    flex: 1,
  },
});
