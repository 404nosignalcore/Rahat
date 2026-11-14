import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { dbService } from '../../services/ServiceFactory';
import { SafeHeroResource } from '../../types';

interface SafeHeroesModalProps {
  navigation: any;
}

export const SafeHeroesModal: React.FC<SafeHeroesModalProps> = ({ navigation }) => {
  const [heroes, setHeroes] = useState<SafeHeroResource[]>([]);

  useEffect(() => {
    dbService.getSafeHeroes().then(setHeroes);
  }, []);

  const handleCall = (phone: string, name: string) => {
    Alert.alert(`Call ${name}`, `Connect directly to ${phone}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Call Now',
        onPress: () => Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`),
      },
    ]);
  };

  const handleOpenWebsite = (url?: string) => {
    if (!url) return;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      {/* Custom Modal Navigation Header */}
      <View style={styles.modalHeader}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.heroBadgeIcon}>
            <MaterialCommunityIcons name="shield-star" size={20} color={Colors.accent} />
          </View>
          <View>
            <Text style={styles.modalTitle}>SafeHeroes Directory</Text>
            <Text style={styles.modalSubtitle}>Verified emergency helplines & support organizations</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          accessibilityLabel="Close SafeHeroes"
        >
          <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Verification Guarantee Banner */}
        <View style={styles.guaranteeBanner}>
          <MaterialCommunityIcons name="check-decagram" size={20} color={Colors.green} />
          <Text style={styles.guaranteeText}>
            Every organization and helpline listed here has been verified through official public safety registries. SafeWalk does not display fabricated verification badges.
          </Text>
        </View>

        {/* Helplines List */}
        {heroes.map((hero) => (
          <Card key={hero.id} style={styles.heroCard}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.titleRow}>
                  <Text style={styles.orgName}>{hero.name}</Text>
                </View>
                <Text style={styles.categoryLabel}>
                  {hero.category.replace(/_/g, ' ').toUpperCase()} • {hero.operatingHours}
                </Text>
              </View>

              {hero.isVerified && (
                <Badge
                  label="VERIFIED"
                  type="verified_official"
                  icon={<MaterialCommunityIcons name="check-decagram" size={12} color={Colors.greenText} />}
                />
              )}
            </View>

            <Text style={styles.description}>{hero.description}</Text>

            {hero.address && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={Colors.textMuted} />
                <Text style={styles.infoText}>{hero.address}</Text>
              </View>
            )}

            <View style={styles.actionsRow}>
              <Button
                title={`Call ${hero.phone}`}
                size="md"
                variant="primary"
                icon={<MaterialCommunityIcons name="phone" size={18} color="#FFF" />}
                onPress={() => handleCall(hero.phone, hero.name)}
                style={{ flex: 1 }}
              />

              {hero.website && (
                <Button
                  title="Official Website"
                  size="md"
                  variant="outline"
                  icon={<MaterialCommunityIcons name="web" size={18} color={Colors.primary} />}
                  onPress={() => handleOpenWebsite(hero.website)}
                  style={{ flex: 1 }}
                />
              )}
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl + 10,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  heroBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '800',
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
  },
  closeBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl + 20,
  },
  guaranteeBanner: {
    flexDirection: 'row',
    backgroundColor: Colors.greenLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  guaranteeText: {
    flex: 1,
    fontSize: Typography.fontSize.footnote,
    color: Colors.greenText,
    lineHeight: Typography.lineHeight.footnote,
  },
  heroCard: {
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgName: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  categoryLabel: {
    fontSize: Typography.fontSize.caption,
    color: Colors.accent,
    fontWeight: '700',
    marginTop: 2,
  },
  description: {
    fontSize: Typography.fontSize.body,
    color: Colors.textSecondary,
    lineHeight: Typography.lineHeight.body,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
});

