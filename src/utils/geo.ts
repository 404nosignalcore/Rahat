import { LatLng } from '../types';

const EARTH_RADIUS_METERS = 6371000;

/**
 * Converts degrees to radians.
 */
export function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 */
export function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Computes great-circle distance between two points in meters using Haversine formula.
 */
export function haversineDistance(coord1: LatLng, coord2: LatLng): number {
  const lat1 = toRadians(coord1.latitude);
  const lon1 = toRadians(coord1.longitude);
  const lat2 = toRadians(coord2.latitude);
  const lon2 = toRadians(coord2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Calculates initial bearing from coord1 to coord2 in radians.
 */
function bearingRadians(coord1: LatLng, coord2: LatLng): number {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return Math.atan2(y, x);
}

/**
 * Computes the perpendicular cross-track distance (in meters) from a point
 * to a great circle path defined by start and end.
 * A positive distance means right of the course, negative means left.
 */
export function crossTrackDistance(
  point: LatLng,
  start: LatLng,
  end: LatLng
): number {
  const distStartToPoint = haversineDistance(start, point) / EARTH_RADIUS_METERS;
  const bearingStartToPoint = bearingRadians(start, point);
  const bearingStartToEnd = bearingRadians(start, end);

  const crossTrackAngularDistance = Math.asin(
    Math.sin(distStartToPoint) * Math.sin(bearingStartToPoint - bearingStartToEnd)
  );

  return Math.abs(crossTrackAngularDistance * EARTH_RADIUS_METERS);
}

/**
 * Computes the distance from a point to a finite segment [start, end].
 * Clamps to endpoints if the projection lies beyond segment boundaries.
 */
export function distanceToSegment(
  point: LatLng,
  start: LatLng,
  end: LatLng
): number {
  const d12 = haversineDistance(start, end);
  if (d12 === 0) {
    return haversineDistance(point, start);
  }

  // Angular distance
  const dStartPoint = haversineDistance(start, point);
  const dEndPoint = haversineDistance(end, point);

  // If projection falls outside the segment, return distance to nearest endpoint
  // Using cosine law approximation for small planar segments
  const theta1 = bearingRadians(start, point) - bearingRadians(start, end);
  const theta2 = bearingRadians(end, point) - bearingRadians(end, start);

  // If angle is obtuse (> 90 deg or < -90 deg), projection is behind the start point
  if (Math.cos(theta1) < 0) {
    return dStartPoint;
  }
  // If angle from end is obtuse, projection is beyond the end point
  if (Math.cos(theta2) < 0) {
    return dEndPoint;
  }

  // Otherwise, use cross-track distance
  return crossTrackDistance(point, start, end);
}

/**
 * Determines the minimum distance from a location to any segment of a route polyline.
 */
export function distanceToPolyline(
  point: LatLng,
  polyline: LatLng[]
): { minDistanceMeters: number; nearestSegmentIndex: number } {
  if (polyline.length === 0) {
    return { minDistanceMeters: Infinity, nearestSegmentIndex: -1 };
  }
  if (polyline.length === 1) {
    return {
      minDistanceMeters: haversineDistance(point, polyline[0]),
      nearestSegmentIndex: 0,
    };
  }

  let minDistance = Infinity;
  let nearestIndex = 0;

  for (let i = 0; i < polyline.length - 1; i++) {
    const segDist = distanceToSegment(point, polyline[i], polyline[i + 1]);
    if (segDist < minDistance) {
      minDistance = segDist;
      nearestIndex = i;
    }
  }

  return {
    minDistanceMeters: minDistance,
    nearestSegmentIndex: nearestIndex,
  };
}

/**
 * Route deviation checker with configurable buffer corridor.
 */
export function checkRouteDeviation(
  currentLocation: LatLng,
  routePolyline: LatLng[],
  corridorThresholdMeters: number = 75
): { isDeviated: boolean; distanceMeters: number } {
  if (!routePolyline || routePolyline.length === 0) {
    return { isDeviated: false, distanceMeters: 0 };
  }

  const { minDistanceMeters } = distanceToPolyline(currentLocation, routePolyline);

  return {
    isDeviated: minDistanceMeters > corridorThresholdMeters,
    distanceMeters: Math.round(minDistanceMeters),
  };
}

/**
 * Formats a distance in meters to a human-readable string.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Formats a duration in seconds to a human-readable string.
 */
export function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return remMinutes > 0 ? `${hours} hr ${remMinutes} min` : `${hours} hr`;
}

/**
 * Generates an openable Google Maps link with coordinates.
 */
export function generateMapsLink(location: LatLng): string {
  return `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
}

