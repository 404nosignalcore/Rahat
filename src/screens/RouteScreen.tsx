import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeWalk } from '../context/SafeWalkContext';
import { getTranslation } from '../i18n/translations';
import { getRiskCategory } from '../utils/safetyRiskEngine';
import { SafetyMapView } from '../components/map/SafetyMapView';
import { AppIcon } from '../components/ui/AppIcon';

export const RouteScreen: React.FC = () => {
  const {
    language,
    theme,
    user,
    zones,
    safeHavens,
    currentLocation,
    routes,
    selectedRoute,
    setSelectedRoute,
    searchRoutes,
    journey,
    deviationAlertVisible,
    startJourney,
    pauseOrResumeJourney,
    endJourney,
    toggleJourneyShare,
    simulateRouteDeviation,
    simulateGpsLoss,
    respondToDeviation,
    safeCircles,
  } = useSafeWalk();

  const t = getTranslation(language);
  const { width } = useWindowDimensions();
  const isWide = width >= 960;

  const [originInput, setOriginInput] = useState(selectedRoute.originLabel);
  const [destInput, setDestInput] = useState(selectedRoute.destinationLabel);

  const handleFindRoutes = async () => {
    await searchRoutes(originInput, destInput);
  };

  const primaryCircleId = safeCircles[0]?.id || 'circle-family';
  const isShared = Boolean(journey.sharedWithCircleId);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Anti-False-Alarm Route Deviation Alert Card (NEVER auto-triggers SOS) */}
      {deviationAlertVisible && (
        <View
          testID="route-deviation-alert"
          style={[
            styles.deviationCard,
            { backgroundColor: theme.colors.cautionBg, borderColor: theme.colors.cautionBorder },
          ]}
        >
          <View style={styles.deviationHeader}>
            <AppIcon name="sos" size={20} color={theme.colors.cautionAmber} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.deviationTitle, { color: theme.colors.textPrimary }]}>
                {t.deviation.title} ({Math.round(journey.deviationMeters)}m off planned route)
              </Text>
              <Text style={[styles.deviationSub, { color: theme.colors.textSecondary }]}>
                {t.deviation.subtitle}
              </Text>
            </View>
          </View>

          <View style={styles.deviationActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.deviation.imSafe}
              onPress={() => respondToDeviation('im_safe')}
              style={[styles.devBtn, { backgroundColor: theme.colors.safeGreen }]}
            >
              <Text style={styles.devBtnText}>{t.deviation.imSafe}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.deviation.recalculate}
              onPress={() => respondToDeviation('recalculate')}
              style={[styles.devBtn, { backgroundColor: theme.colors.navyPrimary }]}
            >
              <Text style={styles.devBtnText}>{t.deviation.recalculate}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.deviation.shareLocation}
              onPress={() => respondToDeviation('share_location')}
              style={[styles.devBtn, { backgroundColor: theme.colors.accentViolet }]}
            >
              <Text style={styles.devBtnText}>{t.deviation.shareLocation}</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.deviation.activateSos}
              onPress={() => respondToDeviation('activate_sos')}
              style={[styles.devBtn, { backgroundColor: theme.colors.dangerRed }]}
            >
              <Text style={styles.devBtnText}>{t.deviation.activateSos}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Origin & Destination Route Planner */}
      <View
        style={[
          styles.card,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Safe Route Planner & Live Journey Monitoring
        </Text>
        <View style={[styles.plannerInputs, isWide && { flexDirection: 'row' }]}>
          <TextInput
            accessibilityLabel="Origin location"
            placeholder="Origin (e.g. Janpath Metro Gate 2)"
            placeholderTextColor={theme.colors.textMuted}
            value={originInput}
            onChangeText={setOriginInput}
            style={[
              styles.input,
              isWide && { flex: 1 },
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />
          <TextInput
            accessibilityLabel="Destination location"
            placeholder="Destination (e.g. Mandi House Campus)"
            placeholderTextColor={theme.colors.textMuted}
            value={destInput}
            onChangeText={setDestInput}
            style={[
              styles.input,
              isWide && { flex: 1 },
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compare safer routes"
            onPress={handleFindRoutes}
            style={[styles.findBtn, { backgroundColor: theme.colors.accentViolet }]}
          >
            <AppIcon name="search" size={16} color="#FFFFFF" />
            <Text style={styles.findBtnText}>Compare Routes</Text>
          </Pressable>
        </View>
      </View>

      {/* Map + Route Options Grid */}
      <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
        <View style={[styles.mapColumn, isWide && styles.mapColumnWide]}>
          <SafetyMapView
            height={isWide ? 410 : 280}
            zones={zones}
            safeHavens={safeHavens}
            routes={routes}
            selectedRouteId={selectedRoute.id}
            userLocation={{ lat: currentLocation.lat, lng: currentLocation.lng }}
          />

          {/* Live Journey Control Bar */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.journeyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.journeyTitle, { color: theme.colors.textPrimary }]}>
                  Journey Status:{' '}
                  {journey.status === 'idle'
                    ? 'Ready to Start'
                    : journey.status === 'active'
                    ? 'Live Monitoring Active'
                    : journey.status === 'paused'
                    ? 'Paused'
                    : 'Completed'}
                </Text>
                <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                  GPS:{' '}
                  {journey.gpsSignalStatus === 'lost'
                    ? 'Signal Lost (Last known coords preserved)'
                    : `${journey.gpsSignalStatus.toUpperCase()} (${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})`}{' '}
                  · Background Tracking:{' '}
                  {user.consents.backgroundTrackingConsent ? 'Consented' : 'Foreground Only'}
                </Text>
              </View>
            </View>

            <View style={styles.journeyBtnsRow}>
              {journey.status === 'idle' || journey.status === 'completed' ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Start Journey Monitoring"
                  onPress={startJourney}
                  style={[styles.journeyPrimaryBtn, { backgroundColor: theme.colors.safeGreen }]}
                >
                  <AppIcon name="play" size={16} color="#FFFFFF" />
                  <Text style={styles.journeyPrimaryText}>Start Journey</Text>
                </Pressable>
              ) : (
                <>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={journey.status === 'paused' ? 'Resume Journey' : 'Pause Journey'}
                    onPress={pauseOrResumeJourney}
                    style={[styles.journeySecondaryBtn, { backgroundColor: theme.colors.navyPrimary }]}
                  >
                    <AppIcon
                      name={journey.status === 'paused' ? 'play' : 'pause'}
                      size={15}
                      color={theme.colors.navyText}
                    />
                    <Text style={[styles.journeySecondaryText, { color: theme.colors.navyText }]}>
                      {journey.status === 'paused' ? 'Resume' : 'Pause'}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="End Journey"
                    onPress={endJourney}
                    style={[styles.journeySecondaryBtn, { backgroundColor: theme.colors.dangerRed }]}
                  >
                    <Text style={[styles.journeySecondaryText, { color: '#FFFFFF' }]}>End</Text>
                  </Pressable>
                </>
              )}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isShared ? 'Stop sharing journey' : 'Share journey with SafeCircle'}
                onPress={() => toggleJourneyShare(primaryCircleId)}
                style={[
                  styles.journeyOutlineBtn,
                  {
                    backgroundColor: isShared
                      ? theme.colors.accentVioletSoft
                      : theme.colors.surfaceAlt,
                    borderColor: isShared ? theme.colors.accentViolet : theme.colors.border,
                  },
                ]}
              >
                <AppIcon
                  name="share"
                  size={14}
                  color={isShared ? theme.colors.accentViolet : theme.colors.textPrimary}
                />
                <Text
                  style={[
                    styles.journeyOutlineText,
                    { color: isShared ? theme.colors.accentViolet : theme.colors.textPrimary },
                  ]}
                >
                  {isShared ? 'Shared with Circle' : 'Share Route'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Simulate Route Deviation Check"
                onPress={simulateRouteDeviation}
                style={[
                  styles.journeyOutlineBtn,
                  { backgroundColor: theme.colors.cautionBg, borderColor: theme.colors.cautionBorder },
                ]}
              >
                <Text style={[styles.journeyOutlineText, { color: theme.colors.cautionAmber }]}>
                  Test Deviation Alert
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Toggle GPS signal loss check"
                onPress={simulateGpsLoss}
                style={[
                  styles.journeyOutlineBtn,
                  { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.journeyOutlineText, { color: theme.colors.textSecondary }]}>
                  {journey.gpsSignalStatus === 'lost' ? 'Restore GPS' : 'Test GPS Loss'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Route Comparison Column */}
        <View style={[styles.routesColumn, isWide && styles.routesColumnWide]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Route Safety Comparison ({routes.length})
          </Text>

          {routes.map((route) => {
            const isSelected = route.id === selectedRoute.id;
            const riskLevel = getRiskCategory(route.safetyScore);
            const scoreColor =
              riskLevel === 'safe'
                ? theme.colors.safeGreen
                : riskLevel === 'caution'
                ? theme.colors.cautionAmber
                : theme.colors.dangerRed;

            return (
              <Pressable
                key={route.id}
                accessibilityRole="button"
                accessibilityLabel={`Select ${route.name}`}
                onPress={() => setSelectedRoute(route)}
                style={[
                  styles.routeCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isSelected ? theme.colors.accentViolet : theme.colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.routeTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.routeName, { color: theme.colors.textPrimary }]}>
                      {language === 'hi' ? route.nameHi : route.name}
                    </Text>
                    <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                      {route.durationMins} min · {route.distanceKm} km · {route.lightingPercentage}%
                      {' lit · '}
                      {route.safeHavensEnRoute} help points
                    </Text>
                  </View>
                  <Text style={[styles.routeScore, { color: scoreColor }]}>
                    {route.safetyScore}/100
                  </Text>
                </View>

                <Text style={[styles.routeRationale, { color: theme.colors.textSecondary }]}>
                  {language === 'hi' ? route.rationaleHi : route.rationale}
                </Text>

                {route.isRecommended && (
                  <Text style={[styles.recLabel, { color: theme.colors.safeGreen }]}>
                    Recommended Safer Corridor
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 36, maxWidth: 1280, width: '100%', alignSelf: 'center' },
  deviationCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 12,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  deviationHeader: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  deviationTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  deviationSub: { fontSize: 13, lineHeight: 18, marginTop: 2, letterSpacing: -0.2 },
  deviationActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  devBtn: { minHeight: 40, paddingHorizontal: 16, borderRadius: 9999, justifyContent: 'center', alignItems: 'center' },
  devBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '600', letterSpacing: -0.15 },
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  plannerInputs: { gap: 10 },
  input: { minHeight: 42, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 12, fontSize: 14 },
  findBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  findBtnText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '600', letterSpacing: -0.2 },
  mainGrid: { gap: 16 },
  mainGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mapColumn: { gap: 14 },
  mapColumnWide: { flex: 1.25 },
  routesColumn: { gap: 12 },
  routesColumnWide: { flex: 1 },
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  journeyTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  metaLine: { fontSize: 12.5, lineHeight: 18, letterSpacing: -0.15 },
  journeyBtnsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  journeyPrimaryBtn: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journeyPrimaryText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '600', letterSpacing: -0.2 },
  journeySecondaryBtn: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journeySecondaryText: { fontSize: 13, fontWeight: '600', letterSpacing: -0.2 },
  journeyOutlineBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 9999,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  journeyOutlineText: { fontSize: 12.5, fontWeight: '600', letterSpacing: -0.15 },
  routeCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  routeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  routeName: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  routeScore: { fontSize: 16, fontWeight: '800' },
  routeRationale: { fontSize: 13, lineHeight: 19, letterSpacing: -0.15 },
  recLabel: { fontSize: 12, fontWeight: '700', letterSpacing: -0.1 },
});
