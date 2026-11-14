import React, { createContext, useContext, useEffect, useState } from 'react';
import { LatLng } from '../types';
import { locationService } from '../services/ServiceFactory';

interface LocationContextType {
  location: LatLng;
  hasForegroundPermission: boolean;
  hasBackgroundPermission: boolean;
  isWatching: boolean;
  requestPermissions: () => Promise<void>;
  refreshLocation: () => Promise<void>;
  simulateMove: (offsetLat: number, offsetLng: number) => void;
}

const DEFAULT_COORDS: LatLng = { latitude: 28.6139, longitude: 77.209 };

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LatLng>(DEFAULT_COORDS);
  const [hasForegroundPermission, setHasForegroundPermission] = useState<boolean>(false);
  const [hasBackgroundPermission, setHasBackgroundPermission] = useState<boolean>(false);
  const [isWatching, setIsWatching] = useState<boolean>(false);

  useEffect(() => {
    let sub: any = null;

    const init = async () => {
      const perms = await locationService.requestPermissions();
      setHasForegroundPermission(perms.foreground);
      setHasBackgroundPermission(perms.background);

      const loc = await locationService.getCurrentLocation();
      setLocation(loc);

      sub = await locationService.watchLocation((newLoc) => {
        setLocation(newLoc);
      });
      setIsWatching(true);
    };

    init();

    return () => {
      if (sub && sub.remove) sub.remove();
    };
  }, []);

  const requestPermissions = async () => {
    const perms = await locationService.requestPermissions();
    setHasForegroundPermission(perms.foreground);
    setHasBackgroundPermission(perms.background);
  };

  const refreshLocation = async () => {
    const loc = await locationService.getCurrentLocation();
    setLocation(loc);
  };

  const simulateMove = (offsetLat: number, offsetLng: number) => {
    setLocation((prev) => ({
      latitude: prev.latitude + offsetLat,
      longitude: prev.longitude + offsetLng,
    }));
  };

  return (
    <LocationContext.Provider
      value={{
        location,
        hasForegroundPermission,
        hasBackgroundPermission,
        isWatching,
        requestPermissions,
        refreshLocation,
        simulateMove,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
};

