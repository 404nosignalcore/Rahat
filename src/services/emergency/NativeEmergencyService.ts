import * as SMS from 'expo-sms';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { IEmergencyService } from '../interfaces/IEmergencyService';
import { EmergencyContact, LatLng, SOSAlert } from '../../types';
import { generateMapsLink } from '../../utils/geo';

export class NativeEmergencyService implements IEmergencyService {
  async triggerSOS(
    user: { uid: string; name: string },
    location: LatLng,
    contacts: EmergencyContact[],
    emergencyNumber: string = '112'
  ): Promise<SOSAlert> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Haptics unavailable on simulator/web
    }

    const mapUrl = generateMapsLink(location);
    const alertId = 'alert_' + Date.now();

    // 1. Try SMS dispatch first as offline guarantee
    const activeContacts = contacts.filter((c) => c.notifyOnSOS);
    const phoneNumbers = activeContacts.map((c) => c.phone);

    let sentViaSMS = false;
    if (phoneNumbers.length > 0) {
      try {
        const isSmsAvailable = await SMS.isAvailableAsync();
        if (isSmsAvailable) {
          const message = `EMERGENCY ALERT from ${user.name} via SafeWalk!\nI need immediate assistance. My current GPS location:\n${mapUrl}\nTime: ${new Date().toLocaleTimeString()}`;
          await SMS.sendSMSAsync(phoneNumbers, message);
          sentViaSMS = true;
        }
      } catch (smsError) {
        console.warn('[SOS] Native SMS trigger failed:', smsError);
      }
    }

    const contactStatuses = activeContacts.map((c) => ({
      contactId: c.id,
      contactName: c.name,
      phone: c.phone,
      status: (sentViaSMS ? 'sent_sms' : 'pending') as any,
      timestamp: Date.now(),
      method: (sentViaSMS ? 'sms' : 'cloud') as any,
    }));

    return {
      id: alertId,
      userId: user.uid,
      userName: user.name,
      location,
      timestamp: Date.now(),
      status: 'active',
      contacts: contactStatuses,
      emergencyNumberDialed: emergencyNumber,
      isOfflineFallback: sentViaSMS,
      googleMapsUrl: mapUrl,
    };
  }

  async sendEmergencySMS(
    contacts: EmergencyContact[],
    location: LatLng,
    userName: string
  ): Promise<boolean> {
    try {
      const activeContacts = contacts.filter((c) => c.notifyOnSOS);
      const phoneNumbers = activeContacts.map((c) => c.phone);
      if (phoneNumbers.length === 0) return false;

      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) return false;

      const mapUrl = generateMapsLink(location);
      const message = `[SafeWalk SOS] ${userName} has activated an emergency alert!\nLocation: ${mapUrl}\nSent at: ${new Date().toLocaleTimeString()}`;

      const res = await SMS.sendSMSAsync(phoneNumbers, message);
      return res.result === 'sent';
    } catch (err) {
      console.warn('[SOS] sendEmergencySMS error:', err);
      return false;
    }
  }

  async dialEmergencyServices(emergencyNumber: string = '112'): Promise<boolean> {
    try {
      const url = `tel:${emergencyNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[SOS] dialEmergencyServices failed:', err);
      return false;
    }
  }

  async resolveSOS(_alertId: string): Promise<void> {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Ignore haptic failure
    }
  }
}

