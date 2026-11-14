import {
  EmergencyContact,
  IncidentReport,
  RouteOption,
  SosAlertRecord,
  UserProfile,
} from '../types/safety';

export interface LocationFix {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestampMs: number;
  source: 'gps' | 'fallback_demo';
}

export interface IAuthService {
  signInWithGoogle(): Promise<UserProfile>;
  signOut(): Promise<void>;
  deleteAccount(uid: string): Promise<void>;
}

export interface ILocationService {
  requestForegroundPermission(): Promise<'granted' | 'denied'>;
  getCurrentLocation(): Promise<LocationFix>;
  watchLocation(
    onFix: (fix: LocationFix) => void,
    onError: (message: string) => void
  ): () => void;
}

export interface IRoutingService {
  findSaferRoutes(
    originQuery: string,
    destinationQuery: string,
    currentHour: number
  ): Promise<RouteOption[]>;
  recalculateFromPosition(
    lat: number,
    lng: number,
    destinationLabel: string,
    currentHour: number
  ): Promise<RouteOption>;
}

export interface INotificationService {
  dispatchEmergencyAlert(params: {
    ownerUid: string;
    latitude: number;
    longitude: number;
    contacts: EmergencyContact[];
  }): Promise<SosAlertRecord>;
}

export interface IDatabaseService {
  submitReport(report: IncidentReport, uid: string): Promise<void>;
  corroborateReport(reportId: string, nextCount: number): Promise<void>;
  flagReport(reportId: string, field: 'outdatedFlags' | 'abuseFlags', nextCount: number): Promise<void>;
}
