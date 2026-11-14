import {
  evaluateRouteDeviation,
  DEFAULT_DEVIATION_CONFIG,
  DeviationTrackerState,
} from './deviationEngine';
import {
  validateSafetyReportInput,
  validateEmergencyContactInput,
  canSubmitWithSpamCooldown,
} from './validation';

const SAMPLE_ROUTE: [number, number][] = [
  [28.6275, 77.2185],
  [28.6322, 77.2198],
  [28.6310, 77.2255],
];

const INITIAL_STATE: DeviationTrackerState = {
  consecutiveOffRouteCount: 0,
  lastAlertDismissedAtMs: null,
  alertActive: false,
  lastDistanceMeters: 0,
};

describe('deviationEngine', () => {
  test('single off-route sample does NOT trigger false-alarm deviation alert', () => {
    const res = evaluateRouteDeviation(INITIAL_STATE, {
      latitude: 28.6280,
      longitude: 77.2230, // ~300m away from route
      accuracyMeters: 15,
      timestampMs: 1000,
      plannedPath: SAMPLE_ROUTE,
    });

    expect(res.shouldPromptUser).toBe(false);
    expect(res.nextState.consecutiveOffRouteCount).toBe(1);
    expect(res.distanceMeters).toBeGreaterThan(90);
  });

  test('low-accuracy GPS spike is ignored to prevent false alarms', () => {
    const res = evaluateRouteDeviation(INITIAL_STATE, {
      latitude: 28.6280,
      longitude: 77.2230,
      accuracyMeters: 150, // exceeds 75m limit
      timestampMs: 1000,
      plannedPath: SAMPLE_ROUTE,
    });

    expect(res.ignoredDueToLowAccuracy).toBe(true);
    expect(res.shouldPromptUser).toBe(false);
    expect(res.nextState.consecutiveOffRouteCount).toBe(0);
  });

  test('triggers deviation prompt only after required consecutive off-route samples', () => {
    let state = INITIAL_STATE;

    for (let i = 1; i <= DEFAULT_DEVIATION_CONFIG.requiredConsecutiveSamples; i++) {
      const res = evaluateRouteDeviation(state, {
        latitude: 28.6250,
        longitude: 77.2250,
        accuracyMeters: 12,
        timestampMs: i * 5000,
        plannedPath: SAMPLE_ROUTE,
      });
      state = res.nextState;
      if (i < DEFAULT_DEVIATION_CONFIG.requiredConsecutiveSamples) {
        expect(res.shouldPromptUser).toBe(false);
      } else {
        expect(res.shouldPromptUser).toBe(true);
        expect(res.nextState.alertActive).toBe(true);
      }
    }
  });

  test('cooldown after user clicks I am Safe suppresses immediate re-alert', () => {
    const dismissedState: DeviationTrackerState = {
      consecutiveOffRouteCount: 0,
      lastAlertDismissedAtMs: 10_000,
      alertActive: false,
      lastDistanceMeters: 200,
    };

    const res = evaluateRouteDeviation(dismissedState, {
      latitude: 28.6250,
      longitude: 77.2250,
      accuracyMeters: 10,
      timestampMs: 30_000, // 20s < 120s cooldown
      plannedPath: SAMPLE_ROUTE,
    });

    expect(res.inCooldown).toBe(true);
    expect(res.shouldPromptUser).toBe(false);
  });

  test('input validation rejects short/empty report and invalid phone numbers', () => {
    expect(
      validateSafetyReportInput({ title: 'Hi', description: 'Too short', areaLabel: 'A' }).valid
    ).toBe(false);
    expect(
      validateSafetyReportInput({
        title: 'Broken streetlights near Janpath exit',
        description: 'Three lights out along the sidewalk after 9 PM.',
        areaLabel: 'Janpath Metro Exit',
      }).valid
    ).toBe(true);
    expect(
      validateEmergencyContactInput({ name: 'Mom', relationship: 'Mother', phone: '12' }).valid
    ).toBe(false);
    expect(
      validateEmergencyContactInput({ name: 'Mom', relationship: 'Mother', phone: '+91 9811012345' }).valid
    ).toBe(true);
    expect(canSubmitWithSpamCooldown(10_000, 15_000, 15_000).allowed).toBe(false);
    expect(canSubmitWithSpamCooldown(10_000, 30_000, 15_000).allowed).toBe(true);
  });
});
