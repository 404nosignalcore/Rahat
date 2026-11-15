import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { RouteOption } from '../../types/safety';
import { AppIcon } from '../ui/AppIcon';
import { Badge } from '../common/Badge';
import { Colors, BorderRadius, TypographyStyles, Spacing } from '../../theme';
import { getRiskCategory } from '../../utils/safetyRiskEngine';

export interface CompareRoutesModalProps {
  visible: boolean;
  onClose: () => void;
  routes: RouteOption[];
  selectedRouteId: string;
  onSelectRoute: (route: RouteOption) => void;
  onStartJourney?: () => void;
  language?: 'en' | 'hi';
  themeMode?: 'light' | 'dark';
}

export const CompareRoutesModal: React.FC<CompareRoutesModalProps> = ({
  visible,
  onClose,
  routes,
  selectedRouteId,
  onSelectRoute,
  onStartJourney,
  language = 'en',
  themeMode = 'light',
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const isDark = themeMode === 'dark';

  const selectedRoute = routes.find((r) => r.id === selectedRouteId) || routes[0];
  const recommendedRoute = routes.find((r) => r.isRecommended) || routes[0];
  const fastestRoute = [...routes].sort((a, b) => a.durationMins - b.durationMins)[0];

  const timeDiffMins = recommendedRoute && fastestRoute
    ? Math.max(0, recommendedRoute.durationMins - fastestRoute.durationMins)
    : 0;
  const safetyBoost = recommendedRoute && fastestRoute
    ? Math.max(0, recommendedRoute.safetyScore - fastestRoute.safetyScore)
    : 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            isWide && styles.sheetWide,
            {
              backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
              borderColor: isDark ? '#272729' : Colors.hairline,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? '#272729' : Colors.hairline },
            ]}
          >
            <View style={styles.titleRow}>
              <View style={styles.titleIconBox}>
                <AppIcon name="route" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  {language === 'hi' ? 'सुरक्षित मार्ग तुलना मैट्रिक्स' : 'Safer Route Comparison'}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                  ]}
                >
                  {language === 'hi'
                    ? 'रोशनी, सीसीटीवी, सुरक्षित केंद्र व समय के आधार पर मार्गों का विश्लेषण'
                    : 'Side-by-side telemetry comparing illumination, CCTV, sanctuary points, and safety trade-offs'}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close Route Comparison"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: isDark ? '#272729' : Colors.canvasParchment },
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="close" size={16} color={isDark ? '#ffffff' : Colors.ink} />
            </Pressable>
          </View>

          {/* Quick Trade-off Insight Banner */}
          {recommendedRoute && fastestRoute && (
            <View
              style={[
                styles.insightBanner,
                {
                  backgroundColor: isDark ? '#162b1a' : '#e6f4ea',
                  borderColor: isDark ? '#285430' : '#ceead6',
                },
              ]}
            >
              <AppIcon name="check" size={16} color={Colors.green} />
              <Text
                style={[
                  styles.insightText,
                  { color: isDark ? '#b7e1cd' : '#137333' },
                ]}
              >
                {language === 'hi'
                  ? `सिफारिश किया गया गलियारा मात्र +${timeDiffMins} मिनट में +${safetyBoost}% अधिक सुरक्षा प्रदान करता है।`
                  : `Safety Insight: Taking the recommended corridor adds only +${timeDiffMins} min for a +${safetyBoost}% safety boost and 3 verified sanctuaries.`}
              </Text>
            </View>
          )}

          {/* Route Comparison Grid */}
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.routesRow, isWide && styles.routesRowWide]}>
              {routes.map((route) => {
                const isSelected = route.id === selectedRouteId;
                const riskLevel = getRiskCategory(route.safetyScore);

                return (
                  <View
                    key={route.id}
                    style={[
                      styles.routeCard,
                      isWide && styles.routeCardWide,
                      {
                        backgroundColor: isDark ? '#272729' : Colors.canvas,
                        borderColor: isSelected ? Colors.primary : isDark ? '#3a3a3c' : Colors.hairline,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    {/* Top Row: Title & Badge */}
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text
                          style={[
                            styles.routeName,
                            { color: isDark ? '#ffffff' : Colors.ink },
                          ]}
                        >
                          {language === 'hi' ? route.nameHi : route.name}
                        </Text>
                        <Text style={styles.routeDistanceText}>
                          {route.durationMins} min · {route.distanceKm} km
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

                    {/* Tag Indicator */}
                    {route.isRecommended ? (
                      <View style={styles.recommendedPill}>
                        <AppIcon name="check" size={12} color="#ffffff" />
                        <Text style={styles.recommendedPillText}>Recommended Corridor</Text>
                      </View>
                    ) : (
                      <View style={styles.standardPill}>
                        <Text style={styles.standardPillText}>Alternative Route</Text>
                      </View>
                    )}

                    {/* Metrics Matrix */}
                    <View style={styles.metricsMatrix}>
                      {/* Illumination Meter */}
                      <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                          Street Illumination
                        </Text>
                        <Text style={[styles.metricVal, { color: route.lightingPercentage >= 80 ? Colors.green : Colors.yellow }]}>
                          {route.lightingPercentage}%
                        </Text>
                      </View>
                      <View style={styles.meterTrack}>
                        <View
                          style={[
                            styles.meterFill,
                            {
                              width: `${route.lightingPercentage}%`,
                              backgroundColor: route.lightingPercentage >= 80 ? Colors.green : Colors.yellow,
                            },
                          ]}
                        />
                      </View>

                      {/* CCTV Surveillance Meter */}
                      <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                          CCTV Surveillance
                        </Text>
                        <Text style={[styles.metricVal, { color: route.cctvCoveragePercentage >= 70 ? Colors.green : '#8e8e93' }]}>
                          {route.cctvCoveragePercentage}%
                        </Text>
                      </View>
                      <View style={styles.meterTrack}>
                        <View
                          style={[
                            styles.meterFill,
                            {
                              width: `${route.cctvCoveragePercentage}%`,
                              backgroundColor: route.cctvCoveragePercentage >= 70 ? Colors.green : Colors.yellow,
                            },
                          ]}
                        />
                      </View>

                      {/* Safe Havens */}
                      <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                          Sanctuary Points
                        </Text>
                        <Text style={[styles.metricVal, { color: Colors.primary }]}>
                          {route.safeHavensEnRoute} En Route
                        </Text>
                      </View>

                      {/* Risk Zones Avoided/Crossed */}
                      <View style={styles.metricRow}>
                        <Text style={[styles.metricLabel, { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 }]}>
                          Corridor Rating
                        </Text>
                        <Text style={[styles.metricVal, { color: isDark ? '#ffffff' : Colors.ink }]}>
                          {route.riskZonesCrossed.length} Zones
                        </Text>
                      </View>
                    </View>

                    {/* Rationale Text */}
                    <Text
                      style={[
                        styles.rationaleText,
                        { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                      ]}
                    >
                      {language === 'hi' ? route.rationaleHi : route.rationale}
                    </Text>

                    {/* Select Action Button */}
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${route.name}`}
                      onPress={() => {
                        onSelectRoute(route);
                        onClose();
                      }}
                      style={({ pressed }) => [
                        styles.selectBtn,
                        isSelected ? styles.selectBtnActive : styles.selectBtnInactive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectBtnText,
                          isSelected ? styles.selectBtnTextActive : styles.selectBtnTextInactive,
                        ]}
                      >
                        {isSelected ? '✓ Selected Route' : 'Select This Route'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Controls */}
          <View
            style={[
              styles.footer,
              { borderTopColor: isDark ? '#272729' : Colors.hairline },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.footerCancelBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.footerCancelText}>Close & View on Map</Text>
            </Pressable>

            {onStartJourney && (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  onClose();
                  onStartJourney();
                }}
                style={({ pressed }) => [
                  styles.footerStartBtn,
                  pressed && styles.pressed,
                ]}
              >
                <AppIcon name="play" size={15} color="#ffffff" />
                <Text style={styles.footerStartText}>
                  Start SafeWalk ({selectedRoute?.name.split(' ')[0]})
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  sheet: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: BorderRadius.xl, // 24px
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetWide: {
    maxWidth: 960,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    gap: 12,
  },
  titleIconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.pill,
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: TypographyStyles.headlineStrong.fontFamily,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 10,
  },
  insightText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  routesRow: {
    gap: 14,
  },
  routesRowWide: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  routeCard: {
    padding: 18,
    borderRadius: BorderRadius.lg, // 18px
    gap: 12,
  },
  routeCardWide: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeName: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  routeDistanceText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2,
  },
  recommendedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  recommendedPillText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  standardPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#8e8e93',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.pill,
  },
  standardPillText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  metricsMatrix: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: BorderRadius.md,
    padding: 12,
    gap: 6,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
  },
  metricVal: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    fontWeight: '700',
  },
  meterTrack: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  meterFill: {
    height: '100%',
    borderRadius: 2,
  },
  rationaleText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 12,
    lineHeight: 16,
  },
  selectBtn: {
    height: 40,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  selectBtnActive: {
    backgroundColor: Colors.primary,
  },
  selectBtnInactive: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  selectBtnText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
  },
  selectBtnTextActive: {
    color: '#ffffff',
  },
  selectBtnTextInactive: {
    color: Colors.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  footerCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
  },
  footerCancelText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    color: '#8e8e93',
  },
  footerStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  footerStartText: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
});
