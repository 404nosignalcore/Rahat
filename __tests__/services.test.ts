import {
  MockAuthService,
  MockDatabaseService,
  MockEmergencyService,
} from '../src/services/mock/MockServices';
import { MOCK_EMERGENCY_CONTACTS } from '../src/services/mock/mockData';

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
});
