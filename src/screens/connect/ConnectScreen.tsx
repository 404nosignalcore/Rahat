import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { SafeMapView } from '../../components/maps/SafeMapView';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { useLocation } from '../../context/LocationContext';
import { useAuth } from '../../context/AuthContext';
import { dbService } from '../../services/ServiceFactory';
import {
  createCommunityPostDoc,
  recordReportCorroborationDoc,
} from '../../services/firebaseClient';
import { CommunityPost } from '../../types/safety';
import {
  SafeCircle,
  NearbyHelpItem,
  SafetyReport,
} from '../../types';
import { formatDistance } from '../../utils/geo';

interface ConnectScreenProps {
  navigation: any;
}

type ConnectTabSection = 'safecircle' | 'nearbyhelp' | 'community';

export const ConnectScreen: React.FC<ConnectScreenProps> = ({ navigation }) => {
  const { location } = useLocation();
  const { user } = useAuth();

  const [activeSection, setActiveSection] = useState<ConnectTabSection>('safecircle');

  // Section A: SafeCircle
  const [safeCircle, setSafeCircle] = useState<SafeCircle | null>(null);
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(true);

  // Section B: Nearby Help
  const [nearbyHelp, setNearbyHelp] = useState<NearbyHelpItem[]>([]);
  const [helpCategoryFilter, setHelpCategoryFilter] = useState<string>('all');
  const [helpSearch, setHelpSearch] = useState<string>('');

  // Section C: Community Feed
  const [communityPosts, setCommunityPosts] = useState<SafetyReport[]>([]);
  const [newPostContent, setNewPostContent] = useState<string>('');
  const [isPosting, setIsPosting] = useState<boolean>(false);

  useEffect(() => {
    loadConnectData();
  }, [user]);

  const loadConnectData = async () => {
    if (user) {
      const circle = await dbService.getSafeCircle(user.uid);
      setSafeCircle(circle);
      if (circle) {
        setIsSharingLocation(circle.shareLiveLocation);
      }
    }
    const helpItems = await dbService.getNearbyHelp(location);
    setNearbyHelp(helpItems);

    const posts = await dbService.getSafetyReports();
    setCommunityPosts(posts);
  };

  const handleToggleLocationSharing = async (val: boolean) => {
    setIsSharingLocation(val);
    if (user) {
      await dbService.updateLocationSharing(user.uid, val, val ? location : undefined);
      Alert.alert(
        val ? 'Live Sharing Enabled' : 'Live Sharing Stopped',
        val
          ? 'Your trusted SafeCircle members can now see your live journey position.'
          : 'Live location sharing with your circle has been completely disabled.'
      );
    }
  };

  const handleCallNearby = (phone: string, name: string) => {
    Alert.alert(`Call ${name}`, `Dial ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        onPress: () => Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`),
      },
    ]);
  };

  const handleGetDirections = (item: NearbyHelpItem) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${item.coordinates.latitude},${item.coordinates.longitude}`;
    Linking.openURL(url);
  };

  const handleCreateCommunityPost = async () => {
    if (!newPostContent.trim()) return;
    setIsPosting(true);
    try {
      const authorUid = user ? user.uid : 'anon';
      const post: CommunityPost = {
        id: 'post_' + Date.now(),
        authorUid,
        authorDisplay: user ? user.name : 'Community Member',
        coarseArea: 'Local Neighborhood Corridor',
        topic: 'safe_tip',
        body: newPostContent.trim(),
        helpfulCount: 0,
        abuseFlags: 0,
        createdAt: new Date().toISOString(),
        comments: [],
      };
      await createCommunityPostDoc(post);
      setNewPostContent('');
      const updated = await dbService.getSafetyReports();
      setCommunityPosts(updated);
      Alert.alert('Posted', 'Your safety tip has been shared with the community.');
    } finally {
      setIsPosting(false);
    }
  };

  const filteredHelp = nearbyHelp.filter((item) => {
    const matchesCat = helpCategoryFilter === 'all' || item.category === helpCategoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(helpSearch.toLowerCase()) ||
      item.address.toLowerCase().includes(helpSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <View style={styles.container}>
      <Header
        title="Connect"
        subtitle="SafeCircle, Nearby Help & Community Feed"
        onOpenHeroes={() => navigation.navigate('SafeHeroes')}
      />

      {/* Segmented Top Switcher */}
      <View style={styles.tabSwitcher}>
        <TouchableOpacity
          style={[styles.switchTab, activeSection === 'safecircle' && styles.switchTabActive]}
          onPress={() => setActiveSection('safecircle')}
        >
          <MaterialCommunityIcons
            name="account-group"
            size={18}
            color={activeSection === 'safecircle' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.switchTabText,
              activeSection === 'safecircle' && styles.switchTabTextActive,
            ]}
          >
            SafeCircle
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchTab, activeSection === 'nearbyhelp' && styles.switchTabActive]}
          onPress={() => setActiveSection('nearbyhelp')}
        >
          <MaterialCommunityIcons
            name="hospital-box-outline"
            size={18}
            color={activeSection === 'nearbyhelp' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.switchTabText,
              activeSection === 'nearbyhelp' && styles.switchTabTextActive,
            ]}
          >
            Nearby Help
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchTab, activeSection === 'community' && styles.switchTabActive]}
          onPress={() => setActiveSection('community')}
        >
          <MaterialCommunityIcons
            name="forum-outline"
            size={18}
            color={activeSection === 'community' ? Colors.primary : Colors.textMuted}
          />
          <Text
            style={[
              styles.switchTabText,
              activeSection === 'community' && styles.switchTabTextActive,
            ]}
          >
            Community
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* =================================================== */}
        {/* SECTION A: SAFECIRCLE */}
        {/* =================================================== */}
        {activeSection === 'safecircle' && (
          <View style={styles.sectionContainer}>
            {/* Live Location Sharing Consent Card */}
            <Card style={styles.sharingCard}>
              <View style={styles.sharingHeader}>
                <View style={styles.sharingIconCircle}>
                  <MaterialCommunityIcons name="radar" size={24} color={Colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sharingTitle}>Live Location Sharing</Text>
                  <Text style={styles.sharingSubtitle}>
                    {isSharingLocation
                      ? 'Currently sharing with active circle members'
                      : 'Live sharing is turned off'}
                  </Text>
                </View>
                <Switch
                  value={isSharingLocation}
                  onValueChange={handleToggleLocationSharing}
                  trackColor={{ false: Colors.border, true: Colors.accent }}
                  thumbColor="#FFF"
                />
              </View>

              <Text style={styles.consentDisclaimer}>
                * Requires your explicit consent. You can disable live location sharing at any time. Location history is never sold or permanently retained.
              </Text>
            </Card>

            {/* Active Circle Members List */}
            <View style={styles.circleHeaderRow}>
              <Text style={styles.sectionTitle}>{safeCircle?.name || 'My SafeCircle'}</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    'Invite Member',
                    'Share your unique SafeCircle invite link with a trusted family member or friend.'
                  )
                }
              >
                <Text style={styles.addMemberLink}>+ Invite Member</Text>
              </TouchableOpacity>
            </View>

            {safeCircle?.members.map((member) => (
              <Card key={member.id} style={styles.memberCard}>
                <View style={[styles.memberAvatar, { backgroundColor: member.avatarColor || Colors.accent }]}>
                  <Text style={styles.avatarInitial}>{member.name[0]}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={styles.memberNameRow}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    {member.isSharingLiveLocation && (
                      <View style={styles.onlineBadge}>
                        <View style={styles.onlineDot} />
                        <Text style={styles.onlineText}>Sharing Live</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.memberPhone}>{member.phone}</Text>
                  {member.lastUpdated && (
                    <Text style={styles.memberUpdated}>
                      Updated {Math.round((Date.now() - member.lastUpdated) / 60000)}m ago
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.callIconBtn}
                  onPress={() => handleCallNearby(member.phone, member.name)}
                >
                  <MaterialCommunityIcons name="phone" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}

        {/* =================================================== */}
        {/* SECTION B: NEARBY HELP */}
        {/* =================================================== */}
        {activeSection === 'nearbyhelp' && (
          <View style={styles.sectionContainer}>
            {/* Help Search */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons name="magnify" size={20} color={Colors.textMuted} />
              <TextInput
                placeholder="Search police station, hospital, pharmacy..."
                placeholderTextColor={Colors.textMuted}
                value={helpSearch}
                onChangeText={setHelpSearch}
                style={styles.searchInput}
              />
            </View>

            {/* Category Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipRow}>
              {[
                { label: 'All', value: 'all' },
                { label: 'Police', value: 'police' },
                { label: 'Pink Booths', value: 'pink_booth' },
                { label: 'Hospitals', value: 'hospital' },
                { label: '24/7 Pharmacy', value: 'pharmacy' },
              ].map((chip) => (
                <TouchableOpacity
                  key={chip.value}
                  style={[
                    styles.chip,
                    helpCategoryFilter === chip.value && styles.chipActive,
                  ]}
                  onPress={() => setHelpCategoryFilter(chip.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      helpCategoryFilter === chip.value && styles.chipTextActive,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Nearby Assistance List */}
            {filteredHelp.map((item) => (
              <Card key={item.id} style={styles.helpCard}>
                <View style={styles.helpHeader}>
                  <View style={styles.helpCategoryIcon}>
                    <MaterialCommunityIcons
                      name={
                        item.category === 'police'
                          ? 'police-badge'
                          : item.category === 'hospital'
                          ? 'hospital-building'
                          : item.category === 'pink_booth'
                          ? 'shield-account'
                          : 'pill'
                      }
                      size={22}
                      color={item.category === 'police' ? Colors.primary : Colors.green}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={styles.helpTitleRow}>
                      <Text style={styles.helpName}>{item.name}</Text>
                      {item.isVerified && (
                        <Badge
                          label="VERIFIED"
                          type="verified_official"
                          icon={<MaterialCommunityIcons name="check-decagram" size={12} color={Colors.greenText} />}
                        />
                      )}
                    </View>
                    <Text style={styles.helpAddress}>{item.address}</Text>
                    <View style={styles.distanceBadgeRow}>
                      <Text style={styles.helpDistance}>
                        {formatDistance(item.distanceMeters)} away
                      </Text>
                      {item.isOpen24Hours && (
                        <Text style={styles.open24Text}>• Open 24 Hours</Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.helpActionsRow}>
                  <Button
                    title="Call Station"
                    size="sm"
                    variant="primary"
                    icon={<MaterialCommunityIcons name="phone" size={16} color="#FFF" />}
                    onPress={() => handleCallNearby(item.phone, item.name)}
                    style={{ flex: 1 }}
                  />

                  <Button
                    title="Directions"
                    size="sm"
                    variant="outline"
                    icon={<MaterialCommunityIcons name="directions" size={16} color={Colors.primary} />}
                    onPress={() => handleGetDirections(item)}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* =================================================== */}
        {/* SECTION C: SAFETY COMMUNITY */}
        {/* =================================================== */}
        {activeSection === 'community' && (
          <View style={styles.sectionContainer}>
            {/* Create Post Input Box */}
            <Card style={styles.createPostCard}>
              <Text style={styles.createPostTitle}>Share a Safety Experience or Tip</Text>
              <TextInput
                placeholder="Share advice, lighting conditions, or helpful safety tips... (Precise home location is never exposed)"
                placeholderTextColor={Colors.textMuted}
                value={newPostContent}
                onChangeText={setNewPostContent}
                multiline
                numberOfLines={3}
                style={styles.postInput}
              />
              <View style={styles.postActionBar}>
                <View style={styles.privacyNoteRow}>
                  <MaterialCommunityIcons name="eye-off-outline" size={14} color={Colors.textMuted} />
                  <Text style={styles.privacyNoteText}>Masked approximate location</Text>
                </View>
                <Button
                  title="Post to Community"
                  size="sm"
                  variant="primary"
                  loading={isPosting}
                  onPress={handleCreateCommunityPost}
                />
              </View>
            </Card>

            {/* Community Feed Posts */}
            <Text style={styles.sectionTitle}>Recent Area Discussions</Text>
            {communityPosts.map((post) => (
              <Card key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    <Text style={styles.postAvatarText}>{post.authorName[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.postAuthorName}>{post.authorName}</Text>
                    <Text style={styles.postLocation}>{post.locationName}</Text>
                  </View>
                  <Badge label={post.status.replace('_', ' ')} type={post.status} />
                </View>

                <Text style={styles.postContent}>{post.description}</Text>

                <View style={styles.postFooter}>
                  <View style={styles.postStats}>
                    <TouchableOpacity
                      style={styles.statBtn}
                      onPress={async () => {
                        if (user?.uid) {
                          await recordReportCorroborationDoc(post.id, user.uid);
                          const updated = await dbService.getSafetyReports();
                          setCommunityPosts(updated);
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="thumb-up-outline" size={16} color={Colors.primary} />
                      <Text style={styles.statBtnText}>{post.upvotes} Helpful</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.flagBtn}
                    onPress={() =>
                      Alert.alert('Report Post', 'Report this post for inappropriate content or spam?', [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Report & Hide',
                          style: 'destructive',
                          onPress: () => Alert.alert('Reported', 'Thank you. Content flagged for moderation.'),
                        },
                      ])
                    }
                  >
                    <MaterialCommunityIcons name="dots-horizontal" size={20} color={Colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabSwitcher: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    gap: 6,
  },
  switchTabActive: {
    backgroundColor: Colors.accentSoft,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  switchTabText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  switchTabTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.lg,
  },
  sectionContainer: {
    gap: Spacing.md,
  },
  sharingCard: {
    gap: Spacing.sm,
  },
  sharingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sharingIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sharingTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  sharingSubtitle: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  consentDisclaimer: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
    lineHeight: Typography.lineHeight.caption,
    marginTop: 2,
  },
  circleHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  addMemberLink: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.accent,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '700',
    color: '#FFF',
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  memberName: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.greenLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  onlineText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.greenText,
  },
  memberPhone: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  memberUpdated: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  callIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.body,
  },
  filterChipRow: {
    gap: Spacing.xs,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFF',
  },
  helpCard: {
    gap: Spacing.md,
  },
  helpHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  helpCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  helpName: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  helpAddress: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  distanceBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  helpDistance: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Colors.accent,
  },
  open24Text: {
    fontSize: Typography.fontSize.caption,
    color: Colors.greenText,
    fontWeight: '600',
  },
  helpActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  createPostCard: {
    gap: Spacing.sm,
  },
  createPostTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  postInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.body,
    height: 80,
    textAlignVertical: 'top',
  },
  postActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  privacyNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  privacyNoteText: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
  },
  postCard: {
    gap: Spacing.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postAvatarText: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.accent,
  },
  postAuthorName: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  postLocation: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
  },
  postContent: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.body,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statBtnText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '600',
    color: Colors.primary,
  },
  flagBtn: {
    padding: 4,
  },
});

