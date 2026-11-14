import * as Location from 'expo-location';
import { ILocationService, LocationFix } from './contracts';

const DEFAULT_FALLBACK: LocationFix = {
  latitude: 28.6275,
  longitude: 77.2185,
  accuracyMeters: 25,
  timestampMs: Date.now(),
  source: 'fallback_demo',
};

export const locationService: ILocationService = {
  async requestForegroundPermission() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted' ? 'granted' : 'denied';
  },

  async getCurrentLocation(): Promise<LocationFix> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return { ...DEFAULT_FALLBACK, timestampMs: Date.now() };
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      return {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracyMeters: loc.coords.accuracy ?? 20,
        timestampMs: loc.timestamp,
        source: 'gps',
      };
    } catch {
      return { ...DEFAULT_FALLBACK, timestampMs: Date.now() };
    }
  },

  watchLocation(onFix, onError) {
    let active = true;
    let subscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 4000,
        distanceInterval: 10,
      },
      (loc) => {
        if (!active) return;
        onFix({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracyMeters: loc.coords.accuracy ?? 20,
          timestampMs: loc.timestamp,
          source: 'gps',
        });
      }
    )
      .then((sub) => {
        if (!active) {
          sub.remove();
        } else {
          subscription = sub;
        }
      })
      .catch((err) => {
        onError(err instanceof Error ? err.message : 'Expo location watcher failed.');
      });

    return () => {
      active = false;
      subscription?.remove();
    };
  },
};
