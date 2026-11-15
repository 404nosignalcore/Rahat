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
      animationType="fade"
      onRequestClose={onSafe}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onSafe} />

        <View style={styles.contentCard}>
          {/* Header Indicator */}
          <View style={styles.badgeRow}>
            <View style={styles.cautionBadge}>
              <MaterialCommunityIcons name="map-marker-alert" size={16} color={Colors.yellowText} />
              <Text style={styles.cautionBadgeText}>ROUTE DEVIATION</Text>
            </View>
            <Text style={styles.distanceText}>~{deviationDistanceMeters}m off path</Text>
          </View>

          {/* Core Prompt */}
          <Text style={styles.questionTitle}>
            Route deviation detected. Are you okay?
          </Text>

          <Text style={styles.explanationText}>
            SafeWalk noticed you took an unexpected turn away from your planned corridor. Please choose how you want to proceed:
          </Text>

          {/* Actions List */}
          <View style={styles.actionsList}>
            <Button
              title="I'm Safe (Dismiss)"
              onPress={onSafe}
              variant="pearl"
              style={styles.actionBtn}
            />

            <Button
              title="Recalculate Route"
              onPress={onRecalculate}
              variant="primary"
              style={styles.actionBtn}
            />

            <Button
              title="Share Location with SafeCircle"
              onPress={onShareLocation}
              variant="secondary"
              style={styles.actionBtn}
            />

            <Button
              title="Activate SOS Emergency"
              onPress={onActivateSOS}
              variant="danger"
              style={styles.actionBtn}
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
    maxWidth: 480,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cautionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.yellowLight,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.yellowBorder,
    gap: 6,
  },
  cautionBadgeText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 11,
    fontWeight: '700',
    color: Colors.yellowText,
    letterSpacing: 0.5,
  },
  distanceText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
  },
  questionTitle: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 20,
    fontWeight: '600',
    color: Colors.ink,
    letterSpacing: 0.231,
    marginBottom: 8,
  },
  explanationText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.inkMuted80,
    marginBottom: 20,
  },
  actionsList: {
    gap: 10,
  },
  actionBtn: {
    width: '100%',
  },
});
