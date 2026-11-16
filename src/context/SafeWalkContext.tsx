import React, { createContext, useContext, useState } from 'react';
import {
  AppLanguage,
  AppTab,
  CommunityPost,
  CommunityResponder,
  CommunitySosRequest,
  ConnectSubTab,
  ConsentSettings,
  EmergencyContact,
  IncidentCategory,
  IncidentReport,
  JourneySession,
  RiskZone,
  RouteOption,
  SafeCircleGroup,
  SafeHaven,
  SafeHeroOrganization,
  SosAlertRecord,
  UserProfile,
  WearableDeviceState,
} from '../types/safety';
import { ThemeMode, AppTheme } from '../theme/tokens';
import { LocationFix } from '../services/contracts';
import { AuthProvider, useAuth } from './AuthContext';
import { ReportsProvider, useReports } from './ReportsContext';
import { JourneyProvider, useJourney } from './JourneyContext';
import { SOSProvider, useSOS } from './SOSContext';

export interface SafeWalkContextValue {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  connectSubTab: ConnectSubTab;
  setConnectSubTab: (sub: ConnectSubTab) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  themeMode: ThemeMode;
  toggleTheme: () => void;
  theme: AppTheme;

  // Modals
  isSafeHeroesOpen: boolean;
  setIsSafeHeroesOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  // Auth & Profile
  user: UserProfile;
  firebaseStatus: 'connecting' | 'online' | 'offline';
  authBusy: boolean;
  statusBanner: string | null;
  clearStatusBanner: () => void;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  saveProfile: (displayName: string, phone: string, consents: ConsentSettings) => Promise<void>;
  deleteAccount: () => Promise<void>;

  // SafeZone
  timeHour: number;
  setTimeHour: (h: number) => void;
  zones: RiskZone[];
  selectedZone: RiskZone | null;
  setSelectedZone: (z: RiskZone | null) => void;
  reports: IncidentReport[];
  categoryFilter: IncidentCategory | 'all';
  setCategoryFilter: (cat: IncidentCategory | 'all') => void;
  submitSafetyReport: (input: {
    category: IncidentCategory;
    title: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    severity: 1 | 2 | 3 | 4 | 5;
  }) => Promise<{ ok: boolean; error?: string }>;
  corroborateReport: (reportId: string) => Promise<void>;
  flagReport: (reportId: string, kind: 'outdated' | 'abuse') => Promise<void>;
  addReportComment: (reportId: string, body: string) => Promise<{ ok: boolean; error?: string }>;

  // Route & Journey Monitoring
  currentLocation: { lat: number; lng: number; accuracyMeters: number; source: 'gps' | 'fallback_demo' };
  refreshLocation: () => Promise<LocationFix>;
  routes: RouteOption[];
  selectedRoute: RouteOption;
  setSelectedRoute: (r: RouteOption) => void;
  searchRoutes: (origin: string, destination: string) => Promise<void>;
  journey: JourneySession;
  deviationAlertVisible: boolean;
  startJourney: () => Promise<void>;
  pauseOrResumeJourney: () => Promise<void>;
  endJourney: () => Promise<void>;
  toggleJourneyShare: (circleId: string) => Promise<void>;
  simulateRouteDeviation: () => void;
  simulateGpsLoss: () => void;
  respondToDeviation: (action: 'im_safe' | 'recalculate' | 'share_location' | 'activate_sos') => Promise<void>;

  // SOS & Trusted Contacts
  contacts: EmergencyContact[];
  addOrUpdateContact: (contact: Omit<EmergencyContact, 'ownerUid'>) => Promise<{ ok: boolean; error?: string }>;
  removeContact: (contactId: string) => Promise<void>;
  verifyContact: (contactId: string) => Promise<void>;
  sosCountdownRemaining: number | null;
  activeSosAlert: SosAlertRecord | null;
  beginSosCountdown: () => void;
  cancelSosCountdown: () => void;
  triggerSosImmediately: (forceFallback?: boolean) => Promise<void>;
  resolveSosAlert: () => Promise<void>;

