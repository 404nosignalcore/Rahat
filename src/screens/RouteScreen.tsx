import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeWalk } from '../context/SafeWalkContext';
import { getTranslation } from '../i18n/translations';
import { getRiskCategory } from '../utils/safetyRiskEngine';
import { SafetyMapView } from '../components/map/SafetyMapView';
import { AppIcon } from '../components/ui/AppIcon';
import {
  Colors,
  BorderRadius,
  TypographyStyles,
  Shadows,
  Spacing,
} from '../theme';
import { SearchInput } from '../components/common/SearchInput';
import { Badge } from '../components/common/Badge';

export const RouteScreen: React.FC = () => {
  const {
    language,
    themeMode,
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
  const isDark = themeMode === 'dark';

  const [originInput, setOriginInput] = useState(selectedRoute.originLabel);
  const [destInput, setDestInput] = useState(selectedRoute.destinationLabel);

  const handleFindRoutes = async () => {
    await searchRoutes(originInput, destInput);
  };

  const primaryCircleId = safeCircles[0]?.id || 'circle-family';
  const isShared = Boolean(journey.sharedWithCircleId);
  const isJourneyActive = journey.status === 'active' || journey.status === 'paused';

  return (
    <View style={styles.container}>
      <ScrollView
        style={[
          styles.screen,
          { backgroundColor: isDark ? '#000000' : Colors.canvasParchment },
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          isJourneyActive && { paddingBottom: 96 },
        ]}
      >
        {/* Anti-False-Alarm Route Deviation Alert Card */}
        {deviationAlertVisible && (
          <View
            testID="route-deviation-alert"
            style={[
              styles.deviationCard,
              {
                backgroundColor: isDark ? '#2f1f05' : Colors.cautionBg,
                borderColor: isDark ? '#7b4f09' : Colors.cautionBorder,
              },
            ]}
          >
            <View style={styles.deviationHeader}>
              <AppIcon name="sos" size={20} color={Colors.yellow} />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.deviationTitle,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  {t.deviation.title} ({Math.round(journey.deviationMeters)}m off planned route)
                </Text>
                <Text
                  style={[
                    styles.deviationSub,
                    { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                  ]}
                >
                  {t.deviation.subtitle}
                </Text>
              </View>
            </View>

            <View style={styles.deviationActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.deviation.imSafe}
                onPress={() => respondToDeviation('im_safe')}
                style={({ pressed }) => [
                  styles.devBtn,
                  { backgroundColor: Colors.green },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.devBtnText}>{t.deviation.imSafe}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.deviation.recalculate}
                onPress={() => respondToDeviation('recalculate')}
                style={({ pressed }) => [
                  styles.devBtn,
                  { backgroundColor: Colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.devBtnText}>{t.deviation.recalculate}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.deviation.shareLocation}
                onPress={() => respondToDeviation('share_location')}
                style={({ pressed }) => [
                  styles.devBtn,
                  { backgroundColor: isDark ? '#272729' : Colors.ink },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.devBtnText}>{t.deviation.shareLocation}</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.deviation.activateSos}
                onPress={() => respondToDeviation('activate_sos')}
                style={({ pressed }) => [
                  styles.devBtn,
                  { backgroundColor: Colors.red },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.devBtnText}>{t.deviation.activateSos}</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* SECTION 1: Museum Hero Tile ({component.product-tile-light}) */}
        <View
          style={[
            styles.heroTile,
            {
              backgroundColor: isDark ? '#161617' : Colors.canvas,
              borderBottomColor: isDark ? '#272729' : Colors.hairline,
            },
          ]}
        >
          <View style={styles.heroContent}>
            <Text
              style={[
                styles.heroHeadline,
                { color: isDark ? '#ffffff' : Colors.ink },
              ]}
            >
              {language === 'hi' ? 'सेफवॉक नेविगेशन' : 'SafeWalk Navigation'}
            </Text>
            <Text
              style={[
                styles.heroLead,
                { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
              ]}
            >
              {language === 'hi'
                ? 'स्ट्रीटलाइटिंग, निरंतर पुलिस गश्ती व सुरक्षित कॉरिडोर आधारित मार्ग।'
                : 'Routing algorithmically weighted by illumination, active commercial zones, and seamless peer check-ins.'}
            </Text>

            {/* Apple Pill Input Planner */}
            <View style={styles.searchPlannerContainer}>
              <View style={[styles.inputsRow, isWide && styles.inputsRowWide]}>
                <View style={{ flex: 1 }}>
                  <SearchInput
                    value={originInput}
                    onChangeText={setOriginInput}
                    onClear={() => setOriginInput('')}
                    placeholder="Origin (e.g. Janpath Metro Gate 2)"
                    accessibilityLabel="Origin location"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <SearchInput
                    value={destInput}
                    onChangeText={setDestInput}
                    onClear={() => setDestInput('')}
                    placeholder="Destination (e.g. Mandi House Campus)"
                    accessibilityLabel="Destination location"
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Compare safer routes"
                  onPress={handleFindRoutes}
                  style={({ pressed }) => [
                    styles.compareBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppIcon name="search" size={16} color="#ffffff" />
                  <Text style={styles.compareBtnText}>Compare Routes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 2: Responsive Map Canvas with Signature Product Shadow */}
        <View style={styles.mainSection}>
          <View style={styles.mainInner}>
            <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
              {/* Map Column */}
              <View style={[styles.mapCol, isWide && styles.mapColWide]}>
                <View style={[styles.mapCard, Shadows.product]}>
                  <SafetyMapView
                    height={isWide ? 440 : 300}
                    zones={zones}
                    safeHavens={safeHavens}
                    routes={routes}
                    selectedRouteId={selectedRoute.id}
                    userLocation={{ lat: currentLocation.lat, lng: currentLocation.lng }}
                  />
                </View>

                {/* Journey Telemetry & Controls Card ({component.store-utility-card}) */}
                <View
                  style={[
                    styles.telemetryCard,
                    {
                      backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                      borderColor: isDark ? '#272729' : Colors.hairline,
                    },
                  ]}
                >
                  <View style={styles.telemetryHeader}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.telemetryTitle,
                          { color: isDark ? '#ffffff' : Colors.ink },
                        ]}
                      >
                        Journey Status:{' '}
                        {journey.status === 'idle'
                          ? 'Ready to Start'
                          : journey.status === 'active'
                          ? 'Live Monitored'
                          : journey.status === 'paused'
                          ? 'Paused'
                          : 'Completed'}
                      </Text>
                      <Text style={styles.telemetryMeta}>
                        GPS:{' '}
                        {journey.gpsSignalStatus === 'lost'
                          ? 'Signal Lost (coordinates preserved)'
                          : `Locked (${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)})`}{' '}
                        · Tracking:{' '}
                        {user.consents.backgroundTrackingConsent ? 'Consented' : 'Foreground Only'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.telemetryBtnsRow}>
                    {journey.status === 'idle' || journey.status === 'completed' ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Start Monitored Journey"
                        onPress={startJourney}
                        style={({ pressed }) => [
                          styles.actionPillPrimary,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="play" size={15} color="#ffffff" />
                        <Text style={styles.actionPillPrimaryText}>Start Journey</Text>
                      </Pressable>
                    ) : (
                      <>
                        <Pressable
                          accessibilityRole="button"
                          onPress={pauseOrResumeJourney}
                          style={({ pressed }) => [
                            styles.actionPillUtility,
                            pressed && styles.pressed,
                          ]}
                        >
                          <AppIcon
                            name={journey.status === 'paused' ? 'play' : 'pause'}
                            size={14}
                            color="#ffffff"
                          />
                          <Text style={styles.actionPillUtilityText}>
                            {journey.status === 'paused' ? 'Resume' : 'Pause'}
                          </Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={endJourney}
                          style={({ pressed }) => [
                            styles.actionPillDanger,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={styles.actionPillDangerText}>End Walk</Text>
                        </Pressable>
                      </>
                    )}

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => toggleJourneyShare(primaryCircleId)}
                      style={({ pressed }) => [
                        styles.actionPillGhost,
                        isShared && styles.actionPillGhostActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <AppIcon
                        name="share"
                        size={14}
                        color={isShared ? Colors.primary : Colors.ink}
                      />
                      <Text
                        style={[
                          styles.actionPillGhostText,
                          isShared && { color: Colors.primary },
                        ]}
                      >
                        {isShared ? 'Shared with Circle' : 'Share Route'}
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={simulateRouteDeviation}
                      style={({ pressed }) => [
                        styles.actionPillTest,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.actionPillTestText}>Test Deviation</Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      onPress={simulateGpsLoss}
                      style={({ pressed }) => [
                        styles.actionPillTest,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.actionPillTestText}>
                        {journey.gpsSignalStatus === 'lost' ? 'Restore GPS' : 'Simulate GPS Loss'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Route Comparison Column */}
              <View style={[styles.routesCol, isWide && styles.routesColWide]}>
                <Text
                  style={[
                    styles.sectionHeading,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  Engineered Route Options ({routes.length})
                </Text>

                {routes.map((route) => {
                  const isSelected = route.id === selectedRoute.id;
                  const riskLevel = getRiskCategory(route.safetyScore);

                  return (
                    <Pressable
                      key={route.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${route.name}`}
                      onPress={() => setSelectedRoute(route)}
                      style={({ pressed }) => [
                        styles.routeCard,
                        {
                          backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                          borderColor: isSelected ? Colors.primary : Colors.hairline,
                          borderWidth: isSelected ? 2 : 1,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <View style={styles.routeCardTop}>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.routeName,
                              { color: isDark ? '#ffffff' : Colors.ink },
                            ]}
                          >
                            {language === 'hi' ? route.nameHi : route.name}
                          </Text>
                          <Text style={styles.routeMeta}>
                            {route.durationMins} min · {route.distanceKm} km ·{' '}
                            {route.lightingPercentage}% lit · {route.safeHavensEnRoute} safe havens
                          </Text>
                        </View>

                        <Badge
                          label={`${route.safetyScore}/100`}
                          type={
                            riskLevel === 'safe'
                              ? 'safe'
                              : riskLevel === 'caution'
                              ? 'caution'
                              : 'danger'
                          }
                        />
                      </View>

                      <Text
                        style={[
                          styles.routeRationale,
                          { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                        ]}
                      >
                        {language === 'hi' ? route.rationaleHi : route.rationale}
                      </Text>

                      {route.isRecommended && (
                        <View style={styles.recBadgeRow}>
                          <AppIcon name="check" size={13} color={Colors.green} />
                          <Text style={styles.recBadgeText}>
                            Recommended Safer Corridor
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* SECTION 3: Floating Sticky Bar ({component.floating-sticky-bar}) */}
      {isJourneyActive && (
        <View
          style={[
            styles.floatingStickyBar,
            {
              backgroundColor: isDark ? 'rgba(28, 28, 30, 0.92)' : 'rgba(245, 245, 247, 0.92)',
              borderTopColor: isDark ? '#272729' : Colors.hairline,
            },
          ]}
        >
          <View style={styles.floatingInner}>
            <View style={styles.floatingLeft}>
              <View style={styles.pulseDot} />
              <View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.floatingStatusText,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  {journey.status === 'active'
                    ? 'SafeWalk Active'
                    : 'SafeWalk Paused'}
                </Text>
                <Text style={styles.floatingSubText}>
                  {selectedRoute.name} · {selectedRoute.durationMins} mins
                </Text>
              </View>
            </View>

            <View style={styles.floatingActions}>
              <Pressable
                accessibilityRole="button"
                onPress={pauseOrResumeJourney}
                style={({ pressed }) => [
                  styles.floatingPauseBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.floatingPauseText}>
                  {journey.status === 'paused' ? 'Resume' : 'Pause'}
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={endJourney}
                style={({ pressed }) => [
                  styles.floatingEndBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.floatingEndText}>End Walk</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },

  // Deviation Alert
  deviationCard: {
    margin: 16,
    padding: 20,
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1.5,
    gap: 12,
  },
  deviationHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  deviationTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 16,
    fontWeight: '600',
  },
  deviationSub: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  deviationActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  devBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  devBtnText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },

  // Hero Tile ({component.product-tile-light})
  heroTile: {
    width: '100%',
    paddingVertical: 56,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  heroContent: {
    width: '100%',
    maxWidth: 980,
    alignItems: 'center',
  },
  heroHeadline: {
    fontFamily: TypographyStyles.displayLg.fontFamily,
    fontSize: 38,
    fontWeight: '600',
    lineHeight: 44,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 10,
  },
  heroLead: {
    fontFamily: TypographyStyles.lead.fontFamily,
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: 0.196,
    textAlign: 'center',
    maxWidth: 680,
    marginBottom: 28,
  },
  searchPlannerContainer: {
    width: '100%',
    maxWidth: 820,
  },
  inputsRow: {
    gap: 12,
  },
  inputsRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareBtn: {
    backgroundColor: Colors.primary, // Action Blue #0066cc
    height: 44,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compareBtnText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
  },

  // Main Section
  mainSection: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  mainInner: {
    width: '100%',
    maxWidth: 1280,
  },
  mainGrid: {
    gap: 20,
  },
  mainGridWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mapCol: {
    gap: 16,
  },
  mapColWide: {
    flex: 1.25,
  },
  routesCol: {
    gap: 14,
  },
  routesColWide: {
    flex: 1,
  },

  mapCard: {
    borderRadius: BorderRadius.lg, // 18px
    overflow: 'hidden',
    backgroundColor: Colors.canvas,
  },

  // Telemetry Card ({component.store-utility-card})
  telemetryCard: {
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 24, // 24px
    gap: 14,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  telemetryTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.374,
  },
  telemetryMeta: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  telemetryBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionPillPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPillPrimaryText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionPillUtility: {
    backgroundColor: Colors.ink,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPillUtilityText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionPillDanger: {
    backgroundColor: Colors.red,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
  },
  actionPillDangerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  actionPillGhost: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionPillGhostActive: {
    borderColor: Colors.primary,
    backgroundColor: '#e8f2ff',
  },
  actionPillGhostText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.ink,
  },
  actionPillTest: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  actionPillTestText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted80,
  },

  // Route Comparison Cards
  sectionHeading: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 21,
    fontWeight: '600',
    letterSpacing: 0.231,
    marginBottom: 4,
  },
  routeCard: {
    borderRadius: BorderRadius.lg, // 18px
    padding: 20,
    gap: 8,
  },
  routeCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  routeName: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.374,
  },
  routeMeta: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  routeRationale: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  recBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  recBadgeText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.green,
  },

  // SECTION 3: Floating Sticky Bar ({component.floating-sticky-bar})
  floatingStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 64, // Exact DESIGN.md spec: 64px
    borderTopWidth: 1,
    paddingHorizontal: 24, // 12-32px per DESIGN.md
    justifyContent: 'center',
    zIndex: 1000,
  },
  floatingInner: {
    maxWidth: 1280,
    marginHorizontal: 'auto',
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.green,
  },
  floatingStatusText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  floatingSubText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: Colors.inkMuted48,
  },
  floatingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  floatingPauseBtn: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  floatingPauseText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.ink,
  },
  floatingEndBtn: {
    backgroundColor: Colors.red,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
  },
  floatingEndText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
});
