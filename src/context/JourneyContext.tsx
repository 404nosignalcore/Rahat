import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { JourneySession, RouteOption } from '../types/safety';
import { PRESET_ROUTES } from '../data/mockSafetyData';
import {
  DEFAULT_DEVIATION_CONFIG,
  DeviationTrackerState,
  evaluateRouteDeviation,
} from '../utils/deviationEngine';
import { locationService } from '../services/locationAdapter';
import { LocationFix } from '../services/contracts';
import { routeService } from '../services/routeService';
import { saveJourneyDoc } from '../services/firebaseClient';
import { buildMapShareUrl } from '../services/alertService';
import { useAuth } from './AuthContext';

export interface ActiveJourneyCompat extends JourneySession {
  selectedRoute: RouteOption & {
    title?: string;
    distanceMeters?: number;
    durationSeconds?: number;
    polyline?: { latitude: number; longitude: number }[];
  };
  destinationName?: string;
}

export interface JourneyContextType {
  currentLocation: { lat: number; lng: number; accuracyMeters: number; source: 'gps' | 'fallback_demo' };
  setCurrentLocation: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number; accuracyMeters: number; source: 'gps' | 'fallback_demo' }>
  >;
  refreshLocation: () => Promise<LocationFix>;
  routes: any[];
  setRoutes: React.Dispatch<React.SetStateAction<any[]>>;
  selectedRoute: any;
  setSelectedRoute: (r: any) => void;
  searchRoutes: (origin: string, destination: string) => Promise<void>;
  journey: JourneySession;
  setJourney: React.Dispatch<React.SetStateAction<JourneySession>>;
  deviationAlertVisible: boolean;
  setDeviationAlertVisible: (visible: boolean) => void;
  startJourney: (routeOrCircleId?: any, originName?: string, destName?: string) => Promise<void>;
  pauseOrResumeJourney: () => Promise<void>;
  endJourney: () => Promise<void>;
  toggleJourneyShare: (circleId: string) => Promise<void>;
  simulateRouteDeviation: () => void;
  simulateGpsLoss: () => void;
  respondToDeviation: (
    action: 'im_safe' | 'recalculate' | 'share_location' | 'activate_sos',
    onSosTrigger?: () => void
  ) => Promise<void>;
  // Legacy compatibility helpers
  activeJourney: ActiveJourneyCompat | null;
  isJourneyActive: boolean;
  deviationAlertActive: boolean;
  currentDeviationDistance: number;
  pauseJourney: () => void;
  resumeJourney: () => void;
  dismissDeviationAsSafe: () => void;
  recalculateRoute: () => void;
  shareLocationWithCircle: () => Promise<void>;
  triggerSOSFromJourney: () => void;
}

