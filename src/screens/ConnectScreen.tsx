import React, { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeWalk } from '../context/SafeWalkContext';
import { getTranslation } from '../i18n/translations';
import { CommunityPost, ConnectSubTab, SafeHavenType } from '../types/safety';
import { formatDistance, getDistanceMeters } from '../utils/safetyRiskEngine';
import { AppIcon } from '../components/ui/AppIcon';
import {
  Colors,
  BorderRadius,
  TypographyStyles,
  Spacing,
} from '../theme';
import { SearchInput } from '../components/common/SearchInput';
import { OptionChip } from '../components/common/OptionChip';
import { Badge } from '../components/common/Badge';

export const ConnectScreen: React.FC = () => {
  const {
    themeMode,
    language,
    connectSubTab,
    setConnectSubTab,
    currentLocation,
    safeCircles,
    toggleCircleSharing,
    inviteCircleMember,
    toggleMemberConsent,
    safeHavens,
    communityPosts,
    blockedAuthorUids,
    createCommunityPost,
    addCommunityPostComment,
    markPostHelpful,
    flagOrBlockCommunityPost,
  } = useSafeWalk();

  const t = getTranslation(language);
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isDark = themeMode === 'dark';

  // SafeCircle Invite State
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');

  // Nearby Help Search & Filter
  const [helpQuery, setHelpQuery] = useState('');
  const [helpTypeFilter, setHelpTypeFilter] = useState<SafeHavenType | 'all'>('all');

  // Community Compose & Comment
  const [postArea, setPostArea] = useState('Connaught Place / Janpath');
  const [postTopic, setPostTopic] = useState<CommunityPost['topic']>('area_update');
  const [postBody, setPostBody] = useState('');
  const [postError, setPostError] = useState<string | null>(null);
  const [commentTextByPost, setCommentTextByPost] = useState<Record<string, string>>({});

  const enrichedHavens = useMemo(() => {
    return safeHavens
      .map((h) => ({
        ...h,
        distanceMeters: getDistanceMeters(
          currentLocation.lat,
          currentLocation.lng,
          h.latitude,
          h.longitude
        ),
      }))
      .filter((h) => {
        const matchesType = helpTypeFilter === 'all' || h.type === helpTypeFilter;
        const q = helpQuery.trim().toLowerCase();
        const matchesQuery =
          !q || h.name.toLowerCase().includes(q) || h.address.toLowerCase().includes(q);
        return matchesType && matchesQuery;
      })
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  }, [safeHavens, currentLocation, helpQuery, helpTypeFilter]);

  const visiblePosts = useMemo(() => {
    return communityPosts.filter(
      (p) => p.abuseFlags < 5 && !blockedAuthorUids.includes(p.authorUid)
    );
  }, [communityPosts, blockedAuthorUids]);

  const handleInvite = (circleId: string) => {
    if (!inviteName.trim()) return;
    inviteCircleMember(circleId, inviteName, invitePhone);
    setInviteName('');
    setInvitePhone('');
  };

  const handleCreatePost = async () => {
    setPostError(null);
    if (postArea.trim().length < 2 || postBody.trim().length < 5) {
      setPostError('Please enter a coarse area name and at least 5 characters.');
      return;
    }
    const res = await createCommunityPost({
      coarseArea: postArea,
      topic: postTopic,
      body: postBody,
    });
    if (!res.ok) {
      setPostError(res.error || 'Could not publish post.');
      return;
    }
    setPostBody('');
  };

  const subTabs: { id: ConnectSubTab; label: string }[] = [
    { id: 'safecircle', label: 'SafeCircle Groups' },
    { id: 'nearby_help', label: 'Nearby Safe Havens' },
    { id: 'community', label: 'Safety Forum' },
  ];

  return (
    <ScrollView
      style={[
        styles.screen,
        { backgroundColor: isDark ? '#000000' : Colors.canvasParchment },
      ]}
      contentContainerStyle={styles.scrollContent}
    >
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
            SafeCircle & Community Defense
          </Text>
          <Text
            style={[
              styles.heroLead,
              { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
            ]}
          >
            Encrypted consent-based location circles, verified physical sanctuary points, and peer safety intelligence.
          </Text>

          {/* Apple Pill Segmented Filter Strip */}
          <View style={styles.segmentedFilterRow}>
            {subTabs.map((st) => {
              const active = connectSubTab === st.id;
              return (
                <OptionChip
                  key={st.id}
                  label={st.label}
                  selected={active}
                  onPress={() => setConnectSubTab(st.id)}
                />
              );
            })}
          </View>
        </View>
      </View>

      {/* SECTION 2: Sub-Tab Content Surfaces */}
      <View style={styles.mainContentSection}>
        <View style={styles.mainInner}>
          {/* SUB-TAB A: SAFECIRCLE */}
          {connectSubTab === 'safecircle' && (
            <View style={styles.sectionStack}>
              {safeCircles.map((circle) => (
                <View
                  key={circle.id}
                  style={[
                    styles.utilityCard,
                    {
                      backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                      borderColor: isDark ? '#272729' : Colors.hairline,
                    },
                  ]}
                >
                  <View style={styles.circleHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.cardHeadline,
                          { color: isDark ? '#ffffff' : Colors.ink },
                        ]}
                      >
                        {circle.name}
                      </Text>
                      <Text style={styles.cardMeta}>
                        Consent-gated location sharing · {circle.members.length} members
                      </Text>
                    </View>

                    <View style={styles.switchCluster}>
                      <Text
                        style={[
                          styles.switchLabel,
                          { color: circle.sharingEnabled ? Colors.green : Colors.inkMuted48 },
                        ]}
                      >
                        {circle.sharingEnabled ? 'Sharing Active' : 'Sharing Paused'}
                      </Text>
                      <Switch
                        accessibilityLabel={`Toggle sharing for ${circle.name}`}
                        value={circle.sharingEnabled}
                        onValueChange={() => toggleCircleSharing(circle.id)}
                        thumbColor="#ffffff"
                        trackColor={{ false: '#38383a', true: Colors.green }}
                      />
                    </View>
                  </View>

                  {/* Members List */}
                  <View style={styles.membersList}>
                    {circle.members.map((member) => (
                      <View
                        key={member.id}
                        style={[
                          styles.memberItem,
                          {
                            backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                            borderColor: isDark ? '#38383a' : Colors.hairline,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text
                            style={[
                              styles.memberName,
                              { color: isDark ? '#ffffff' : Colors.ink },
                            ]}
                          >
                            {member.displayName}
                          </Text>
                          <Text style={styles.memberMeta}>
                            {member.inviteStatus === 'accepted' ? 'Active Member' : 'Pending Invite'} ·{' '}
                            {member.lastSharedArea || 'No location shared'}
                          </Text>
                          {member.activeJourneySummary && (
                            <Text style={styles.journeyBadge}>
                              {member.activeJourneySummary}
                            </Text>
                          )}
                        </View>

                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Toggle location consent for ${member.displayName}`}
                          onPress={() => toggleMemberConsent(circle.id, member.id)}
                          style={({ pressed }) => [
                            styles.consentPill,
                            member.consentToShareLocation
                              ? styles.consentPillActive
                              : styles.consentPillInactive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.consentPillText,
                              member.consentToShareLocation
                                ? { color: Colors.greenText }
                                : { color: Colors.inkMuted48 },
                            ]}
                          >
                            {member.consentToShareLocation ? 'Consent On' : 'Consent Off'}
                          </Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Invite New Member */}
                  <View style={styles.inviteContainer}>
                    <Text
                      style={[
                        styles.inviteTitle,
                        { color: isDark ? '#ffffff' : Colors.ink },
                      ]}
                    >
                      Invite Trusted Friend or Family
                    </Text>
                    <View style={[styles.inputsRow, isWide && styles.inputsRowWide]}>
                      <TextInput
                        placeholder="Full Name"
                        placeholderTextColor={Colors.inkMuted48}
                        value={inviteName}
                        onChangeText={setInviteName}
                        style={[
                          styles.pillInput,
                          {
                            flex: 1,
                            backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                            color: isDark ? '#ffffff' : Colors.ink,
                          },
                        ]}
                      />
                      <TextInput
                        placeholder="Phone Number (+91 ...)"
                        placeholderTextColor={Colors.inkMuted48}
                        value={invitePhone}
                        onChangeText={setInvitePhone}
                        keyboardType="phone-pad"
                        style={[
                          styles.pillInput,
                          {
                            flex: 1,
                            backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                            color: isDark ? '#ffffff' : Colors.ink,
                          },
                        ]}
                      />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleInvite(circle.id)}
                        style={({ pressed }) => [
                          styles.inviteBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.inviteBtnText}>Send Invite</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* SUB-TAB B: NEARBY HELP HAVENS */}
          {connectSubTab === 'nearby_help' && (
            <View style={styles.sectionStack}>
              <SearchInput
                value={helpQuery}
                onChangeText={setHelpQuery}
                onClear={() => setHelpQuery('')}
                placeholder="Search police stations, hospitals, pharmacies..."
                style={{ marginBottom: 14 }}
              />

              {/* Category Filter Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.havenFilterScroll}
              >
                {(
                  [
                    { id: 'all', label: 'All Sanctuary Points' },
                    { id: 'police', label: 'Police Stations' },
                    { id: 'hospital', label: 'Hospitals' },
                    { id: 'pharmacy', label: '24/7 Pharmacies' },
                    { id: 'campus_security', label: 'Security Posts' },
                    { id: 'metro_booth', label: 'Metro Helpdesks' },
                  ] as { id: SafeHavenType | 'all'; label: string }[]
                ).map((opt) => (
                  <OptionChip
                    key={opt.id}
                    label={opt.label}
                    selected={helpTypeFilter === opt.id}
                    onPress={() => setHelpTypeFilter(opt.id)}
                  />
                ))}
              </ScrollView>

              {/* Havens Grid */}
              <View style={[styles.havensGrid, isWide && styles.havensGridWide]}>
                {enrichedHavens.map((haven) => (
                  <View
                    key={haven.id}
                    style={[
                      styles.havenCard,
                      {
                        backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                        borderColor: isDark ? '#272729' : Colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.havenTop}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[
                            styles.havenName,
                            { color: isDark ? '#ffffff' : Colors.ink },
                          ]}
                        >
                          {language === 'hi' ? haven.nameHi : haven.name}
                        </Text>
                        <Text style={styles.havenMeta}>
                          {t.safeHavenTypes[haven.type]} · {formatDistance(haven.distanceMeters || 0)}
                          {haven.open24Hours ? ' · Open 24/7' : ''}
                        </Text>
                      </View>

                      <Badge
                        label={haven.sourceTier === 'verified' ? 'Verified' : 'Community'}
                        type={haven.sourceTier === 'verified' ? 'safe' : 'neutral'}
                      />
                    </View>

                    <Text
                      style={[
                        styles.havenAddress,
                        { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                      ]}
                    >
                      {haven.address}
                      {haven.notes ? ` — ${haven.notes}` : ''}
                    </Text>

                    <View style={styles.havenActionRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          Linking.openURL(
                            `https://www.google.com/maps/dir/?api=1&destination=${haven.latitude},${haven.longitude}`
                          )
                        }
                        style={({ pressed }) => [
                          styles.havenActionBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="route" size={14} color={Colors.primary} />
                        <Text style={styles.havenActionText}>Directions</Text>
                      </Pressable>

                      {haven.phone && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => Linking.openURL(`tel:${haven.phone}`)}
                          style={({ pressed }) => [
                            styles.havenActionBtn,
                            pressed && styles.pressed,
                          ]}
                        >
                          <AppIcon name="phone" size={14} color={Colors.green} />
                          <Text style={[styles.havenActionText, { color: Colors.green }]}>
                            Call {haven.phone}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* SUB-TAB C: SAFETY FORUM */}
          {connectSubTab === 'community' && (
            <View style={styles.sectionStack}>
              {/* Post Composer Card ({component.store-utility-card}) */}
              <View
                style={[
                  styles.utilityCard,
                  {
                    backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                    borderColor: isDark ? '#272729' : Colors.hairline,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardHeadline,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  Share Local Safety Intelligence
                </Text>
                <Text style={styles.cardMeta}>
                  Privacy Shield: Only coarse neighborhood names are displayed—never your exact coordinates.
                </Text>

                {/* Topic Selector Chips */}
                <View style={styles.topicChipsRow}>
                  {(
                    [
                      { id: 'area_update', label: 'Area Update' },
                      { id: 'safe_tip', label: 'Safe Tip' },
                      { id: 'lighting_alert', label: 'Lighting Alert' },
                      { id: 'suspicious_activity', label: 'Caution' },
                    ] as { id: CommunityPost['topic']; label: string }[]
                  ).map((topic) => (
                    <OptionChip
                      key={topic.id}
                      label={topic.label}
                      selected={postTopic === topic.id}
                      onPress={() => setPostTopic(topic.id)}
                    />
                  ))}
                </View>

                <TextInput
                  placeholder="Neighborhood / Area Corridor (coarse only)"
                  placeholderTextColor={Colors.inkMuted48}
                  value={postArea}
                  onChangeText={setPostArea}
                  style={[
                    styles.pillInput,
                    {
                      backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                      color: isDark ? '#ffffff' : Colors.ink,
                      marginBottom: 10,
                    },
                  ]}
                />

                <TextInput
                  placeholder="Share a factual observation or safety tip..."
                  placeholderTextColor={Colors.inkMuted48}
                  value={postBody}
                  onChangeText={setPostBody}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.textAreaInput,
                    {
                      backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                      color: isDark ? '#ffffff' : Colors.ink,
                      marginBottom: 10,
                    },
                  ]}
                />

                {postError && <Text style={styles.errorText}>{postError}</Text>}

                <Pressable
                  accessibilityRole="button"
                  onPress={handleCreatePost}
                  style={({ pressed }) => [
                    styles.publishBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.publishBtnText}>Publish Safety Update</Text>
                </Pressable>
              </View>

              {/* Feed of Community Posts */}
              <View style={styles.postsList}>
                {visiblePosts.map((post) => (
                  <View
                    key={post.id}
                    style={[
                      styles.postCard,
                      {
                        backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                        borderColor: isDark ? '#272729' : Colors.hairline,
                      },
                    ]}
                  >
                    <View style={styles.postTopRow}>
                      <Text
                        style={[
                          styles.postAuthor,
                          { color: isDark ? '#ffffff' : Colors.ink },
                        ]}
                      >
                        {post.authorDisplay}
                      </Text>
                      <Badge
                        label={post.topic.replace('_', ' ')}
                        type="accent"
                      />
                    </View>

                    <Text style={styles.postMeta}>
                      {post.coarseArea} · {new Date(post.createdAt).toLocaleDateString()}
                    </Text>

                    <Text
                      style={[
                        styles.postContent,
                        { color: isDark ? Colors.bodyMuted : Colors.inkMuted80 },
                      ]}
                    >
                      {post.body}
                    </Text>

                    <View style={styles.postActionRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => markPostHelpful(post.id)}
                        style={({ pressed }) => [
                          styles.postMiniBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="heart" size={13} color={Colors.primary} />
                        <Text style={styles.postMiniBtnText}>
                          Helpful ({post.helpfulCount})
                        </Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => flagOrBlockCommunityPost(post.id, post.authorUid, false)}
                        style={({ pressed }) => [
                          styles.postMiniBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <AppIcon name="flag" size={13} color={Colors.yellow} />
                        <Text style={styles.postMiniBtnText}>Report</Text>
                      </Pressable>

                      <Pressable
                        accessibilityRole="button"
                        onPress={() => flagOrBlockCommunityPost(post.id, post.authorUid, true)}
                        style={({ pressed }) => [
                          styles.postMiniBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={[styles.postMiniBtnText, { color: Colors.red }]}>
                          Block Author
                        </Text>
                      </Pressable>
                    </View>

                    {/* Comments */}
                    {post.comments.length > 0 && (
                      <View style={styles.postCommentsSection}>
                        {post.comments.map((c) => (
                          <View key={c.id} style={styles.postCommentItem}>
                            <Text style={styles.postCommentAuthor}>{c.authorDisplay}</Text>
                            <Text style={styles.postCommentText}>{c.body}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Inline Comment Input */}
                    <View style={styles.postCommentInputRow}>
                      <TextInput
                        placeholder="Reply with a verified fact..."
                        placeholderTextColor={Colors.inkMuted48}
                        value={commentTextByPost[post.id] || ''}
                        onChangeText={(txt) =>
                          setCommentTextByPost((prev) => ({ ...prev, [post.id]: txt }))
                        }
                        style={[
                          styles.commentTextInput,
                          {
                            backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                            color: isDark ? '#ffffff' : Colors.ink,
                          },
                        ]}
                      />
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => {
                          const val = commentTextByPost[post.id];
                          if (val?.trim()) {
                            addCommunityPostComment(post.id, val.trim());
                            setCommentTextByPost((prev) => ({ ...prev, [post.id]: '' }));
                          }
                        }}
                        style={styles.commentSendBtn}
                      >
                        <Text style={styles.commentSendText}>Reply</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pressed: {
    transform: [{ scale: 0.95 }], // Exact DESIGN.md micro-interaction
  },

  // SECTION 1: Museum Hero Tile ({component.product-tile-light})
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
    marginBottom: 24,
  },
  segmentedFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },

  // SECTION 2: Sub-Tab Content
  mainContentSection: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: '100%',
  },
  mainInner: {
    width: '100%',
    maxWidth: 1200,
  },
  sectionStack: {
    gap: 20,
    width: '100%',
  },

  // Utility Card ({component.store-utility-card} 18px radius)
  utilityCard: {
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 24, // 24px
    gap: 16,
  },
  circleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeadline: {
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.231,
  },
  cardMeta: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  switchCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Members List
  membersList: {
    gap: 10,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: BorderRadius.md, // 11px
    borderWidth: 1,
  },
  memberName: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  memberMeta: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
  },
  journeyBadge: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  consentPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
  },
  consentPillActive: {
    backgroundColor: Colors.greenLight,
    borderColor: Colors.greenBorder,
  },
  consentPillInactive: {
    backgroundColor: 'transparent',
    borderColor: Colors.hairline,
  },
  consentPillText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Invite Section
  inviteContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    paddingTop: 16,
    gap: 10,
  },
  inviteTitle: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  inputsRow: {
    gap: 10,
  },
  inputsRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillInput: {
    height: 44,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  textAreaInput: {
    borderRadius: BorderRadius.md,
    padding: 14,
    fontSize: 14,
    minHeight: 76,
    textAlignVertical: 'top',
  },
  inviteBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtnText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Sanctuary Havens
  havenFilterScroll: {
    gap: 8,
    paddingVertical: 2,
    marginBottom: 16,
  },
  havensGrid: {
    gap: 16,
  },
  havensGridWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  havenCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  havenTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  havenName: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 16,
    fontWeight: '600',
  },
  havenMeta: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
  },
  havenAddress: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
  },
  havenActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  havenActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  havenActionText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Forum Section
  topicChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: Colors.red,
    marginBottom: 8,
  },
  publishBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnText: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  postsList: {
    gap: 16,
  },
  postCard: {
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  postTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  postAuthor: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 15,
    fontWeight: '600',
  },
  postMeta: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
  },
  postContent: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    marginVertical: 4,
  },
  postActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  postMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  postMiniBtnText: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.ink,
  },
  postCommentsSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
    gap: 6,
  },
  postCommentItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    padding: 8,
    borderRadius: BorderRadius.sm,
  },
  postCommentAuthor: {
    fontSize: 11,
    fontWeight: '600',
  },
  postCommentText: {
    fontSize: 13,
    color: Colors.inkMuted80,
  },
  postCommentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  commentTextInput: {
    flex: 1,
    height: 36,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  commentSendBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.pill,
    justifyContent: 'center',
  },
  commentSendText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
});
