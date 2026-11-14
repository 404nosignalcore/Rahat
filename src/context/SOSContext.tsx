import React, { createContext, useContext, useEffect, useState } from 'react';
import { SOSAlert, EmergencyContact } from '../types';
import { useLocation } from './LocationContext';
import { useAuth } from './AuthContext';
import { emergencyService, dbService } from '../services/ServiceFactory';

interface SOSContextType {
  isConfirmationVisible: boolean;
  isSOSActive: boolean;
  countdownSeconds: number;
  activeAlert: SOSAlert | null;
  openSOSConfirmation: () => void;
  cancelSOSConfirmation: () => void;
  activateSOSImmediate: () => Promise<void>;
  resolveSOS: () => Promise<void>;
  callEmergencyServices: () => Promise<void>;
  retrySMSDispatch: () => Promise<void>;
}

const SOSContext = createContext<SOSContextType | undefined>(undefined);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { location } = useLocation();
  const { user, securitySettings } = useAuth();

  const [isConfirmationVisible, setIsConfirmationVisible] = useState<boolean>(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(securitySettings.sosCountdownSeconds);
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [timerId, setTimerId] = useState<any>(null);

  // Countdown timer effect
  useEffect(() => {
    if (isConfirmationVisible) {
      setCountdownSeconds(securitySettings.sosCountdownSeconds);

      const id = setInterval(() => {
        setCountdownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(id);
            executeSOS();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimerId(id);

      return () => {
        clearInterval(id);
      };
    } else {
      if (timerId) clearInterval(timerId);
    }
  }, [isConfirmationVisible, securitySettings.sosCountdownSeconds]);

  const openSOSConfirmation = () => {
    setIsConfirmationVisible(true);
  };

  const cancelSOSConfirmation = () => {
    if (timerId) clearInterval(timerId);
    setIsConfirmationVisible(false);
  };

  const executeSOS = async () => {
    setIsConfirmationVisible(false);
    if (!user) return;

    try {
      const contacts: EmergencyContact[] = await dbService.getEmergencyContacts(user.uid);
      const alert = await emergencyService.triggerSOS(
        { uid: user.uid, name: user.name },
        location,
        contacts,
        securitySettings.preferredEmergencyNumber
      );
      await dbService.createSOSAlert(alert);
      setActiveAlert(alert);

      // Auto-prompt dialer if configured
      if (securitySettings.autoCallEmergencyOnSOS) {
        await emergencyService.dialEmergencyServices(securitySettings.preferredEmergencyNumber);
      }
    } catch (err) {
      console.error('[SOS] Execution error:', err);
    }
  };

  const activateSOSImmediate = async () => {
    if (timerId) clearInterval(timerId);
    await executeSOS();
  };

  const resolveSOS = async () => {
    if (activeAlert) {
      await emergencyService.resolveSOS(activeAlert.id);
      await dbService.resolveSOSAlert(activeAlert.id);
      setActiveAlert(null);
    }
  };

  const callEmergencyServices = async () => {
    await emergencyService.dialEmergencyServices(securitySettings.preferredEmergencyNumber);
  };

  const retrySMSDispatch = async () => {
    if (!user || !activeAlert) return;
    const contacts: EmergencyContact[] = await dbService.getEmergencyContacts(user.uid);
    await emergencyService.sendEmergencySMS(contacts, location, user.name);
  };

  return (
    <SOSContext.Provider
      value={{
        isConfirmationVisible,
        isSOSActive: activeAlert !== null,
        countdownSeconds,
        activeAlert,
        openSOSConfirmation,
        cancelSOSConfirmation,
        activateSOSImmediate,
        resolveSOS,
        callEmergencyServices,
        retrySMSDispatch,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
};

export const useSOS = () => {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error('useSOS must be used within SOSProvider');
  return ctx;
};

