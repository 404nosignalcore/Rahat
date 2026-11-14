import { RiskLevel, RouteOption, IncidentCategory } from '../types/safety';

export function getTimeOfDayModifier(hour: number): number {
  if (hour >= 23 || hour < 5) {
    return -25;
  }
  if (hour >= 18) {
    return -12;
  }
  if (hour >= 5 && hour < 8) {
    return -5;
  }
  return 5;
}

export function getRiskCategory(score: number): RiskLevel {
  if (score >= 75) return 'safe';
  if (score >= 45) return 'caution';
  return 'danger';
}

export function calculateDynamicZoneScore(
  baseScore: number,
  hour: number,
  lightingRating: number,
  cctvCoverage: number,
  incidentCount: number
): { score: number; level: RiskLevel; explanation: string[] } {
  let score = baseScore;
  const explanations: string[] = [];

  const timeMod = getTimeOfDayModifier(hour);
  score += timeMod;
  if (timeMod < 0) {
    explanations.push(
      hour >= 23 || hour < 5
        ? 'Late night hours reduce bystander visibility and active commercial presence (-25 pts).'
        : 'Evening hours reduce natural daylight visibility (-12 pts).'
    );
  } else {
    explanations.push('Daytime hours with higher ambient footfall and visibility (+5 pts).');
  }

  const lightingDelta = (lightingRating - 3) * 4;
  score += lightingDelta;
  if (lightingRating < 3) {
    explanations.push(`Low reported lighting rating (${lightingRating}/5) (-${Math.abs(lightingDelta)} pts).`);
  } else if (lightingRating >= 4) {
    explanations.push(`Strong street illumination reported (${lightingRating}/5) (+${lightingDelta} pts).`);
  }

  if (cctvCoverage > 70) {
    score += 5;
    explanations.push(`Higher surveillance coverage (${cctvCoverage}%) (+5 pts).`);
  } else if (cctvCoverage < 30) {
    score -= 5;
    explanations.push(`Limited camera visibility (${cctvCoverage}%) (-5 pts).`);
  }

  if (incidentCount > 0) {
    const penalty = Math.min(30, incidentCount * 6);
    score -= penalty;
    explanations.push(`${incidentCount} community safety report(s) in this area (-${penalty} pts).`);
  }

  score = Math.max(5, Math.min(98, Math.round(score)));

  return {
    score,
    level: getRiskCategory(score),
    explanation: explanations,
  };
}

export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Computes minimum distance (meters) from a GPS point to any vertex or interpolated segment point on a polyline.
 */
export function pointToPolylineMinDistanceMeters(
  point: [number, number],
  polyline: [number, number][]
): number {
  if (polyline.length === 0) return 0;
  if (polyline.length === 1) {
    return getDistanceMeters(point[0], point[1], polyline[0][0], polyline[0][1]);
  }

  let minMeters = Infinity;

  for (let i = 0; i < polyline.length - 1; i++) {
    const [aLat, aLng] = polyline[i];
    const [bLat, bLng] = polyline[i + 1];

    // Project onto segment in local equirectangular approximation
    const midLatRad = (((aLat + bLat) / 2) * Math.PI) / 180;
    const cosLat = Math.cos(midLatRad);

    const ax = aLng * cosLat;
    const ay = aLat;
    const bx = bLng * cosLat;
    const by = bLat;
    const px = point[1] * cosLat;
    const py = point[0];

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;

    let t = 0;
    if (lenSq > 0) {
      t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    }

    const projLat = aLat + t * (bLat - aLat);
    const projLng = aLng + t * (bLng - aLng);
    const dist = getDistanceMeters(point[0], point[1], projLat, projLng);
    if (dist < minMeters) {
      minMeters = dist;
    }
  }

  return minMeters === Infinity ? 0 : minMeters;
}

export function compareRouteSafety(
  route: RouteOption,
  hour: number
): { adjustedScore: number; level: RiskLevel; deltaMins: number } {
  const timeMod = getTimeOfDayModifier(hour);
  const mitigation = Math.min(15, route.safeHavensEnRoute * 5);
  const adjustedScore = Math.max(
    10,
    Math.min(98, Math.round(route.safetyScore + (timeMod < 0 ? timeMod + mitigation : timeMod)))
  );

  return {
    adjustedScore,
    level: getRiskCategory(adjustedScore),
    deltaMins: route.durationMins,
  };
}

export function clusterIncidentsGeospatially(
  incidents: { id: string; latitude: number; longitude: number; severity: number; category: IncidentCategory; timeHour: number }[],
  radiusMeters = 250
): {
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
}[] {
  const clusters: {
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
  }[] = [];

  const visited = new Set<string>();

  for (let i = 0; i < incidents.length; i++) {
    const incA = incidents[i];
    if (visited.has(incA.id)) continue;

    const group = [incA];
    visited.add(incA.id);

    for (let j = i + 1; j < incidents.length; j++) {
      const incB = incidents[j];
      if (visited.has(incB.id)) continue;

      const dist = getDistanceMeters(incA.latitude, incA.longitude, incB.latitude, incB.longitude);
      if (dist <= radiusMeters) {
        group.push(incB);
        visited.add(incB.id);
      }
    }

    if (group.length >= 2 || group.some((g) => g.severity >= 4)) {
      const avgLat = group.reduce((sum, g) => sum + g.latitude, 0) / group.length;
      const avgLng = group.reduce((sum, g) => sum + g.longitude, 0) / group.length;
      const maxSeverity = Math.max(...group.map((g) => g.severity));

      const catCount: Record<string, number> = {};
      group.forEach((g) => {
        catCount[g.category] = (catCount[g.category] || 0) + 1;
      });
      const primaryCategory = Object.keys(catCount).sort(
        (a, b) => catCount[b] - catCount[a]
      )[0] as IncidentCategory;

      const nightIncidents = group.filter((g) => g.timeHour >= 20 || g.timeHour < 4).length;
      const isNightCluster = nightIncidents >= group.length / 2;

      const timePattern = isNightCluster
        ? 'Higher evening/night concentration (8:00 PM - 3:00 AM)'
        : 'Daytime & evening distribution';
      const timePatternHi = isNightCluster
        ? 'रात्रि कालीन संकेन्द्रण (रात 8:00 से 3:00 बजे)'
        : 'दिन व शाम का पैटर्न';

      const mitigation =
        primaryCategory === 'poor_lighting'
          ? 'Streetlight repair and improved visibility recommended along this stretch.'
          : 'Stay on lit main thoroughfares and keep SafeCircle sharing enabled.';
      const mitigationHi =
        primaryCategory === 'poor_lighting'
          ? 'इस मार्ग पर स्ट्रीटलाइट मरम्मत और बेहतर प्रकाश की आवश्यकता है।'
          : 'मुख्य रोशनी वाले मार्ग पर रहें और सेफसर्किल शेयरिंग सक्रिय रखें।';

      clusters.push({
        id: `cluster-${i + 1}`,
        center: [avgLat, avgLng],
        radiusMeters: Math.max(120, radiusMeters * 0.8),
        incidentCount: group.length,
        incidentIds: group.map((g) => g.id),
        severityLevel: maxSeverity >= 4 ? 'danger' : maxSeverity >= 3 ? 'caution' : 'safe',
        primaryCategory,
        timePattern,
        timePatternHi,
        mitigationRecommendation: mitigation,
        mitigationRecommendationHi: mitigationHi,
      });
    }
  }

  return clusters;
}
