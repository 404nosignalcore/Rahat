import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Header } from '../../components/common/Header';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useLocation } from '../../context/LocationContext';
import { dbService } from '../../services/ServiceFactory';
import { EmergencyContact } from '../../types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const { user, securitySettings, updateSecuritySettings, signOut, updateProfile } = useAuth();
  const { hasForegroundPermission, hasBackgroundPermission, requestPermissions } = useLocation();

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [isAddContactModalVisible, setIsAddContactModalVisible] = useState<boolean>(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);

  // Contact Form Fields
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactRelationship, setContactRelationship] = useState<string>('Family');
  const [contactNotifySOS, setContactNotifySOS] = useState<boolean>(true);
  const [contactNotifyDev, setContactNotifyDev] = useState<boolean>(true);

  useEffect(() => {
    if (user) {
      loadContacts();
    }
  }, [user]);

  const loadContacts = async () => {
    if (!user) return;
    const list = await dbService.getEmergencyContacts(user.uid);
    setContacts(list);
  };

  const openAddContactModal = () => {
    setEditingContact(null);
    setContactName('');
    setContactPhone('');
    setContactRelationship('Family');
    setContactNotifySOS(true);
    setContactNotifyDev(true);
    setIsAddContactModalVisible(true);
  };

  const openEditContactModal = (c: EmergencyContact) => {
    setEditingContact(c);
    setContactName(c.name);
    setContactPhone(c.phone);
    setContactRelationship(c.relationship);
    setContactNotifySOS(c.notifyOnSOS);
    setContactNotifyDev(c.notifyOnDeviation);
    setIsAddContactModalVisible(true);
  };

  const handleSaveContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Required Info', 'Please enter a name and phone number.');
      return;
    }
    if (!user) return;

    if (editingContact) {
      await dbService.updateEmergencyContact(user.uid, {
        ...editingContact,
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: contactRelationship,
        notifyOnSOS: contactNotifySOS,
        notifyOnDeviation: contactNotifyDev,
      });
    } else {
      await dbService.addEmergencyContact(user.uid, {
        name: contactName.trim(),
        phone: contactPhone.trim(),
        relationship: contactRelationship,
        isPrimary: contacts.length === 0,
        notifyOnSOS: contactNotifySOS,
        notifyOnDeviation: contactNotifyDev,
      });
    }

    setIsAddContactModalVisible(false);
    await loadContacts();
    Alert.alert('Contact Saved', 'Your emergency contact list has been updated.');
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert('Delete Contact', 'Are you sure you want to remove this emergency contact?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!user) return;
          await dbService.deleteEmergencyContact(user.uid, contactId);
          await loadContacts();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete SafeWalk Account',
      'This will permanently erase your profile, contacts, and journey history in accordance with data privacy regulations. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Permanently Delete',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            Alert.alert('Account Deleted', 'All local and stored data has been removed.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Profile & Settings"
        subtitle="Account, privacy & emergency controls"
        onOpenHeroes={() => navigation.navigate('SafeHeroes')}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Identity Card */}
        <Card style={styles.userCard}>
          <View style={styles.avatarContainer}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{user?.name ? user.name[0] : 'U'}</Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'SafeWalk User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'Guest Session'}</Text>
            <Text style={styles.userPhone}>{user?.phone || '+91 98765 43210'}</Text>
          </View>

          <TouchableOpacity
            style={styles.editProfileBtn}
            onPress={() =>
              Alert.prompt
                ? Alert.prompt('Update Name', 'Enter your display name:', (val) => {
                    if (val) updateProfile({ name: val });
                  })
                : Alert.alert('Edit Profile', 'Profile updates are synchronized with your secure account.')
            }
          >
            <MaterialCommunityIcons name="account-edit-outline" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </Card>

        {/* Emergency Contacts Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={openAddContactModal}>
            <Text style={styles.addContactAction}>+ Add Contact</Text>
          </TouchableOpacity>
        </View>

        {contacts.map((contact) => (
          <Card key={contact.id} style={styles.contactCard}>
            <View style={{ flex: 1 }}>
              <View style={styles.contactNameRow}>
                <Text style={styles.contactNameText}>{contact.name}</Text>
                {contact.isPrimary && <Badge label="PRIMARY" type="accent" />}
              </View>
              <Text style={styles.contactSubText}>
                {contact.phone} • {contact.relationship}
              </Text>
              <View style={styles.togglesRow}>
                <Text style={styles.toggleNote}>
                  SOS: {contact.notifyOnSOS ? 'Yes' : 'No'} | Deviation: {contact.notifyOnDeviation ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>

            <View style={styles.contactButtonsRow}>
              <TouchableOpacity onPress={() => openEditContactModal(contact)} style={styles.iconActionBtn}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteContact(contact.id)} style={styles.iconActionBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.red} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Location & Tracking Permissions */}
        <Text style={styles.sectionTitle}>Location & Privacy Permissions</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Background Location Monitoring</Text>
              <Text style={styles.settingDesc}>
                Allows SafeWalk to detect route deviations while your phone screen is locked.
              </Text>
            </View>
            <Switch
              value={securitySettings.backgroundTrackingConsent}
              onValueChange={(val) => updateSecuritySettings({ backgroundTrackingConsent: val })}
              trackColor={{ false: Colors.border, true: Colors.accent }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Route Deviation Corridor</Text>
              <Text style={styles.settingDesc}>
                Current threshold: {securitySettings.routeDeviationCorridorMeters}m (Buffers GPS jitter)
              </Text>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  updateSecuritySettings({
                    routeDeviationCorridorMeters: Math.max(50, securitySettings.routeDeviationCorridorMeters - 10),
                  })
                }
              >
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{securitySettings.routeDeviationCorridorMeters}m</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  updateSecuritySettings({
                    routeDeviationCorridorMeters: Math.min(150, securitySettings.routeDeviationCorridorMeters + 10),
                  })
                }
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>System Permissions Status</Text>
              <Text style={styles.settingDesc}>
                Foreground: {hasForegroundPermission ? 'Granted' : 'Missing'} | Background:{' '}
                {hasBackgroundPermission ? 'Granted' : 'Missing'}
              </Text>
            </View>
            <TouchableOpacity onPress={requestPermissions} style={styles.checkPermBtn}>
              <Text style={styles.checkPermText}>Check</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Emergency Preferences */}
        <Text style={styles.sectionTitle}>Emergency SOS Preferences</Text>
        <Card style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Auto-Dial Emergency Services</Text>
              <Text style={styles.settingDesc}>
                Automatically opens the phone dialer with {securitySettings.preferredEmergencyNumber} upon SOS activation.
              </Text>
            </View>
            <Switch
              value={securitySettings.autoCallEmergencyOnSOS}
              onValueChange={(val) => updateSecuritySettings({ autoCallEmergencyOnSOS: val })}
              trackColor={{ false: Colors.border, true: Colors.accent }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Cancellation Countdown</Text>
              <Text style={styles.settingDesc}>Seconds before emergency alert dispatches</Text>
            </View>
            <View style={styles.stepperRow}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  updateSecuritySettings({
                    sosCountdownSeconds: Math.max(3, securitySettings.sosCountdownSeconds - 1),
                  })
                }
              >
                <Text style={styles.stepperText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.stepperValue}>{securitySettings.sosCountdownSeconds}s</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() =>
                  updateSecuritySettings({
                    sosCountdownSeconds: Math.min(15, securitySettings.sosCountdownSeconds + 1),
                  })
                }
              >
                <Text style={styles.stepperText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Offline SMS Fallback</Text>
              <Text style={styles.settingDesc}>
                Guarantees SMS dispatch if mobile data or cloud connection is lost.
              </Text>
            </View>
            <Switch
              value={securitySettings.offlineSMSFallback}
              onValueChange={(val) => updateSecuritySettings({ offlineSMSFallback: val })}
              trackColor={{ false: Colors.border, true: Colors.accent }}
            />
          </View>
        </Card>

        {/* Legal & Account Management */}
        <Text style={styles.sectionTitle}>App & Legal</Text>
        <Card style={styles.settingsCard}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'About SafeWalk',
                'SafeWalk v1.0.0\nYour personal safety companion before, during, and after every journey.\n\nSafeWalk complements official emergency services and does not replace the police or 112 responders.'
              )
            }
          >
            <Text style={styles.menuItemText}>About SafeWalk</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              Alert.alert(
                'Privacy Policy & Terms',
                'SafeWalk strictly adheres to privacy-by-design principles:\n- Precise locations are never published publicly.\n- Location histories are purged upon journey completion.\n- Emergency data is shared strictly with your designated circle.'
              )
            }
          >
            <Text style={styles.menuItemText}>Terms & Privacy Policy</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textMuted} />
          </TouchableOpacity>
        </Card>

        {/* Action Buttons: Sign Out and Delete Account */}
        <View style={styles.accountActionButtons}>
          <Button
            title="Sign Out"
            variant="outline"
            size="md"
            onPress={signOut}
            icon={<MaterialCommunityIcons name="logout" size={18} color={Colors.text} />}
          />

          <Button
            title="Delete Account & Clear Data"
            variant="ghost"
            size="md"
            onPress={handleDeleteAccount}
            textStyle={{ color: Colors.red }}
            icon={<MaterialCommunityIcons name="delete-forever" size={18} color={Colors.red} />}
          />
        </View>
      </ScrollView>

      {/* Add / Edit Contact Modal */}
      <Modal visible={isAddContactModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingContact ? 'Edit Emergency Contact' : 'Add Emergency Contact'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddContactModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Full Name</Text>
            <TextInput
              placeholder="e.g., Pooja Sharma (Sister)"
              placeholderTextColor={Colors.textMuted}
              value={contactName}
              onChangeText={setContactName}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              placeholder="e.g., +91 98111 22334"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={contactPhone}
              onChangeText={setContactPhone}
              style={styles.textInput}
            />

            <Text style={styles.fieldLabel}>Relationship</Text>
            <TextInput
              placeholder="e.g., Sister, Mother, Friend, Spouse"
              placeholderTextColor={Colors.textMuted}
              value={contactRelationship}
              onChangeText={setContactRelationship}
              style={styles.textInput}
            />

            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalSwitchLabel}>Notify during SOS Emergency</Text>
              <Switch
                value={contactNotifySOS}
                onValueChange={setContactNotifySOS}
                trackColor={{ false: Colors.border, true: Colors.red }}
              />
            </View>

            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalSwitchLabel}>Notify upon Unresolved Deviation</Text>
              <Switch
                value={contactNotifyDev}
                onValueChange={setContactNotifyDev}
                trackColor={{ false: Colors.border, true: Colors.accent }}
              />
            </View>

            <Button
              title="Save Contact"
              variant="primary"
              size="lg"
              onPress={handleSaveContact}
              style={{ marginTop: Spacing.md }}
            />
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
    gap: Spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: Typography.fontSize.title2,
    fontWeight: '700',
    color: Colors.accent,
  },
  userName: {
    fontSize: Typography.fontSize.subtitle,
    fontWeight: '700',
    color: Colors.text,
  },
  userEmail: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
    marginTop: 1,
  },
  editProfileBtn: {
    padding: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.title3,
    fontWeight: '700',
    color: Colors.text,
  },
  addContactAction: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.accent,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactNameText: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  contactSubText: {
    fontSize: Typography.fontSize.footnote,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  togglesRow: {
    marginTop: 4,
  },
  toggleNote: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textMuted,
  },
  contactButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconActionBtn: {
    padding: 6,
  },
  settingsCard: {
    gap: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  settingTitle: {
    fontSize: Typography.fontSize.body,
    fontWeight: '700',
    color: Colors.text,
  },
  settingDesc: {
    fontSize: Typography.fontSize.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.sm,
    padding: 4,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepperText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  stepperValue: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.text,
    minWidth: 32,
    textAlign: 'center',
  },
  checkPermBtn: {
    backgroundColor: Colors.surfaceSubtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkPermText: {
    fontSize: Typography.fontSize.caption,
    fontWeight: '700',
    color: Colors.accent,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  menuItemText: {
    fontSize: Typography.fontSize.body,
    fontWeight: '600',
    color: Colors.text,
  },
  accountActionButtons: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
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
  fieldLabel: {
    fontSize: Typography.fontSize.footnote,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.body,
    color: Colors.text,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalSwitchLabel: {
    fontSize: Typography.fontSize.body,
    color: Colors.text,
    fontWeight: '600',
  },
});

