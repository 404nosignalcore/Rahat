import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { AppIcon } from '../ui/AppIcon';

export const SafeHeroesModal: React.FC = () => {
  const { isSafeHeroesOpen, setIsSafeHeroesOpen, safeHeroes, theme } = useSafeWalk();

  return (
    <Modal
      visible={isSafeHeroesOpen}
      transparent
      animationType="none"
      onRequestClose={() => setIsSafeHeroesOpen(false)}
    >
      <View style={[styles.backdrop, { backgroundColor: theme.colors.overlayBg }]}>
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
          ]}
        >
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <View style={styles.titleRow}>
              <AppIcon name="heroes" size={22} color={theme.colors.accentViolet} />
              <View>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  SafeHeroes — People Who Protect
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                  Verified public helplines & statutory support resources
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close SafeHeroes directory"
              onPress={() => setIsSafeHeroesOpen(false)}
              style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceAlt }]}
            >
              <AppIcon name="close" size={18} color={theme.colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View
              style={[
                styles.disclosureBox,
                { backgroundColor: theme.colors.surfaceAlt, borderColor: theme.colors.border },
              ]}
            >
              <Text style={[styles.disclosureText, { color: theme.colors.textSecondary }]}>
                Rahat complements official emergency services and never replaces police or
                emergency responders. Only verified statutory & public helplines are shown below.
              </Text>
            </View>

            {safeHeroes.map((org) => (
              <View
                key={org.id}
                style={[
                  styles.orgCard,
                  { backgroundColor: theme.colors.bg, borderColor: theme.colors.border },
                ]}
              >
                <View style={styles.orgHeader}>
                  <Text style={[styles.orgName, { color: theme.colors.textPrimary }]}>
                    {org.name}
                  </Text>
                  <Text style={[styles.verifiedMeta, { color: theme.colors.safeGreen }]}>
                    {org.verificationStatus === 'verified_public_helpline'
                      ? 'Verified Public Helpline'
                      : 'Directory Listing'}
                  </Text>
                </View>

                <Text style={[styles.orgDetail, { color: theme.colors.textSecondary }]}>
                  {org.assistanceType} · {org.serviceLocation}
                </Text>
                <Text style={[styles.orgNotes, { color: theme.colors.textMuted }]}>
                  {org.notes}
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${org.name} at ${org.contactPhone}`}
                    onPress={() => Linking.openURL(`tel:${org.contactPhone}`)}
                    style={[styles.callBtn, { backgroundColor: theme.colors.navyPrimary }]}
                  >
                    <AppIcon name="phone" size={15} color={theme.colors.navyText} />
                    <Text style={[styles.btnText, { color: theme.colors.navyText }]}>
                      Call {org.contactPhone}
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Visit official website for ${org.name}`}
                    onPress={() => Linking.openURL(org.officialWebsite)}
                    style={[
                      styles.webBtn,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <AppIcon name="external" size={15} color={theme.colors.textPrimary} />
                    <Text style={[styles.btnText, { color: theme.colors.textPrimary }]}>
                      Official Website
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    height: '84%',
    maxHeight: 740,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  disclosureBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  disclosureText: {
    fontSize: 12,
    lineHeight: 18,
  },
  orgCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  orgHeader: {
    gap: 3,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '700',
  },
  verifiedMeta: {
    fontSize: 12,
    fontWeight: '600',
  },
  orgDetail: {
    fontSize: 13,
    fontWeight: '500',
  },
  orgNotes: {
    fontSize: 12,
    lineHeight: 17,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  callBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
