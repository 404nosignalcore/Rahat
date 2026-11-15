import React from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IncidentReport, RiskZone, RouteOption, SafeHaven } from '../../types/safety';

export interface SafetyMapViewProps {
  height?: number;
  zones?: RiskZone[];
  reports?: IncidentReport[];
  safeHavens?: SafeHaven[];
  routes?: RouteOption[];
  selectedRouteId?: string;
  userLocation?: { lat: number; lng: number };
  onSelectZone?: (zone: RiskZone) => void;
  onSelectReport?: (report: IncidentReport) => void;
  onPickCoordinate?: (lat: number, lng: number) => void;
  pickMode?: boolean;
}

const RISK_THEME = {
  safe: { color: '#34C759', bg: 'rgba(52, 199, 89, 0.16)', label: 'SAFE' },
  caution: { color: '#FF9500', bg: 'rgba(255, 149, 0, 0.16)', label: 'CAUTION' },
  danger: { color: '#FF3B30', bg: 'rgba(255, 59, 48, 0.16)', label: 'CONCERN' },
};

export const SafetyMapView: React.FC<SafetyMapViewProps> = ({
  height = 280,
  zones = [],
  reports = [],
  safeHavens = [],
  routes = [],
  selectedRouteId,
  userLocation = { lat: 28.6295, lng: 77.224 },
  onSelectZone,
  onSelectReport,
  onPickCoordinate,
  pickMode = false,
}) => {
  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  const handleCanvasPress = (e: any) => {
    if (!pickMode || !onPickCoordinate) return;
    const { locationX, locationY } = e.nativeEvent;
    // Map tap offset to approximate Delhi NCR delta
    const latOffset = ((140 - locationY) / 140) * 0.015;
    const lngOffset = ((locationX - 180) / 180) * 0.015;
    onPickCoordinate(userLocation.lat + latOffset, userLocation.lng + lngOffset);
  };

  return (
    <Pressable
      onPress={handleCanvasPress}
      style={[styles.container, { height }]}
    >
      {/* Grid Pattern */}
      <View style={styles.gridOverlay}>
        <View style={styles.gridLineH1} />
        <View style={styles.gridLineH2} />
        <View style={styles.gridLineV1} />
        <View style={styles.gridLineV2} />
      </View>

      {/* Safety Zone Overlays */}
      <View style={styles.zonesLayer}>
        {zones.slice(0, 4).map((zone, idx) => {
          const cfg = RISK_THEME[zone.level] || RISK_THEME.safe;
          const topPercent = 20 + ((idx * 23) % 55);
          const leftPercent = 16 + ((idx * 28) % 60);

          return (
            <TouchableOpacity
              key={zone.id}
              style={[
                styles.zoneRing,
                {
                  top: `${topPercent}%`,
                  left: `${leftPercent}%`,
                  backgroundColor: cfg.bg,
                  borderColor: cfg.color,
                },
              ]}
              onPress={() => onSelectZone && onSelectZone(zone)}
              activeOpacity={0.7}
            >
              <Text style={[styles.zoneLabel, { color: cfg.color }]}>
                {zone.name.split(' ')[0]} ({zone.safetyScore})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Active Route Path */}
      {selectedRoute && (
        <View style={styles.routeTrackContainer}>
          <View style={styles.routeTrackPath} />
        </View>
      )}

      {/* Incident Markers */}
      {reports.slice(0, 5).map((rep, idx) => {
        const top = 25 + ((idx * 19) % 50);
        const left = 22 + ((idx * 27) % 62);
        return (
          <TouchableOpacity
            key={rep.id}
            style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
            onPress={() => onSelectReport && onSelectReport(rep)}
          >
            <View style={[styles.pinCircle, { backgroundColor: '#F59E0B' }]}>
              <Ionicons name="warning-outline" size={12} color="#FFF" />
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Safe Haven Pins */}
      {safeHavens.slice(0, 3).map((haven, idx) => {
        const top = 18 + ((idx * 26) % 60);
        const left = 62 + ((idx * 15) % 25);
        return (
          <View
            key={haven.id}
            style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
          >
            <View style={[styles.pinCircle, { backgroundColor: '#15803D' }]}>
              <Ionicons name="shield-checkmark" size={12} color="#FFF" />
            </View>
          </View>
        );
      })}

      {/* User GPS Location Beacon */}
      <View style={styles.userBeaconContainer}>
        <View style={styles.userPulseRing} />
        <View style={styles.userDot}>
          <Ionicons name="navigate" size={13} color="#FFF" />
        </View>
      </View>

      {/* Pick Mode Crosshair indicator */}
      {pickMode && (
        <View style={styles.pickModeBanner}>
          <Ionicons name="locate-outline" size={14} color="#6D5BD0" />
          <Text style={styles.pickModeText}>Tap map anywhere to pick coordinate</Text>
        </View>
      )}

      {/* Map Legend HUD */}
      <View style={styles.mapHud}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#15803D' }]} />
            <Text style={styles.legendText}>Safe</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#B45309' }]} />
            <Text style={styles.legendText}>Caution</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
            <Text style={styles.legendText}>Concern</Text>
          </View>
        </View>

        <View style={styles.coordinatesPill}>
          <Ionicons name="locate-outline" size={11} color="#64748B" />
          <Text style={styles.coordinatesText}>
            {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#F5F5F7',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D2D2D7',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#F5F5F7',
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
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -60 }, { translateY: -60 }],
  },
  zoneLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(255,255,255,0.9)',
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
    backgroundColor: '#0071E3',
    borderRadius: 3,
    transform: [{ rotate: '-25deg' }],
    opacity: 0.9,
  },
  markerPin: {
    position: 'absolute',
    transform: [{ translateX: -11 }, { translateY: -11 }],
  },
  pinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  userBeaconContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userPulseRing: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(109, 91, 208, 0.25)',
  },
  userDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6D5BD0',
    borderWidth: 2,
    borderColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  pickModeBanner: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#0071E3',
  },
  pickModeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#0071E3',
    letterSpacing: -0.15,
  },
  mapHud: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 7,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D2D2D7',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D1D1F',
    letterSpacing: -0.1,
  },
  coordinatesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#D2D2D7',
  },
  coordinatesText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#86868B',
    letterSpacing: -0.1,
  },
});
