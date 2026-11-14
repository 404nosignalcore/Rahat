import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { Button } from '../common/Button';

interface DeviationAlertModalProps {
  visible: boolean;
  deviationDistanceMeters: number;
  onSafe: () => void;
  onRecalculate: () => void;
  onShareLocation: () => void;
  onActivateSOS: () => void;
}

export const DeviationAlertModal: React.FC<DeviationAlertModalProps> = ({
  visible,
  deviationDistanceMeters,
  onSafe,
  onRecalculate,
  onShareLocation,
  onActivateSOS,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onSafe}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onSafe} />

        <View style={styles.contentCard}>
          {/* Header Indicator */}
          <View style={styles.badgeRow}>
            <View style={styles.cautionBadge}>
              <MaterialCommunityIcons name="map-marker-alert" size={18} color={Colors.yellowText} />
              <Text style={styles.cautionBadgeText}>ROUTE DEVIATION DETECTED</Text>
            </View>
            <Text style={styles.distanceText}>~{deviationDistanceMeters}m off path</Text>
          </View>

          {/* Core Prompt Requirement */}
          <Text style={styles.questionTitle}>
            Your location appears to be different from your planned route. Are you okay?
          </Text>

          <Text style={styles.explanationText}>
            SafeWalk noticed you took an unexpected turn or detour away from your safe route. Please select an option below:
          </Text>

          {/* Four Required Actions */}
          <View style={styles.actionsList}>
            {/* 1. I'm Safe */}
            <Button
              title="I'm Safe"
              variant="outline"
              size="md"
              icon={<MaterialCommunityIcons name="check-circle-outline" size={20} color={Colors.green} />}
              onPress={onSafe}
              style={styles.safeButton}
              textStyle={styles.safeButtonText}
            />

            {/* 2. Recalculate Route */}
            <Button
              title="Recalculate Route"
              variant="secondary"
              size="md"
              icon={<MaterialCommunityIcons name="routes" size={20} color="#FFF" />}
              onPress={onRecalculate}
            />

            {/* 3. Share My Location */}
            <Button
              title="Share My Location With Circle"
              variant="outline"
              size="md"
              icon={<MaterialCommunityIcons name="account-group-outline" size={20} color={Colors.primary} />}
              onPress={onShareLocation}
            />

            {/* 4. Activate SOS */}
            <Button
              title="Activate SOS Alert"
              variant="danger"
              size="md"
              icon={<MaterialCommunityIcons name="alert-octagon" size={20} color="#FFF" />}
              onPress={onActivateSOS}
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
    backgroundColor: 'rgba(11, 19, 43, 0.75)',
    justifyContent: 'flex-end',
    padding: Spacing.md,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  contentCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.prominent,
    marginBottom: Spacing.md,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cautionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.yellowBorder,
    gap: 6,
  },
  cautionBadgeText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: Colors.yellowText,
  },
  distanceText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  questionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: Typography.lineHeight.title3,
    marginBottom: Spacing.sm,
  },
  explanationText: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.body,
    marginBottom: Spacing.lg,
  },
  actionsList: {
    gap: Spacing.sm,
  },
  safeButton: {
    borderColor: Colors.greenBorder,
    backgroundColor: Colors.greenLight,
  },
  safeButtonText: {
    color: Colors.greenText,
    fontWeight: '700',
  },
});

