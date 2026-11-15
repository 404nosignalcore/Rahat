import React, { useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IncidentReport, RiskZone, RouteOption, SafeHaven } from '../../types/safety';
import { Colors, BorderRadius, TypographyStyles } from '../../theme';

export type GoogleMapType = 'roadmap' | 'satellite' | 'terrain';

const GOOGLE_MAP_LYRS: Record<GoogleMapType, string> = {
  roadmap: 'm',
  satellite: 'y',
  terrain: 'p',
};

function latLngToTile(lat: number, lng: number, zoom: number) {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y, z: zoom };
}

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
  safe: { color: '#34c759', bg: 'rgba(52, 199, 89, 0.22)', label: 'SAFE' },
  caution: { color: '#ff9500', bg: 'rgba(255, 149, 0, 0.22)', label: 'CAUTION' },
  danger: { color: '#ff3b30', bg: 'rgba(255, 59, 48, 0.24)', label: 'CONCERN' },
};

const ZOOM_STEPS = [1.0, 1.35, 1.75, 2.2];

export const SafetyMapView: React.FC<SafetyMapViewProps> = ({
  height = 360,
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
  const [zoomIndex, setZoomIndex] = useState<number>(0);
  const [selectedPinInfo, setSelectedPinInfo] = useState<string | null>(null);
  const [mapType, setMapType] = useState<GoogleMapType>('roadmap');
  const [tilesLoaded, setTilesLoaded] = useState<boolean>(true);

  const zoomScale = ZOOM_STEPS[zoomIndex];
  const selectedRoute = routes.find((r) => r.id === selectedRouteId);
  const centerTile = latLngToTile(userLocation.lat, userLocation.lng, 15);
  const lyrs = GOOGLE_MAP_LYRS[mapType];

  const handleZoomIn = () => {
    setZoomIndex((prev) => Math.min(prev + 1, ZOOM_STEPS.length - 1));
  };

  const handleZoomOut = () => {
    setZoomIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleReset = () => {
    setZoomIndex(0);
    setSelectedPinInfo(null);
  };

  const handleCanvasPress = (e: any) => {
    if (pickMode && onPickCoordinate) {
      const { locationX, locationY } = e.nativeEvent;
      const latOffset = ((height / 2 - locationY) / (height / 2)) * 0.012;
      const lngOffset = ((locationX - 180) / 180) * 0.012;
      onPickCoordinate(userLocation.lat + latOffset, userLocation.lng + lngOffset);
    } else {
      setSelectedPinInfo(null);
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      <Pressable onPress={handleCanvasPress} style={styles.interactiveCanvas}>
        {/* Scaled Map World Container */}
        <View
          style={[
            styles.mapWorld,
            {
              transform: [{ scale: zoomScale }],
            },
          ]}
        >
          {/* 1. Official Google Maps Tile Background Grid */}
          {tilesLoaded && (
            <View style={styles.tileGridContainer}>
              {[-1, 0, 1].map((dy) => (
                <View key={`row-${dy}`} style={styles.tileRow}>
                  {[-1, 0, 1].map((dx) => {
                    const tx = centerTile.x + dx;
                    const ty = centerTile.y + dy;
                    const tileUri = `https://mt1.google.com/vt/lyrs=${lyrs}&x=${tx}&y=${ty}&z=15`;
                    return (
                      <Image
                        key={`${tx}-${ty}`}
                        source={{ uri: tileUri }}
                        style={styles.googleMapTile}
                        resizeMode="cover"
                        onError={() => setTilesLoaded(false)}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* Fallback Vector Terrain (renders if offline or while tiles load) */}
          <View style={styles.terrainBase} />
          {!tilesLoaded && (
            <>
              {/* Lush Green Parks & Public Spaces */}
              <View style={styles.parkCentral} />
              <View style={styles.parkEast} />
              <View style={styles.parkSouth} />

              {/* Waterway / Canal Feature */}
              <View style={styles.waterwayCanal} />

              {/* Arterial Road Grid & Roundabouts */}
              <View style={styles.connaughtOuter} />
              <View style={styles.connaughtInner} />

              {/* Major Avenues */}
              <View style={styles.avenueJanpath} />
              <View style={styles.avenueBarakhamba} />
              <View style={styles.avenueSansad} />
              <View style={styles.avenueKG} />
              <View style={styles.avenueCrossA} />
              <View style={styles.avenueCrossB} />

              {/* Street Labels */}
              <Text style={styles.streetLabelJanpath}>Janpath Blvd</Text>
              <Text style={styles.streetLabelBarakhamba}>Barakhamba Rd</Text>
              <Text style={styles.streetLabelConnaught}>Connaught Place</Text>
              <Text style={styles.streetLabelSansad}>Sansad Marg</Text>
            </>
          )}

          {/* 2. Safety Zones Layer */}
          <View style={styles.zonesLayer}>
            {zones.map((zone, idx) => {
              const cfg = RISK_THEME[zone.level] || RISK_THEME.safe;
              const topPercent = 22 + ((idx * 26) % 52);
              const leftPercent = 18 + ((idx * 29) % 58);

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
                  onPress={() => {
                    setSelectedPinInfo(`${zone.name} (${zone.safetyScore}/100 · ${zone.level.toUpperCase()})`);
                    onSelectZone?.(zone);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={[styles.zoneBadge, { borderColor: cfg.color }]}>
                    <Text style={[styles.zoneLabel, { color: cfg.color }]}>
                      {zone.name.split(' ')[0]} ({zone.safetyScore})
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. Monitored Route Corridor */}
          {selectedRoute && (
            <View style={styles.routeTrackContainer}>
              <View style={styles.routeTrackGlow} />
              <View style={styles.routeTrackPath} />
              {/* Waypoint lighting dots */}
              <View style={[styles.waypointDot, { top: '35%', left: '42%' }]} />
              <View style={[styles.waypointDot, { top: '48%', left: '50%' }]} />
              <View style={[styles.waypointDot, { top: '62%', left: '58%' }]} />
            </View>
          )}

          {/* 4. Incident Markers */}
          {reports.slice(0, 5).map((rep, idx) => {
            const top = 26 + ((idx * 18) % 48);
            const left = 24 + ((idx * 26) % 58);
            return (
              <TouchableOpacity
                key={rep.id}
                style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
                onPress={() => {
                  setSelectedPinInfo(`⚠️ ${rep.title} (${rep.verificationStatus})`);
                  onSelectReport?.(rep);
                }}
              >
                <View
                  style={[
                    styles.pinCircle,
                    { backgroundColor: rep.severity >= 4 ? '#ff3b30' : '#ff9500' },
                  ]}
                >
                  <Ionicons name="warning" size={10} color="#ffffff" />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* 5. Safe Haven Sanctuary Points */}
          {safeHavens.slice(0, 4).map((haven, idx) => {
            const top = 16 + ((idx * 24) % 62);
            const left = 58 + ((idx * 16) % 30);
            return (
              <TouchableOpacity
                key={haven.id}
                style={[styles.markerPin, { top: `${top}%`, left: `${left}%` }]}
                onPress={() => {
                  setSelectedPinInfo(`🏥 ${haven.name} · Safe Haven`);
                }}
              >
                <View style={[styles.pinCircle, { backgroundColor: '#0066cc' }]}>
                  <Ionicons name="shield-checkmark" size={11} color="#ffffff" />
                </View>
              </TouchableOpacity>
            );
          })}

          {/* 6. User GPS Location Beacon */}
          <View style={styles.userBeaconContainer}>
            <View style={styles.userPulseRing} />
            <View style={styles.userDot}>
              <Ionicons name="navigate" size={13} color="#ffffff" />
            </View>
          </View>
        </View>
      </Pressable>

      {/* Top Left: Apple-Frosted Google Maps Mode Selector ([Map] [Satellite] [Terrain]) */}
      <View style={styles.mapTypeSelector}>
        {(['roadmap', 'satellite', 'terrain'] as GoogleMapType[]).map((type) => {
          const isActive = mapType === type;
          const labels: Record<GoogleMapType, string> = {
            roadmap: 'Map',
            satellite: 'Satellite',
            terrain: 'Terrain',
          };
          return (
            <TouchableOpacity
              key={type}
              onPress={() => setMapType(type)}
              style={[
                styles.mapTypeBtn,
                isActive && styles.mapTypeBtnActive,
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.mapTypeBtnText,
                  isActive && styles.mapTypeBtnTextActive,
                ]}
              >
                {labels[type]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Floating Apple Map Zoom Controls ({component.button-icon-circular} 40x40px) */}
      <View style={styles.controlsCluster}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom in map preview"
          onPress={handleZoomIn}
          style={[styles.controlBtn, zoomIndex === ZOOM_STEPS.length - 1 && styles.controlBtnDisabled]}
          activeOpacity={0.8}
        >
          <Text style={styles.controlBtnText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Zoom out map preview"
          onPress={handleZoomOut}
          style={[styles.controlBtn, zoomIndex === 0 && styles.controlBtnDisabled]}
          activeOpacity={0.8}
        >
          <Text style={styles.controlBtnText}>−</Text>
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Recenter location map preview"
          onPress={handleReset}
          style={styles.controlBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="locate" size={18} color="#0066cc" />
        </TouchableOpacity>
      </View>

      {/* Dynamic Pin Tooltip Banner */}
      {selectedPinInfo && (
        <View style={styles.infoBanner}>
          <Text numberOfLines={1} style={styles.infoBannerText}>
            {selectedPinInfo}
          </Text>
        </View>
      )}

      {/* Bottom Bar: Google Brand Watermark & Safety Legend Pill */}
      <View style={styles.bottomCluster}>
        {/* Google Maps Watermark Badge */}
        <View style={styles.googleBadge}>
          <Text style={[styles.googleLetter, { color: '#4285F4' }]}>G</Text>
          <Text style={[styles.googleLetter, { color: '#EA4335' }]}>o</Text>
          <Text style={[styles.googleLetter, { color: '#FBBC05' }]}>o</Text>
          <Text style={[styles.googleLetter, { color: '#4285F4' }]}>g</Text>
          <Text style={[styles.googleLetter, { color: '#34A853' }]}>l</Text>
          <Text style={[styles.googleLetter, { color: '#EA4335' }]}>e</Text>
        </View>

        {/* Map Legend Pill */}
        <View style={styles.legendPill}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#34c759' }]} />
            <Text style={styles.legendText}>Safe</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff9500' }]} />
            <Text style={styles.legendText}>Caution</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff3b30' }]} />
            <Text style={styles.legendText}>Concern</Text>
          </View>
          <Text style={styles.legendZoomText}>| Zoom: {zoomScale.toFixed(1)}x</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#f5f5f7',
    borderRadius: BorderRadius.lg, // 18px
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e0e0e0', // 1px hairline border
  },
  interactiveCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapWorld: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },

  // 1. Google Maps Tile Layer
  tileGridContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileRow: {
    flexDirection: 'row',
  },
  googleMapTile: {
    width: 256,
    height: 256,
  },

  // 1b. Cartographic Visual Background (Fallback)
  terrainBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#f6f6f8',
  },
  parkCentral: {
    position: 'absolute',
    top: '36%',
    left: '38%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#ceead6',
  },
  parkEast: {
    position: 'absolute',
    top: '15%',
    right: '8%',
    width: 100,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#e6f4ea',
    borderWidth: 1,
    borderColor: '#ceead6',
  },
  parkSouth: {
    position: 'absolute',
    bottom: '12%',
    left: '12%',
    width: 120,
    height: 70,
    borderRadius: 20,
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
    top: '28%',
    left: '30%',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 6,
    borderColor: '#ffffff',
  },
  connaughtInner: {
    position: 'absolute',
    top: '32%',
    left: '34%',
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
    left: '25%',
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
    right: '25%',
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
  avenueCrossA: {
    position: 'absolute',
    top: '20%',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ebebf0',
  },
  avenueCrossB: {
    position: 'absolute',
    bottom: '22%',
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#ebebf0',
  },
  streetLabelJanpath: {
    position: 'absolute',
    top: '12%',
    left: '51%',
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
    letterSpacing: 0.5,
  },
  streetLabelBarakhamba: {
    position: 'absolute',
    top: '68%',
    left: '18%',
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
  },
  streetLabelConnaught: {
    position: 'absolute',
    top: '40%',
    left: '37%',
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    color: '#1d1d1f',
  },
  streetLabelSansad: {
    position: 'absolute',
    bottom: '8%',
    right: '20%',
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 9,
    fontWeight: '600',
    color: '#8e8e93',
  },

  // 2. Zones
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
  zoneBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  zoneLabel: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // 3. Routes
  routeTrackContainer: {
    ...StyleSheet.absoluteFill,
  },
  routeTrackGlow: {
    position: 'absolute',
    top: '32%',
    left: '38%',
    width: '32%',
    height: 10,
    backgroundColor: 'rgba(52, 199, 89, 0.3)',
    borderRadius: 5,
    transform: [{ rotate: '36deg' }],
  },
  routeTrackPath: {
    position: 'absolute',
    top: '32%',
    left: '38%',
    width: '32%',
    height: 4,
    backgroundColor: '#34c759',
    borderRadius: 2,
    transform: [{ rotate: '36deg' }],
  },
  waypointDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#34c759',
  },

  // 4. Markers
  markerPin: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -14 }, { translateY: -14 }],
  },
  pinCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 3,
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
    backgroundColor: 'rgba(0, 102, 204, 0.18)',
  },
  userDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0066cc',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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

  // Google Maps Mode Selector
  mapTypeSelector: {
    position: 'absolute',
    top: 14,
    left: 14,
    zIndex: 100,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 3,
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mapTypeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: BorderRadius.pill,
  },
  mapTypeBtnActive: {
    backgroundColor: Colors.primary,
  },
  mapTypeBtnText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    fontWeight: '400',
    color: '#1d1d1f',
  },
  mapTypeBtnTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Info Banner
  infoBanner: {
    position: 'absolute',
    top: 54,
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

  // Bottom Cluster
  bottomCluster: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },
  googleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  googleLetter: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Legend
  legendPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: BorderRadius.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
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
});
