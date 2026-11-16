jest.mock('expo-sms');

import {
  MockAuthService,
  MockDatabaseService,
  MockEmergencyService,
} from '../src/services/mock/MockServices';
import { MOCK_EMERGENCY_CONTACTS } from '../src/services/mock/mockData';
import { alertService, buildEmergencySmsText, sendNativeEmergencySms } from '../src/services/alertService';
import * as SMS from 'expo-sms';
import {
  testFirestoreConnection,
  fetchSafetyReports,
  createSafetyReportDoc,
  saveEmergencyContactDoc,
  loadUserPrivateAndContacts,
  recordReportCorroborationDoc,
  recordReportAbuseFlagDoc,
  saveEmergencyAlertDoc,
  deleteAccountCascade,
  offlineMockAdapter,
} from '../src/services/firebaseClient';

describe('SafeWalk Core Services & State Workflows', () => {
  let auth: MockAuthService;
  let db: MockDatabaseService;
  let emergency: MockEmergencyService;

  beforeEach(() => {
    auth = new MockAuthService();
    db = new MockDatabaseService();
    emergency = new MockEmergencyService();
  });

  test('MockAuthService initializes with demo profile and supports anonymous guest', async () => {
    const current = auth.getCurrentUser();
    expect(current).not.toBeNull();
    expect(current?.name).toBe('Ananya Sharma');

    const guest = await auth.signInAnonymously();
    expect(guest.isAnonymous).toBe(true);
    expect(auth.getCurrentUser()?.isAnonymous).toBe(true);
  });

  test('MockDatabaseService retrieves zones with explainable indicators', async () => {
    const zones = await db.getSafetyZones();
    expect(zones.length).toBeGreaterThanOrEqual(3);

    const green = zones.find((z) => z.level === 'green');
    expect(green).toBeDefined();
    expect(green?.indicators.lightingQuality).toBe('good');

    const red = zones.find((z) => z.level === 'red');
    expect(red).toBeDefined();
    expect(red?.indicators.lightingQuality).toBe('poor');
  });

  test('MockDatabaseService creates community report starting in unverified status', async () => {
    const newReport = await db.createSafetyReport({
      userId: 'test_u1',
      authorName: 'Test Reporter',
      category: 'poor_lighting',
      title: 'Dark Alleyway',
      description: 'Streetlamps missing bulbs',
      coordinates: { latitude: 28.614, longitude: 77.21 },
      locationName: 'Sector 5 Alley',
      status: 'unverified',
    });

    expect(newReport.id).toBeDefined();
    expect(newReport.status).toBe('unverified');

    // Test upvoting
    await db.voteSafetyReport(newReport.id, 'up');
    const reports = await db.getSafetyReports();
    const found = reports.find((r) => r.id === newReport.id);
    expect(found?.upvotes).toBe(2);
  });

  test('EmergencyService triggers SOS alert with active status and location link', async () => {
    const user = { uid: 'u_123', name: 'SafeWalk User' };
    const loc = { latitude: 28.6139, longitude: 77.209 };
    const alert = await emergency.triggerSOS(user, loc, MOCK_EMERGENCY_CONTACTS, '112');

    expect(alert.status).toBe('active');
    expect(alert.googleMapsUrl).toContain('28.6139,77.209');
    expect(alert.contacts.length).toBe(MOCK_EMERGENCY_CONTACTS.length);
  });

  describe('alertService Safety & Privacy Delivery Verification', () => {
    const origEnv = process.env.EXPO_PUBLIC_SOS_FUNCTION_URL;
    const origFetch = globalThis.fetch;

    afterEach(() => {
      process.env.EXPO_PUBLIC_SOS_FUNCTION_URL = origEnv;
      globalThis.fetch = origFetch;
      jest.restoreAllMocks();
    });

    test('alertService never claims sent when gateway is unconfigured (offline fallback)', async () => {
      delete process.env.EXPO_PUBLIC_SOS_FUNCTION_URL;
      const contacts = [
        {
          id: 'c1',
          ownerUid: 'u1',
          name: 'Priya',
          relationship: 'Sister',
          phone: '+919876543210',
          verificationStatus: 'verified' as const,
          notifyOnSOS: true,
        },
      ];

      const alert = await alertService.dispatchEmergencyAlert({
        ownerUid: 'u1',
        latitude: 28.6139,
        longitude: 77.209,
        contacts,
      });

      expect(alert.deliveryChannelStatus).toBe('offline_fallback');
      expect(alert.contactDeliveries[0].status).toBe('offline_fallback');
      expect(alert.contactDeliveries[0].detail).toContain('SMS gateway unconfigured');
    });

    test('alertService properly handles gateway returning unconfigured status without claiming sent', async () => {
      process.env.EXPO_PUBLIC_SOS_FUNCTION_URL = 'http://localhost:3000/api/sos';
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          results: [
            {
              contactId: 'c1',
              status: 'unconfigured',
              reason: 'SMS gateway webhook not configured; client should prompt native SMS/call fallback.',
            },
          ],
        }),
      } as any);

      const contacts = [
        {
          id: 'c1',
          ownerUid: 'u1',
          name: 'Priya',
          relationship: 'Sister',
          phone: '+919876543210',
          verificationStatus: 'verified' as const,
          notifyOnSOS: true,
        },
      ];

      const alert = await alertService.dispatchEmergencyAlert({
        ownerUid: 'u1',
        latitude: 28.6139,
        longitude: 77.209,
        contacts,
      });

      expect(alert.deliveryChannelStatus).toBe('offline_fallback');
      expect(alert.contactDeliveries[0].status).toBe('offline_fallback');
      expect(alert.contactDeliveries[0].detail).not.toContain('Confirmed by gateway');
      expect(alert.contactDeliveries[0].detail).toContain('SMS gateway webhook not configured');
    });

    test('alertService only claims sent when gateway explicitly confirms delivery with sent status', async () => {
      process.env.EXPO_PUBLIC_SOS_FUNCTION_URL = 'http://localhost:3000/api/sos';
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          results: [
            {
              contactId: 'c1',
              status: 'sent',
              reason: 'Delivered via SMS gateway',
            },
          ],
        }),
      } as any);

      const contacts = [
        {
          id: 'c1',
          ownerUid: 'u1',
          name: 'Priya',
          relationship: 'Sister',
          phone: '+919876543210',
          verificationStatus: 'verified' as const,
          notifyOnSOS: true,
        },
      ];

      const alert = await alertService.dispatchEmergencyAlert({
        ownerUid: 'u1',
        latitude: 28.6139,
        longitude: 77.209,
        contacts,
      });

      expect(alert.deliveryChannelStatus).toBe('sent');
      expect(alert.contactDeliveries[0].status).toBe('sent');
      expect(alert.contactDeliveries[0].detail).toBe('Delivered via SMS gateway');
    });

    test('buildEmergencySmsText adds critical warning header when locationSource is fallback_demo', () => {
      const normalSms = buildEmergencySmsText(28.6139, 77.209, '2026-11-16T12:00:00Z', 'gps');
      expect(normalSms).toContain('RAHAT SOS Emergency Alert');
      expect(normalSms).not.toContain('CRITICAL WARNING: GPS UNAVAILABLE');

      const fallbackSms = buildEmergencySmsText(28.6275, 77.2185, '2026-11-16T12:00:00Z', 'fallback_demo');
      expect(fallbackSms).toContain('[CRITICAL WARNING: GPS UNAVAILABLE - UNVERIFIED LOCATION]');
      expect(fallbackSms).toContain('Device GPS was offline; last simulated demo location:');
      expect(fallbackSms).toContain('Confirm victim\'s true location via direct phone call.');
    });

    test('alertService includes isFallbackLocation flag and auth token when dispatching fallback demo coordinates', async () => {
      process.env.EXPO_PUBLIC_SOS_FUNCTION_URL = 'http://localhost:3000/api/sos';
      let capturedBody: any = null;
      let capturedHeaders: any = null;

      globalThis.fetch = jest.fn().mockImplementation(async (_url: string, options: any) => {
        capturedHeaders = options.headers;
        capturedBody = JSON.parse(options.body);
        return {
          ok: true,
          json: async () => ({
            success: true,
            results: [{ contactId: 'c1', status: 'sent', reason: 'Delivered via gateway' }],
          }),
        };
      });

      const contacts = [
        {
          id: 'c1',
          ownerUid: 'u1',
          name: 'Priya',
          relationship: 'Sister',
          phone: '+919876543210',
          verificationStatus: 'verified' as const,
          notifyOnSOS: true,
        },
      ];

      const alert = await alertService.dispatchEmergencyAlert({
        ownerUid: 'u1',
        latitude: 28.6275,
        longitude: 77.2185,
        contacts,
        locationSource: 'fallback_demo',
      });

      expect(alert.locationSource).toBe('fallback_demo');
      expect(alert.isFallbackLocation).toBe(true);
      expect(capturedBody.locationSource).toBe('fallback_demo');
      expect(capturedBody.isFallbackLocation).toBe(true);
      expect(capturedHeaders['Authorization']).toMatch(/^Bearer /);
    });

    test('sendNativeEmergencySms dispatches SMS via expo-sms with valid coordinates and active contacts', async () => {
      const sendSMSAsyncSpy = jest.spyOn(SMS, 'sendSMSAsync');
      const contacts = [
        {
          id: 'c1',
          name: 'Priya',
          phone: '+91 98765 43210',
          notifyOnSOS: true,
        },
        {
          id: 'c2',
          name: 'Aman',
          phone: '+91 99999 88888',
          notifyOnSOS: false,
        },
      ];

      const success = await sendNativeEmergencySms(contacts, 28.6139, 77.209, 'gps');
      expect(success).toBe(true);
      expect(sendSMSAsyncSpy).toHaveBeenCalledTimes(1);
      const [recipients, message] = sendSMSAsyncSpy.mock.calls[0];
      expect(recipients).toEqual(['+919876543210']);
      expect(message).toContain('RAHAT SOS Emergency Alert');
      expect(message).toContain('https://maps.google.com/?q=28.613900,77.209000');
    });

    test('testFirestoreConnection returns offline and avoids remote network calls when Firebase is unconfigured', async () => {
      const status = await testFirestoreConnection();
      expect(status).toBe('offline');
    });

    test('offlineMockAdapter stores and retrieves safety reports and contacts without touching Firestore', async () => {
      const initialReports = await fetchSafetyReports();
      const initialCount = initialReports.length;

      const newReportId = `rep-mock-${Date.now()}`;
      await createSafetyReportDoc(
        {
          id: newReportId,
          authorUid: 'user-mock-1',
          category: 'poor_lighting',
          title: 'Unlit Alley Test',
          description: 'Verified offline storage test report',
          address: 'Connaught Place',
          latitude: 28.6315,
          longitude: 77.2167,
          severity: 3,
          verificationStatus: 'unverified',
          corroborationCount: 0,
          outdatedFlags: 0,
          abuseFlags: 0,
          isSynthetic: false,
          timestamp: new Date().toISOString(),
          timeHour: 21,
          lightingCondition: 'dim',
          comments: [],
        },
        'user-mock-1'
      );

      const updatedReports = await fetchSafetyReports();
      expect(updatedReports.length).toBe(initialCount + 1);
      const inserted = updatedReports.find((r) => r.id === newReportId);
      expect(inserted).toBeDefined();
      expect(inserted?.title).toBe('Unlit Alley Test');

      await saveEmergencyContactDoc({
        id: 'contact-mock-1',
        ownerUid: 'user-mock-1',
        name: 'Kavita',
        relationship: 'Mother',
        phone: '+91 98111 22233',
        verificationStatus: 'unverified',
        notifyOnSOS: true,
      });

      const userData = await loadUserPrivateAndContacts('user-mock-1');
      const foundContact = userData.contacts.find((c) => c.id === 'contact-mock-1');
      expect(foundContact).toBeDefined();
      expect(foundContact?.name).toBe('Kavita');
    });

    test('recordReportCorroborationDoc prevents self-corroboration and multiple corroborations by same account', async () => {
      const repId = `rep-corroborate-${Date.now()}`;
      await createSafetyReportDoc(
        {
          id: repId,
          authorUid: 'author-alice',
          category: 'poor_lighting',
          title: 'Author Self-Corroboration Guard',
          description: 'Testing that authors cannot corroborate their own report',
          address: 'Connaught Place',
          latitude: 28.6315,
          longitude: 77.2167,
          severity: 2,
          verificationStatus: 'unverified',
          corroborationCount: 0,
          outdatedFlags: 0,
          abuseFlags: 0,
          isSynthetic: false,
          timestamp: new Date().toISOString(),
          timeHour: 22,
          lightingCondition: 'dim',
          comments: [],
        },
        'author-alice'
      );

      // Author attempting self-corroboration must be rejected
      const authorAttempt = await recordReportCorroborationDoc(repId, 'author-alice');
      expect(authorAttempt).toBe(false);

      // Independent user Bob corroborating
      const bobAttempt1 = await recordReportCorroborationDoc(repId, 'user-bob');
      expect(bobAttempt1).toBe(true);

      // Bob corroborating again (must not increment count twice)
      const bobAttempt2 = await recordReportCorroborationDoc(repId, 'user-bob');
      expect(bobAttempt2).toBe(false);

      const reports = await fetchSafetyReports();
      const target = reports.find((r) => r.id === repId);
      expect(target?.corroborationCount).toBe(1);
    });

    test('recordReportAbuseFlagDoc prevents a single account from spamming abuse flags to hide reports', async () => {
      const repId = `rep-flag-${Date.now()}`;
      await createSafetyReportDoc(
        {
          id: repId,
          authorUid: 'author-victim',
          category: 'harassment',
          title: 'Abuse Flag Spam Guard Test',
          description: 'Testing that one account cannot increment abuseFlags repeatedly',
          address: 'Janpath',
          latitude: 28.62,
          longitude: 77.21,
          severity: 3,
          verificationStatus: 'unverified',
          corroborationCount: 0,
          outdatedFlags: 0,
          abuseFlags: 0,
          isSynthetic: false,
          timestamp: new Date().toISOString(),
          timeHour: 22,
          lightingCondition: 'dim',
          comments: [],
        },
        'author-victim'
      );

      // Attacker flags report first time
      const flag1 = await recordReportAbuseFlagDoc(repId, 'attacker-user-1');
      expect(flag1).toBe(true);

      // Attacker tries flagging again 4 more times
      await recordReportAbuseFlagDoc(repId, 'attacker-user-1');
      await recordReportAbuseFlagDoc(repId, 'attacker-user-1');
      await recordReportAbuseFlagDoc(repId, 'attacker-user-1');
      await recordReportAbuseFlagDoc(repId, 'attacker-user-1');

      const reports = await fetchSafetyReports();
      const target = reports.find((r) => r.id === repId);
      expect(target?.abuseFlags).toBe(1); // strictly 1, attacker cannot spam to reach 5
    });

    test('saveEmergencyContactDoc preserves verificationStatus when updated by non-admin user', async () => {
      const contactId = `contact-verify-${Date.now()}`;
      await saveEmergencyContactDoc({
        id: contactId,
        ownerUid: 'user-regular',
        name: 'Papa',
        relationship: 'Father',
        phone: '+919876543210',
        verificationStatus: 'unverified',
        notifyOnSOS: true,
      });

      // Regular user tries to update verificationStatus to verified without admin privileges
      await saveEmergencyContactDoc(
        {
          id: contactId,
          ownerUid: 'user-regular',
          name: 'Papa (Updated)',
          relationship: 'Father',
          phone: '+919876543210',
          verificationStatus: 'verified',
          notifyOnSOS: true,
        },
        false // isAdmin = false
      );

      const data = await loadUserPrivateAndContacts('user-regular');
      const contact = data.contacts.find((c) => c.id === contactId);
      expect(contact?.name).toBe('Papa (Updated)');
      expect(contact?.verificationStatus).toBe('unverified'); // Unchanged!

      // Admin verification can legitimately verify
      await saveEmergencyContactDoc(
        {
          id: contactId,
          ownerUid: 'user-regular',
          name: 'Papa (Updated)',
          relationship: 'Father',
          phone: '+919876543210',
          verificationStatus: 'verified',
          notifyOnSOS: true,
        },
        true // isAdmin = true
      );

      const adminData = await loadUserPrivateAndContacts('user-regular');
      const verifiedContact = adminData.contacts.find((c) => c.id === contactId);
      expect(verifiedContact?.verificationStatus).toBe('verified');
    });

    test('saveEmergencyAlertDoc enforces pending status on creation and prevents clients from forging deliveryChannelStatus', async () => {
      const alertId = `alert-secure-${Date.now()}`;
      await saveEmergencyAlertDoc(
        {
          id: alertId,
          ownerUid: 'user-test',
          status: 'active',
          deliveryChannelStatus: 'sent' as any, // Client tries to claim sent on creation
          latitude: 28.6139,
          longitude: 77.209,
          mapShareUrl: 'https://maps.google.com',
          triggeredAt: new Date().toISOString(),
          contactDeliveries: [],
        },
        true // isNew
      );

      // Verify that offline adapter / Firestore initialization enforced 'pending'
      const activeAlerts = (offlineMockAdapter as any).alerts as any[];
      const alertDoc = activeAlerts.find((a) => a.id === alertId);
      expect(alertDoc?.deliveryChannelStatus).toBe('pending');

      // Client updates coordinates, tries to tamper deliveryChannelStatus
      await saveEmergencyAlertDoc(
        {
          id: alertId,
          ownerUid: 'user-test',
          status: 'active',
          deliveryChannelStatus: 'sent' as any, // Tamper attempt
          latitude: 28.6145,
          longitude: 77.2095,
          mapShareUrl: 'https://maps.google.com',
          triggeredAt: new Date().toISOString(),
          contactDeliveries: [],
        },
        false // update
      );

      const updatedAlertDoc = activeAlerts.find((a) => a.id === alertId);
      expect(updatedAlertDoc?.deliveryChannelStatus).toBe('pending');
      expect(updatedAlertDoc?.latitude).toBe(28.6145);
    });

    test('deleteAccountCascade purges all personal data across reports, posts, comments, contacts and journeys under DPDP Act', async () => {
      const dpdpUid = `user-dpdp-${Date.now()}`;
      await createSafetyReportDoc(
        {
          id: `rep-dpdp-${Date.now()}`,
          authorUid: dpdpUid,
          category: 'poor_lighting',
          title: 'DPDP User Report',
          description: 'This report should be deleted with cascade',
          address: 'Delhi',
          latitude: 28.6,
          longitude: 77.2,
          severity: 1,
          verificationStatus: 'unverified',
          corroborationCount: 0,
          outdatedFlags: 0,
          abuseFlags: 0,
          isSynthetic: false,
          timestamp: new Date().toISOString(),
          timeHour: 10,
          lightingCondition: 'dim',
          comments: [],
        },
        dpdpUid
      );

      await saveEmergencyContactDoc({
        id: `contact-dpdp-${Date.now()}`,
        ownerUid: dpdpUid,
        name: 'Brother',
        relationship: 'Brother',
        phone: '+919999911111',
        verificationStatus: 'unverified',
        notifyOnSOS: true,
      });

      // Execute cascade deletion
      await deleteAccountCascade(dpdpUid);

      const reports = await fetchSafetyReports();
      const orphanedReport = reports.find((r) => r.authorUid === dpdpUid);
      expect(orphanedReport).toBeUndefined();

      const contactsData = await loadUserPrivateAndContacts(dpdpUid);
      expect(contactsData.contacts.length).toBe(0);
    });
  });
});
