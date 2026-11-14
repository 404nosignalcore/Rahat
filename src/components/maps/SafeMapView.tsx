import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, Shadows, Typography, Spacing } from '../../theme';
import { LatLng, SafetyZone, SafetyReport, NearbyHelpItem } from '../../types';

interface SafeMapViewProps {
  currentLocation: LatLng;
  zones?: SafetyZone[];
  reports?: SafetyReport[];
  helpPoints?: NearbyHelpItem[];
  routePolyline?: LatLng[];
  activeDeviationPoint?: LatLng;
  onSelectZone?: (zone: SafetyZone) => void;
  onSelectReport?: (report: SafetyReport) => void;
  onSelectHelpPoint?: (item: NearbyHelpItem) => void;
  height?: number;
}

export const SafeMapView: React.FC<SafeMapViewProps> = ({
  currentLocation,
  zones = [],
  reports = [],
  helpPoints = [],
  routePolyline = [],
  activeDeviationPoint,
  onSelectZone,
  onSelectReport,
  onSelectHelpPoint,
  height = 320,
}) => {
  return (
    <View style={[styles.mapContainer, { height }]}>
      {/* Map Grid Canvas Background */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridLineH1} />
        <View style={styles.gridLineH2} />
        <View style={styles.gridLineV1} />
        <View style={styles.gridLineV2} />
      </View>

      {/* Safety Zone Overlays (Green, Yellow, Red visual corridors) */}
      <View style={styles.zonesLayer}>
        {zones.map((zone, idx) => {
          const zoneColor =
            zone.level === 'green'
              ? 'rgba(42, 157, 143, 0.16)'
              : zone.level === 'yellow'
              ? 'rgba(231, 111, 81, 0.16)'
              : 'rgba(230, 57, 70, 0.18)';
          const borderColor =
            zone.level === 'green'
              ? Colors.green
              : zone.level === 'yellow'
              ? Colors.yellow
              : Colors.red;

          // Spatial positioning on canvas relative to center
          const topPercent = 20 + (idx * 24) % 60;
          const leftPercent = 15 + (idx * 30) % 65;

          return (
            <TouchableOpacity
              key={zone.id}
              style={[
                styles.zoneRing,
                {
                  top: `${topPercent}%`,
                  left: `${leftPercent}%`,
                  backgroundColor: zoneColor,
                  borderColor: borderColor,
                },
              ]}
              onPress={() => onSelectZone && onSelectZone(zone)}
              activeOpacity={0.7}
            >
              <Text style={[styles.zoneLabel, { color: borderColor }]}>
                {zone.level.toUpperCase()} ZONE ({zone.safetyScore})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Route Polyline Track visualization */}
      {routePolyline.length > 0 && (
        <View style={styles.routeTrackContainer}>
          <View style={styles.routeTrackPath} />
        </View>
      )}

      {/* Incident Markers */}
      {reports.slice(0, 5).map((rep, idx) => {
        const top = 30 + ((idx * 17) % 50);
        const left = 25 + ((idx * 27) % 60);
        return (
          <TouchableOpacity
            key={rep.id}
            style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
            onPress={() => onSelectReport && onSelectReport(rep)}
          >
            <View style={[styles.pinCircle, { backgroundColor: Colors.yellow }]}>
              <MaterialCommunityIcons name="alert-outline" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Safe Haven / Help Point Pins */}
      {helpPoints.slice(0, 3).map((help, idx) => {
        const top = 15 + ((idx * 25) % 65);
        const left = 60 + ((idx * 18) % 30);
        return (
          <TouchableOpacity
            key={help.id}
            style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
            onPress={() => onSelectHelpPoint && onSelectHelpPoint(help)}
          >
            <View style={[styles.pinCircle, { backgroundColor: Colors.green }]}>
              <MaterialCommunityIcons name="shield-check" size={14} color="#FFF" />
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Active User GPS Beacon */}
      <View style={styles.userBeaconContainer}>
        <View style={styles.userPulseRing} />
        <View style={styles.userDot}>
          <MaterialCommunityIcons name="navigation" size={14} color="#FFF" />
        </View>
      </View>

      {/* Deviation Warning Beacon if currently off-track */}
      {activeDeviationPoint && (
        <View style={styles.deviationBeaconContainer}>
          <View style={styles.deviationPulse} />
          <MaterialCommunityIcons name="alert-octagon" size={20} color={Colors.red} />
        </View>
      )}

      {/* Map Control HUD (Compass, Center, SafeZone Legend) */}
      <View style={styles.mapHud}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.green }]} />
            <Text style={styles.legendText}>Positive</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.yellow }]} />
            <Text style={styles.legendText}>Caution</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.red }]} />
            <Text style={styles.legendText}>Concern</Text>
          </View>
        </View>

        <View style={styles.coordinatesPill}>
          <MaterialCommunityIcons name="crosshairs-gps" size={12} color={Colors.textSecondary} />
          <Text style={styles.coordinatesText}>
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    backgroundColor: '#EAEFF5',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#EDF2F7',
  },
  gridLineH1: {
    position: 'absolute',
    top: '33%',
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  gridLineH2: {
    position: 'absolute',
    top: '66%',
    width: '100%',
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  gridLineV1: {
    position: 'absolute',
    left: '33%',
    height: '100%',
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  gridLineV2: {
    position: 'absolute',
    left: '66%',
    height: '100%',
    width: 1,
    backgroundColor: '#E2E8F0',
  },
  zonesLayer: {
    ...StyleSheet.absoluteFill,
  },
  zoneRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -65 }, { translateY: -65 }],
  },
  zoneLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  routeTrackContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeTrackPath: {
    width: '70%',
    height: 5,
    backgroundColor: Colors.accent,
    borderRadius: 3,
    transform: [{ rotate: '-25deg' }],
    opacity: 0.85,
  },
  markerPin: {
    position: 'absolute',
    transform: [{ translateX: -12 }, { translateY: -12 }],
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  userBeaconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -18 }, { translateY: -18 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(94, 96, 206, 0.25)',
  },
  userDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    borderWidth: 2.5,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
  deviationBeaconContainer: {
    position: 'absolute',
    top: '72%',
    left: '68%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviationPulse: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(230, 57, 70, 0.3)',
  },
  mapHud: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  coordinatesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  coordinatesText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

