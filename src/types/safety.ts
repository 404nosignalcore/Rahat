export type AppTab = 'safezone' | 'route' | 'sos' | 'connect' | 'profile';
export type ConnectSubTab = 'safecircle' | 'nearby_help' | 'community';

export type RiskLevel = 'safe' | 'caution' | 'danger';
export type AppLanguage = 'en' | 'hi';

export type IncidentCategory =
  | 'harassment'
  | 'stalking'
  | 'verbal_abuse'
  | 'physical_assault'
  | 'poor_lighting'
  | 'secluded_area'
  | 'unsafe_transport'
  | 'suspicious_activity';

export type SafeHavenType =
  | 'police'
  | 'hospital'
  | 'pharmacy'
  | 'verified_shop'
  | 'campus_security'
  | 'metro_booth';

/** Four explicit, transparent verification tiers — never misrepresent ordinary reports as official */
export type ReportVerificationStatus =
  | 'unverified'
  | 'under_review'
  | 'community_corroborated'
  | 'authorized_verified';

export interface CommunityComment {
  id: string;
  reportId: string;
  authorUid: string;
  authorDisplay: string;
  body: string;
  flaggedAbuse: boolean;
  createdAt: string;
}

export interface IncidentReport {
  id: string;
  authorUid?: string;
  category: IncidentCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  timestamp: string;
  timeHour: number;
  lightingCondition: 'well_lit' | 'dim' | 'dark' | 'pitch_black';
  severity: 1 | 2 | 3 | 4 | 5;
  verificationStatus: ReportVerificationStatus;
  corroborationCount: number;
  outdatedFlags: number;
  abuseFlags: number;
  isSynthetic: boolean;
  comments?: CommunityComment[];
}

export interface RiskZone {
  id: string;
  name: string;
  nameHi: string;
  level: RiskLevel;
  safetyScore: number;
  coordinates: [number, number][];
  center: [number, number];
  primaryConcerns: string[];
  primaryConcernsHi: string[];
  positiveFactors: string[];
  positiveFactorsHi: string[];
  lightingRating: number;
  cctvCoverage: number;
  patrolFrequency: 'continuous' | 'frequent' | 'rare' | 'none';
  timeRiskModifier: {
    day: number;
    evening: number;
    night: number;
    lateNight: number;
  };
}

export interface SafeHaven {
  id: string;
  name: string;
  nameHi: string;
  type: SafeHavenType;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  open24Hours: boolean;
  sourceTier: 'verified' | 'community';
  notes?: string;
  distanceMeters?: number;
}

export interface RouteOption {
  id: string;
  name: string;
  title?: string; // Compatibility alias for name
  nameHi: string;
  originLabel: string;
  destinationLabel: string;
  isRecommended: boolean;
  safetyScore: number;
  distanceKm: number;
  durationMins: number;
  lightingPercentage: number;
  cctvCoveragePercentage: number;
  safeHavensEnRoute: number;
  riskZonesCrossed: { name: string; level: RiskLevel }[];
  path: [number, number][];
  polyline?: { latitude: number; longitude: number }[]; // Compatibility alias
  rationale: string;
  rationaleHi: string;
}

export type ContactVerificationStatus = 'unverified' | 'pending' | 'verified';

export interface EmergencyContact {
  id: string;
  ownerUid: string;
  name: string;
  relationship: string;
  phone: string;
  verificationStatus: ContactVerificationStatus;
  notifyOnSOS: boolean;
}

export type AlertChannelDeliveryStatus =
  | 'pending'
  | 'sent'
  | 'partial_failure'
  | 'failed'
  | 'offline_fallback';

export interface ContactDeliveryStatus {
  contactId: string;
  contactName: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed' | 'offline_fallback';
  detail: string;
}

export interface SosAlertRecord {
  id: string;
  ownerUid: string;
  status: 'countdown' | 'active' | 'cancelled' | 'resolved';
  deliveryChannelStatus: AlertChannelDeliveryStatus;
  latitude: number;
  longitude: number;
  mapShareUrl: string;
  triggeredAt: string;
  timestamp?: string; // Compatibility alias for triggeredAt
  contactDeliveries: ContactDeliveryStatus[];
  locationSource?: 'gps' | 'fallback_demo';
  isFallbackLocation?: boolean;
  isOfflineFallback?: boolean; // Compatibility alias
}

export type JourneyStatus = 'idle' | 'active' | 'paused' | 'completed' | 'sos_escalated' | 'deviated' | 'sos_triggered';

export interface JourneySession {
  id: string;
  ownerUid: string;
  originLabel: string;
  destinationLabel: string;
  destinationName?: string; // Compatibility alias
  routeId: string;
  routeName: string;
  status: JourneyStatus;
  sharedWithCircleId?: string;
  isSharingWithCircle?: boolean; // Compatibility alias
  selectedRoute?: RouteOption; // Compatibility alias
  lastLatitude: number;
  lastLongitude: number;
  gpsSignalStatus: 'locked' | 'weak' | 'lost' | 'permission_denied';
  networkOnline: boolean;
  deviationDetected: boolean;
  deviationMeters: number;
  startedAt: string;
}

