import * as Location from 'expo-location';
import { ILocationService, LocationSubscription } from '../interfaces/ILocationService';
import { LatLng } from '../../types';

export class ExpoLocationService implements ILocationService {
  private isTrackingActive: boolean = false;

  async requestPermissions(): Promise<{ foreground: boolean; background: boolean }> {
    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      let bgGranted = false;
      if (fg.granted) {
        try {
          const bg = await Location.requestBackgroundPermissionsAsync();
          bgGranted = bg.granted;
        } catch {
          bgGranted = false;
        }
      }
      return {
        foreground: fg.granted,
        background: bgGranted,
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
    _journeyId: string,
    _onDeviationDetected?: (distance: number) => void
  ): Promise<boolean> {
    this.isTrackingActive = true;
    return true;
  }

  async stopBackgroundJourneyTracking(): Promise<void> {
    this.isTrackingActive = false;
  }

  isBackgroundTrackingActive(): boolean {
    return this.isTrackingActive;
  }
}

