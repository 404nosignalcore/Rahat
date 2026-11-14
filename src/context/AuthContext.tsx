import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserSecuritySettings } from '../types';
import { authService } from '../services/ServiceFactory';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  securitySettings: UserSecuritySettings;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  signOut: () => Promise<void>;
  updateSecuritySettings: (settings: Partial<UserSecuritySettings>) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const DEFAULT_SECURITY_SETTINGS: UserSecuritySettings = {
  backgroundTrackingConsent: true,
  routeDeviationCorridorMeters: 75,
  deviationConfirmationTimeoutSeconds: 30,
  sosCountdownSeconds: 5,
  autoCallEmergencyOnSOS: true,
  preferredEmergencyNumber: '112',
  enableHaptics: true,
  offlineSMSFallback: true,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState<boolean>(true);
  const [securitySettings, setSecuritySettings] = useState<UserSecuritySettings>(DEFAULT_SECURITY_SETTINGS);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((newUser) => {
      setUser(newUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const u = await authService.signInWithEmail(email, pass);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string, phone: string) => {
    setLoading(true);
    try {
      const u = await authService.signUpWithEmail(email, pass, name, phone);
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const signInAnonymously = async () => {
    setLoading(true);
    try {
      const u = await authService.signInAnonymously();
      setUser(u);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await authService.signOut();
    setUser(null);
  };

  const updateSecuritySettings = (settings: Partial<UserSecuritySettings>) => {
    setSecuritySettings((prev) => ({ ...prev, ...settings }));
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    await authService.updateProfile(updates);
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        securitySettings,
        signInWithEmail,
        signUpWithEmail,
        signInAnonymously,
        signOut,
        updateSecuritySettings,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

