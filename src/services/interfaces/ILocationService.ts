import { LatLng } from '../../types';

export interface LocationSubscription {
  remove: () => void;
}

export interface ILocationService {
  requestPermissions(): Promise<{ foreground: boolean; background: boolean }>;
  getCurrentLocation(): Promise<LatLng>;
  watchLocation(
    onLocation: (location: LatLng) => void,
    onError?: (error: Error) => void
  ): Promise<LocationSubscription>;
  startBackgroundJourneyTracking(
    journeyId: string,
    onDeviationDetected?: (distance: number) => void
  ): Promise<boolean>;
  stopBackgroundJourneyTracking(): Promise<void>;
  isBackgroundTrackingActive(): boolean;
}

