import {
  getTimeOfDayModifier,
  getRiskCategory,
  calculateDynamicZoneScore,
  getDistanceMeters,
  formatDistance,
  clusterIncidentsGeospatially,
} from './safetyRiskEngine';

describe('safetyRiskEngine', () => {
  test('getTimeOfDayModifier drops significantly during late night hours', () => {
    expect(getTimeOfDayModifier(2)).toBe(-25);
    expect(getTimeOfDayModifier(23)).toBe(-25);
    expect(getTimeOfDayModifier(20)).toBe(-12);
    expect(getTimeOfDayModifier(14)).toBe(5);
  });

  test('getRiskCategory correctly classifies green, yellow and red ranges', () => {
    expect(getRiskCategory(85)).toBe('safe');
    expect(getRiskCategory(75)).toBe('safe');
    expect(getRiskCategory(74)).toBe('caution');
    expect(getRiskCategory(45)).toBe('caution');
    expect(getRiskCategory(44)).toBe('danger');
    expect(getRiskCategory(20)).toBe('danger');
  });

  test('calculateDynamicZoneScore penalizes dark lighting and incidents', () => {
    const result = calculateDynamicZoneScore(80, 2, 1, 20, 2);
    expect(result.level).toBe('danger');
    expect(result.score).toBeLessThan(45);
    expect(result.explanation.length).toBeGreaterThan(2);
  });

  test('calculateDynamicZoneScore elevates well-lit daytime sectors', () => {
    const result = calculateDynamicZoneScore(75, 13, 5, 85, 0);
    expect(result.level).toBe('safe');
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  test('getDistanceMeters calculates accurate approximate coordinates', () => {
    const dist = getDistanceMeters(28.6315, 77.2167, 28.6380, 77.2190);
    expect(dist).toBeGreaterThan(500);
    expect(dist).toBeLessThan(1200);
  });

  test('formatDistance handles meters and kilometers formatting', () => {
    expect(formatDistance(450)).toBe('450 m');
    expect(formatDistance(1500)).toBe('1.5 km');
  });

  test('clusterIncidentsGeospatially identifies proximate incident hotspots', () => {
    const mockReports = [
      { id: '1', latitude: 28.6255, longitude: 77.2290, severity: 4 as const, category: 'stalking' as const, timeHour: 22 },
      { id: '2', latitude: 28.6258, longitude: 77.2292, severity: 3 as const, category: 'poor_lighting' as const, timeHour: 23 },
      { id: '3', latitude: 28.6338, longitude: 77.2185, severity: 1 as const, category: 'verbal_abuse' as const, timeHour: 14 },
    ];
    const clusters = clusterIncidentsGeospatially(mockReports, 200);
    expect(clusters.length).toBe(1);
    expect(clusters[0].incidentCount).toBe(2);
    expect(clusters[0].severityLevel).toBe('danger');
  });
});
