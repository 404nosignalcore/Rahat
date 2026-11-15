import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { AppIcon } from '../ui/AppIcon';
import { Colors, BorderRadius, TypographyStyles, Shadows, Spacing } from '../../theme';
import { CommunitySosRequest } from '../../types/safety';

export interface CommunitySosCardProps {
  onTriggerCommunitySos: (
    category: CommunitySosRequest['emergencyCategory'],
    description: string
  ) => void;
  onSimulateIncomingAlert?: () => void;
  isBroadcasting?: boolean;
  themeMode?: 'light' | 'dark';
  currentCoordinates?: { lat: number; lng: number };
}

const CATEGORIES: {
  id: CommunitySosRequest['emergencyCategory'];
  label: string;
  icon: 'shield' | 'sos' | 'route' | 'pin';
}[] = [
  { id: 'personal_safety', label: 'Personal Safety', icon: 'shield' },
  { id: 'stalking_threat', label: 'Followed / Stalked', icon: 'sos' },
  { id: 'harassment', label: 'Harassment / Threat', icon: 'sos' },
  { id: 'medical_distress', label: 'Medical Distress', icon: 'shield' },
  { id: 'general_emergency', label: 'General Emergency', icon: 'pin' },
];

export const CommunitySosCard: React.FC<CommunitySosCardProps> = ({
  onTriggerCommunitySos,
  onSimulateIncomingAlert,
  isBroadcasting = false,
  themeMode = 'light',
  currentCoordinates = { lat: 28.6295, lng: 77.224 },
}) => {
  const isDark = themeMode === 'dark';

  const [selectedCategory, setSelectedCategory] =
    useState<CommunitySosRequest['emergencyCategory']>('personal_safety');
  const [description, setDescription] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleTrigger = () => {
    onTriggerCommunitySos(selectedCategory, description);
  };

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
          borderColor: isBroadcasting
            ? Colors.primary
            : isDark
            ? '#272729'
            : Colors.hairline,
        },
      ]}
    >
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.headerIconWrapper}>
          <AppIcon name="connect" size={22} color={Colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.badgeRow}>
            <Text
              style={[
                styles.title,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              GET HELP FROM NEARBY PEOPLE
            </Text>
            <View style={styles.liveTag}>
              <View style={styles.liveTagDot} />
              <Text style={styles.liveTagText}>Community Network</Text>
            </View>
          </View>
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
            ]}
          >
            Alert nearby SafeWalk community members who can physically come and assist you.
          </Text>
        </View>
      </View>

      {/* Proximity Wave & Rule Summary */}
      <View
        style={[
          styles.waveSummaryBox,
          {
            backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
            borderColor: isDark ? '#3a3a3c' : Colors.hairline,
          },
        ]}
      >
        <View style={styles.waveItem}>
          <AppIcon name="shield" size={14} color={Colors.primary} />
          <Text style={[styles.waveText, { color: isDark ? '#ffffff' : Colors.ink }]}>
            Wave 1: <Text style={{ fontWeight: '700' }}>500m</Text>
          </Text>
        </View>
        <Text style={styles.waveArrow}>→</Text>
        <View style={styles.waveItem}>
          <Text style={[styles.waveText, { color: isDark ? '#ffffff' : Colors.ink }]}>
            Wave 2: <Text style={{ fontWeight: '700' }}>1 km</Text>
          </Text>
        </View>
        <Text style={styles.waveArrow}>→</Text>
        <View style={styles.waveItem}>
          <Text style={[styles.waveText, { color: isDark ? '#ffffff' : Colors.ink }]}>
            Max <Text style={{ fontWeight: '700' }}>3 Responders</Text>
          </Text>
        </View>
      </View>

      {/* Quick Details Expansion */}
      <View style={styles.configArea}>
        <Text style={[styles.sectionLabel, { color: isDark ? '#ffffff' : Colors.ink }]}>
          Emergency Category:
        </Text>
        <View style={styles.chipsRow}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected
                      ? Colors.primary
                      : isDark
                      ? '#2a2a2c'
                      : Colors.canvasParchment,
                    borderColor: isSelected
                      ? Colors.primary
                      : isDark
                      ? '#3a3a3c'
                      : Colors.hairline,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isSelected ? '#ffffff' : isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Optional Context Input */}
        <View style={styles.inputWrapper}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#ffffff' : Colors.ink }]}>
            Quick Situation Note (Optional):
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Near metro exit gate 3, need someone to walk with me"
            placeholderTextColor={isDark ? '#636366' : '#8e8e93'}
            style={[
              styles.noteInput,
              {
                backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                borderColor: isDark ? '#3a3a3c' : Colors.hairline,
                color: isDark ? '#ffffff' : Colors.ink,
              },
            ]}
            maxLength={140}
          />
        </View>

        {/* Current GPS Snapshot */}
        <View style={styles.locationSnapshot}>
          <AppIcon name="pin" size={13} color={Colors.primary} />
          <Text style={[styles.locationSnapshotText, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
            GPS Location: {currentCoordinates.lat.toFixed(5)}, {currentCoordinates.lng.toFixed(5)} · Locked
          </Text>
        </View>

        {/* Main Activation Button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Broadcast Community SOS"
          onPress={handleTrigger}
          style={({ pressed }) => [
            styles.activateBtn,
            pressed && styles.pressed,
          ]}
        >
          <AppIcon name="sos" size={18} color="#ffffff" />
          <Text style={styles.activateBtnText}>
            {isBroadcasting ? 'Broadcasting to Community...' : 'Alert Nearby Community Responders'}
          </Text>
        </Pressable>

        {/* Simulation / Testing Action */}
        {onSimulateIncomingAlert && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Simulate Incoming Alert as Nearby Responder"
            onPress={onSimulateIncomingAlert}
            style={({ pressed }) => [
              styles.simHelperBtn,
              pressed && styles.pressed,
            ]}
          >
            <AppIcon name="phone" size={13} color={Colors.primary} />
            <Text style={styles.simHelperText}>
              Test Incoming Alert (Preview what a nearby responder sees)
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: BorderRadius.lg, // 18px store-utility-card
    padding: 22,
    borderWidth: 1,
    gap: 16,
    ...Shadows.product,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 102, 204, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    gap: 5,
  },
  liveTagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  liveTagText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  waveSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md, // 11px
    borderWidth: 1,
  },
  waveItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  waveText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
  },
  waveArrow: {
    color: '#8e8e93',
    fontSize: 14,
  },
  configArea: {
    gap: 12,
  },
  sectionLabel: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  categoryChipText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    gap: 6,
  },
  noteInput: {
    height: 42,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 13,
  },
  locationSnapshot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationSnapshotText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
  },
  activateBtn: {
    backgroundColor: Colors.primary, // Action Blue #0066cc
    height: 48,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  activateBtnText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  simHelperBtn: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  simHelperText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
