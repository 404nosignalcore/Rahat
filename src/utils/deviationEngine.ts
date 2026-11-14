import { pointToPolylineMinDistanceMeters } from './safetyRiskEngine';

export interface DeviationConfig {
  /** Minimum distance off planned route before a sample counts as off-route */
  thresholdMeters: number;
  /** Number of consecutive off-route samples required to suppress GPS jitter false alarms */
  requiredConsecutiveSamples: number;
  /** Ignore samples whose GPS accuracy radius is coarser than this value */
  maxAcceptedGpsAccuracyMeters: number;
  /** Cooldown after user taps "I'm Safe" or dismisses alert */
  cooldownMs: number;
}

export const DEFAULT_DEVIATION_CONFIG: DeviationConfig = {
  thresholdMeters: 90,
  requiredConsecutiveSamples: 3,
  maxAcceptedGpsAccuracyMeters: 75,
  cooldownMs: 120_000,
};

export interface DeviationSampleInput {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestampMs: number;
  plannedPath: [number, number][];
}

export interface DeviationTrackerState {
  consecutiveOffRouteCount: number;
  lastAlertDismissedAtMs: number | null;
  alertActive: boolean;
  lastDistanceMeters: number;
}

export interface DeviationEvaluationResult {
  nextState: DeviationTrackerState;
  shouldPromptUser: boolean;
  ignoredDueToLowAccuracy: boolean;
  inCooldown: boolean;
  distanceMeters: number;
}

/**
 * Evaluates a live GPS sample against a planned route.
 * Designed specifically to prevent false alarms from GPS drift, and NEVER auto-triggers SOS.
 */
export function evaluateRouteDeviation(
  state: DeviationTrackerState,
  sample: DeviationSampleInput,
  config: DeviationConfig = DEFAULT_DEVIATION_CONFIG
): DeviationEvaluationResult {
  const distanceMeters = pointToPolylineMinDistanceMeters(
    [sample.latitude, sample.longitude],
    sample.plannedPath
  );

  // Ignore coarse/noisy GPS fixes to prevent false deviation alerts
  if (sample.accuracyMeters > config.maxAcceptedGpsAccuracyMeters) {
    return {
      nextState: { ...state, lastDistanceMeters: distanceMeters },
      shouldPromptUser: state.alertActive,
      ignoredDueToLowAccuracy: true,
      inCooldown: false,
      distanceMeters,
    };
  }

  const inCooldown =
    state.lastAlertDismissedAtMs !== null &&
    sample.timestampMs - state.lastAlertDismissedAtMs < config.cooldownMs;

  if (inCooldown) {
    return {
      nextState: {
        ...state,
        consecutiveOffRouteCount: 0,
        alertActive: false,
        lastDistanceMeters: distanceMeters,
      },
      shouldPromptUser: false,
      ignoredDueToLowAccuracy: false,
      inCooldown: true,
      distanceMeters,
    };
  }

  if (distanceMeters >= config.thresholdMeters) {
    const nextCount = state.consecutiveOffRouteCount + 1;
    const triggered = nextCount >= config.requiredConsecutiveSamples;
    return {
      nextState: {
        ...state,
        consecutiveOffRouteCount: nextCount,
        alertActive: state.alertActive || triggered,
        lastDistanceMeters: distanceMeters,
      },
      shouldPromptUser: state.alertActive || triggered,
      ignoredDueToLowAccuracy: false,
      inCooldown: false,
      distanceMeters,
    };
  }

  // Back on planned route -> reset consecutive counter
  return {
    nextState: {
      ...state,
      consecutiveOffRouteCount: 0,
      alertActive: false,
      lastDistanceMeters: distanceMeters,
    },
    shouldPromptUser: false,
    ignoredDueToLowAccuracy: false,
    inCooldown: false,
    distanceMeters,
  };
}
