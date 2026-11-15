import React, { useMemo, useState } from 'react';
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
import { IncidentCategory, RiskLevel } from '../types/safety';
import { validateSafetyReportInput } from '../utils/validation';
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
import { OptionChip } from '../components/common/OptionChip';
import { Badge } from '../components/common/Badge';

const CATEGORIES: (IncidentCategory | 'all')[] = [
  'all',
  'harassment',
  'stalking',
  'poor_lighting',
  'secluded_area',
  'unsafe_transport',
  'suspicious_activity',
];

export const SafeZoneScreen: React.FC = () => {
  const {
    setActiveTab,
    beginSosCountdown,
    activeSosAlert,
    language,
    themeMode,
    timeHour,
    setTimeHour,
    zones,
    selectedZone,
    setSelectedZone,
    reports,
    categoryFilter,
    setCategoryFilter,
    safeHavens,
    currentLocation,
    submitSafetyReport,
    corroborateReport,
    flagReport,
    addReportComment,
  } = useSafeWalk();

  const t = getTranslation(language);
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isDark = themeMode === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const [repCategory, setRepCategory] = useState<IncidentCategory>('poor_lighting');
  const [repTitle, setRepTitle] = useState('');
  const [repArea, setRepArea] = useState('');
  const [repDesc, setRepDesc] = useState('');
  const [repSeverity, setRepSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (r.abuseFlags >= 5) return false;
      const matchesCat = categoryFilter === 'all' || r.category === categoryFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [reports, categoryFilter, searchQuery]);

  const activeZone = useMemo(() => {
    if (!selectedZone) return zones[0];
    return zones.find((z) => z.id === selectedZone.id) || zones[0];
  }, [selectedZone, zones]);

  const riskBadgeColors = (level: RiskLevel) => {
    if (level === 'safe') {
      return {
        fg: Colors.greenText,
        bg: Colors.greenLight,
        border: Colors.greenBorder,
        label: language === 'hi' ? 'सुरक्षित (Safe)' : 'Safe Zone',
      };
    }
    if (level === 'caution') {
      return {
        fg: Colors.yellowText,
        bg: Colors.yellowLight,
        border: Colors.yellowBorder,
        label: language === 'hi' ? 'सावधानी (Caution)' : 'Caution Zone',
      };
    }
    return {
      fg: Colors.redText,
      bg: Colors.redLight,
      border: Colors.redBorder,
      label: language === 'hi' ? 'उच्च जोखिम (High Risk)' : 'High Risk Area',
    };
  };

  const handleSubmitReport = async () => {
    setFormError(null);
    setFormSuccess(null);
    const check = validateSafetyReportInput({
      title: repTitle,
      description: repDesc,
      areaLabel: repArea,
    });
    if (!check.valid) {
      setFormError(check.error || 'Please complete all required fields.');
      return;
    }

    const res = await submitSafetyReport({
      category: repCategory,
      title: repTitle,
      description: repDesc,
      address: repArea,
      latitude: pickedCoords?.lat ?? currentLocation.lat,
      longitude: pickedCoords?.lng ?? currentLocation.lng,
      severity: repSeverity,
    });

    if (!res.ok) {
      setFormError(res.error || 'Unable to submit report.');
      return;
    }

    setRepTitle('');
    setRepArea('');
    setRepDesc('');
    setPickedCoords(null);
    setShowReportForm(false);
    setFormSuccess('Report submitted with "Unverified" status for transparent community review.');
  };

  const handlePostComment = async (reportId: string) => {
    if (!commentDraft.trim()) return;
    const res = await addReportComment(reportId, commentDraft);
    if (res.ok) {
      setCommentDraft('');
    }
  };

  const zonePalette = riskBadgeColors(activeZone.level);

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={[
          styles.screen,
          { backgroundColor: isDark ? '#000000' : Colors.canvasParchment },
        ]}
        contentContainerStyle={styles.scrollContent}
      >
      {/* SECTION 1: Museum Hero Tile (Light Full-Bleed Tile - {component.product-tile-light}) */}
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
          {/* Ethical Disclaimer Capsule Badge */}
          <View style={styles.disclaimerPill}>
            <AppIcon name="shield" size={13} color={Colors.primary} />
            <Text style={styles.disclaimerText}>
              {t.disclaimers.zoneNotice}
            </Text>
          </View>

          {/* Display-Lg Headline with negative tracking */}
          <Text
            style={[
              styles.heroHeadline,
              { color: isDark ? '#ffffff' : Colors.ink },
            ]}
          >
            {language === 'hi' ? 'स्थानिक सुरक्षा इंटेलिजेंस' : 'Spatial Safety Intelligence'}
          </Text>

          {/* Lead Tagline */}
          <Text
            style={[
              styles.heroLead,
              { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
            ]}
          >
            {language === 'hi'
              ? 'सत्यापित स्ट्रीटलाइटिंग इंडेक्स, सामुदायिक रिपोर्ट व सुरक्षित स्थल।'
              : 'Live streetlighting indices, community reports, and verified safe havens framed with absolute clarity.'}
          </Text>

          {/* Action Pills with Emergency SOS Button */}
          <View style={styles.ctaRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Activate Emergency SOS"
              onPress={() => {
                setActiveTab('sos');
                beginSosCountdown();
              }}
              style={({ pressed }) => [
                styles.sosHeroBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name="sos" size={16} color="#ffffff" />
              <Text style={styles.sosHeroBtnText}>
                {activeSosAlert
                  ? 'SOS ACTIVE'
                  : language === 'hi'
                  ? 'आपातकालीन SOS'
                  : 'EMERGENCY SOS'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Report Incident"
              onPress={() => {
                setShowReportForm((prev) => !prev);
                setFormError(null);
              }}
              style={({ pressed }) => [
                styles.primaryPillBtn,
                pressed && styles.pressed,
              ]}
            >
              <AppIcon name={showReportForm ? 'close' : 'plus'} size={15} color="#ffffff" />
              <Text style={styles.primaryPillText}>
                {showReportForm ? 'Close Report' : 'Report Incident'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Find Safe Havens"
              onPress={() => {
                const mapEl = document?.getElementById?.('map-canvas');
                if (mapEl) mapEl.scrollIntoView({ behavior: 'smooth' });
              }}
              style={({ pressed }) => [
                styles.secondaryPillBtn,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryPillText}>
                {language === 'hi' ? 'सुरक्षित स्थल देखें' : 'View Safe Havens'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* SECTION 2: Interactive Product Canvas Tile with Signature Drop-Shadow */}
      <View style={styles.canvasSection}>
        <View style={styles.canvasContainer}>
          {/* Apple Pill Search Input */}
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery('')}
            placeholder={
              language === 'hi'
                ? 'क्षेत्र या सुरक्षा रिपोर्ट खोजें...'
                : 'Search area, street, or safety report...'
            }
            style={styles.searchBar}
          />

          {/* Precision Time-of-Day Chips & Category Filters */}
          <View style={styles.filterSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {[
                { label: '08:00 AM', hour: 8 },
                { label: '02:00 PM', hour: 14 },
                { label: '09:00 PM', hour: 21 },
                { label: '11:30 PM', hour: 23 },
              ].map((preset) => {
                const isSelected = timeHour === preset.hour;
                return (
                  <OptionChip
                    key={preset.hour}
                    label={preset.label}
                    selected={isSelected}
                    onPress={() => setTimeHour(preset.hour)}
                    icon={
                      <AppIcon
                        name="clock"
                        size={13}
                        color={isSelected ? Colors.primary : Colors.inkMuted48}
                      />
                    }
                  />
                );
              })}
            </ScrollView>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = categoryFilter === cat;
                const label = cat === 'all' ? 'All Incidents' : t.categories[cat];
                return (
                  <OptionChip
                    key={cat}
                    label={label}
                    selected={isSelected}
                    onPress={() => setCategoryFilter(cat)}
                  />
                );
              })}
            </ScrollView>
          </View>

          {/* Feedback Banner if Submitted */}
          {formSuccess && (
            <View style={styles.successBanner}>
              <AppIcon name="check" size={16} color={Colors.green} />
              <Text style={styles.successBannerText}>{formSuccess}</Text>
            </View>
          )}

          {/* Interactive Incident Submission Sheet if Active */}
          {showReportForm && (
            <View
              style={[
                styles.reportSheet,
                {
                  backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                  borderColor: isDark ? '#272729' : Colors.hairline,
                },
              ]}
            >
              <Text
                style={[
                  styles.sheetHeadline,
                  { color: isDark ? '#ffffff' : Colors.ink },
                ]}
              >
                Submit Community Safety Report
              </Text>
              <Text style={styles.sheetSub}>
                Reports enter transparent community review with an "Unverified" badge.
              </Text>

              {/* Category Options */}
              <View style={styles.sheetCategories}>
                {(
                  [
                    'poor_lighting',
                    'stalking',
                    'harassment',
                    'secluded_area',
                    'unsafe_transport',
                  ] as IncidentCategory[]
                ).map((cat) => (
                  <OptionChip
                    key={cat}
                    label={t.categories[cat]}
                    selected={repCategory === cat}
                    onPress={() => setRepCategory(cat)}
                  />
                ))}
              </View>

              <Text style={styles.fieldLabel}>Report Title</Text>
              <TextInput
                accessibilityLabel="Report Title"
                placeholder="e.g. Unlit stretch near Metro Exit"
                placeholderTextColor={Colors.inkMuted48}
                value={repTitle}
                onChangeText={setRepTitle}
                style={[
                  styles.pillInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />

              <Text style={styles.fieldLabel}>Area / Street Landmark</Text>
              <TextInput
                accessibilityLabel="Area or Landmark"
                placeholder="e.g. Janpath Subway Gate B"
                placeholderTextColor={Colors.inkMuted48}
                value={repArea}
                onChangeText={setRepArea}
                style={[
                  styles.pillInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />

              <Text style={styles.fieldLabel}>Observations (10+ characters)</Text>
              <TextInput
                accessibilityLabel="Observations"
                placeholder="Describe lighting visibility, crowd density, time..."
                placeholderTextColor={Colors.inkMuted48}
                value={repDesc}
                onChangeText={setRepDesc}
                multiline
                numberOfLines={3}
                style={[
                  styles.textAreaInput,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    color: isDark ? '#ffffff' : Colors.ink,
                  },
                ]}
              />

              <View style={styles.sheetActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPickMode((p) => !p)}
                  style={({ pressed }) => [
                    styles.pinBtn,
                    pickMode && styles.pinBtnActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <AppIcon
                    name="pin"
                    size={14}
                    color={pickMode ? Colors.primary : Colors.ink}
                  />
                  <Text style={styles.pinBtnText}>
                    {pickMode
                      ? 'Tap map to set pin...'
                      : pickedCoords
                      ? `Pinned (${pickedCoords.lat.toFixed(4)}, ${pickedCoords.lng.toFixed(4)})`
                      : 'Pin on Map'}
                  </Text>
                </Pressable>

                <View style={styles.severityPicker}>
                  <Text style={styles.severityLabel}>Severity:</Text>
                  {[1, 2, 3, 4, 5].map((sev) => (
                    <Pressable
                      key={sev}
                      onPress={() => setRepSeverity(sev as 1 | 2 | 3 | 4 | 5)}
                      style={[
                        styles.sevPill,
                        repSeverity === sev && styles.sevPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sevPillText,
                          repSeverity === sev && styles.sevPillTextActive,
                        ]}
                      >
                        {sev}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {formError && <Text style={styles.errorText}>{formError}</Text>}

              <Pressable
                accessibilityRole="button"
                onPress={handleSubmitReport}
                style={({ pressed }) => [
                  styles.sheetSubmitBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.sheetSubmitText}>Submit Report</Text>
              </Pressable>
            </View>
          )}

          {/* MAP CANVAS — Single system drop-shadow resting on surface */}
          <View style={[styles.mapWrapper, Shadows.product]}>
            <SafetyMapView
              height={isWide ? 440 : 300}
              zones={zones}
              reports={filteredReports}
              safeHavens={safeHavens}
              userLocation={
                pickedCoords || { lat: currentLocation.lat, lng: currentLocation.lng }
              }
              onSelectZone={setSelectedZone}
              onSelectReport={(rep) => setExpandedReportId(rep.id)}
              pickMode={pickMode}
              onPickCoordinate={(lat, lng) => {
                setPickedCoords({ lat, lng });
                setPickMode(false);
              }}
            />
          </View>
        </View>
      </View>

      {/* SECTION 3: Dark Tile Section ({component.product-tile-dark} #272729 full-bleed) */}
      <View style={styles.darkTileSection}>
        <View style={styles.darkTileInner}>
          <View style={styles.darkHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.darkSectionOverline}>
                ZONE SAFETY BREAKDOWN
              </Text>
              <Text style={styles.darkSectionHeadline}>
                {language === 'hi' ? activeZone.nameHi : activeZone.name}
              </Text>
              <Text style={styles.darkSectionMeta}>
                Lighting {activeZone.lightingRating}/5 · CCTV {activeZone.cctvCoverage}% ·{' '}
                {activeZone.patrolFrequency} patrol
              </Text>
            </View>

            <View
              style={[
                styles.darkScoreCapsule,
                { backgroundColor: zonePalette.bg, borderColor: zonePalette.border },
              ]}
            >
              <Text style={[styles.darkScoreVal, { color: zonePalette.fg }]}>
                {activeZone.safetyScore}/100
              </Text>
              <Text style={[styles.darkScoreText, { color: zonePalette.fg }]}>
                {zonePalette.label}
              </Text>
            </View>
          </View>

          {/* Factor Columns in Apple Dark Tile Style */}
          <View style={[styles.factorsGrid, isWide && styles.factorsGridWide]}>
            <View style={styles.factorCard}>
              <View style={styles.factorHeadingRow}>
                <AppIcon name="check" size={16} color={Colors.green} />
                <Text style={styles.factorHeadingSafe}>Safety Assets</Text>
              </View>
              {(language === 'hi'
                ? activeZone.positiveFactorsHi
                : activeZone.positiveFactors
              ).map((f, idx) => (
                <Text key={idx} style={styles.factorTextDark}>
                  · {f}
                </Text>
              ))}
            </View>

            <View style={styles.factorCard}>
              <View style={styles.factorHeadingRow}>
                <AppIcon name="flag" size={16} color={Colors.yellow} />
                <Text style={styles.factorHeadingCaution}>Active Concerns</Text>
              </View>
              {(language === 'hi'
                ? activeZone.primaryConcernsHi
                : activeZone.primaryConcerns
              ).map((c, idx) => (
                <Text key={idx} style={styles.factorTextDark}>
                  · {c}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* SECTION 4: Light Utility Grid ({component.store-utility-card} 18px radius) */}
      <View style={styles.utilitySection}>
        <View style={styles.utilityInner}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? '#ffffff' : Colors.ink },
            ]}
          >
            Community Incident Reports ({filteredReports.length})
          </Text>

          {filteredReports.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                  borderColor: isDark ? '#272729' : Colors.hairline,
                },
              ]}
            >
              <Text style={styles.emptyText}>
                No incidents match this filter. Absence of reports does not indicate guaranteed safety.
              </Text>
            </View>
          ) : (
            <View style={[styles.reportsGrid, isWide && styles.reportsGridWide]}>
              {filteredReports.map((rep) => {
                const isExpanded = expandedReportId === rep.id;
                const verText = t.verification[rep.verificationStatus];

                return (
                  <View
                    key={rep.id}
                    style={[
                      styles.utilityCard,
                      {
                        backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                        borderColor: isDark ? '#272729' : Colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text
                        style={[
                          styles.cardTitle,
                          { color: isDark ? '#ffffff' : Colors.ink },
                        ]}
                      >
                        {rep.title}
                      </Text>
                      <Badge
                        label={verText}
                        type={
                          rep.verificationStatus === 'authorized_verified'
                            ? 'safe'
                            : rep.verificationStatus === 'community_corroborated'
                            ? 'accent'
                            : rep.verificationStatus === 'under_review'
                            ? 'caution'
                            : 'neutral'
                        }
                      />
                    </View>

                    <Text style={styles.cardMeta}>
                      {t.categories[rep.category]} · {rep.address}
                      {rep.isSynthetic ? ' · Synthetic Demo' : ''}
                    </Text>

                    <Text
                      style={[
                        styles.cardBody,
                        { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                      ]}
                    >
                      {rep.description}
                    </Text>

                    {/* Action Pills */}
                    <View style={styles.cardActionRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => corroborateReport(rep.id)}
                        style={({ pressed }) => [
                          styles.miniPill,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="check" size={13} color={Colors.green} />
                        <Text style={styles.miniPillText}>
                          Corroborate ({rep.corroborationCount})
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setExpandedReportId(isExpanded ? null : rep.id)}
                        style={({ pressed }) => [
                          styles.miniPill,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="comment" size={13} color={Colors.primary} />
                        <Text style={styles.miniPillText}>
                          Comments ({rep.comments?.length || 0})
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => flagReport(rep.id, 'abuse')}
                        style={({ pressed }) => [
                          styles.miniPill,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.miniPillDanger}>Report</Text>
                      </Pressable>
                    </View>

                    {/* Expandable Comments Drawer */}
                    {isExpanded && (
                      <View style={styles.commentsDrawer}>
                        {(rep.comments || []).map((c) => (
                          <View key={c.id} style={styles.commentItem}>
                            <Text style={styles.commentAuthor}>{c.authorDisplay}</Text>
                            <Text style={styles.commentContent}>{c.body}</Text>
                          </View>
                        ))}
                        <View style={styles.commentInputRow}>
                          <TextInput
                            placeholder="Share a verified update..."
                            placeholderTextColor={Colors.inkMuted48}
                            value={commentDraft}
                            onChangeText={setCommentDraft}
                            style={[
                              styles.commentInput,
                              {
                                backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                                color: isDark ? '#ffffff' : Colors.ink,
                              },
                            ]}
                          />
                          <Pressable
                            onPress={() => handlePostComment(rep.id)}
                            style={styles.commentPostBtn}
                          >
                            <Text style={styles.commentPostText}>Post</Text>
                          </Pressable>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </ScrollView>

    {/* Floating Emergency SOS Fast-Action Button */}
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Emergency SOS Fast Action"
      onPress={() => {
        setActiveTab('sos');
        beginSosCountdown();
      }}
      style={({ pressed }) => [
        styles.floatingSosBtn,
        pressed && styles.pressed,
        activeSosAlert && styles.floatingSosActive,
      ]}
    >
      <View style={styles.floatingSosInner}>
        <AppIcon name="sos" size={18} color="#ffffff" />
        <Text style={styles.floatingSosText}>
          {activeSosAlert ? 'SOS ACTIVE' : 'SOS'}
        </Text>
      </View>
    </Pressable>
  </View>
  );
};

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    position: 'relative',
  },
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },
  sosHeroBtn: {
    backgroundColor: Colors.red,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sosHeroBtnText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  floatingSosBtn: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    backgroundColor: Colors.red,
    borderRadius: BorderRadius.pill,
    paddingVertical: 12,
    paddingHorizontal: 20,
    zIndex: 999,
    ...Shadows.product,
  },
  floatingSosActive: {
    backgroundColor: '#b91c1c',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  floatingSosInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  floatingSosText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // SECTION 1: Museum Hero Tile ({component.product-tile-light})
  heroTile: {
    width: '100%',
    paddingVertical: 56, // 48-80px per DESIGN.md
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    width: '100%',
    maxWidth: 980, // Content lock per DESIGN.md
    alignItems: 'center',
    textAlign: 'center',
  },
  disclaimerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.pill,
    backgroundColor: '#e8f2ff', // Soft tint Action Blue
    marginBottom: 16,
    maxWidth: '90%',
  },
  disclaimerText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    color: Colors.primary,
    letterSpacing: -0.12,
  },
  heroHeadline: {
    fontFamily: TypographyStyles.displayLg.fontFamily,
    fontSize: 38,
    fontWeight: '600',
    lineHeight: 44,
    letterSpacing: 0,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroLead: {
    fontFamily: TypographyStyles.lead.fontFamily,
    fontSize: 19,
    fontWeight: '400',
    lineHeight: 26,
    letterSpacing: 0.196,
    textAlign: 'center',
    maxWidth: 680,
    marginBottom: 24,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryPillBtn: {
    backgroundColor: Colors.primary, // Action Blue #0066cc
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  primaryPillText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: '#ffffff',
    letterSpacing: -0.374,
  },
  secondaryPillBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 11,
    paddingHorizontal: 22,
    borderRadius: BorderRadius.pill,
  },
  secondaryPillText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.primary,
    letterSpacing: -0.374,
  },

  // SECTION 2: Canvas Section
  canvasSection: {
    width: '100%',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  canvasContainer: {
    width: '100%',
    maxWidth: 1200,
  },
  searchBar: {
    marginBottom: 16,
  },
  filterSection: {
    gap: 10,
    marginBottom: 16,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenBorder,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: 12,
    marginBottom: 16,
  },
  successBannerText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    color: Colors.greenText,
  },

  // Incident Submission Sheet
  reportSheet: {
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
  },
  sheetHeadline: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 21,
    fontWeight: '600',
    marginBottom: 4,
  },
  sheetSub: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 14,
    color: Colors.inkMuted48,
    marginBottom: 16,
  },
  sheetCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  fieldLabel: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.inkMuted80,
    marginBottom: 6,
  },
  pillInput: {
    height: 44,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 14,
  },
  textAreaInput: {
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: 15,
    minHeight: 76,
    textAlignVertical: 'top',
    marginBottom: 14,
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  pinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  pinBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: '#e8f2ff',
  },
  pinBtnText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.ink,
  },
  severityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityLabel: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted80,
  },
  sevPill: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sevPillActive: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  sevPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
  },
  sevPillTextActive: {
    color: '#ffffff',
  },
  errorText: {
    color: Colors.red,
    fontSize: 13,
    marginBottom: 12,
  },
  sheetSubmitBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSubmitText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Map Container with Product Shadow
  mapWrapper: {
    borderRadius: BorderRadius.lg, // 18px
    overflow: 'hidden',
    backgroundColor: Colors.canvas,
  },

  // SECTION 3: Dark Tile Section ({component.product-tile-dark} #272729)
  darkTileSection: {
    backgroundColor: Colors.surfaceTile1, // #272729
    paddingVertical: 48,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  darkTileInner: {
    width: '100%',
    maxWidth: 1200,
  },
  darkHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  darkSectionOverline: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryOnDark, // Sky Link Blue #2997ff
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  darkSectionHeadline: {
    fontFamily: TypographyStyles.displayMd.fontFamily,
    fontSize: 28,
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: -0.374,
    marginBottom: 6,
  },
  darkSectionMeta: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 14,
    color: Colors.bodyMuted,
  },
  darkScoreCapsule: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  darkScoreVal: {
    fontSize: 20,
    fontWeight: '700',
  },
  darkScoreText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  factorsGrid: {
    gap: 16,
  },
  factorsGridWide: {
    flexDirection: 'row',
  },
  factorCard: {
    flex: 1,
    backgroundColor: Colors.surfaceTile2, // #2a2a2c
    borderRadius: BorderRadius.md, // 11px
    padding: 18,
    gap: 8,
  },
  factorHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  factorHeadingSafe: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.green,
  },
  factorHeadingCaution: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.yellow,
  },
  factorTextDark: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: '#ffffff',
  },

  // SECTION 4: Light Utility Grid ({component.store-utility-card} 18px radius)
  utilitySection: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  utilityInner: {
    width: '100%',
    maxWidth: 1200,
  },
  sectionTitle: {
    fontFamily: TypographyStyles.displayMd.fontFamily,
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.374,
    marginBottom: 20,
  },
  emptyCard: {
    padding: 24,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    color: Colors.inkMuted48,
    textAlign: 'center',
  },
  reportsGrid: {
    gap: 16,
  },
  reportsGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  utilityCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 24, // 24px per DESIGN.md
    gap: 8,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 17, // 17px
    fontWeight: '600',
    flex: 1,
  },
  cardMeta: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
  },
  cardBody: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.374,
    marginVertical: 4,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  miniPillText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.ink,
  },
  miniPillDanger: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.red,
  },
  commentsDrawer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    gap: 8,
  },
  commentItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  commentAuthor: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink,
  },
  commentContent: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted80,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  commentInput: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  commentPostBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
  },
  commentPostText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
