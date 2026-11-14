import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
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
            <MaterialCommunityIcons name="alert-octagon" size={18} color={Colors.red} />
            <Text style={styles.warningPillText}>EMERGENCY PROTOCOL TRIGGER</Text>
          </View>

          <Text style={styles.title}>Activating SOS Alert</Text>
          <Text style={styles.subtitle}>
            Your real-time GPS location will be broadcast to all selected emergency contacts and SafeCircle members in:
          </Text>

          {/* Large Countdown Circle */}
          <View style={styles.countdownContainer}>
            <View style={styles.outerRing}>
              <View style={styles.innerRing}>
                <Text style={styles.countdownText}>{secondsRemaining}</Text>
                <Text style={styles.countdownLabel}>SECONDS</Text>
              </View>
            </View>
          </View>

          <Text style={styles.infoNote}>
            Tapping "Cancel" stops the dispatch immediately if pressed by mistake.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <Button
              title="CANCEL — I AM SAFE"
              variant="outline"
              size="lg"
              onPress={onCancel}
              style={styles.cancelButton}
              textStyle={styles.cancelButtonText}
            />

            <Button
              title="SEND SOS IMMEDIATELY"
              variant="danger"
              size="md"
              icon={<MaterialCommunityIcons name="flash-alert" size={20} color="#FFF" />}
              onPress={onTriggerNow}
              style={styles.immediateButton}
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
    backgroundColor: 'rgba(11, 19, 43, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.prominent,
  },
  warningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.redLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
    marginBottom: Spacing.md,
  },
  warningPillText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: Colors.red,
    letterSpacing: 0.8,
  },
  title: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.body,
    marginBottom: Spacing.lg,
  },
  countdownContainer: {
    marginVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.redLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.redBorder,
  },
  innerRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: Colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.prominent,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 52,
  },
  countdownLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 1,
  },
  infoNote: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  buttonGroup: {
    width: '100%',
    gap: Spacing.md,
  },
  cancelButton: {
    borderColor: Colors.border,
    borderWidth: 2,
    backgroundColor: Colors.surfaceSubtle,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: '800',
  },
  immediateButton: {
    backgroundColor: Colors.redDark,
  },
});

