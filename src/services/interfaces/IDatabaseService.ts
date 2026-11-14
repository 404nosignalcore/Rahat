import {
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

export interface IDatabaseService {
  // Safe Zones
  getSafetyZones(nearbyLocation?: LatLng): Promise<SafetyZone[]>;

  // Safety Reports
  getSafetyReports(categoryFilter?: string): Promise<SafetyReport[]>;
  createSafetyReport(report: Omit<SafetyReport, 'id' | 'createdAt' | 'upvotes' | 'downvotes' | 'flagCount'>): Promise<SafetyReport>;
  voteSafetyReport(reportId: string, direction: 'up' | 'down'): Promise<void>;
  flagSafetyReport(reportId: string, reason: string): Promise<void>;

  // Comments
  getComments(reportId: string): Promise<CommunityComment[]>;
  addComment(reportId: string, content: string, userId: string, userName: string): Promise<CommunityComment>;

  // Nearby Help & SafeHeroes
  getNearbyHelp(location: LatLng): Promise<NearbyHelpItem[]>;
  getSafeHeroes(): Promise<SafeHeroResource[]>;

  // Emergency Contacts
  getEmergencyContacts(userId: string): Promise<EmergencyContact[]>;
  addEmergencyContact(userId: string, contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact>;
  updateEmergencyContact(userId: string, contact: EmergencyContact): Promise<void>;
  deleteEmergencyContact(userId: string, contactId: string): Promise<void>;

  // SafeCircle
  getSafeCircle(userId: string): Promise<SafeCircle | null>;
  updateLocationSharing(userId: string, isSharing: boolean, location?: LatLng): Promise<void>;

  // Journey
  saveJourney(journey: Journey): Promise<void>;
  updateJourneyStatus(journeyId: string, status: Journey['status']): Promise<void>;

  // SOS
  createSOSAlert(alert: Omit<SOSAlert, 'id'>): Promise<SOSAlert>;
  resolveSOSAlert(alertId: string): Promise<void>;
}

