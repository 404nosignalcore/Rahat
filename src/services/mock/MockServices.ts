import { IAuthService } from '../interfaces/IAuthService';
import { IDatabaseService } from '../interfaces/IDatabaseService';
import { ILocationService, LocationSubscription } from '../interfaces/ILocationService';
import { IEmergencyService } from '../interfaces/IEmergencyService';
import {
  UserProfile,
  SafetyZone,
  SafetyReport,
  CommunityComment,
  NearbyHelpItem,
  SafeHeroResource,
  SafeCircle,
  EmergencyContact,
  Journey,
  SOSAlert,
  LatLng,
} from '../../types';
import {
  MOCK_USER,
  MOCK_EMERGENCY_CONTACTS,
  MOCK_SAFETY_ZONES,
  MOCK_SAFETY_REPORTS,
  MOCK_NEARBY_HELP,
  MOCK_SAFE_HEROES,
  MOCK_SAFE_CIRCLE,
} from './mockData';
import { generateMapsLink } from '../../utils/geo';

export class MockAuthService implements IAuthService {
  private currentUser: UserProfile | null = MOCK_USER;
  private listeners: ((user: UserProfile | null) => void)[] = [];

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  async signInWithEmail(email: string, _pass: string): Promise<UserProfile> {
    this.currentUser = {
      ...MOCK_USER,
      email,
      name: email.split('@')[0],
      isAnonymous: false,
    };
    this.notify();
    return this.currentUser;
  }

  async signUpWithEmail(
    email: string,
    _pass: string,
    name: string,
    phone: string
  ): Promise<UserProfile> {
    this.currentUser = {
      uid: 'user_' + Date.now(),
      name,
      email,
      phone,
      isAnonymous: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.notify();
    return this.currentUser;
  }

  async signInAnonymously(): Promise<UserProfile> {
    this.currentUser = {
      uid: 'guest_' + Date.now(),
      name: 'Guest User',
      email: '',
      phone: '',
      isAnonymous: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.notify();
    return this.currentUser;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.notify();
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates, updatedAt: Date.now() };
      this.notify();
    }
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentUser));
  }
}

export class MockDatabaseService implements IDatabaseService {
  private zones: SafetyZone[] = [...MOCK_SAFETY_ZONES];
  private reports: SafetyReport[] = [...MOCK_SAFETY_REPORTS];
  private comments: Record<string, CommunityComment[]> = {
    rep_1: [
      {
        id: 'comm_1',
        reportId: 'rep_1',
        userId: 'u_2',
        userName: 'Divya P.',
        content: 'Confirmed, walked past here yesterday evening. Extremely dark, please avoid.',
        createdAt: Date.now() - 2 * 3600 * 1000,
        flagged: false,
      },
    ],
  };
  private contacts: EmergencyContact[] = [...MOCK_EMERGENCY_CONTACTS];
  private circle: SafeCircle = { ...MOCK_SAFE_CIRCLE };
  private journeys: Record<string, Journey> = {};
  private activeAlerts: SOSAlert[] = [];

  async getSafetyZones(_nearbyLocation?: LatLng): Promise<SafetyZone[]> {
    return [...this.zones];
  }

  async getSafetyReports(categoryFilter?: string): Promise<SafetyReport[]> {
    if (!categoryFilter || categoryFilter === 'all') {
      return [...this.reports];
    }
    return this.reports.filter((r) => r.category === categoryFilter);
  }

  async createSafetyReport(
    reportData: Omit<SafetyReport, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'flagCount'>
  ): Promise<SafetyReport> {
    const newReport: SafetyReport = {
      ...reportData,
      id: 'rep_' + Date.now(),
      createdAt: Date.now(),
      upvotes: 1,
      downvotes: 0,
      flagCount: 0,
      status: 'unverified', // Transparent: new community reports start unverified
    };
    this.reports.unshift(newReport);
    return newReport;
  }

