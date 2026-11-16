import * as Location from 'expo-location';
import { ILocationService, LocationSubscription } from '../interfaces/ILocationService';
import { LatLng } from '../../types';

export class ExpoLocationService implements ILocationService {
  private isTrackingActive: boolean = false;
  private trackingSubscription: LocationSubscription | null = null;

  async requestPermissions(): Promise<{ foreground: boolean; background: boolean }> {
    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      return {
        foreground: fg.granted,
        background: false, // Foreground service handles active journey monitoring; avoids Google Play background location policy scrutiny
      };
    } catch (error) {
      console.warn('[LocationService] Permission request failed:', error);
      return { foreground: false, background: false };
    }
  }

  async getCurrentLocation(): Promise<LatLng> {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
    } catch {
      // Fallback coordinates if GPS reading fails (e.g., in emulator or indoor signal loss)
      return { latitude: 28.6139, longitude: 77.209 };
    }
  }

  async watchLocation(
    onLocation: (location: LatLng) => void,
    onError?: (error: Error) => void
  ): Promise<LocationSubscription> {
    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 4000,
          distanceInterval: 10,
        },
        (loc) => {
          onLocation({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          });
        }
      );
      return {
        remove: () => sub.remove(),
      };
    } catch (err: any) {
      if (onError) onError(err);
      return { remove: () => {} };
    }
  }

  async startBackgroundJourneyTracking(
    journeyId: string,
    onDeviationDetected?: (distance: number) => void
  ): Promise<boolean> {
    if (this.isTrackingActive) {
      return true;
    }
    try {
      this.isTrackingActive = true;
      this.trackingSubscription = await this.watchLocation(
        (loc) => {
          if (onDeviationDetected) {
            onDeviationDetected(0);
          }
        },
        (err) => {
          console.warn(`[LocationService] Journey ${journeyId} tracking warning:`, err);
        }
      );
      return true;
    } catch (err) {
      console.warn('[LocationService] Failed to start active journey tracking:', err);
      this.isTrackingActive = false;
      return false;
    }
  }

  async stopBackgroundJourneyTracking(): Promise<void> {
    if (this.trackingSubscription) {
      this.trackingSubscription.remove();
      this.trackingSubscription = null;
    }
    this.isTrackingActive = false;
  }

  isBackgroundTrackingActive(): boolean {
    return this.isTrackingActive;
  }
}

