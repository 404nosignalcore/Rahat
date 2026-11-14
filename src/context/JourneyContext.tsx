import React, { createContext, useContext, useEffect, useState } from 'react';
import { Journey, RouteOption, LatLng, RouteDeviationEvent } from '../types';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { checkRouteDeviation } from '../utils/geo';
import { dbService } from '../services/ServiceFactory';

interface JourneyContextType {
  activeJourney: Journey | null;
  selectedRoute: RouteOption | null;
  isJourneyActive: boolean;
  deviationAlertActive: boolean;
  currentDeviationDistance: number;
  startJourney: (route: RouteOption, originName: string, destName: string) => Promise<void>;
  pauseJourney: () => void;
  resumeJourney: () => void;
  endJourney: () => Promise<void>;
  setSelectedRoute: (route: RouteOption | null) => void;
  // Deviation actions
  dismissDeviationAsSafe: () => void;
  recalculateRoute: () => void;
  shareLocationWithCircle: () => Promise<void>;
  triggerSOSFromJourney: () => void;
}

const JourneyContext = createContext<JourneyContextType | undefined>(undefined);

export const JourneyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { location } = useLocation();
  const { user, securitySettings } = useAuth();

  const [activeJourney, setActiveJourney] = useState<Journey | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [deviationAlertActive, setDeviationAlertActive] = useState<boolean>(false);
  const [currentDeviationDistance, setCurrentDeviationDistance] = useState<number>(0);
  const [consecutiveDeviations, setConsecutiveDeviations] = useState<number>(0);
  const [safeSuppressionUntil, setSafeSuppressionUntil] = useState<number>(0);

  // Monitor location deviations when journey is active
  useEffect(() => {
    if (!activeJourney || activeJourney.status !== 'active') {
      return;
    }

    // Check if deviation alert is temporarily suppressed by user confirmation
    if (Date.now() < safeSuppressionUntil) {
      return;
    }

    const { isDeviated, distanceMeters } = checkRouteDeviation(
      location,
      activeJourney.selectedRoute.polyline,
      securitySettings.routeDeviationCorridorMeters
    );

    setCurrentDeviationDistance(distanceMeters);

    if (isDeviated) {
      setConsecutiveDeviations((prev) => {
        const next = prev + 1;
        // Require at least 2 consecutive deviated readings to prevent single GPS glitch false alarm
        if (next >= 2 && !deviationAlertActive) {
          setDeviationAlertActive(true);
          const devEvent: RouteDeviationEvent = {
            id: 'dev_' + Date.now(),
            timestamp: Date.now(),
            location,
            distanceFromPathMeters: distanceMeters,
            resolved: false,
          };
          setActiveJourney((j) => (j ? { ...j, status: 'deviated', deviationHistory: [...j.deviationHistory, devEvent] } : null));
        }
        return next;
      });
    } else {
      setConsecutiveDeviations(0);
      if (deviationAlertActive) {
        setDeviationAlertActive(false);
      }
    }
  }, [location, activeJourney, securitySettings.routeDeviationCorridorMeters, safeSuppressionUntil, deviationAlertActive]);

  const startJourney = async (route: RouteOption, originName: string, destName: string) => {
    if (!user) return;
    const newJourney: Journey = {
      id: 'journey_' + Date.now(),
      userId: user.uid,
      origin: location,
      originName,
      destination: route.polyline[route.polyline.length - 1],
      destinationName: destName,
      selectedRoute: route,
      status: 'active',
      startedAt: Date.now(),
      deviationHistory: [],
      isSharingWithCircle: true,
    };
    setActiveJourney(newJourney);
    setSelectedRoute(route);
    setDeviationAlertActive(false);
    setConsecutiveDeviations(0);
    await dbService.saveJourney(newJourney);
  };

  const pauseJourney = () => {
    if (activeJourney) {
      setActiveJourney({ ...activeJourney, status: 'paused' });
    }
  };

  const resumeJourney = () => {
    if (activeJourney) {
      setActiveJourney({ ...activeJourney, status: 'active' });
    }
  };

  const endJourney = async () => {
    if (activeJourney) {
      await dbService.updateJourneyStatus(activeJourney.id, 'completed');
      setActiveJourney(null);
      setDeviationAlertActive(false);
      setConsecutiveDeviations(0);
    }
  };

  const dismissDeviationAsSafe = () => {
    setDeviationAlertActive(false);
    setConsecutiveDeviations(0);
    // Suppress repeated alarms for 5 minutes
    setSafeSuppressionUntil(Date.now() + 5 * 60 * 1000);
    if (activeJourney) {
      setActiveJourney({ ...activeJourney, status: 'active' });
    }
  };

  const recalculateRoute = () => {
    if (activeJourney) {
      // Connect current deviated location as a new leg to the destination
      const remainingPolyline = [
        location,
        ...activeJourney.selectedRoute.polyline.slice(Math.floor(activeJourney.selectedRoute.polyline.length / 2)),
      ];
      const updatedRoute: RouteOption = {
        ...activeJourney.selectedRoute,
        id: 'route_recalc_' + Date.now(),
        title: 'Recalculated Safe Route',
        polyline: remainingPolyline,
      };
      setActiveJourney({
        ...activeJourney,
        selectedRoute: updatedRoute,
        status: 'active',
      });
      setSelectedRoute(updatedRoute);
      setDeviationAlertActive(false);
      setConsecutiveDeviations(0);
    }
  };

  const shareLocationWithCircle = async () => {
    if (user) {
      await dbService.updateLocationSharing(user.uid, true, location);
      setDeviationAlertActive(false);
    }
  };

  const triggerSOSFromJourney = () => {
    setDeviationAlertActive(false);
    if (activeJourney) {
      setActiveJourney({ ...activeJourney, status: 'sos_triggered' });
    }
  };

  return (
    <JourneyContext.Provider
      value={{
        activeJourney,
        selectedRoute,
        isJourneyActive: activeJourney !== null && activeJourney.status === 'active',
        deviationAlertActive,
        currentDeviationDistance,
        startJourney,
        pauseJourney,
        resumeJourney,
        endJourney,
        setSelectedRoute,
        dismissDeviationAsSafe,
        recalculateRoute,
        shareLocationWithCircle,
        triggerSOSFromJourney,
      }}
    >
      {children}
    </JourneyContext.Provider>
  );
};

export const useJourney = () => {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error('useJourney must be used within JourneyProvider');
  return ctx;
};

