import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { SafeMapView } from '../../components/maps/SafeMapView';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/ServiceFactory';
import {
  createSafetyReportDoc,
  recordReportCorroborationDoc,
  recordReportAbuseFlagDoc,
} from '../../services/firebaseClient';
import { IncidentReport } from '../../types/safety';
import {
  SafetyZone,
  SafetyReport,
  ReportCategory,
  CommunityComment,
  LatLng,
} from '../../types';

interface SafeZoneScreenProps {
  navigation: any;
}

export const SafeZoneScreen: React.FC<SafeZoneScreenProps> = ({ navigation }) => {
  const { location } = useLocation();
  const { user } = useAuth();

  const [zones, setZones] = useState<SafetyZone[]>([]);
  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<SafetyZone | null>(null);
  const [mapCenter, setMapCenter] = useState<LatLng | null>(null);

  // New Report Modal State
  const [isReportModalVisible, setIsReportModalVisible] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDescription, setNewDescription] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ReportCategory>('poor_lighting');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Comments Sheet State
  const [activeReportComments, setActiveReportComments] = useState<SafetyReport | null>(null);
  const [commentsList, setCommentsList] = useState<CommunityComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const filteredReports = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return reports.filter((r) => {
      const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
      const matchesQ =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [reports, selectedCategory, searchQuery]);

  const matchingZones = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter(
      (z) =>
        z.name.toLowerCase().includes(q) ||
        z.summary.toLowerCase().includes(q)
    );
  }, [zones, searchQuery]);

  const handleSelectSearchedZone = (zone: SafetyZone) => {
    setSelectedZone(zone);
    setMapCenter(zone.center);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setMapCenter(null);
  };

  const loadData = async () => {
    const fetchedZones = await dbService.getSafetyZones(location);
    setZones(fetchedZones);
    if (fetchedZones.length > 0 && !selectedZone) {
      setSelectedZone(fetchedZones[0]);
    }
    const fetchedReports = await dbService.getSafetyReports(selectedCategory);
    setReports(fetchedReports);
  };

  const handleCreateReport = async () => {
    if (!newTitle.trim() || !newDescription.trim()) {
      Alert.alert('Required Fields', 'Please enter a title and description for your safety report.');
      return;
    }

    setIsSubmitting(true);
    try {
      const authorUid = user ? user.uid : 'anon_user';
      const newReport: IncidentReport = {
        id: 'rep_' + Date.now(),
        authorUid,
        category: (newCategory as any) || 'poor_lighting',
        title: newTitle.trim(),
        description: newDescription.trim(),
        address: 'Near current location',
        latitude: location.latitude,
        longitude: location.longitude,
        severity: 3,
        verificationStatus: 'unverified',
        corroborationCount: 0,
        outdatedFlags: 0,
        abuseFlags: 0,
        isSynthetic: false,
        timestamp: new Date().toISOString(),
        timeHour: new Date().getHours(),
        lightingCondition: 'dim',
        comments: [],
      };
      await createSafetyReportDoc(newReport, authorUid);

      setIsReportModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      await loadData();
      Alert.alert(
        'Report Submitted',
        'Your report has been shared with the community as an unverified report. Thank you for contributing to collective safety!'
      );
    } catch {
      Alert.alert('Error', 'Unable to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVote = async (reportId: string, _direction: 'up' | 'down') => {
    if (user?.uid) {
      await recordReportCorroborationDoc(reportId, user.uid);
      await loadData();
    }
  };

  const handleFlag = (reportId: string) => {
    Alert.alert(
      'Flag Safety Report',
      'Is this report misleading, abusive, or outdated?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Flag for Review',
          style: 'destructive',
          onPress: async () => {
            if (user?.uid) {
              await recordReportAbuseFlagDoc(reportId, user.uid);
            }
            await loadData();
            Alert.alert('Thank You', 'This report has been flagged for moderation review.');
          },
        },
      ]
    );
  };

  const openComments = async (report: SafetyReport) => {
    setActiveReportComments(report);
    const cmts = await dbService.getComments(report.id);
    setCommentsList(cmts);
  };

  const handleAddComment = async () => {
    if (!activeReportComments || !newCommentText.trim()) return;
    await dbService.addComment(
      activeReportComments.id,
      newCommentText.trim(),
      user ? user.uid : 'anon',
      user ? user.name : 'Community Member'
    );
    setNewCommentText('');
    const updated = await dbService.getComments(activeReportComments.id);
    setCommentsList(updated);
  };

  const categories: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'Poor Lighting', value: 'poor_lighting' },
    { label: 'Harassment', value: 'harassment' },
    { label: 'Suspicious', value: 'suspicious_activity' },
    { label: 'Deserted', value: 'deserted_area' },
    { label: 'Safe Shelters', value: 'safe_shelter' },
  ];

  return (
    <View style={styles.container}>
      <Header
        title="SafeZone"
        subtitle="Area awareness & community reports"
        onOpenHeroes={() => navigation.navigate('SafeHeroes')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
          <TextInput
            placeholder="Search location, metro station, or area..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => {
              if (matchingZones.length > 0) {
                handleSelectSearchedZone(matchingZones[0]);
              } else if (filteredReports.length > 0) {
                setMapCenter(filteredReports[0].coordinates);
              }
            }}
            returnKeyType="search"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Autocomplete / Suggestions Overlay */}
        {searchQuery.trim().length > 0 && (
          <View style={styles.searchSuggestionsCard}>
            <View style={styles.searchSuggestionsHeader}>
              <Text style={styles.searchSuggestionsTitle}>
                {matchingZones.length + filteredReports.length > 0
                  ? `Search Results (${matchingZones.length} zones, ${filteredReports.length} reports)`
                  : 'No Matching Results'}
              </Text>
              <TouchableOpacity onPress={handleClearSearch}>
                <Text style={styles.searchClearText}>Clear</Text>
              </TouchableOpacity>
            </View>

            {matchingZones.map((z) => (
              <TouchableOpacity
                key={z.id}
                style={styles.searchResultRow}
                onPress={() => handleSelectSearchedZone(z)}
              >
                <View
                  style={[
                    styles.searchResultIcon,
                    {
                      backgroundColor:
                        z.level === 'green'
                          ? '#DCFCE7'
                          : z.level === 'yellow'
                          ? '#FEF3C7'
                          : '#FEE2E2',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="shield-outline"
                    size={16}
                    color={
                      z.level === 'green'
                        ? Colors.green
                        : z.level === 'yellow'
                        ? Colors.yellow
                        : Colors.red
                    }
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultName}>{z.name}</Text>
                  <Text style={styles.searchResultSub}>
                    Safety Score: {z.safetyScore}/100 · {z.level.toUpperCase()} ZONE
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}

            {filteredReports.slice(0, 3).map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.searchResultRow}
                onPress={() => {
                  setMapCenter(r.coordinates);
                  openComments(r);
                }}
              >
                <View style={[styles.searchResultIcon, { backgroundColor: '#F3F4F6' }]}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.searchResultName}>{r.title}</Text>
                  <Text style={styles.searchResultSub}>{r.locationName} · {r.category}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Search Area Shortcuts */}
        {!searchQuery && zones.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickSearchRow}
          >
            {zones.map((z) => (
              <TouchableOpacity
                key={z.id}
                style={[
                  styles.quickSearchChip,
                  selectedZone?.id === z.id && styles.quickSearchChipActive,
                ]}
                onPress={() => handleSelectSearchedZone(z)}
              >
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={14}
                  color={selectedZone?.id === z.id ? '#FFF' : Colors.primary}
                />
                <Text
                  style={[
                    styles.quickSearchChipText,
                    selectedZone?.id === z.id && styles.quickSearchChipTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {z.name.split('&')[0].trim()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Interactive Map */}
        <SafeMapView
          currentLocation={location}
          centerLocation={mapCenter || location}
          zones={matchingZones.length > 0 ? matchingZones : zones}
          reports={filteredReports}
          onSelectZone={(z) => {
            setSelectedZone(z);
            setMapCenter(z.center);
          }}
          onSelectReport={(r) => {
            openComments(r);
            setMapCenter(r.coordinates);
          }}
          height={260}
        />

        {/* Selected Zone Transparent Explanation Card */}
        {selectedZone && (
          <Card style={styles.zoneCard}>
            <View style={styles.zoneHeaderRow}>
              <View>
                <Text style={styles.zoneName}>{selectedZone.name}</Text>
                <Text style={styles.zoneScoreSub}>Safety Confidence Score: {selectedZone.safetyScore}/100</Text>
              </View>
              <Badge
                label={`${selectedZone.level.toUpperCase()} ZONE`}
                type={selectedZone.level}
              />
            </View>

            <Text style={styles.zoneSummary}>{selectedZone.summary}</Text>

            {/* Explainable Factor Pills */}
            <View style={styles.indicatorsRow}>
              <View style={styles.indicatorPill}>
                <MaterialCommunityIcons
                  name="lightbulb-on-outline"
                  size={14}
                  color={selectedZone.indicators.lightingQuality === 'good' ? Colors.green : Colors.yellow}
                />
                <Text style={styles.indicatorText}>
                  Lighting: {selectedZone.indicators.lightingQuality}
                </Text>
              </View>

              <View style={styles.indicatorPill}>
                <MaterialCommunityIcons
                  name="police-badge-outline"
                  size={14}
                  color={selectedZone.indicators.policePresence ? Colors.green : Colors.textMuted}
                />
                <Text style={styles.indicatorText}>
                  {selectedZone.indicators.policePresence ? 'Police Patrols' : 'No Regular Patrols'}
                </Text>
              </View>

              <View style={styles.indicatorPill}>
                <MaterialCommunityIcons
                  name="cctv"
                  size={14}
                  color={selectedZone.indicators.cctvCoverage ? Colors.green : Colors.textMuted}
                />
                <Text style={styles.indicatorText}>
                  {selectedZone.indicators.cctvCoverage ? 'CCTV Active' : 'Low Surveillance'}
                </Text>
              </View>
            </View>

            <Text style={styles.disclaimerNote}>
              * Zone classifications are based on recent community reports, lighting, and presence indicators, not official crime predictions.
            </Text>
          </Card>
        )}

        {/* Category Filter Pills */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Community Reports</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsRow}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.value}
                style={[
                  styles.filterPill,
                  selectedCategory === c.value && styles.filterPillActive,
                ]}
                onPress={() => setSelectedCategory(c.value)}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    selectedCategory === c.value && styles.filterPillTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Add Report Action Button */}
        <TouchableOpacity
          style={styles.addReportBanner}
          onPress={() => setIsReportModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.addReportIcon}>
            <MaterialCommunityIcons name="plus-circle" size={20} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addReportTitle}>Report a Safety Condition</Text>
            <Text style={styles.addReportSubtitle}>Help other women by sharing lighting, hazard, or safe shelter updates</Text>
          </View>
        </TouchableOpacity>

        {/* Reports Feed */}
        <View style={styles.reportsList}>
          {filteredReports.length === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="shield-check" size={36} color={Colors.green} />
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No Matching Reports Found' : 'No Safety Concerns Reported'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? `No reports found matching "${searchQuery}". Try clearing search or checking another category.`
                  : 'There are currently no active reports in this category nearby.'}
              </Text>
            </Card>
          ) : (
            filteredReports.map((rep) => (
              <Card key={rep.id} style={styles.reportCard}>
                <View style={styles.reportHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportTitle}>{rep.title}</Text>
                    <Text style={styles.reportAuthor}>
                      By {rep.authorName} • {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Badge
                    label={rep.status.replace('_', ' ')}
                    type={rep.status}
                  />
                </View>

                <Text style={styles.reportDescription}>{rep.description}</Text>

                <View style={styles.reportFooter}>
                  <View style={styles.voteControls}>
                    <TouchableOpacity
                      style={styles.voteBtn}
                      onPress={() => handleVote(rep.id, 'up')}
                    >
                      <MaterialCommunityIcons name="thumb-up-outline" size={16} color={Colors.primary} />
                      <Text style={styles.voteCount}>{rep.upvotes}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.voteBtn}
                      onPress={() => openComments(rep)}
                    >
                      <MaterialCommunityIcons name="comment-text-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.voteCount}>Comments</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.flagBtn}
                    onPress={() => handleFlag(rep.id)}
                  >
                    <MaterialCommunityIcons name="flag-outline" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>

      {/* Submit Report Modal */}
      <Modal visible={isReportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Safety Report</Text>
              <TouchableOpacity onPress={() => setIsReportModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryPicker}>
              {(['poor_lighting', 'harassment', 'suspicious_activity', 'deserted_area', 'safe_shelter'] as ReportCategory[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catOption,
                    newCategory === cat && styles.catOptionActive,
                  ]}
                  onPress={() => setNewCategory(cat)}
                >
                  <Text style={[styles.catOptionText, newCategory === cat && styles.catOptionTextActive]}>
                    {cat.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              placeholder="e.g., Streetlights dark on pedestrian path"
              placeholderTextColor={Colors.textMuted}
              value={newTitle}
              onChangeText={setNewTitle}
              style={styles.modalInput}
            />

            <Text style={styles.inputLabel}>Details & Observation</Text>
            <TextInput
              placeholder="Describe the condition, helpful landmarks, and tips..."
              placeholderTextColor={Colors.textMuted}
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={4}
              style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
            />

            <Button
              title="Submit Report"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              onPress={handleCreateReport}
              style={{ marginTop: Spacing.md }}
            />
          </View>
        </View>
      </Modal>

      {/* Community Comments Modal */}
      <Modal visible={activeReportComments !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Community Discussion</Text>
              <TouchableOpacity onPress={() => setActiveReportComments(null)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {activeReportComments && (
              <View style={styles.commentHeaderReport}>
                <Text style={styles.commentHeaderTitle}>{activeReportComments.title}</Text>
                <Text style={styles.commentHeaderDesc}>{activeReportComments.description}</Text>
              </View>
            )}

            <FlatList
              data={commentsList}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: Spacing.sm, paddingVertical: Spacing.md }}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Text style={styles.commentUser}>{item.userName}</Text>
                  <Text style={styles.commentText}>{item.content}</Text>
                  <Text style={styles.commentTime}>
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.noCommentsText}>No comments yet. Be the first to share an update!</Text>
              }
            />

            <View style={styles.addCommentBar}>
              <TextInput
                placeholder="Add a corroborating update..."
                placeholderTextColor={Colors.textMuted}
                value={newCommentText}
                onChangeText={setNewCommentText}
                style={styles.addCommentInput}
              />
              <Button
                title="Post"
                size="sm"
                variant="primary"
                onPress={handleAddComment}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 46,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    color: Colors.text,
  },
  searchSuggestionsCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: Spacing.xs,
    marginTop: -Spacing.md,
  },
  searchSuggestionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  searchSuggestionsTitle: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  searchClearText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  searchResultIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '600',
    color: Colors.text,
  },
  searchResultSub: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
  },
  quickSearchRow: {
    gap: Spacing.xs,
    marginTop: -Spacing.md,
    paddingBottom: 2,
  },
  quickSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  quickSearchChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickSearchChipText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  quickSearchChipTextActive: {
    color: '#FFF',
  },
  zoneCard: {
    gap: Spacing.sm,
  },
  zoneHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  zoneName: {
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '700',
    color: Colors.text,
  },
  zoneScoreSub: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  zoneSummary: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.body,
  },
  indicatorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  indicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  indicatorText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  disclaimerNote: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
  },
  filterSection: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  filterPillsRow: {
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterPillText: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFF',
  },
  addReportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accentSoft,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: Spacing.md,
  },
  addReportIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addReportTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.primary,
  },
  addReportSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reportsList: {
    gap: Spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '700',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  reportCard: {
    gap: Spacing.sm,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reportTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  reportAuthor: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
    marginTop: 2,
  },
  reportDescription: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.body,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  voteControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  voteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  voteCount: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  flagBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 19, 43, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  inputLabel: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  catOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catOptionActive: {
    backgroundColor: Colors.accentSoft,
    borderColor: Colors.accent,
  },
  catOptionText: {
    fontSize: Typography.fontSize.caption,
    textTransform: 'capitalize',
    color: Colors.textSecondary,
  },
  catOptionTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.text,
  },
  commentHeaderReport: {
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  commentHeaderTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  commentHeaderDesc: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  commentItem: {
    backgroundColor: Colors.surfaceSubtle,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 2,
  },
  commentUser: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
  commentText: {
    fontSize: Typography.fontSize.body,
    color: Colors.text,
  },
  commentTime: {
    fontSize: 10,
    color: Colors.textMuted,
    alignSelf: 'flex-end',
  },
  noCommentsText: {
    textAlign: 'center',
    color: Colors.textMuted,
    paddingVertical: Spacing.xl,
  },
  addCommentBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  addCommentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    fontSize: Typography.fontSize.body,
  },
});

