import {
  haversineDistance,
  crossTrackDistance,
  distanceToPolyline,
  checkRouteDeviation,
  formatDistance,
  formatDuration,
  generateMapsLink,
} from '../src/utils/geo';
import { LatLng } from '../src/types';

describe('SafeWalk Geo-Spatial & Deviation Engine', () => {
  const newDelhiCenter: LatLng = { latitude: 28.6139, longitude: 77.209 };
  const pointNearby: LatLng = { latitude: 28.6149, longitude: 77.21 };

  test('haversineDistance accurately computes meter distance between two coordinates', () => {
    const dist = haversineDistance(newDelhiCenter, pointNearby);
    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(180);
  });

  test('haversineDistance returns 0 for identical points', () => {
    const dist = haversineDistance(newDelhiCenter, newDelhiCenter);
    expect(dist).toBe(0);
  });

  test('crossTrackDistance calculates perpendicular distance to path', () => {
    const start: LatLng = { latitude: 28.6139, longitude: 77.209 };
    const end: LatLng = { latitude: 28.6239, longitude: 77.209 }; // Directly North
    const offsetPoint: LatLng = { latitude: 28.6189, longitude: 77.21 }; // ~100m East

    const crossDist = crossTrackDistance(offsetPoint, start, end);
    expect(crossDist).toBeGreaterThan(80);
    expect(crossDist).toBeLessThan(120);
  });

  test('distanceToPolyline calculates distance to multi-segment route', () => {
    const polyline: LatLng[] = [
      { latitude: 28.6139, longitude: 77.209 },
      { latitude: 28.6174, longitude: 77.2125 },
      { latitude: 28.6201, longitude: 77.214 },
    ];

    const userOnPath = { latitude: 28.6174, longitude: 77.2125 };
    const { minDistanceMeters } = distanceToPolyline(userOnPath, polyline);
    expect(minDistanceMeters).toBeLessThan(2);
  });

  test('checkRouteDeviation correctly flags deviation beyond corridor threshold', () => {
    const polyline: LatLng[] = [
      { latitude: 28.6139, longitude: 77.209 },
      { latitude: 28.6201, longitude: 77.214 },
    ];

    // Point on path
    const onRoute = { latitude: 28.617, longitude: 77.2115 };
    const resOn = checkRouteDeviation(onRoute, polyline, 75);
    expect(resOn.isDeviated).toBe(false);

    // Point deviated by 200m
    const deviated = { latitude: 28.617, longitude: 77.216 };
    const resDeviated = checkRouteDeviation(deviated, polyline, 75);
    expect(resDeviated.isDeviated).toBe(true);
    expect(resDeviated.distanceMeters).toBeGreaterThan(75);
  });

  test('formatDistance and formatDuration format human readable strings', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(2400)).toBe('2.4 km');

    expect(formatDuration(900)).toBe('15 min');
    expect(formatDuration(3600)).toBe('1 hr');
    expect(formatDuration(4200)).toBe('1 hr 10 min');
  });

  test('generateMapsLink returns valid Google Maps query URL', () => {
    const url = generateMapsLink(newDelhiCenter);
    expect(url).toContain('https://www.google.com/maps/search/?api=1&query=28.6139,77.209');
  });
});