export const JourneyContext = createContext<JourneyContextType | null>(null);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setStatusBanner } = useAuth();

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    accuracyMeters: number;
    source: 'gps' | 'fallback_demo';
  }>({
    lat: 28.6275,
    lng: 77.2185,
    accuracyMeters: 20,
    source: 'fallback_demo',
  });

  const [routes, setRoutes] = useState<RouteOption[]>(PRESET_ROUTES);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption>(PRESET_ROUTES[0]);
  const [journey, setJourney] = useState<JourneySession>({
    id: 'journey-preview',
    ownerUid: 'demo-user',
    originLabel: PRESET_ROUTES[0].originLabel,
    destinationLabel: PRESET_ROUTES[0].destinationLabel,
    routeId: PRESET_ROUTES[0].id,
    routeName: PRESET_ROUTES[0].name,
    status: 'idle',
    lastLatitude: 28.6275,
    lastLongitude: 77.2185,
    gpsSignalStatus: 'locked',
    networkOnline: true,
    deviationDetected: false,
    deviationMeters: 0,
    startedAt: new Date().toISOString(),
  });

  const journeyRef = useRef<JourneySession>(journey);
  useEffect(() => {
    journeyRef.current = journey;
  }, [journey]);

  const lastJourneySyncRef = useRef<number>(0);

  const deviationStateRef = useRef<DeviationTrackerState>({
    consecutiveOffRouteCount: 0,
    lastAlertDismissedAtMs: null,
    alertActive: false,
    lastDistanceMeters: 0,
  });
  const [deviationAlertVisible, setDeviationAlertVisible] = useState(false);
  const watchStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    locationService.getCurrentLocation().then((fix) => {
      setCurrentLocation({
        lat: fix.latitude,
        lng: fix.longitude,
        accuracyMeters: fix.accuracyMeters,
        source: fix.source,
      });
    });

    return () => {
      watchStopRef.current?.();
    };
  }, []);

  const refreshLocation = async (): Promise<LocationFix> => {
    try {
      await locationService.requestForegroundPermission();
      const fix = await locationService.getCurrentLocation();
      setCurrentLocation({
        lat: fix.latitude,
        lng: fix.longitude,
        accuracyMeters: fix.accuracyMeters,
        source: fix.source,
      });
      if (fix.source === 'gps') {
        setStatusBanner('Live GPS signal locked.');
      } else {
        setStatusBanner('GPS offline: using simulated fallback coordinates.');
      }
      return fix;
    } catch {
      setStatusBanner('Unable to acquire GPS fix.');
      return {
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        accuracyMeters: currentLocation.accuracyMeters,
        timestampMs: Date.now(),
        source: currentLocation.source,
      };
    }
  };

  const searchRoutes = async (origin: string, destination: string) => {
    const found = await routeService.findSaferRoutes(origin, destination, new Date().getHours());
    setRoutes(found);
    setSelectedRoute(found[0]);
  };

  const processLiveFix = (lat: number, lng: number, accuracyMeters: number) => {
    setCurrentLocation({ lat, lng, accuracyMeters, source: 'gps' });
    const evalResult = evaluateRouteDeviation(
      deviationStateRef.current,
      {
        latitude: lat,
        longitude: lng,
        accuracyMeters,
        timestampMs: Date.now(),
        plannedPath: selectedRoute.path,
      },
      DEFAULT_DEVIATION_CONFIG
    );
    deviationStateRef.current = evalResult.nextState;
    setDeviationAlertVisible(evalResult.shouldPromptUser);
    const updatedJourney: JourneySession = {
      ...journeyRef.current,
      lastLatitude: lat,
      lastLongitude: lng,
      gpsSignalStatus: accuracyMeters > 80 ? 'weak' : 'locked',
      deviationDetected: evalResult.shouldPromptUser,
      deviationMeters: evalResult.distanceMeters,
    };
    journeyRef.current = updatedJourney;
    setJourney(updatedJourney);

    const now = Date.now();
    if (
      user.isAuthenticated &&
      journeyRef.current.status === 'active' &&
      now - lastJourneySyncRef.current > 6000
    ) {
      lastJourneySyncRef.current = now;
      saveJourneyDoc(updatedJourney, false).catch((err) =>
        console.warn('[JourneyContext] Live journey Firestore sync skipped:', err)
      );
    }
  };

  const startJourney = async (routeOrCircleId?: any, originName?: string, destName?: string) => {
    if (!user.consents.locationConsent) {
      setStatusBanner('Enable Location Consent in Profile before starting live journey monitoring.');
      return;
    }
    deviationStateRef.current = {
      consecutiveOffRouteCount: 0,
      lastAlertDismissedAtMs: null,
      alertActive: false,
      lastDistanceMeters: 0,
    };
    setDeviationAlertVisible(false);

    let activeRoute = selectedRoute;
    let circleId: string | undefined = undefined;

    if (routeOrCircleId && typeof routeOrCircleId === 'object') {
      activeRoute = routeOrCircleId;
      setSelectedRoute(routeOrCircleId);
    } else if (typeof routeOrCircleId === 'string') {
      circleId = routeOrCircleId;
    }

    const startLat =
      typeof currentLocation.lat === 'number'
        ? currentLocation.lat
        : activeRoute?.path?.[0]?.[0] ?? 28.6275;
    const startLng =
      typeof currentLocation.lng === 'number'
        ? currentLocation.lng
        : activeRoute?.path?.[0]?.[1] ?? 77.2185;

    const newJourney: JourneySession = {
      id: `jrn-${Date.now()}`,
      ownerUid: user.uid,
      originLabel: originName || activeRoute.originLabel || 'Current Location',
      destinationLabel: destName || activeRoute.destinationLabel || 'Destination',
      destinationName: destName || activeRoute.destinationLabel || 'Destination',
      routeId: activeRoute.id,
      routeName: activeRoute.name || (activeRoute as any).title || 'Safe Corridor',
      selectedRoute: activeRoute,
      status: 'active',
      sharedWithCircleId: circleId,
      isSharingWithCircle: Boolean(circleId),
      lastLatitude: startLat,
      lastLongitude: startLng,
      gpsSignalStatus: 'locked',
      networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      deviationDetected: false,
      deviationMeters: 0,
      startedAt: new Date().toISOString(),
    };
    journeyRef.current = newJourney;
    setJourney(newJourney);

    watchStopRef.current?.();
    watchStopRef.current = locationService.watchLocation(
      (fix) => processLiveFix(fix.latitude, fix.longitude, fix.accuracyMeters),
      () => {
        setJourney((prev) => ({ ...prev, gpsSignalStatus: 'weak' }));
      }
    );

    if (user.isAuthenticated) {
      try {
        await saveJourneyDoc(newJourney, true);
      } catch (err) {
        console.warn('Journey Firestore save skipped:', err);
      }
    }
  };

  const pauseOrResumeJourney = async () => {
    const nextStatus = journey.status === 'paused' ? 'active' : 'paused';
    const updated = { ...journey, status: nextStatus } as JourneySession;
    setJourney(updated);
    if (user.isAuthenticated) {
      try {
        await saveJourneyDoc(updated, false);
      } catch {}
    }
  };

  const endJourney = async () => {
    watchStopRef.current?.();
    watchStopRef.current = null;
    setDeviationAlertVisible(false);
    const completed: JourneySession = { ...journey, status: 'completed', deviationDetected: false };
    setJourney(completed);
    if (user.isAuthenticated) {
      try {
        await saveJourneyDoc(completed, false);
      } catch {}
    }
    setStatusBanner('Journey ended safely. Live monitoring stopped.');
  };

  const toggleJourneyShare = async (circleId: string) => {
    const nextShare = journey.sharedWithCircleId === circleId ? undefined : circleId;
    const updated = { ...journey, sharedWithCircleId: nextShare };
    setJourney(updated);
    if (user.isAuthenticated && journey.status === 'active') {
      try {
        await saveJourneyDoc(updated, false);
      } catch {}
    }
  };

  const simulateRouteDeviation = () => {
    const offLat = 28.624;
    const offLng = 77.2265;
    for (let i = 0; i < DEFAULT_DEVIATION_CONFIG.requiredConsecutiveSamples; i++) {
      processLiveFix(offLat, offLng, 12);
    }
  };

  const simulateGpsLoss = () => {
    setJourney((prev) => ({
      ...prev,
      gpsSignalStatus: prev.gpsSignalStatus === 'lost' ? 'locked' : 'lost',
    }));
  };

  const respondToDeviation: JourneyContextType['respondToDeviation'] = async (action, onSosTrigger) => {
    if (action === 'im_safe') {
      deviationStateRef.current = {
        consecutiveOffRouteCount: 0,
        lastAlertDismissedAtMs: Date.now(),
        alertActive: false,
        lastDistanceMeters: 0,
      };
      setDeviationAlertVisible(false);
      setJourney((prev) => ({ ...prev, deviationDetected: false }));
      setStatusBanner("Marked 'I'm Safe'. Deviation alert silenced for 2 minutes.");
      return;
    }

    if (action === 'recalculate') {
      const recalculated = await routeService.recalculateFromPosition(
        currentLocation.lat,
        currentLocation.lng,
        journey.destinationLabel,
        new Date().getHours()
      );
      setRoutes((prev) => [recalculated, ...prev.slice(0, 2)]);
      setSelectedRoute(recalculated);
      deviationStateRef.current = {
        consecutiveOffRouteCount: 0,
        lastAlertDismissedAtMs: null,
        alertActive: false,
        lastDistanceMeters: 0,
      };
      setDeviationAlertVisible(false);
      setJourney((prev) => ({
        ...prev,
        routeId: recalculated.id,
        routeName: recalculated.name,
        deviationDetected: false,
        deviationMeters: 0,
      }));
      setStatusBanner('Route recalculated onto nearest illuminated main corridor.');
      return;
    }

    if (action === 'share_location') {
      const shareUrl = buildMapShareUrl(currentLocation.lat, currentLocation.lng);
      setJourney((prev) => ({ ...prev, sharedWithCircleId: 'circle-family' }));
      setStatusBanner(`Live location link prepared: ${shareUrl}`);
      return;
    }

    if (action === 'activate_sos') {
      setDeviationAlertVisible(false);
      if (onSosTrigger) onSosTrigger();
    }
  };

  return (
    <JourneyContext.Provider
      value={{
        currentLocation,
        setCurrentLocation,
        refreshLocation,
        routes,
        setRoutes,
        selectedRoute,
        setSelectedRoute,
        searchRoutes,
        journey,
        setJourney,
        deviationAlertVisible,
        setDeviationAlertVisible,
        startJourney,
        pauseOrResumeJourney,
        endJourney,
        toggleJourneyShare,
        simulateRouteDeviation,
        simulateGpsLoss,
        respondToDeviation,
        activeJourney: journey.status === 'active' || journey.status === 'paused'
          ? {
              ...journey,
              selectedRoute: {
                ...selectedRoute,
                title: (selectedRoute as any).title || selectedRoute.name,
                distanceMeters: (selectedRoute as any).distanceMeters || Math.round((selectedRoute.distanceKm || 0) * 1000),
                durationSeconds: (selectedRoute as any).durationSeconds || (selectedRoute.durationMins || 0) * 60,
                polyline:
                  (selectedRoute as any).polyline ||
                  selectedRoute.path?.map((p: any) => ({ latitude: p[0], longitude: p[1] })) ||
                  [],
              },
              destinationName: journey.destinationLabel,
            }
          : null,
        isJourneyActive: journey.status === 'active',
        deviationAlertActive: deviationAlertVisible,
        currentDeviationDistance: journey.deviationMeters,
        pauseJourney: () => {
          pauseOrResumeJourney();
        },
        resumeJourney: () => {
          pauseOrResumeJourney();
        },
        dismissDeviationAsSafe: () => {
          respondToDeviation('im_safe');
        },
        recalculateRoute: () => {
          respondToDeviation('recalculate');
        },
        shareLocationWithCircle: async () => {
          await respondToDeviation('share_location');
        },
        triggerSOSFromJourney: () => {
          respondToDeviation('activate_sos');
        },
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export function useJourney(): JourneyContextType {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used inside JourneyProvider');
  return ctx;
}
