import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, BorderRadius, TypographyStyles, Spacing } from '../../theme';
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

const ZOOM_STEPS = [1.0, 1.35, 1.75, 2.2];

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
  height = 340,
}) => {
  const [zoomIndex, setZoomIndex] = useState<number>(0);
  const [selectedItemName, setSelectedItemName] = useState<string | null>(null);

  const zoomScale = ZOOM_STEPS[zoomIndex];

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setZoomIndex(0);
    setSelectedItemName(null);
  };

  return (
    <View style={[styles.mapContainer, { height }]}>
      <Pressable onPress={() => setSelectedItemName(null)} style={styles.interactiveArea}>
        {/* Scaled Map World */}
        <View
          style={[
            styles.mapWorld,
            {
              transform: [{ scale: zoomScale }],
            },
          ]}
        >
          {/* 1. Rich Cartographic Base (Streets, Parks, Waterway) */}
          <View style={styles.terrainBase} />
          <View style={styles.parkCentral} />
          <View style={styles.parkEast} />
          <View style={styles.waterwayCanal} />

          {/* Connaught Circular Plazas */}
          <View style={styles.connaughtOuter} />
          <View style={styles.connaughtInner} />

          {/* Major Radial Boulevards */}
          <View style={styles.avenueJanpath} />
          <View style={styles.avenueBarakhamba} />
          <View style={styles.avenueSansad} />
          <View style={styles.avenueKG} />

          {/* Street Name Typography */}
          <Text style={styles.streetLabelJanpath}>Janpath Blvd</Text>
          <Text style={styles.streetLabelBarakhamba}>Barakhamba Rd</Text>
          <Text style={styles.streetLabelConnaught}>Connaught Place</Text>

          {/* 2. Safety Zones Layer */}
          <View style={styles.zonesLayer}>
            {zones.map((zone, idx) => {
              const zoneColor =
                zone.level === 'green'
                  ? 'rgba(52, 199, 89, 0.2)'
                  : zone.level === 'yellow'
                  ? 'rgba(255, 149, 0, 0.2)'
                  : 'rgba(255, 59, 48, 0.22)';
              const borderColor =
                zone.level === 'green'
                  ? Colors.green
                  : zone.level === 'yellow'
                  ? Colors.yellow
                  : Colors.red;

              const topPercent = 20 + ((idx * 24) % 55);
              const leftPercent = 16 + ((idx * 28) % 60);

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
                  onPress={() => {
                    setSelectedItemName(`${zone.level.toUpperCase()} ZONE (${zone.safetyScore}/100)`);
                    onSelectZone && onSelectZone(zone);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.zoneBadge, { borderColor }]}>
                    <Text style={[styles.zoneLabel, { color: borderColor }]}>
                      {zone.level.toUpperCase()} ({zone.safetyScore})
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. Monitored Route Track */}
          {routePolyline.length > 0 && (
            <View style={styles.routeTrackContainer}>
              <View style={styles.routeTrackGlow} />
              <View style={styles.routeTrackPath} />
            </View>
          )}

          {/* 4. Incident Markers */}
          {reports.slice(0, 5).map((rep, idx) => {
            const top = 28 + ((idx * 17) % 48);
            const left = 24 + ((idx * 27) % 58);
            return (
              <TouchableOpacity
                key={rep.id}
                style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
                onPress={() => {
                  setSelectedItemName(`⚠️ ${rep.title} · ${rep.status}`);
                  onSelectReport && onSelectReport(rep);
                }}
              >
                <View style={[styles.pinCircle, { backgroundColor: Colors.yellow }]}>
                  <MaterialCommunityIcons name="alert-outline" size={12} color="#ffffff" />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* 5. Safe Haven Points */}
          {helpPoints.slice(0, 4).map((item, idx) => {
            const top = 16 + ((idx * 25) % 62);
            const left = 60 + ((idx * 15) % 28);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
                onPress={() => {
                  const dist = (item.distanceMeters / 1000).toFixed(1);
                  setSelectedItemName(`🏥 ${item.name} (${dist} km)`);
                  onSelectHelpPoint && onSelectHelpPoint(item);
                }}
              >
                <View style={[styles.pinCircle, { backgroundColor: Colors.primary }]}>
                  <MaterialCommunityIcons name="shield-check" size={12} color="#ffffff" />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* 6. User Current Location Beacon */}
          <View style={styles.userBeaconContainer}>
            <View style={styles.userPulseRing} />
            <View style={styles.userDot}>
              <MaterialCommunityIcons name="crosshairs-gps" size={13} color="#ffffff" />
            </View>
          </View>

          {/* 7. Active Deviation Alert Indicator */}
          {activeDeviationPoint && (
            <View style={styles.deviationBeaconContainer}>
              <View style={styles.deviationPulse} />
              <View style={[styles.pinCircle, { backgroundColor: Colors.red }]}>
                <MaterialCommunityIcons name="map-marker-alert" size={12} color="#ffffff" />
              </View>
            </View>
          )}
        </View>
      </Pressable>

      {/* Floating Apple Map Zoom Controls */}
      <View style={styles.controlsCluster}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          onPress={handleZoomIn}
          style={[styles.controlBtn, zoomIndex === ZOOM_STEPS.length - 1 && styles.controlBtnDisabled]}
          activeOpacity={0.8}
        >
          <Text style={styles.controlBtnText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          onPress={handleZoomOut}
          style={[styles.controlBtn, zoomIndex === 0 && styles.controlBtnDisabled]}
          activeOpacity={0.8}
        >
          <Text style={styles.controlBtnText}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Recenter location"
          onPress={handleReset}
          style={styles.controlBtn}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Selected Item Tooltip Banner */}
      {selectedItemName && (
        <View style={styles.infoBanner}>
          <Text numberOfLines={1} style={styles.infoBannerText}>
            {selectedItemName}
          </Text>
        </View>
      )}

      {/* Bottom HUD: Legend & Coordinates */}
      <View style={styles.mapHud}>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.green }]} />
            <Text style={styles.legendText}>Safe</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.yellow }]} />
            <Text style={styles.legendText}>Caution</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.red }]} />
            <Text style={styles.legendText}>Concern</Text>
          </View>
          <Text style={styles.legendZoomText}>| Zoom: {zoomScale.toFixed(1)}x</Text>
        </View>

        <View style={styles.coordinatesPill}>
          <MaterialCommunityIcons name="crosshairs" size={12} color={Colors.primary} />
          <Text style={styles.coordinatesText}>
            {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    width: '100%',
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.lg, // 18px
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e0e0e0', // 1px hairline border
  },
  interactiveArea: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapWorld: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  // 1. Cartographic Base
  terrainBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f6f6f8',
  },
  parkCentral: {
    position: 'absolute',
    top: '34%',
    left: '36%',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#ceead6',
  },
  parkEast: {
    position: 'absolute',
    top: '12%',
    right: '8%',
    width: 90,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#ceead6',
  },
  waterwayCanal: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '32%',
    width: 14,
    backgroundColor: '#e1f0fe',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#c2e0fc',
    transform: [{ skewX: '-18deg' }],
  },
  connaughtOuter: {
    position: 'absolute',
    top: '26%',
    left: '28%',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#ffffff',
  },
  connaughtInner: {
    position: 'absolute',
    top: '30%',
    left: '32%',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  avenueJanpath: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '48%',
    width: 12,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e5ea',
  },
  avenueBarakhamba: {
    position: 'absolute',
    top: '10%',
    bottom: '10%',
    left: '24%',
    width: 10,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e5ea',
    transform: [{ rotate: '42deg' }],
  },
  avenueSansad: {
    position: 'absolute',
    top: '10%',
    bottom: '10%',
    right: '24%',
    width: 10,
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#e5e5ea',
    transform: [{ rotate: '-42deg' }],
  },
  avenueKG: {
    position: 'absolute',
    top: '46%',
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e5ea',
  },
  streetLabelJanpath: {
    position: 'absolute',
    top: '10%',
    left: '51%',
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
  },
  streetLabelBarakhamba: {
    position: 'absolute',
    top: '70%',
    left: '16%',
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
  },
  streetLabelConnaught: {
    position: 'absolute',
    top: '39%',
    left: '36%',
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#1d1d1f',
  },

  // 2. Zones
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
  zoneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  zoneLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // 3. Routes
  routeTrackContainer: {
    ...StyleSheet.absoluteFill,
  },
  routeTrackGlow: {
    position: 'absolute',
    top: '32%',
    left: '36%',
    width: '32%',
    height: 10,
    backgroundColor: 'rgba(0, 102, 204, 0.25)',
    borderRadius: 5,
    transform: [{ rotate: '36deg' }],
  },
  routeTrackPath: {
    position: 'absolute',
    top: '32%',
    left: '36%',
    width: '32%',
    height: 4,
    backgroundColor: Colors.primary,
    borderRadius: 2,
    transform: [{ rotate: '36deg' }],
  },

  // 4. Markers
  markerPin: {
    position: 'absolute',
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -13 }, { translateY: -13 }],
  },
  pinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 5. User Beacon
  userBeaconContainer: {
    position: 'absolute',
    top: '50%',
    left: '48%',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -22 }, { translateY: -22 }],
  },
  userPulseRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 102, 204, 0.2)',
  },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 6. Deviation
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
    backgroundColor: 'rgba(255, 59, 48, 0.3)',
  },

  // Controls Cluster
  controlsCluster: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 100,
    gap: 8,
  },
  controlBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnDisabled: {
    opacity: 0.4,
  },
  controlBtnText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 20,
    fontWeight: '600',
    color: '#1d1d1f',
    marginTop: -2,
  },

  // Info Banner
  infoBanner: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 68,
    backgroundColor: 'rgba(29, 29, 31, 0.92)',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    zIndex: 100,
  },
  infoBannerText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 12,
    color: '#ffffff',
  },

  // Bottom HUD
  mapHud: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    gap: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: '#1d1d1f',
  },
  legendZoomText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: '#8e8e93',
  },
  coordinatesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    gap: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  coordinatesText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: '#1d1d1f',
  },
});