  async voteSafetyReport(reportId: string, direction: 'up' | 'down'): Promise<void> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      if (direction === 'up') {
        rep.upvotes += 1;
        rep.userVoted = 'up';
      } else {
        rep.downvotes += 1;
        rep.userVoted = 'down';
      }
      // Corroboration logic: 5+ upvotes moves to corroborated if not official
      if (rep.upvotes >= 5 && rep.status === 'unverified') {
        rep.status = 'corroborated';
      }
    }
  }

  async flagSafetyReport(reportId: string, _reason: string): Promise<void> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      rep.flagCount += 1;
      if (rep.flagCount >= 3) {
        rep.status = 'under_review';
      }
    }
  }

  async getComments(reportId: string): Promise<CommunityComment[]> {
    return this.comments[reportId] ? [...this.comments[reportId]] : [];
  }

  async addComment(
    reportId: string,
    content: string,
    userId: string,
    userName: string
  ): Promise<CommunityComment> {
    const newComment: CommunityComment = {
      id: 'comm_' + Date.now(),
      reportId,
      userId,
      userName,
      content,
      createdAt: Date.now(),
      flagged: false,
    };
    if (!this.comments[reportId]) {
      this.comments[reportId] = [];
    }
    this.comments[reportId].push(newComment);
    return newComment;
  }

  async getNearbyHelp(_location: LatLng): Promise<NearbyHelpItem[]> {
    return [...MOCK_NEARBY_HELP];
  }

  async getSafeHeroes(): Promise<SafeHeroResource[]> {
    return [...MOCK_SAFE_HEROES];
  }

  async getEmergencyContacts(_userId: string): Promise<EmergencyContact[]> {
    return [...this.contacts];
  }

  async addEmergencyContact(
    _userId: string,
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<EmergencyContact> {
    const newContact: EmergencyContact = {
      ...contact,
      id: 'contact_' + Date.now(),
    };
    this.contacts.push(newContact);
    return newContact;
  }

  async updateEmergencyContact(
    _userId: string,
    contact: EmergencyContact
  ): Promise<void> {
    const index = this.contacts.findIndex((c) => c.id === contact.id);
    if (index !== -1) {
      this.contacts[index] = contact;
    }
  }

  async deleteEmergencyContact(
    _userId: string,
    contactId: string
  ): Promise<void> {
    this.contacts = this.contacts.filter((c) => c.id !== contactId);
  }

  async getSafeCircle(_userId: string): Promise<SafeCircle | null> {
    return { ...this.circle };
  }

  async updateLocationSharing(
    userId: string,
    isSharing: boolean,
    location?: LatLng
  ): Promise<void> {
    this.circle.shareLiveLocation = isSharing;
    const member = this.circle.members.find((m) => m.id === userId);
    if (member) {
      member.isSharingLiveLocation = isSharing;
      if (location) {
        member.currentLocation = location;
        member.lastUpdated = Date.now();
      }
    }
  }

  async saveJourney(journey: Journey): Promise<void> {
    this.journeys[journey.id] = journey;
  }

  async updateJourneyStatus(
    journeyId: string,
    status: Journey['status']
  ): Promise<void> {
    if (this.journeys[journeyId]) {
      this.journeys[journeyId].status = status;
      if (status === 'completed') {
        this.journeys[journeyId].endedAt = Date.now();
      }
    }
  }

  async createSOSAlert(alertData: Omit<SOSAlert, 'id'>): Promise<SOSAlert> {
    const newAlert: SOSAlert = {
      ...alertData,
      id: 'sos_' + Date.now(),
    };
    this.activeAlerts.push(newAlert);
    return newAlert;
  }

  async resolveSOSAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
    }
  }
}

export class MockLocationService implements ILocationService {
  private mockLocation: LatLng = { latitude: 28.6139, longitude: 77.209 };
  private isTracking: boolean = false;
  private intervalId: any = null;

  async requestPermissions(): Promise<{ foreground: boolean; background: boolean }> {
    return { foreground: true, background: true };
  }

  async getCurrentLocation(): Promise<LatLng> {
    return { ...this.mockLocation };
  }

  async watchLocation(
    onLocation: (location: LatLng) => void,
    _onError?: (error: Error) => void
  ): Promise<LocationSubscription> {
    onLocation({ ...this.mockLocation });
    const timer = setInterval(() => {
      // Simulate subtle GPS movement
      this.mockLocation = {
        latitude: this.mockLocation.latitude + (Math.random() - 0.48) * 0.0001,
        longitude: this.mockLocation.longitude + (Math.random() - 0.48) * 0.0001,
      };
      onLocation({ ...this.mockLocation });
    }, 4000);

    return {
      remove: () => clearInterval(timer),
    };
  }

  async startBackgroundJourneyTracking(
    _journeyId: string,
    _onDeviationDetected?: (dist: number) => void
  ): Promise<boolean> {
    this.isTracking = true;
    return true;
  }

  async stopBackgroundJourneyTracking(): Promise<void> {
    this.isTracking = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  isBackgroundTrackingActive(): boolean {
    return this.isTracking;
  }

  // Developer simulation helper to trigger deviation during testing
  simulateDeviation(offsetMeters: number) {
    const degrees = offsetMeters / 111320;
    this.mockLocation.latitude += degrees;
  }
}

export class MockEmergencyService implements IEmergencyService {
  async triggerSOS(
    user: { uid: string; name: string },
    location: LatLng,
    contacts: EmergencyContact[],
    emergencyNumber: string = '112'
  ): Promise<SOSAlert> {
    const mapUrl = generateMapsLink(location);
    const notifications = contacts.map((c) => ({
      contactId: c.id,
      contactName: c.name,
      phone: c.phone,
      status: 'delivered_cloud' as const,
      timestamp: Date.now(),
      method: 'cloud' as const,
    }));

    return {
      id: 'alert_' + Date.now(),
      userId: user.uid,
      userName: user.name,
      location,
      timestamp: Date.now(),
      status: 'active',
      contacts: notifications,
      emergencyNumberDialed: emergencyNumber,
      isOfflineFallback: false,
      googleMapsUrl: mapUrl,
    };
  }

  async sendEmergencySMS(
    _contacts: EmergencyContact[],
    _location: LatLng,
    _userName: string
  ): Promise<boolean> {
    // In mock/simulated mode, returns true
    return true;
  }

  async dialEmergencyServices(_emergencyNumber: string = '112'): Promise<boolean> {
    return true;
  }

  async resolveSOS(_alertId: string): Promise<void> {
    return;
  }
}

