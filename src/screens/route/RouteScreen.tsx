import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { SafeMapView } from '../../components/maps/SafeMapView';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { DeviationAlertModal } from '../../components/sos/DeviationAlertModal';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { useLocation } from '../../context/LocationContext';
import { useJourney } from '../../context/JourneyContext';
import { useSOS } from '../../context/SOSContext';
import { MOCK_ROUTES } from '../../services/mock/mockData';
import { RouteOption } from '../../types';
import { formatDistance, formatDuration } from '../../utils/geo';

interface RouteScreenProps {
  navigation: any;
}

export const RouteScreen: React.FC<RouteScreenProps> = ({ navigation }) => {
  const { location, simulateMove } = useLocation();
  const {
    activeJourney,
    selectedRoute,
    isJourneyActive,
    deviationAlertActive,
    currentDeviationDistance,
    startJourney,
    pauseJourney,
    resumeJourney,
    endJourney,
    setSelectedRoute,
    dismissDeviationAsSafe,
    recalculateRoute,
    shareLocationWithCircle,
    triggerSOSFromJourney,
  } = useJourney();
  const { openSOSConfirmation } = useSOS();

  const [originText, setOriginText] = useState<string>('My Current Location');
  const [destinationText, setDestinationText] = useState<string>('City Central Metro Interchange');
  const [availableRoutes] = useState<RouteOption[]>(MOCK_ROUTES);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);

  const currentRoute = selectedRoute || availableRoutes[activeRouteIndex];

  const handleStartJourney = async () => {
    await startJourney(currentRoute, originText, destinationText);
    Alert.alert(
      'Journey Monitoring Started',
      'SafeWalk is now actively monitoring your path and lighting conditions. Keep your phone with you.'
    );
  };

  const handleEndJourney = () => {
    Alert.alert(
      'End Journey',
      'Have you arrived safely at your destination?',
      [
        { text: 'Keep Tracking', style: 'cancel' },
        {
          text: 'Arrived Safely',
          style: 'default',
          onPress: async () => {
            await endJourney();
            Alert.alert('Journey Completed', 'Glad you arrived safely! Journey log saved.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Route Planning"
        subtitle={isJourneyActive ? 'Live Journey Monitoring Active' : 'Compare routes with safety scoring'}
        onOpenHeroes={() => navigation.navigate('SafeHeroes')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Origin & Destination Inputs (When not actively journeying) */}
        {!isJourneyActive ? (
          <Card style={styles.searchCard}>
            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="crosshairs-gps" size={20} color={Colors.green} />
              <TextInput
                value={originText}
                onChangeText={setOriginText}
                placeholder="Starting location"
                style={styles.textInput}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.inputRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color={Colors.red} />
              <TextInput
                value={destinationText}
                onChangeText={setDestinationText}
                placeholder="Where to? (Destination)"
                style={styles.textInput}
              />
            </View>
          </Card>
        ) : (
          /* Active Journey Live HUD */
          <Card style={styles.activeJourneyCard}>
            <View style={styles.activeHeader}>
              <View style={styles.pulsingDot} />
              <Text style={styles.activeStatusText}>
                {activeJourney?.status === 'paused' ? 'MONITORING PAUSED' : 'LIVE ROUTE MONITORING ACTIVE'}
              </Text>
            </View>

            <Text style={styles.activeRouteTitle}>{activeJourney?.selectedRoute.title}</Text>
            <Text style={styles.activeDestinationText}>To: {activeJourney?.destinationName}</Text>

            <View style={styles.activeStatsRow}>
              <View style={styles.activeStat}>
                <Text style={styles.statLabel}>Distance</Text>
                <Text style={styles.statValue}>
                  {formatDistance(activeJourney?.selectedRoute.distanceMeters || 0)}
                </Text>
              </View>
              <View style={styles.activeStat}>
                <Text style={styles.statLabel}>Est. Time</Text>
                <Text style={styles.statValue}>
                  {formatDuration(activeJourney?.selectedRoute.durationSeconds || 0)}
                </Text>
              </View>
              <View style={styles.activeStat}>
                <Text style={styles.statLabel}>Safety Score</Text>
                <Text style={[styles.statValue, { color: Colors.green }]}>
                  {activeJourney?.selectedRoute.safetyScore}/100
                </Text>
              </View>
            </View>

            <View style={styles.activeActionsRow}>
              {activeJourney?.status === 'paused' ? (
                <Button
                  title="Resume"
                  size="sm"
                  variant="primary"
                  onPress={resumeJourney}
                  icon={<MaterialCommunityIcons name="play" size={16} color="#FFF" />}
                />
              ) : (
                <Button
                  title="Pause"
                  size="sm"
                  variant="outline"
                  onPress={pauseJourney}
                  icon={<MaterialCommunityIcons name="pause" size={16} color={Colors.text} />}
                />
              )}

              <Button
                title="End Journey"
                size="sm"
                variant="outline"
                onPress={handleEndJourney}
                icon={<MaterialCommunityIcons name="check" size={16} color={Colors.green} />}
              />

              <Button
                title="Emergency SOS"
                size="sm"
                variant="danger"
                onPress={openSOSConfirmation}
                icon={<MaterialCommunityIcons name="alert-octagon" size={16} color="#FFF" />}
              />
            </View>

            {/* Development / Testing Simulation Helper */}
            <View style={styles.simulationBar}>
              <Text style={styles.simLabel}>Dev GPS Simulation:</Text>
              <TouchableOpacity
                style={styles.simBtn}
                onPress={() => simulateMove(0.0015, 0.0015)} // Triggers ~150m deviation
              >
                <Text style={styles.simBtnText}>Test Route Deviation (+150m)</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}

        {/* Map with Selected Route */}
        <SafeMapView
          currentLocation={location}
          routePolyline={currentRoute.polyline}
          height={280}
        />

        {/* Route Alternatives Comparison (When planning) */}
        {!isJourneyActive && (
          <View style={styles.routesContainer}>
            <Text style={styles.sectionTitle}>Available Routes</Text>

            {availableRoutes.map((route, index) => {
              const isSelected = activeRouteIndex === index;
              return (
                <TouchableOpacity
                  key={route.id}
                  activeOpacity={0.85}
                  onPress={() => {
                    setActiveRouteIndex(index);
                    setSelectedRoute(route);
                  }}
                >
                  <Card
                    style={
                      [
                        styles.routeCard,
                        isSelected && styles.routeCardSelected,
                      ] as any
                    }
                  >
                    <View style={styles.routeCardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.routeTitle}>{route.title}</Text>
                        <Text style={styles.routeSubtitle}>{route.subtitle}</Text>
                      </View>
                      <Badge
                        label={`${route.safetyScore}/100 SAFE`}
                        type={route.safetyScore >= 80 ? 'green' : route.safetyScore >= 60 ? 'yellow' : 'red'}
                      />
                    </View>

                    <View style={styles.metricsRow}>
                      <View style={styles.metricItem}>
                        <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.textSecondary} />
                        <Text style={styles.metricText}>{formatDuration(route.durationSeconds)}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <MaterialCommunityIcons name="map-marker-distance" size={16} color={Colors.textSecondary} />
                        <Text style={styles.metricText}>{formatDistance(route.distanceMeters)}</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <MaterialCommunityIcons name="lightbulb-on" size={16} color={Colors.yellowText} />
                        <Text style={styles.metricText}>{route.lightingPercentage}% Lit</Text>
                      </View>
                      <View style={styles.metricItem}>
                        <MaterialCommunityIcons name="cctv" size={16} color={Colors.green} />
                        <Text style={styles.metricText}>{route.cctvPercentage}% CCTV</Text>
                      </View>
                    </View>

                    {/* Safety Highlights & Considerations */}
                    <View style={styles.prosConsBox}>
                      {route.safetyPros.map((pro, pIdx) => (
                        <View key={`pro_${pIdx}`} style={styles.bulletRow}>
                          <MaterialCommunityIcons name="check-circle" size={14} color={Colors.green} />
                          <Text style={styles.proText}>{pro}</Text>
                        </View>
                      ))}
                      {route.safetyCons.map((con, cIdx) => (
                        <View key={`con_${cIdx}`} style={styles.bulletRow}>
                          <MaterialCommunityIcons name="alert-circle" size={14} color={Colors.red} />
                          <Text style={styles.conText}>{con}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}

            <Button
              title={`Start Journey via ${currentRoute.title}`}
              size="lg"
              variant="primary"
              icon={<MaterialCommunityIcons name="navigation-variant" size={22} color="#FFF" />}
              onPress={handleStartJourney}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        )}
      </ScrollView>

      {/* Route Deviation Prompt Modal (Requirement from Section 5) */}
      <DeviationAlertModal
        visible={deviationAlertActive}
        deviationDistanceMeters={currentDeviationDistance}
        onSafe={dismissDeviationAsSafe}
        onRecalculate={recalculateRoute}
        onShareLocation={shareLocationWithCircle}
        onActivateSOS={() => {
          triggerSOSFromJourney();
          openSOSConfirmation();
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.lg,
  },
  searchCard: {
    gap: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.text,
  },
  activeJourneyCard: {
    backgroundColor: Colors.primary,
    gap: Spacing.sm,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.green,
  },
  activeStatusText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '800',
    color: Colors.greenLight,
    letterSpacing: 0.8,
  },
  activeRouteTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '800',
    color: '#FFF',
  },
  activeDestinationText: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textMuted,
  },
  activeStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
  activeStat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
  },
  statValue: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 2,
  },
  activeActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  simulationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    padding: 8,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  simLabel: {
    fontSize: 10,
    color: '#FFF',
  },
  simBtn: {
    backgroundColor: Colors.yellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  simBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  routesContainer: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  routeCard: {
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  routeCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: '#FBFBFF',
    ...Shadows.medium,
  },
  routeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  routeSubtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  prosConsBox: {
    gap: 4,
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  proText: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
  },
  conText: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.redText,
  },
});

