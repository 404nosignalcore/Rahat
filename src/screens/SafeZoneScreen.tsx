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
    language,
    theme,
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
        fg: theme.colors.safeGreen,
        bg: theme.colors.safeBg,
        border: theme.colors.safeBorder,
        label: language === 'hi' ? 'सुरक्षित (Safe)' : 'Safe',
      };
    }
    if (level === 'caution') {
      return {
        fg: theme.colors.cautionAmber,
        bg: theme.colors.cautionBg,
        border: theme.colors.cautionBorder,
        label: language === 'hi' ? 'सावधानी (Caution)' : 'Caution',
      };
    }
    return {
      fg: theme.colors.dangerRed,
      bg: theme.colors.dangerBg,
      border: theme.colors.dangerBorder,
      label: language === 'hi' ? 'उच्च जोखिम (High Risk)' : 'High Risk',
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
    const res = await addReportComment(reportId, commentDraft);
    if (res.ok) {
      setCommentDraft('');
    }
  };

  const zonePalette = riskBadgeColors(activeZone.level);

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Ethical Transparency Disclaimer */}
      <View
        style={[
          styles.noticeBanner,
          { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
        ]}
      >
        <AppIcon name="shield" size={16} color={theme.colors.accentViolet} />
        <Text style={[styles.noticeText, { color: theme.colors.textSecondary }]}>
          {t.disclaimers.zoneNotice}
        </Text>
      </View>

      {/* Search & Report Action Row */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <AppIcon name="search" size={16} color={theme.colors.textMuted} />
          <TextInput
            accessibilityLabel="Search area or safety report"
            placeholder="Search area, street, or safety report..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: theme.colors.textPrimary }]}
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showReportForm ? 'Close report form' : 'Report Safety Issue'}
          onPress={() => {
            setShowReportForm((v) => !v);
            setFormError(null);
          }}
          style={[styles.reportTrigger, { backgroundColor: theme.colors.accentViolet }]}
        >
          <AppIcon name={showReportForm ? 'close' : 'plus'} size={16} color="#FFFFFF" />
          <Text numberOfLines={1} style={styles.reportTriggerText}>
            {showReportForm ? 'Close' : 'Report Issue'}
          </Text>
        </Pressable>
      </View>

      {/* Time-of-Day & Category Filter Controls */}
      <View style={styles.filterGroup}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { label: '08:00 AM', hour: 8 },
            { label: '02:00 PM', hour: 14 },
            { label: '09:00 PM', hour: 21 },
            { label: '11:30 PM', hour: 23 },
          ].map((preset) => {
            const active = timeHour === preset.hour;
            return (
              <Pressable
                key={preset.hour}
                accessibilityRole="button"
                accessibilityLabel={`Simulate time ${preset.label}`}
                onPress={() => setTimeHour(preset.hour)}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: active ? theme.colors.navyPrimary : theme.colors.surface,
                    borderColor: active ? theme.colors.navyPrimary : theme.colors.border,
                  },
                ]}
              >
                <AppIcon
                  name="clock"
                  size={13}
                  color={active ? theme.colors.navyText : theme.colors.textSecondary}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterTabText,
                    { color: active ? theme.colors.navyText : theme.colors.textSecondary },
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => {
            const active = categoryFilter === cat;
            const label = cat === 'all' ? 'All Categories' : t.categories[cat];
            return (
              <Pressable
                key={cat}
                accessibilityRole="button"
                accessibilityLabel={`Filter category ${label}`}
                onPress={() => setCategoryFilter(cat)}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: active ? theme.colors.accentVioletSoft : theme.colors.surface,
                    borderColor: active ? theme.colors.accentViolet : theme.colors.border,
                  },
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.filterTabText,
                    { color: active ? theme.colors.accentViolet : theme.colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {formSuccess && (
        <View
          style={[
            styles.feedbackBox,
            { backgroundColor: theme.colors.safeBg, borderColor: theme.colors.safeBorder },
          ]}
        >
          <Text style={[styles.feedbackText, { color: theme.colors.safeGreen }]}>{formSuccess}</Text>
        </View>
      )}

      {/* Submit Safety Report Form */}
      {showReportForm && (
        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Submit Community Safety Report
          </Text>
          <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
            New reports are labelled "Unverified" until corroborated by community reviews or an
            authorized source.
          </Text>

          <View style={styles.catGrid}>
            {(['poor_lighting', 'stalking', 'harassment', 'secluded_area', 'unsafe_transport'] as IncidentCategory[]).map(
              (cat) => {
                const selected = repCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    accessibilityRole="button"
                    accessibilityLabel={`Select category ${t.categories[cat]}`}
                    onPress={() => setRepCategory(cat)}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: selected
                          ? theme.colors.accentViolet
                          : theme.colors.surfaceAlt,
                        borderColor: selected ? theme.colors.accentViolet : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.filterTabText,
                        { color: selected ? '#FFFFFF' : theme.colors.textPrimary },
                      ]}
                    >
                      {t.categories[cat]}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>Title</Text>
          <TextInput
            accessibilityLabel="Report title"
            placeholder="e.g. Unlit stretch near Metro Exit"
            placeholderTextColor={theme.colors.textMuted}
            value={repTitle}
            onChangeText={setRepTitle}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            Area / Landmark
          </Text>
          <TextInput
            accessibilityLabel="Area or landmark"
            placeholder="e.g. Janpath Subway Gate B"
            placeholderTextColor={theme.colors.textMuted}
            value={repArea}
            onChangeText={setRepArea}
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />

          <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
            Details (10+ characters)
          </Text>
          <TextInput
            accessibilityLabel="Report description"
            placeholder="Describe visibility, time, and what happened..."
            placeholderTextColor={theme.colors.textMuted}
            value={repDesc}
            onChangeText={setRepDesc}
            multiline
            numberOfLines={3}
            style={[
              styles.textArea,
              {
                backgroundColor: theme.colors.bg,
                borderColor: theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
          />

          <View style={styles.formActionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tap map to pick exact pin"
              onPress={() => setPickMode((p) => !p)}
              style={[
                styles.secondaryBtn,
                {
                  backgroundColor: pickMode ? theme.colors.cautionBg : theme.colors.surfaceAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <AppIcon name="pin" size={14} color={theme.colors.textPrimary} />
              <Text style={[styles.secondaryBtnText, { color: theme.colors.textPrimary }]}>
                {pickMode
                  ? 'Tap Map Below...'
                  : pickedCoords
                  ? `Pinned (${pickedCoords.lat.toFixed(4)}, ${pickedCoords.lng.toFixed(4)})`
                  : 'Pin on Map (Optional)'}
              </Text>
            </Pressable>

            <View style={styles.severityRow}>
              {[1, 2, 3, 4, 5].map((sev) => (
                <Pressable
                  key={sev}
                  accessibilityRole="button"
                  accessibilityLabel={`Severity ${sev}`}
                  onPress={() => setRepSeverity(sev as 1 | 2 | 3 | 4 | 5)}
                  style={[
                    styles.sevBtn,
                    {
                      backgroundColor:
                        repSeverity === sev ? theme.colors.dangerRed : theme.colors.surfaceAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: repSeverity === sev ? '#FFFFFF' : theme.colors.textPrimary,
                      fontWeight: '700',
                      fontSize: 12,
                    }}
                  >
                    {sev}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {formError && (
            <Text style={[styles.errorText, { color: theme.colors.dangerRed }]}>{formError}</Text>
          )}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Submit Safety Report"
            onPress={handleSubmitReport}
            style={[styles.primarySubmitBtn, { backgroundColor: theme.colors.navyPrimary }]}
          >
            <Text style={[styles.primarySubmitText, { color: theme.colors.navyText }]}>
              Submit Safety Report
            </Text>
          </Pressable>
        </View>
      )}

      {/* Main Responsive Split: Map + Zone Intelligence */}
      <View style={[styles.mainGrid, isWide && styles.mainGridWide]}>
        <View style={[styles.mapColumn, isWide && styles.mapColumnWide]}>
          <SafetyMapView
            height={isWide ? 420 : 270}
            zones={zones}
            reports={filteredReports}
            safeHavens={safeHavens}
            userLocation={pickedCoords || { lat: currentLocation.lat, lng: currentLocation.lng }}
            onSelectZone={setSelectedZone}
            onSelectReport={(rep) => setExpandedReportId(rep.id)}
            pickMode={pickMode}
            onPickCoordinate={(lat, lng) => {
              setPickedCoords({ lat, lng });
              setPickMode(false);
            }}
          />

          {/* Selected Zone Explainable Panel */}
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.zoneHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.zoneName, { color: theme.colors.textPrimary }]}>
                  {language === 'hi' ? activeZone.nameHi : activeZone.name}
                </Text>
                <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                  Lighting {activeZone.lightingRating}/5 · CCTV {activeZone.cctvCoverage}% ·{' '}
                  {activeZone.patrolFrequency} patrol
                </Text>
              </View>
              <View
                style={[
                  styles.statusBlock,
                  { backgroundColor: zonePalette.bg, borderColor: zonePalette.border },
                ]}
              >
                <Text style={[styles.statusScore, { color: zonePalette.fg }]}>
                  {activeZone.safetyScore}/100
                </Text>
                <Text style={[styles.statusLabel, { color: zonePalette.fg }]}>
                  {zonePalette.label}
                </Text>
              </View>
            </View>

            <View style={styles.factorCols}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.factorHeading, { color: theme.colors.safeGreen }]}>
                  Positive Factors
                </Text>
                {(language === 'hi' ? activeZone.positiveFactorsHi : activeZone.positiveFactors).map(
                  (f, idx) => (
                    <Text key={idx} style={[styles.factorItem, { color: theme.colors.textSecondary }]}>
                      · {f}
                    </Text>
                  )
                )}
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.factorHeading, { color: theme.colors.cautionAmber }]}>
                  Reported Concerns
                </Text>
                {(language === 'hi' ? activeZone.primaryConcernsHi : activeZone.primaryConcerns).map(
                  (c, idx) => (
                    <Text key={idx} style={[styles.factorItem, { color: theme.colors.textSecondary }]}>
                      · {c}
                    </Text>
                  )
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Community Reports Feed Column */}
        <View style={[styles.feedColumn, isWide && styles.feedColumnWide]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
            Area Safety Reports ({filteredReports.length})
          </Text>

          {filteredReports.length === 0 ? (
            <View
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
                No reports match this filter. Absence of reports does not indicate guaranteed safety.
              </Text>
            </View>
          ) : (
            filteredReports.map((rep) => {
              const isExpanded = expandedReportId === rep.id;
              const verText = t.verification[rep.verificationStatus];
              const verColor =
                rep.verificationStatus === 'authorized_verified'
                  ? theme.colors.safeGreen
                  : rep.verificationStatus === 'community_corroborated'
                  ? theme.colors.accentViolet
                  : rep.verificationStatus === 'under_review'
                  ? theme.colors.cautionAmber
                  : theme.colors.textMuted;

              return (
                <View
                  key={rep.id}
                  style={[
                    styles.card,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                  ]}
                >
                  <Text style={[styles.reportTitle, { color: theme.colors.textPrimary }]}>
                    {rep.title}
                  </Text>
                  <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                    {t.categories[rep.category]} · {rep.address} ·{' '}
                    <Text style={{ color: verColor, fontWeight: '700' }}>{verText}</Text>
                    {rep.isSynthetic ? ' · Synthetic Demo' : ''}
                  </Text>

                  <Text style={[styles.reportDesc, { color: theme.colors.textSecondary }]}>
                    {rep.description}
                  </Text>

                  <View style={styles.reportActions}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Corroborate report ${rep.title}`}
                      onPress={() => corroborateReport(rep.id)}
                      style={[
                        styles.miniAction,
                        { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                      ]}
                    >
                      <AppIcon name="check" size={14} color={theme.colors.safeGreen} />
                      <Text style={[styles.miniActionText, { color: theme.colors.textPrimary }]}>
                        Corroborate ({rep.corroborationCount})
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Comments for ${rep.title}`}
                      onPress={() => setExpandedReportId(isExpanded ? null : rep.id)}
                      style={[
                        styles.miniAction,
                        { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                      ]}
                    >
                      <AppIcon name="comment" size={14} color={theme.colors.accentViolet} />
                      <Text style={[styles.miniActionText, { color: theme.colors.textPrimary }]}>
                        Comments ({rep.comments?.length || 0})
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Flag outdated ${rep.title}`}
                      onPress={() => flagReport(rep.id, 'outdated')}
                      style={[
                        styles.miniAction,
                        { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                      ]}
                    >
                      <AppIcon name="flag" size={14} color={theme.colors.cautionAmber} />
                      <Text style={[styles.miniActionText, { color: theme.colors.textPrimary }]}>
                        Outdated ({rep.outdatedFlags})
                      </Text>
                    </Pressable>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Report spam or abuse on ${rep.title}`}
                      onPress={() => flagReport(rep.id, 'abuse')}
                      style={[
                        styles.miniAction,
                        { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
                      ]}
                    >
                      <Text style={[styles.miniActionText, { color: theme.colors.dangerRed }]}>
                        Report Abuse
                      </Text>
                    </Pressable>
                  </View>

                  {isExpanded && (
                    <View style={[styles.commentsPanel, { borderTopColor: theme.colors.border }]}>
                      {(rep.comments || []).map((c) => (
                        <View key={c.id} style={styles.commentRow}>
                          <Text style={[styles.commentAuthor, { color: theme.colors.textPrimary }]}>
                            {c.authorDisplay}
                          </Text>
                          <Text style={[styles.commentBody, { color: theme.colors.textSecondary }]}>
                            {c.body}
                          </Text>
                        </View>
                      ))}
                      <View style={styles.commentInputRow}>
                        <TextInput
                          accessibilityLabel="Add comment"
                          placeholder="Share a helpful update..."
                          placeholderTextColor={theme.colors.textMuted}
                          value={commentDraft}
                          onChangeText={setCommentDraft}
                          style={[
                            styles.commentInput,
                            {
                              backgroundColor: theme.colors.bg,
                              borderColor: theme.colors.border,
                              color: theme.colors.textPrimary,
                            },
                          ]}
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Post comment"
                          onPress={() => handlePostComment(rep.id)}
                          style={[styles.postCommentBtn, { backgroundColor: theme.colors.accentViolet }]}
                        >
                          <Text style={styles.postCommentText}>Post</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 36, maxWidth: 1280, width: '100%', alignSelf: 'center' },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeText: { flex: 1, fontSize: 12, lineHeight: 17 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  searchBox: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, minHeight: 40 },
  reportTrigger: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportTriggerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  filterGroup: { gap: 8 },
  filterScroll: { gap: 8, paddingVertical: 2 },
  filterTab: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterTabText: { fontSize: 12, fontWeight: '600' },
  feedbackBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
  feedbackText: { fontSize: 13, fontWeight: '600' },
  mainGrid: { gap: 16 },
  mainGridWide: { flexDirection: 'row', alignItems: 'flex-start' },
  mapColumn: { gap: 14 },
  mapColumnWide: { flex: 1.2 },
  feedColumn: { gap: 12 },
  feedColumnWide: { flex: 1 },
  card: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  helperText: { fontSize: 12, lineHeight: 17 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  inputLabel: { fontSize: 12, fontWeight: '600' },
  input: { minHeight: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  textArea: { minHeight: 74, borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  formActionsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  secondaryBtn: { minHeight: 40, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  secondaryBtnText: { fontSize: 12, fontWeight: '600' },
  severityRow: { flexDirection: 'row', gap: 6 },
  sevBtn: { width: 34, height: 34, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 12, fontWeight: '600' },
  primarySubmitBtn: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primarySubmitText: { fontSize: 14, fontWeight: '700' },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  zoneName: { fontSize: 15, fontWeight: '700' },
  metaLine: { fontSize: 12, lineHeight: 18 },
  statusBlock: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, alignItems: 'flex-end' },
  statusScore: { fontSize: 16, fontWeight: '800' },
  statusLabel: { fontSize: 11, fontWeight: '700' },
  factorCols: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  factorHeading: { fontSize: 12, fontWeight: '700' },
  factorItem: { fontSize: 12, lineHeight: 17 },
  reportTitle: { fontSize: 14, fontWeight: '700' },
  reportDesc: { fontSize: 13, lineHeight: 19 },
  reportActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniAction: { minHeight: 36, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniActionText: { fontSize: 12, fontWeight: '600' },
  commentsPanel: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  commentRow: { gap: 2 },
  commentAuthor: { fontSize: 12, fontWeight: '700' },
  commentBody: { fontSize: 12, lineHeight: 17 },
  commentInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commentInput: { flex: 1, minHeight: 40, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, fontSize: 13 },
  postCommentBtn: { minHeight: 40, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  postCommentText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});