export interface SafeCircleMember {
  id: string;
  circleId: string;
  circleOwnerUid: string;
  displayName: string;
  phone?: string;
  role: 'owner' | 'trusted_member' | 'invited';
  consentToShareLocation: boolean;
  inviteStatus: 'accepted' | 'pending' | 'revoked';
  lastSharedArea?: string;
  activeJourneySummary?: string;
}

export interface SafeCircleGroup {
  id: string;
  ownerUid: string;
  name: string;
  sharingEnabled: boolean;
  members: SafeCircleMember[];
}

export interface CommunityPost {
  id: string;
  authorUid: string;
  authorDisplay: string;
  coarseArea: string;
  topic: 'area_update' | 'suspicious_activity' | 'safe_tip' | 'lighting_alert';
  body: string;
  helpfulCount: number;
  abuseFlags: number;
  createdAt: string;
  comments: { id: string; authorDisplay: string; body: string; createdAt: string }[];
}

export interface SafeHeroOrganization {
  id: string;
  name: string;
  assistanceType: string;
  contactPhone: string;
  serviceLocation: string;
  officialWebsite: string;
  verificationStatus: 'verified_public_helpline' | 'unverified_directory';
  notes: string;
}

export interface WearableDeviceState {
  id: string;
  name: string;
  type: 'smartwatch' | 'safety_locket';
  connectionStatus: 'prototype_paired' | 'standby' | 'disconnected';
  batteryPercent: number;
  firmwareLabel: string;
  lastHeartbeatAt: string;
  isPrototypeSimulation: true;
}

export interface ConsentSettings {
  locationConsent: boolean;
  backgroundTrackingConsent: boolean;
  notificationConsent: boolean;
  sosCountdownSeconds: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  name?: string; // Compatibility alias
  phone: string;
  photoUrl?: string;
  photoURL?: string; // Compatibility alias
  preferredLanguage?: 'en' | 'hi';
  role: 'citizen' | 'admin';
  isAuthenticated: boolean;
  isDemoSession: boolean;
  consents: ConsentSettings;
  savedPlaces: { id: string; name: string; address: string; lat: number; lng: number }[];
}

export interface HotspotCluster {
  id: string;
  center: [number, number];
  radiusMeters: number;
  incidentCount: number;
  incidentIds: string[];
  severityLevel: RiskLevel;
  primaryCategory: IncidentCategory;
  timePattern: string;
  timePatternHi: string;
  mitigationRecommendation: string;
  mitigationRecommendationHi: string;
}

export interface StreetLightingSegment {
  id: string;
  streetName: string;
  path: [number, number][];
  luxLevel: number;
  quality: 'good' | 'moderate' | 'poor' | 'unlit';
  reliability: 'verified_audit' | 'community_reported' | 'unreliable';
  lastAuditedDate: string;
}

export interface DataReliabilitySector {
  id: string;
  name: string;
  nameHi: string;
  coordinates: [number, number][];
  status: 'fully_verified' | 'community_reported_only' | 'missing_data';
  auditConfidence: number;
  warningNotice?: string;
  warningNoticeHi?: string;
}

/**
 * Community Emergency Response Network Types (SafeWalk/Raksha Rescue Network)
 */
export type CommunitySosStatus =
  | 'idle'
  | 'broadcasting'
  | 'responders_assigned'
  | 'arrived'
  | 'resolved'
  | 'cancelled';

export type CommunityResponderStatus =
  | 'notified'
  | 'accepted'
  | 'on_the_way'
  | 'arrived'
  | 'cancelled';

export interface CommunityResponder {
  id: string;
  name: string;
  phone: string;
  avatarColor: string;
  isVerified: boolean;
  verificationBadge: string;
  rating: number;
  acceptedHelpsCount: number;
  distanceMeters: number;
  latitude: number;
  longitude: number;
  status: CommunityResponderStatus;
  acceptedAt?: string;
  startedAt?: string;
  arrivedAt?: string;
  cancelledAt?: string;
  etaMinutes?: number;
}

export interface CommunitySosEventLog {
  id: string;
  timestamp: string;
  type:
    | 'broadcast_started'
    | 'wave_expanded'
    | 'responder_accepted'
    | 'responder_en_route'
    | 'responder_arrived'
    | 'responder_cancelled'
    | 'cancelled_by_victim'
    | 'resolved'
    | 'suspicious_behavior_reported';
  message: string;
  responderName?: string;
}

export interface CommunitySosRequest {
  id: string;
  victimUid: string;
  victimName: string;
  victimPhone: string;
  victimLocation: { lat: number; lng: number };
  emergencyCategory: 'personal_safety' | 'stalking_threat' | 'medical_distress' | 'harassment' | 'general_emergency';
  emergencyDescription: string;
  currentWave: 1 | 2 | 3;
  waveRadiusMeters: number;
  status: CommunitySosStatus;
  createdAt: string;
  responders: CommunityResponder[];
  auditLog: CommunitySosEventLog[];
  isCancelled: boolean;
  cancelReason?: string;
}
