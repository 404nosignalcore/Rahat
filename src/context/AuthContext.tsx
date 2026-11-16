import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppLanguage, ConsentSettings, UserProfile } from '../types/safety';
import { UserSecuritySettings } from '../types';
import { INITIAL_USER_PROFILE } from '../data/mockSafetyData';
import { ThemeMode, AppTheme, getTheme } from '../theme/tokens';
import {
  deleteAccountCascade,
  signInWithGooglePopup,
  signOutFirebase,
  subscribeToAuth,
  testFirestoreConnection,
  updateUserProfileAndConsents,
} from '../services/firebaseClient';

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

const DEFAULT_USER_AUTH_PROFILE: UserProfile & { name: string; photoURL?: string } = {
  ...INITIAL_USER_PROFILE,
  name: INITIAL_USER_PROFILE.displayName,
  photoURL: INITIAL_USER_PROFILE.photoUrl,
};

export interface AuthContextType {
  user: UserProfile & { name: string; photoURL?: string };
  setUser: React.Dispatch<React.SetStateAction<UserProfile & { name: string; photoURL?: string }>>;
  firebaseStatus: 'connecting' | 'online' | 'offline';
  setFirebaseStatus: React.Dispatch<React.SetStateAction<'connecting' | 'online' | 'offline'>>;
  authBusy: boolean;
  statusBanner: string | null;
  setStatusBanner: React.Dispatch<React.SetStateAction<string | null>>;
  clearStatusBanner: () => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  theme: AppTheme;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (displayName: string, phone: string, consents: ConsentSettings) => Promise<void>;
  deleteAccount: () => Promise<void>;
  // Legacy compatibility helpers
  loading: boolean;
  securitySettings: UserSecuritySettings;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, phone: string) => Promise<void>;
  signInAnonymously: () => Promise<void>;
  updateSecuritySettings: (settings: Partial<UserSecuritySettings>) => void;
  updateProfile: (updates: Partial<UserProfile> & { name?: string; photoURL?: string }) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile & { name: string; photoURL?: string }>({
    ...INITIAL_USER_PROFILE,
    name: INITIAL_USER_PROFILE.displayName,
    photoURL: INITIAL_USER_PROFILE.photoUrl,
  });
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [authBusy, setAuthBusy] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [securitySettings, setSecuritySettings] = useState<UserSecuritySettings>(DEFAULT_SECURITY_SETTINGS);

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', themeMode === 'dark');
    }
  }, [themeMode]);

  useEffect(() => {
    testFirestoreConnection().then((status) => setFirebaseStatus(status));

    const unsub = subscribeToAuth(async (fbUser) => {
      if (!fbUser) {
        setUser({
          ...INITIAL_USER_PROFILE,
          name: INITIAL_USER_PROFILE.displayName,
          photoURL: INITIAL_USER_PROFILE.photoUrl,
        });
        return;
      }
      setUser((prev) => ({
        ...prev,
        uid: fbUser.uid,
        email: fbUser.email || prev.email,
        displayName: fbUser.displayName || prev.displayName,
        name: fbUser.displayName || prev.displayName || 'User',
        photoUrl: fbUser.photoURL || undefined,
        photoURL: fbUser.photoURL || undefined,
        isAuthenticated: true,
        isDemoSession: false,
      }));
    });

    return () => {
      unsub();
    };
  }, []);

  const toggleTheme = () => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  const clearStatusBanner = () => setStatusBanner(null);

  const signInGoogle = async () => {
    setAuthBusy(true);
    try {
      await signInWithGooglePopup();
      setIsAuthModalOpen(false);
      setStatusBanner('Signed in with Google. Your profile, contacts, and reports sync to Cloud Firestore.');
    } catch (err) {
      setStatusBanner(err instanceof Error ? err.message : 'Google Sign-In could not complete.');
    } finally {
      setAuthBusy(false);
    }
  };

  const signOut = async () => {
    setAuthBusy(true);
    try {
      await signOutFirebase();
      setUser(DEFAULT_USER_AUTH_PROFILE);
      setStatusBanner('Signed out. Switched back to Demo Exploration mode.');
    } finally {
      setAuthBusy(false);
    }
  };

  const saveProfile = async (displayName: string, phone: string, consents: ConsentSettings) => {
    setUser((prev) => ({ ...prev, displayName, phone, consents }));
    if (user.isAuthenticated) {
      try {
        await updateUserProfileAndConsents({
          uid: user.uid,
          displayName,
          preferredLanguage: language,
          phone,
          consents,
        });
        setStatusBanner('Profile and privacy preferences saved to Cloud Firestore.');
      } catch (err) {
        setStatusBanner(err instanceof Error ? err.message : 'Could not update Firestore profile.');
      }
    } else {
      setStatusBanner('Preferences updated locally (Sign in to persist across devices).');
    }
  };

  const deleteAccount = async () => {
    if (user.isAuthenticated) {
      await deleteAccountCascade(user.uid);
    }
    setUser(DEFAULT_USER_AUTH_PROFILE);
    setStatusBanner('Account data deleted and session signed out.');
  };

  const signInWithEmail = async (_email: string, _pass: string) => {
    setAuthBusy(true);
    try {
      setUser((prev) => ({ ...prev, isAuthenticated: true, isDemoSession: false }));
    } finally {
      setAuthBusy(false);
    }
  };

  const signUpWithEmail = async (email: string, _pass: string, name: string, phone: string) => {
    setAuthBusy(true);
    try {
      setUser((prev) => ({
        ...prev,
        email,
        displayName: name,
        phone,
        isAuthenticated: true,
        isDemoSession: false,
      }));
    } finally {
      setAuthBusy(false);
    }
  };

  const signInAnonymously = async () => {
    setUser((prev) => ({ ...prev, isDemoSession: true }));
  };

  const updateSecuritySettings = (settings: Partial<UserSecuritySettings>) => {
    setSecuritySettings((prev) => ({ ...prev, ...settings }));
  };

  const updateProfile = async (updates: Partial<UserProfile> & { name?: string; photoURL?: string }) => {
    setUser((prev) => ({
      ...prev,
      ...updates,
      displayName: updates.displayName || updates.name || prev.displayName,
      name: updates.name || updates.displayName || prev.name,
      photoUrl: updates.photoUrl || updates.photoURL || prev.photoUrl,
      photoURL: updates.photoURL || updates.photoUrl || prev.photoURL,
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        firebaseStatus,
        setFirebaseStatus,
        authBusy,
        statusBanner,
        setStatusBanner,
        clearStatusBanner,
        language,
        setLanguage,
        themeMode,
        toggleTheme,
        theme,
        isAuthModalOpen,
        setIsAuthModalOpen,
        signInGoogle,
        signOut,
        saveProfile,
        deleteAccount,
        loading: authBusy,
        securitySettings,
        signInWithEmail,
        signUpWithEmail,
        signInAnonymously,
        updateSecuritySettings,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
