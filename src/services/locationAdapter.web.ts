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
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return 'denied';
    }
    try {
      await this.getCurrentLocation();
      return 'granted';
    } catch {
      return 'denied';
    }
  },

  getCurrentLocation(): Promise<LocationFix> {
    return new Promise((resolve) => {
      if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
        resolve({ ...DEFAULT_FALLBACK, timestampMs: Date.now() });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy || 20,
            timestampMs: pos.timestamp || Date.now(),
            source: 'gps',
          });
        },
        () => {
          resolve({ ...DEFAULT_FALLBACK, timestampMs: Date.now() });
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 15000 }
      );
    });
  },

  watchLocation(onFix, onError) {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      onError('Browser Geolocation unavailable; using demo coordinates.');
      return () => {};
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        onFix({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy || 20,
          timestampMs: pos.timestamp || Date.now(),
          source: 'gps',
        });
      },
      (err) => {
        onError(err.message || 'Location signal unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  },
};
