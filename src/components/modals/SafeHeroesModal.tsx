import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeWalk } from '../../context/SafeWalkContext';
import { AppIcon } from '../ui/AppIcon';
import { Colors, BorderRadius, TypographyStyles } from '../../theme';
import { Badge } from '../common/Badge';

export const SafeHeroesModal: React.FC = () => {
  const { isSafeHeroesOpen, setIsSafeHeroesOpen, safeHeroes, themeMode } = useSafeWalk();
  const isDark = themeMode === 'dark';

  return (
    <Modal
      visible={isSafeHeroesOpen}
      transparent
      animationType="fade"
      onRequestClose={() => setIsSafeHeroesOpen(false)}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
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
              <AppIcon name="heroes" size={20} color={Colors.primary} />
              <View>
                <Text
                  style={[
                    styles.title,
                    { color: isDark ? '#ffffff' : Colors.ink },
                  ]}
                >
                  SafeHeroes Verified Directory
                </Text>
                <Text style={styles.subtitle}>
                  Verified public helplines & statutory support organizations
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close SafeHeroes directory"
              onPress={() => setIsSafeHeroesOpen(false)}
              style={({ pressed }) => [
                styles.closeBtn,
                { backgroundColor: isDark ? '#272729' : Colors.canvasParchment },
                pressed && styles.pressed,
              ]}
            >
              <AppIcon
                name="close"
                size={16}
                color={isDark ? '#ffffff' : Colors.ink}
              />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View
              style={[
                styles.disclosureBox,
                {
                  backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                  borderColor: isDark ? '#38383a' : Colors.hairline,
                },
              ]}
            >
              <Text style={styles.disclosureText}>
                Rahat complements official emergency services and never replaces police or
                emergency responders. Only verified statutory & public helplines are shown below.
              </Text>
            </View>

            {safeHeroes.map((org) => (
              <View
                key={org.id}
                style={[
                  styles.orgCard,
                  {
                    backgroundColor: isDark ? '#272729' : Colors.canvasParchment,
                    borderColor: isDark ? '#38383a' : Colors.hairline,
                  },
                ]}
              >
                <View style={styles.orgHeader}>
                  <Text
                    style={[
                      styles.orgName,
                      { color: isDark ? '#ffffff' : Colors.ink },
                    ]}
                  >
                    {org.name}
                  </Text>
                  <Badge
                    label={
                      org.verificationStatus === 'verified_public_helpline'
                        ? 'Verified Helpline'
                        : 'Directory Listing'
                    }
                    type="safe"
                  />
                </View>

                <Text style={styles.orgDetail}>
                  {org.assistanceType} · {org.serviceLocation}
                </Text>
                <Text style={styles.orgNotes}>{org.notes}</Text>

                <View style={styles.actionRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${org.name} at ${org.contactPhone}`}
                    onPress={() => Linking.openURL(`tel:${org.contactPhone}`)}
                    style={({ pressed }) => [
                      styles.callBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppIcon name="phone" size={14} color="#ffffff" />
                    <Text style={styles.callBtnText}>Call {org.contactPhone}</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Visit official website for ${org.name}`}
                    onPress={() => Linking.openURL(org.officialWebsite)}
                    style={({ pressed }) => [
                      styles.webBtn,
                      {
                        backgroundColor: isDark ? '#1c1c1e' : Colors.canvas,
                        borderColor: isDark ? '#38383a' : Colors.hairline,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <AppIcon
                      name="external"
                      size={14}
                      color={isDark ? '#ffffff' : Colors.ink}
                    />
                    <Text
                      style={[
                        styles.webBtnText,
                        { color: isDark ? '#ffffff' : Colors.ink },
                      ]}
                    >
                      Official Site
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
    backgroundColor: 'rgba(0, 0, 0, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  sheet: {
    width: '100%',
    maxWidth: 640,
    height: '84%',
    maxHeight: 740,
    borderRadius: BorderRadius.xl, // 24px (Apple Sheet)
    borderWidth: 1,
    overflow: 'hidden',
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  header: {
    padding: 20,
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
    fontFamily: TypographyStyles.tagline.fontFamily,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.231,
  },
  subtitle: {
    fontFamily: TypographyStyles.finePrint.fontFamily,
    fontSize: 12,
    color: Colors.inkMuted48,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 14,
  },
  disclosureBox: {
    padding: 14,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  disclosureText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.inkMuted80,
  },
  orgCard: {
    padding: 18,
    borderRadius: BorderRadius.lg, // 18px
    borderWidth: 1,
    gap: 8,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  orgName: {
    fontFamily: TypographyStyles.bodyStrong.fontFamily,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  orgDetail: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    color: Colors.inkMuted48,
  },
  orgNotes: {
    fontFamily: TypographyStyles.body.fontFamily,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.inkMuted80,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  callBtn: {
    backgroundColor: Colors.primary, // Action Blue #0066cc
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  callBtnText: {
    fontFamily: TypographyStyles.captionStrong.fontFamily,
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  webBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  webBtnText: {
    fontFamily: TypographyStyles.caption.fontFamily,
    fontSize: 13,
    fontWeight: '500',
  },
});
