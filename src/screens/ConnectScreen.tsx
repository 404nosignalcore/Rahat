import React, { useMemo, useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeWalk } from '../context/SafeWalkContext';
import { getTranslation } from '../i18n/translations';
import { CommunityPost, ConnectSubTab, SafeHavenType } from '../types/safety';
import { formatDistance, getDistanceMeters } from '../utils/safetyRiskEngine';
import { AppIcon } from '../components/ui/AppIcon';

export const ConnectScreen: React.FC = () => {
  const {
    theme,
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
    { id: 'safecircle', label: 'SafeCircle' },
    { id: 'nearby_help', label: 'Nearby Help' },
    { id: 'community', label: 'Safety Community' },
  ];

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: theme.colors.bg }]}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Segmented Sub-Tab Switcher */}
      <View
        style={[
          styles.segmentedBar,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        {subTabs.map((st) => {
          const active = connectSubTab === st.id;
          return (
            <Pressable
              key={st.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${st.label} section`}
              onPress={() => setConnectSubTab(st.id)}
              style={[
                styles.segmentBtn,
                {
                  backgroundColor: active ? theme.colors.accentViolet : 'transparent',
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.segmentText,
                  { color: active ? '#FFFFFF' : theme.colors.textSecondary },
                ]}
              >
                {st.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* SECTION A: SAFECIRCLE */}
      {connectSubTab === 'safecircle' && (
        <View style={styles.sectionStack}>
          {safeCircles.map((circle) => (
            <View
              key={circle.id}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                    {circle.name}
                  </Text>
                  <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                    Consent-gated location sharing · {circle.members.length} members
                  </Text>
                </View>
                <View style={styles.switchWrap}>
                  <Text style={[styles.switchLabel, { color: theme.colors.textSecondary }]}>
                    {circle.sharingEnabled ? 'Sharing On' : 'Paused'}
                  </Text>
                  <Switch
                    accessibilityLabel={`Toggle live sharing for ${circle.name}`}
                    value={circle.sharingEnabled}
                    onValueChange={() => toggleCircleSharing(circle.id)}
                  />
                </View>
              </View>

              {circle.members.map((member) => (
                <View
                  key={member.id}
                  style={[
                    styles.memberCard,
                    { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
                  ]}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.memberName, { color: theme.colors.textPrimary }]}>
                      {member.displayName}
                    </Text>
                    <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                      {member.inviteStatus === 'accepted' ? 'Active Member' : 'Pending Invite'} ·{' '}
                      {member.lastSharedArea || 'No location shared'}
                    </Text>
                    {member.activeJourneySummary && (
                      <Text style={[styles.journeyHint, { color: theme.colors.accentViolet }]}>
                        {member.activeJourneySummary}
                      </Text>
                    )}
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle location consent for ${member.displayName}`}
                    onPress={() => toggleMemberConsent(circle.id, member.id)}
                    style={[
                      styles.consentBtn,
                      {
                        backgroundColor: member.consentToShareLocation
                          ? theme.colors.safeBg
                          : theme.colors.surfaceAlt,
                        borderColor: member.consentToShareLocation
                          ? theme.colors.safeBorder
                          : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: member.consentToShareLocation
                          ? theme.colors.safeGreen
                          : theme.colors.textMuted,
                      }}
                    >
                      {member.consentToShareLocation ? 'Consent On' : 'Consent Off'}
                    </Text>
                  </Pressable>
                </View>
              ))}

              {/* Invite New Circle Member */}
              <View style={[styles.inviteBox, { borderTopColor: theme.colors.border }]}>
                <Text style={[styles.subTitle, { color: theme.colors.textPrimary }]}>
                  Invite Trusted Friend or Family Member
                </Text>
                <View style={styles.inviteInputs}>
                  <TextInput
                    accessibilityLabel="Invite member name"
                    placeholder="Member name"
                    placeholderTextColor={theme.colors.textMuted}
                    value={inviteName}
                    onChangeText={setInviteName}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.bg,
                        borderColor: theme.colors.border,
                        color: theme.colors.textPrimary,
                      },
                    ]}
                  />
                  <TextInput
                    accessibilityLabel="Invite member phone"
                    placeholder="Phone (+91 ...)"
                    placeholderTextColor={theme.colors.textMuted}
                    value={invitePhone}
                    onChangeText={setInvitePhone}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.colors.bg,
                        borderColor: theme.colors.border,
                        color: theme.colors.textPrimary,
                      },
                    ]}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send SafeCircle Invite"
                  onPress={() => handleInvite(circle.id)}
                  style={[styles.primaryBtn, { backgroundColor: theme.colors.navyPrimary }]}
                >
                  <Text style={[styles.primaryBtnText, { color: theme.colors.navyText }]}>
                    Send Circle Invite
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* SECTION B: NEARBY HELP */}
      {connectSubTab === 'nearby_help' && (
        <View style={styles.sectionStack}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <AppIcon name="search" size={16} color={theme.colors.textMuted} />
            <TextInput
              accessibilityLabel="Search nearby police, hospitals, pharmacies"
              placeholder="Search police stations, hospitals, pharmacies..."
              placeholderTextColor={theme.colors.textMuted}
              value={helpQuery}
              onChangeText={setHelpQuery}
              style={[styles.searchInput, { color: theme.colors.textPrimary }]}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {(
              [
                { id: 'all', label: 'All Help' },
                { id: 'police', label: 'Police' },
                { id: 'hospital', label: 'Hospital' },
                { id: 'pharmacy', label: 'Pharmacy' },
                { id: 'campus_security', label: 'Security' },
                { id: 'metro_booth', label: 'Metro Booth' },
              ] as { id: SafeHavenType | 'all'; label: string }[]
            ).map((opt) => {
              const active = helpTypeFilter === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter nearby help ${opt.label}`}
                  onPress={() => setHelpTypeFilter(opt.id)}
                  style={[
                    styles.filterTab,
                    {
                      backgroundColor: active ? theme.colors.accentViolet : theme.colors.surface,
                      borderColor: active ? theme.colors.accentViolet : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '600',
                      color: active ? '#FFFFFF' : theme.colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {enrichedHavens.map((haven) => (
            <View
              key={haven.id}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <View style={styles.rowBetween}>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                    {language === 'hi' ? haven.nameHi : haven.name}
                  </Text>
                  <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                    {t.safeHavenTypes[haven.type]} · {formatDistance(haven.distanceMeters || 0)} ·{' '}
                    <Text
                      style={{
                        color:
                          haven.sourceTier === 'verified'
                            ? theme.colors.safeGreen
                            : theme.colors.cautionAmber,
                        fontWeight: '700',
                      }}
                    >
                      {haven.sourceTier === 'verified' ? 'Verified Source' : 'Community Listed'}
                    </Text>
                    {haven.open24Hours ? ' · Open 24/7' : ''}
                  </Text>
                </View>
              </View>

              <Text style={[styles.bodyText, { color: theme.colors.textSecondary }]}>
                {haven.address}
                {haven.notes ? ` — ${haven.notes}` : ''}
              </Text>

              <View style={styles.actionsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Directions to ${haven.name}`}
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/dir/?api=1&destination=${haven.latitude},${haven.longitude}`
                    )
                  }
                  style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
                >
                  <AppIcon name="route" size={14} color={theme.colors.accentViolet} />
                  <Text style={[styles.outlineBtnText, { color: theme.colors.textPrimary }]}>
                    Directions
                  </Text>
                </Pressable>

                {haven.phone && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${haven.name}`}
                    onPress={() => Linking.openURL(`tel:${haven.phone}`)}
                    style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
                  >
                    <AppIcon name="phone" size={14} color={theme.colors.safeGreen} />
                    <Text style={[styles.outlineBtnText, { color: theme.colors.textPrimary }]}>
                      Call {haven.phone}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* SECTION C: SAFETY COMMUNITY */}
      {connectSubTab === 'community' && (
        <View style={styles.sectionStack}>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Share Area Safety Experience
            </Text>
            <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
              Privacy protection: Only coarse neighborhood names are displayed—never your exact GPS
              coordinates.
            </Text>

            <View style={styles.filterRow}>
              {(
                [
                  { id: 'area_update', label: 'Area Update' },
                  { id: 'safe_tip', label: 'Safe Tip' },
                  { id: 'lighting_alert', label: 'Lighting Alert' },
                  { id: 'suspicious_activity', label: 'Caution' },
                ] as { id: CommunityPost['topic']; label: string }[]
              ).map((topic) => {
                const active = postTopic === topic.id;
                return (
                  <Pressable
                    key={topic.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Topic ${topic.label}`}
                    onPress={() => setPostTopic(topic.id)}
                    style={[
                      styles.filterTab,
                      {
                        backgroundColor: active ? theme.colors.accentViolet : theme.colors.surfaceAlt,
                        borderColor: active ? theme.colors.accentViolet : theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: active ? '#FFFFFF' : theme.colors.textPrimary,
                      }}
                    >
                      {topic.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              accessibilityLabel="Coarse neighborhood name"
              placeholder="Neighborhood / Corridor (coarse area only)"
              placeholderTextColor={theme.colors.textMuted}
              value={postArea}
              onChangeText={setPostArea}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.bg,
                  borderColor: theme.colors.border,
                  color: theme.colors.textPrimary,
                },
              ]}
            />

            <TextInput
              accessibilityLabel="Community safety post body"
              placeholder="Share a factual observation or tip to help others..."
              placeholderTextColor={theme.colors.textMuted}
              value={postBody}
              onChangeText={setPostBody}
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

            {postError && (
              <Text style={[styles.errorText, { color: theme.colors.dangerRed }]}>{postError}</Text>
            )}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Publish Community Post"
              onPress={handleCreatePost}
              style={[styles.primaryBtn, { backgroundColor: theme.colors.navyPrimary }]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.colors.navyText }]}>
                Publish Post
              </Text>
            </Pressable>
          </View>

          {visiblePosts.map((post) => (
            <View
              key={post.id}
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.metaLine, { color: theme.colors.textMuted }]}>
                <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>
                  {post.authorDisplay}
                </Text>{' '}
                · {post.coarseArea} · {post.topic.replace('_', ' ')}
              </Text>

              <Text style={[styles.bodyText, { color: theme.colors.textPrimary }]}>
                {post.body}
              </Text>

              <View style={styles.actionsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mark helpful post by ${post.authorDisplay}`}
                  onPress={() => markPostHelpful(post.id)}
                  style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
                >
                  <AppIcon name="heart" size={14} color={theme.colors.accentViolet} />
                  <Text style={[styles.outlineBtnText, { color: theme.colors.textPrimary }]}>
                    Helpful ({post.helpfulCount})
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Report post by ${post.authorDisplay}`}
                  onPress={() => flagOrBlockCommunityPost(post.id, post.authorUid, false)}
                  style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
                >
                  <AppIcon name="flag" size={14} color={theme.colors.cautionAmber} />
                  <Text style={[styles.outlineBtnText, { color: theme.colors.textSecondary }]}>
                    Report
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Block author ${post.authorDisplay}`}
                  onPress={() => flagOrBlockCommunityPost(post.id, post.authorUid, true)}
                  style={[styles.outlineBtn, { borderColor: theme.colors.border }]}
                >
                  <Text style={[styles.outlineBtnText, { color: theme.colors.dangerRed }]}>
                    Block User
                  </Text>
                </Pressable>
              </View>

              {post.comments.length > 0 && (
                <View style={[styles.commentsBox, { borderTopColor: theme.colors.border }]}>
                  {post.comments.map((c) => (
                    <Text key={c.id} style={[styles.commentLine, { color: theme.colors.textSecondary }]}>
                      <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>
                        {c.authorDisplay}:{' '}
                      </Text>
                      {c.body}
                    </Text>
                  ))}
                </View>
              )}

              <View style={styles.commentInputRow}>
                <TextInput
                  accessibilityLabel={`Reply to ${post.authorDisplay}`}
                  placeholder="Write a supportive reply..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={commentTextByPost[post.id] || ''}
                  onChangeText={(txt) =>
                    setCommentTextByPost((prev) => ({ ...prev, [post.id]: txt }))
                  }
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
                  accessibilityLabel="Send reply"
                  onPress={() => {
                    addCommunityPostComment(post.id, commentTextByPost[post.id] || '');
                    setCommentTextByPost((prev) => ({ ...prev, [post.id]: '' }));
                  }}
                  style={[styles.replyBtn, { backgroundColor: theme.colors.accentViolet }]}
                >
                  <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>Reply</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 36, maxWidth: 960, width: '100%', alignSelf: 'center' },
  segmentedBar: { flexDirection: 'row', padding: 4, borderRadius: 12, borderWidth: 1, gap: 4 },
  segmentBtn: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  segmentText: { fontSize: 13, fontWeight: '700' },
  sectionStack: { gap: 12 },
  card: { padding: 15, borderRadius: 14, borderWidth: 1, gap: 10 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  metaLine: { fontSize: 12, lineHeight: 18 },
  switchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchLabel: { fontSize: 12, fontWeight: '600' },
  memberCard: { padding: 12, borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  memberName: { fontSize: 14, fontWeight: '700' },
  journeyHint: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  consentBtn: { minHeight: 36, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, justifyContent: 'center' },
  inviteBox: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  subTitle: { fontSize: 13, fontWeight: '700' },
  inviteInputs: { gap: 8 },
  input: { minHeight: 42, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 14 },
  textArea: { minHeight: 74, borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  primaryBtn: { minHeight: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 13, fontWeight: '700' },
  searchBox: { minHeight: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: { flex: 1, fontSize: 14, minHeight: 40 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterTab: { minHeight: 36, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, justifyContent: 'center' },
  bodyText: { fontSize: 13, lineHeight: 19 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  outlineBtn: { minHeight: 38, paddingHorizontal: 12, borderRadius: 9, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  outlineBtnText: { fontSize: 12, fontWeight: '600' },
  errorText: { fontSize: 12, fontWeight: '600' },
  commentsBox: { borderTopWidth: 1, paddingTop: 8, gap: 4 },
  commentLine: { fontSize: 12, lineHeight: 17 },
  commentInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  commentInput: { flex: 1, minHeight: 38, borderRadius: 9, borderWidth: 1, paddingHorizontal: 10, fontSize: 13 },
  replyBtn: { minHeight: 38, paddingHorizontal: 14, borderRadius: 9, justifyContent: 'center' },
});