  // Community SOS Rescue Network
  activeCommunitySos: CommunitySosRequest | null;
  incomingRescueAlert: { request: CommunitySosRequest; responder: CommunityResponder } | null;
  activeResponderSession: { request: CommunitySosRequest; responder: CommunityResponder } | null;
  triggerCommunitySos: (
    category?: CommunitySosRequest['emergencyCategory'],
    description?: string
  ) => Promise<void>;
  cancelCommunitySos: (reason?: string) => Promise<void>;
  resolveCommunitySosRequest: () => Promise<void>;
  reportCommunityResponder: (responderId: string, concernDetails: string) => Promise<void>;
  simulateIncomingRescueAlert: () => void;
  acceptRescueRequest: () => void;
  declineRescueRequest: () => void;
  startResponderTravel: () => void;
  markResponderArrived: () => void;
  cancelResponderHelp: (reason?: string) => void;
  dismissResponderSession: () => void;

  // Connect
  safeCircles: SafeCircleGroup[];
  toggleCircleSharing: (circleId: string) => void;
  inviteCircleMember: (circleId: string, name: string, phone: string) => void;
  toggleMemberConsent: (circleId: string, memberId: string) => void;
  safeHavens: SafeHaven[];
  communityPosts: CommunityPost[];
  blockedAuthorUids: string[];
  createCommunityPost: (input: {
    coarseArea: string;
    topic: CommunityPost['topic'];
    body: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  addCommunityPostComment: (postId: string, body: string) => void;
  markPostHelpful: (postId: string) => void;
  flagOrBlockCommunityPost: (postId: string, authorUid: string, blockAuthor: boolean) => void;

  // SafeHeroes & Wearables
  safeHeroes: SafeHeroOrganization[];
  wearables: WearableDeviceState[];
  toggleWearableConnection: (deviceId: string) => void;
  triggerWearableSosTest: (deviceName: string) => void;
}

const SafeWalkContext = createContext<SafeWalkContextValue | null>(null);

const InnerSafeWalkBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('safezone');
  const [connectSubTab, setConnectSubTab] = useState<ConnectSubTab>('safecircle');

  const auth = useAuth();
  const reports = useReports();
  const journey = useJourney();
  const sos = useSOS();

  const combinedValue: SafeWalkContextValue = {
    activeTab,
    setActiveTab,
    connectSubTab,
    setConnectSubTab,
    // Auth & theme
    language: auth.language,
    setLanguage: auth.setLanguage,
    themeMode: auth.themeMode,
    toggleTheme: auth.toggleTheme,
    theme: auth.theme,
    isAuthModalOpen: auth.isAuthModalOpen,
    setIsAuthModalOpen: auth.setIsAuthModalOpen,
    user: auth.user,
    firebaseStatus: auth.firebaseStatus,
    authBusy: auth.authBusy,
    statusBanner: auth.statusBanner,
    clearStatusBanner: auth.clearStatusBanner,
    signInGoogle: auth.signInGoogle,
    signOut: auth.signOut,
    saveProfile: auth.saveProfile,
    deleteAccount: auth.deleteAccount,

    // SafeZone & Reports
    timeHour: reports.timeHour,
    setTimeHour: reports.setTimeHour,
    zones: reports.zones,
    selectedZone: reports.selectedZone,
    setSelectedZone: reports.setSelectedZone,
    reports: reports.reports,
    categoryFilter: reports.categoryFilter,
    setCategoryFilter: reports.setCategoryFilter,
    submitSafetyReport: reports.submitSafetyReport,
    corroborateReport: reports.corroborateReport,
    flagReport: reports.flagReport,
    addReportComment: reports.addReportComment,

    // Journey & Location
    currentLocation: journey.currentLocation,
    refreshLocation: journey.refreshLocation,
    routes: journey.routes,
    selectedRoute: journey.selectedRoute,
    setSelectedRoute: journey.setSelectedRoute,
    searchRoutes: journey.searchRoutes,
    journey: journey.journey,
    deviationAlertVisible: journey.deviationAlertVisible,
    startJourney: async () => {
      await journey.startJourney(sos.safeCircles[0]?.sharingEnabled ? sos.safeCircles[0].id : undefined);
    },
    pauseOrResumeJourney: journey.pauseOrResumeJourney,
    endJourney: journey.endJourney,
    toggleJourneyShare: journey.toggleJourneyShare,
    simulateRouteDeviation: journey.simulateRouteDeviation,
    simulateGpsLoss: journey.simulateGpsLoss,
    respondToDeviation: async (action) => {
      await journey.respondToDeviation(action, () => {
        setActiveTab('sos');
        sos.beginSosCountdown();
      });
    },

    // SOS & Contacts
    contacts: sos.contacts,
    addOrUpdateContact: sos.addOrUpdateContact,
    removeContact: sos.removeContact,
    verifyContact: sos.verifyContact,
    sosCountdownRemaining: sos.sosCountdownRemaining,
    activeSosAlert: sos.activeSosAlert,
    beginSosCountdown: sos.beginSosCountdown,
    cancelSosCountdown: sos.cancelSosCountdown,
    triggerSosImmediately: sos.triggerSosImmediately,
    resolveSosAlert: sos.resolveSosAlert,

    // Community SOS
    activeCommunitySos: sos.activeCommunitySos,
    incomingRescueAlert: sos.incomingRescueAlert,
    activeResponderSession: sos.activeResponderSession,
    triggerCommunitySos: sos.triggerCommunitySos,
    cancelCommunitySos: sos.cancelCommunitySos,
    resolveCommunitySosRequest: sos.resolveCommunitySosRequest,
    reportCommunityResponder: sos.reportCommunityResponder,
    simulateIncomingRescueAlert: sos.simulateIncomingRescueAlert,
    acceptRescueRequest: sos.acceptRescueRequest,
    declineRescueRequest: sos.declineRescueRequest,
    startResponderTravel: sos.startResponderTravel,
    markResponderArrived: sos.markResponderArrived,
    cancelResponderHelp: sos.cancelResponderHelp,
    dismissResponderSession: sos.dismissResponderSession,

    // Connect & Circles
    safeCircles: sos.safeCircles,
    toggleCircleSharing: sos.toggleCircleSharing,
    inviteCircleMember: sos.inviteCircleMember,
    toggleMemberConsent: sos.toggleMemberConsent,
    safeHavens: reports.safeHavens,
    communityPosts: reports.communityPosts,
    blockedAuthorUids: reports.blockedAuthorUids,
    createCommunityPost: reports.createCommunityPost,
    addCommunityPostComment: reports.addCommunityPostComment,
    markPostHelpful: reports.markPostHelpful,
    flagOrBlockCommunityPost: reports.flagOrBlockCommunityPost,

    // SafeHeroes & Wearables
    safeHeroes: sos.safeHeroes,
    isSafeHeroesOpen: sos.isSafeHeroesOpen,
    setIsSafeHeroesOpen: sos.setIsSafeHeroesOpen,
    wearables: sos.wearables,
    toggleWearableConnection: sos.toggleWearableConnection,
    triggerWearableSosTest: (deviceName) => {
      auth.setStatusBanner(`${deviceName} simulated discreet trigger -> Opening SOS confirmation.`);
      setActiveTab('sos');
      sos.beginSosCountdown();
    },
  };

  return <SafeWalkContext.Provider value={combinedValue}>{children}</SafeWalkContext.Provider>;
};

export const SafeWalkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <ReportsProvider>
        <JourneyProvider>
          <SOSProvider>
            <InnerSafeWalkBridge>{children}</InnerSafeWalkBridge>
          </SOSProvider>
        </JourneyProvider>
      </ReportsProvider>
    </AuthProvider>
  );
};

export function useSafeWalk() {
  const ctx = useContext(SafeWalkContext);
  if (!ctx) throw new Error('useSafeWalk must be used inside SafeWalkProvider / RahatProvider');
  return ctx;
}

export const useRahat = useSafeWalk;
export const RahatProvider = SafeWalkProvider;
export type RahatContextValue = SafeWalkContextValue;

// Export modular hooks directly from SafeWalkContext
export { useAuth } from './AuthContext';
export { useReports } from './ReportsContext';
export { useJourney } from './JourneyContext';
export { useSOS, useSos } from './SOSContext';
