/**
 * Rahat Core Domain Types
 */

export * from './safety';

export type ZoneSafetyLevel = 'green' | 'yellow' | 'red';

export type ReportCategory =
  | 'poor_lighting'
  | 'harassment'
  | 'suspicious_activity'
  | 'deserted_area'
  | 'safe_shelter'
  | 'infrastructure_hazard'
  | 'other';

export type ReportStatus =
  | 'unverified'
  | 'under_review'
  | 'corroborated'
  | 'verified_official';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  photoURL?: string;
  isAnonymous?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  notifyOnSOS: boolean;
  notifyOnDeviation: boolean;
}

export interface SafetyZone {
  id: string;
  name: string;
  level: ZoneSafetyLevel;
  safetyScore: number; // 0 - 100
  center: LatLng;
  radiusMeters: number;
  summary: string;
  indicators: {
    lightingQuality: 'good' | 'moderate' | 'poor';
    crowdDensity: 'high' | 'moderate' | 'isolated';
    policePresence: boolean;
    cctvCoverage: boolean;
    recentReportCount: number;
  };
  lastUpdated: number;
}

export interface SafetyReport {
  id: string;
  userId: string;
  authorName: string;
  category: ReportCategory;
  title: string;
  description: string;
  coordinates: LatLng;
  locationName: string;
  status: ReportStatus;
  upvotes: number;
  downvotes: number;
  userVoted?: 'up' | 'down' | null;
  flagCount: number;
  createdAt: number;
  verifiedBadge?: string;
}

export interface CommunityComment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
  flagged: boolean;
}

export interface RouteOption {
  id: string;
  title: string;
  subtitle: string;
  distanceMeters: number;
  durationSeconds: number;
  safetyScore: number; // 0 - 100
  safetyTier: 'recommended_safe' | 'balanced' | 'faster_cautious';
  polyline: LatLng[];
  safetyPros: string[];
  safetyCons: string[];
  lightingPercentage: number;
  cctvPercentage: number;
}

export interface Journey {
  id: string;
  userId: string;
  origin: LatLng;
  originName: string;
  destination: LatLng;
  destinationName: string;
  selectedRoute: RouteOption;
  status: 'active' | 'paused' | 'deviated' | 'completed' | 'sos_triggered';
  currentLocation?: LatLng;
  startedAt: number;
  endedAt?: number;
  deviationHistory: RouteDeviationEvent[];
  isSharingWithCircle: boolean;
}

export interface RouteDeviationEvent {
  id: string;
  timestamp: number;
  location: LatLng;
  distanceFromPathMeters: number;
  resolved: boolean;
  resolvedAction?: 'safe' | 'recalculated' | 'shared' | 'sos';
}

export type SOSNotificationStatus = 'pending' | 'sent_sms' | 'delivered_cloud' | 'failed';

export interface SOSContactNotification {
  contactId: string;
  contactName: string;
  phone: string;
  status: SOSNotificationStatus;
  timestamp: number;
  method: 'sms' | 'cloud' | 'dialer';
}

export interface SOSAlert {
  id: string;
  userId: string;
  userName: string;
  location: LatLng;
  timestamp: number;
  status: 'active' | 'resolved' | 'cancelled';
  contacts: SOSContactNotification[];
  emergencyNumberDialed?: string;
  isOfflineFallback: boolean;
  googleMapsUrl: string;
}

export interface SafeCircleMember {
  id: string;
  name: string;
  phone: string;
  role: 'owner' | 'trusted_contact';
  isSharingLiveLocation: boolean;
  currentLocation?: LatLng;
  lastUpdated?: number;
  avatarColor?: string;
}

export interface SafeCircle {
  id: string;
  name: string;
  ownerId: string;
  members: SafeCircleMember[];
  shareLiveLocation: boolean;
}

export interface NearbyHelpItem {
  id: string;
  name: string;
  category: 'police' | 'hospital' | 'pharmacy' | 'pink_booth' | 'metro_helpdesk';
  address: string;
  phone: string;
  coordinates: LatLng;
  distanceMeters: number;
  isOpen24Hours: boolean;
  isVerified: boolean;
}

export interface SafeHeroResource {
  id: string;
  name: string;
  category: 'national_helpline' | 'ngo_crisis_center' | 'legal_support' | 'shelter' | 'cyber_safety';
  phone: string;
  alternatePhone?: string;
  address?: string;
  website?: string;
  description: string;
  isVerified: boolean;
  operatingHours: string;
  tollFree: boolean;
}

export interface UserSecuritySettings {
  backgroundTrackingConsent: boolean;
  routeDeviationCorridorMeters: number; // e.g. 60m
  deviationConfirmationTimeoutSeconds: number; // e.g. 30s
  sosCountdownSeconds: number; // e.g. 5s
  autoCallEmergencyOnSOS: boolean;
  preferredEmergencyNumber: string; // e.g. "112"
  enableHaptics: boolean;
  offlineSMSFallback: boolean;
}

