import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
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
  ReportVerificationStatus,
  RiskZone,
  RouteOption,
  SafeCircleGroup,
  SafeHaven,
  SafeHeroOrganization,
  SosAlertRecord,
  UserProfile,
  WearableDeviceState,
} from '../types/safety';
import {
  INITIAL_COMMUNITY_POSTS,
  INITIAL_EMERGENCY_CONTACTS,
  INITIAL_INCIDENT_REPORTS,
  INITIAL_RISK_ZONES,
  INITIAL_SAFE_CIRCLES,
  INITIAL_SAFE_HAVENS,
  INITIAL_USER_PROFILE,
  INITIAL_WEARABLES,
  PRESET_ROUTES,
  SAFE_HEROES_DIRECTORY,
} from '../data/mockSafetyData';
import { ThemeMode, AppTheme, getTheme } from '../theme/tokens';
import { calculateDynamicZoneScore } from '../utils/safetyRiskEngine';
import {
  DEFAULT_DEVIATION_CONFIG,
  DeviationTrackerState,
  evaluateRouteDeviation,
} from '../utils/deviationEngine';
import { canSubmitWithSpamCooldown } from '../utils/validation';
import { locationService } from '../services/locationAdapter';
import { LocationFix } from '../services/contracts';
import { routeService } from '../services/routeService';
import { alertService, buildMapShareUrl, sendNativeEmergencySms } from '../services/alertService';
import {
  acceptCommunitySosResponse,
  cancelCommunitySosByVictim,
  cancelResponderAssistance,
  createCommunitySosRequest,
  expandProximityWave,
  getAvailableCommunityCandidates,
  isCommunitySimulationEnabled,
  reportSuspiciousResponder,
  resolveCommunitySos,
  setResponderArrived,
  setResponderOnTheWay,
} from '../services/communitySosService';
import {
  addSafetyReportCommentDoc,
  createCommunityPostDoc,
  createSafeCircleDoc,
  createSafetyReportDoc,
  deleteAccountCascade,
  deleteEmergencyContactDoc,
  fetchSafetyReports,
  incrementReportCounterDoc,
  loadUserPrivateAndContacts,
  saveEmergencyAlertDoc,
  saveEmergencyContactDoc,
  saveJourneyDoc,
  signInWithGooglePopup,
  signOutFirebase,
  subscribeToAuth,
  testFirestoreConnection,
  updateUserProfileAndConsents,
} from '../services/firebaseClient';

interface SafeWalkContextValue {
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

  // Community SOS Rescue Network (Atomic 3-Responder System)
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

  // Connect (SafeCircle, Nearby Help, Community)
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

export const SafeWalkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<AppTab>('safezone');
  const [connectSubTab, setConnectSubTab] = useState<ConnectSubTab>('safecircle');
  const [language, setLanguage] = useState<AppLanguage>('en');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const theme = useMemo(() => getTheme(themeMode), [themeMode]);

  const [isSafeHeroesOpen, setIsSafeHeroesOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [user, setUser] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [firebaseStatus, setFirebaseStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');
  const [authBusy, setAuthBusy] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const [timeHour, setTimeHour] = useState<number>(21);
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_INCIDENT_REPORTS);
  const [categoryFilter, setCategoryFilter] = useState<IncidentCategory | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<RiskZone | null>(INITIAL_RISK_ZONES[0]);

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

  const deviationStateRef = useRef<DeviationTrackerState>({
    consecutiveOffRouteCount: 0,
    lastAlertDismissedAtMs: null,
    alertActive: false,
    lastDistanceMeters: 0,
  });
  const [deviationAlertVisible, setDeviationAlertVisible] = useState(false);

  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_EMERGENCY_CONTACTS);
  const [sosCountdownRemaining, setSosCountdownRemaining] = useState<number | null>(null);
  const [activeSosAlert, setActiveSosAlert] = useState<SosAlertRecord | null>(null);

  // Community SOS State
  const [activeCommunitySos, setActiveCommunitySos] = useState<CommunitySosRequest | null>(null);
  const [incomingRescueAlert, setIncomingRescueAlert] = useState<{
    request: CommunitySosRequest;
    responder: CommunityResponder;
  } | null>(null);
  const [activeResponderSession, setActiveResponderSession] = useState<{
    request: CommunitySosRequest;
    responder: CommunityResponder;
  } | null>(null);
  const communityTimeoutsRef = useRef<any[]>([]);

  const clearCommunityTimeouts = () => {
    communityTimeoutsRef.current.forEach((t) => clearTimeout(t));
    communityTimeoutsRef.current = [];
  };

  useEffect(() => {
    return () => {
      clearCommunityTimeouts();
    };
  }, []);

  const [safeCircles, setSafeCircles] = useState<SafeCircleGroup[]>(INITIAL_SAFE_CIRCLES);
  const [safeHavens] = useState<SafeHaven[]>(INITIAL_SAFE_HAVENS);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(INITIAL_COMMUNITY_POSTS);
  const [blockedAuthorUids, setBlockedAuthorUids] = useState<string[]>([]);
  const [wearables, setWearables] = useState<WearableDeviceState[]>(INITIAL_WEARABLES);

  const lastPostTimestampRef = useRef<number | null>(null);
  const watchStopRef = useRef<(() => void) | null>(null);

  // Sync HTML class for Tailwind/web dark mode consistency
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', themeMode === 'dark');
    }
  }, [themeMode]);

  // Boot Firestore connectivity check + Auth subscription
  useEffect(() => {
    testFirestoreConnection().then((status) => setFirebaseStatus(status));

    locationService.getCurrentLocation().then((fix) => {
      setCurrentLocation({
        lat: fix.latitude,
        lng: fix.longitude,
        accuracyMeters: fix.accuracyMeters,
        source: fix.source,
      });
    });

    const unsub = subscribeToAuth(async (fbUser) => {
      if (!fbUser) {
        setUser(INITIAL_USER_PROFILE);
        return;
      }
      setUser((prev) => ({
        ...prev,
        uid: fbUser.uid,
        email: fbUser.email || prev.email,
        displayName: fbUser.displayName || prev.displayName,
        photoUrl: fbUser.photoURL || undefined,
        isAuthenticated: true,
        isDemoSession: false,
      }));
      try {
        const bundle = await loadUserPrivateAndContacts(fbUser.uid);
        setUser((prev) => ({
          ...prev,
          phone: bundle.phone ?? prev.phone,
          consents: bundle.consents ?? prev.consents,
        }));
        if (bundle.contacts.length > 0) {
          setContacts(bundle.contacts);
        }
        const remoteReports = await fetchSafetyReports();
        if (remoteReports.length > 0) {
          setReports((prev) => {
            const syntheticSeed = prev.filter((r) => r.isSynthetic);
            return [...remoteReports, ...syntheticSeed];
          });
        }
      } catch (err) {
        console.warn('Firestore sync partial fallback:', err);
      }
    });

    return () => {
      unsub();
      watchStopRef.current?.();
    };
  }, []);

  // SOS Countdown timer
  useEffect(() => {
    if (sosCountdownRemaining === null) return;
    if (sosCountdownRemaining <= 0) {
      setSosCountdownRemaining(null);
      triggerSosImmediately(true);
      return;
    }
    const timer = setTimeout(() => {
      setSosCountdownRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [sosCountdownRemaining]);

  const zones: RiskZone[] = useMemo(() => {
    return INITIAL_RISK_ZONES.map((zone) => {
      const nearbyCount = reports.filter(
        (r) =>
          Math.abs(r.latitude - zone.center[0]) < 0.005 &&
          Math.abs(r.longitude - zone.center[1]) < 0.005
      ).length;
      const calc = calculateDynamicZoneScore(
        zone.safetyScore,
        timeHour,
        zone.lightingRating,
        zone.cctvCoverage,
        nearbyCount
      );
      return {
        ...zone,
        safetyScore: calc.score,
        level: calc.level,
      };
    });
  }, [reports, timeHour]);

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
      setUser(INITIAL_USER_PROFILE);
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
    setContacts([]);
    setUser(INITIAL_USER_PROFILE);
    setStatusBanner('Account data deleted and session signed out.');
  };

  const submitSafetyReport: SafeWalkContextValue['submitSafetyReport'] = async (input) => {
    const cooldown = canSubmitWithSpamCooldown(lastPostTimestampRef.current, Date.now(), 10_000);
    if (!cooldown.allowed) {
      return { ok: false, error: `Please wait ${cooldown.waitSeconds}s before submitting another report.` };
    }
    const id = `rep-${Date.now()}`;
    const newReport: IncidentReport = {
      id,
      authorUid: user.uid,
      category: input.category,
      title: input.title.trim(),
      description: input.description.trim(),
      address: input.address.trim(),
      latitude: input.latitude,
      longitude: input.longitude,
      timestamp: new Date().toISOString(),
      timeHour: new Date().getHours(),
      lightingCondition: 'dim',
      severity: input.severity,
      verificationStatus: 'unverified',
      corroborationCount: 0,
      outdatedFlags: 0,
      abuseFlags: 0,
      isSynthetic: !user.isAuthenticated,
      comments: [],
    };
    setReports((prev) => [newReport, ...prev]);
    lastPostTimestampRef.current = Date.now();

    if (user.isAuthenticated) {
      try {
        await createSafetyReportDoc(newReport, user.uid);
      } catch (err) {
        console.warn('Firestore report write failed:', err);
      }
    }
    return { ok: true };
  };

  const corroborateReport = async (reportId: string) => {
    let nextCount = 1;
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        nextCount = r.corroborationCount + 1;
        const nextStatus: ReportVerificationStatus =
          r.verificationStatus === 'authorized_verified'
            ? 'authorized_verified'
            : nextCount >= 3
            ? 'community_corroborated'
            : 'under_review';
        return { ...r, corroborationCount: nextCount, verificationStatus: nextStatus };
      })
    );
    if (user.isAuthenticated) {
      try {
        await incrementReportCounterDoc(reportId, 'corroborationCount', nextCount);
      } catch (err) {
        console.warn('Corroborate update skipped:', err);
      }
    }
  };

  const flagReport = async (reportId: string, kind: 'outdated' | 'abuse') => {
    let nextCount = 1;
    setReports((prev) =>
      prev.map((r) => {
        if (r.id !== reportId) return r;
        nextCount = (kind === 'outdated' ? r.outdatedFlags : r.abuseFlags) + 1;
        return kind === 'outdated'
          ? { ...r, outdatedFlags: nextCount }
          : { ...r, abuseFlags: nextCount };
      })
    );
    if (user.isAuthenticated) {
      try {
        await incrementReportCounterDoc(
          reportId,
          kind === 'outdated' ? 'outdatedFlags' : 'abuseFlags',
          nextCount
        );
      } catch (err) {
        console.warn('Flag update skipped:', err);
      }
    }
  };

  const addReportComment: SafeWalkContextValue['addReportComment'] = async (reportId, body) => {
    const trimmed = body.trim();
    if (trimmed.length < 2) {
      return { ok: false, error: 'Comment must be at least 2 characters.' };
    }
    const comment = {
      id: `cmt-${Date.now()}`,
      reportId,
      authorUid: user.uid,
      authorDisplay: user.displayName || 'Community Member',
      body: trimmed,
      flaggedAbuse: false,
      createdAt: new Date().toISOString(),
    };
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, comments: [...(r.comments || []), comment] } : r))
    );
    if (user.isAuthenticated) {
      try {
        await addSafetyReportCommentDoc(comment);
      } catch (err) {
        console.warn('Comment write skipped:', err);
      }
    }
    return { ok: true };
  };

  const searchRoutes = async (origin: string, destination: string) => {
    const found = await routeService.findSaferRoutes(origin, destination, timeHour);
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
    setJourney((prev) => ({
      ...prev,
      lastLatitude: lat,
      lastLongitude: lng,
      gpsSignalStatus: accuracyMeters > 80 ? 'weak' : 'locked',
      deviationDetected: evalResult.shouldPromptUser,
      deviationMeters: evalResult.distanceMeters,
    }));
  };

  const startJourney = async () => {
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

    const newJourney: JourneySession = {
      id: `jrn-${Date.now()}`,
      ownerUid: user.uid,
      originLabel: selectedRoute.originLabel,
      destinationLabel: selectedRoute.destinationLabel,
      routeId: selectedRoute.id,
      routeName: selectedRoute.name,
      status: 'active',
      sharedWithCircleId: safeCircles[0]?.sharingEnabled ? safeCircles[0].id : undefined,
      lastLatitude: selectedRoute.path[0][0],
      lastLongitude: selectedRoute.path[0][1],
      gpsSignalStatus: 'locked',
      networkOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      deviationDetected: false,
      deviationMeters: 0,
      startedAt: new Date().toISOString(),
    };
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
    // Feed 3 consecutive clean off-route fixes so the real anti-false-alarm engine triggers
    const offLat = 28.6240;
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

  const respondToDeviation: SafeWalkContextValue['respondToDeviation'] = async (action) => {
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
        timeHour
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
      setJourney((prev) => ({ ...prev, sharedWithCircleId: safeCircles[0]?.id || 'circle-family' }));
      setStatusBanner(`Live location link prepared for SafeCircle: ${shareUrl}`);
      return;
    }

    if (action === 'activate_sos') {
      setDeviationAlertVisible(false);
      setActiveTab('sos');
      beginSosCountdown();
    }
  };

  const addOrUpdateContact: SafeWalkContextValue['addOrUpdateContact'] = async (contactInput) => {
    const contact: EmergencyContact = {
      ...contactInput,
      ownerUid: user.uid,
    };
    setContacts((prev) => {
      const exists = prev.some((c) => c.id === contact.id);
      return exists ? prev.map((c) => (c.id === contact.id ? contact : c)) : [...prev, contact];
    });
    if (user.isAuthenticated) {
      try {
        await saveEmergencyContactDoc(contact);
      } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : 'Failed to save contact.' };
      }
    }
    return { ok: true };
  };

  const removeContact = async (contactId: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    if (user.isAuthenticated) {
      try {
        await deleteEmergencyContactDoc(user.uid, contactId);
      } catch {}
    }
  };

  const verifyContact = async (contactId: string) => {
    let target: EmergencyContact | undefined;
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id !== contactId) return c;
        target = { ...c, verificationStatus: 'verified' };
        return target;
      })
    );
    if (user.isAuthenticated && target) {
      try {
        await saveEmergencyContactDoc(target);
      } catch {}
    }
  };

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

  const beginSosCountdown = async () => {
    if (currentLocation.source === 'fallback_demo') {
      try {
        const fresh = await locationService.getCurrentLocation();
        if (fresh.source === 'gps') {
          setCurrentLocation({
            lat: fresh.latitude,
            lng: fresh.longitude,
            accuracyMeters: fresh.accuracyMeters,
            source: 'gps',
          });
          setSosCountdownRemaining(user.consents.sosCountdownSeconds || 5);
          return;
        }
      } catch {}

      Alert.alert(
        '⚠️ GPS Unavailable: Demo Coordinates Active',
        'Device cannot acquire a live GPS signal. Starting SOS now will broadcast simulated demo coordinates (Connaught Place, New Delhi). Your emergency contacts will NOT receive your actual location.\n\nPlease enable location services or confirm if you wish to proceed with an unverified location disclaimer.',
        [
          {
            text: 'Cancel SOS',
            style: 'cancel',
            onPress: () => {
              setStatusBanner('SOS aborted: Live GPS signal required for accurate emergency dispatch.');
            },
          },
          {
            text: 'Retry GPS',
            onPress: async () => {
              const fix = await refreshLocation();
              if (fix.source === 'gps') {
                setSosCountdownRemaining(user.consents.sosCountdownSeconds || 5);
              } else {
                Alert.alert(
                  'GPS Still Unavailable',
                  'Please grant location permissions in device settings and ensure GPS hardware is active.'
                );
              }
            },
          },
          {
            text: 'Send with Warning',
            style: 'destructive',
            onPress: () => {
              setSosCountdownRemaining(user.consents.sosCountdownSeconds || 5);
              setStatusBanner('⚠️ SOS countdown active with UNVERIFIED location warning.');
            },
          },
        ]
      );
      return;
    }

    setSosCountdownRemaining(user.consents.sosCountdownSeconds || 5);
  };

  const cancelSosCountdown = () => {
    setSosCountdownRemaining(null);
    setStatusBanner('SOS countdown cancelled safely.');
  };

  const triggerSosImmediately = async (forceFallback = false) => {
    let loc = currentLocation;

    if (loc.source === 'fallback_demo' && !forceFallback) {
      try {
        const fresh = await locationService.getCurrentLocation();
        if (fresh.source === 'gps') {
          loc = {
            lat: fresh.latitude,
            lng: fresh.longitude,
            accuracyMeters: fresh.accuracyMeters,
            source: 'gps',
          };
          setCurrentLocation(loc);
        }
      } catch {}
    }

    if (loc.source === 'fallback_demo' && !forceFallback) {
      setSosCountdownRemaining(null);
      Alert.alert(
        '⚠️ GPS Unavailable: Refusing Unverified SOS',
        'Your live GPS location could not be determined. Triggering SOS without GPS sends hardcoded demo coordinates that could mislead responders.\n\nDo you want to broadcast anyway with an explicit UNVERIFIED LOCATION warning, or cancel?',
        [
          {
            text: 'Cancel SOS',
            style: 'cancel',
            onPress: () => {
              setStatusBanner('SOS cancelled: GPS unavailable.');
            },
          },
          {
            text: 'Broadcast with Warning',
            style: 'destructive',
            onPress: () => {
              triggerSosImmediately(true);
            },
          },
        ]
      );
      return;
    }

    setSosCountdownRemaining(null);
    const alertRecord = await alertService.dispatchEmergencyAlert({
      ownerUid: user.uid,
      latitude: loc.lat,
      longitude: loc.lng,
      contacts,
      locationSource: loc.source,
      isFallbackLocation: loc.source === 'fallback_demo',
    });
    setActiveSosAlert(alertRecord);

    // If cloud gateway is unconfigured or offline fallback, actively dispatch native SMS via expo-sms
    if (
      alertRecord.deliveryChannelStatus === 'offline_fallback' ||
      alertRecord.deliveryChannelStatus === 'failed'
    ) {
      try {
        await sendNativeEmergencySms(contacts, loc.lat, loc.lng, loc.source);
      } catch (smsErr) {
        console.warn('[SafeWalkContext] Automatic native SMS fallback failed:', smsErr);
      }
    }

    if (loc.source === 'fallback_demo') {
      setStatusBanner('⚠️ SOS Alert dispatched with UNVERIFIED location warning (GPS offline).');
    } else {
      setStatusBanner('Emergency SOS Alert dispatched with live GPS location.');
    }
    if (user.isAuthenticated) {
      try {
        await saveEmergencyAlertDoc(alertRecord, true);
      } catch {}
    }
  };

  const resolveSosAlert = async () => {
    if (!activeSosAlert) return;
    const resolved: SosAlertRecord = { ...activeSosAlert, status: 'resolved' };
    setActiveSosAlert(null);
    if (user.isAuthenticated) {
      try {
        await saveEmergencyAlertDoc(resolved, false);
      } catch {}
    }
    setStatusBanner('Emergency alert marked resolved.');
  };

  // --- Community SOS Rescue Network Handlers ---
  const triggerCommunitySos: SafeWalkContextValue['triggerCommunitySos'] = async (
    category = 'personal_safety',
    description = 'Need immediate physical presence and support from nearby people.'
  ) => {
    clearCommunityTimeouts();

    let loc = currentLocation;
    let fallbackWarningNote = '';

    if (loc.source === 'fallback_demo') {
      try {
        const fresh = await locationService.getCurrentLocation();
        if (fresh.source === 'gps') {
          loc = {
            lat: fresh.latitude,
            lng: fresh.longitude,
            accuracyMeters: fresh.accuracyMeters,
            source: 'gps',
          };
          setCurrentLocation(loc);
        } else {
          fallbackWarningNote = '[UNVERIFIED LOCATION - GPS OFFLINE] ';
        }
      } catch {
        fallbackWarningNote = '[UNVERIFIED LOCATION - GPS OFFLINE] ';
      }
    }

    const victimName = user.displayName || 'SafeWalk Member';
    const victimPhone = (user.phone || '').trim();
    const victimUid = user.uid || 'usr-local';

    if (!victimPhone) {
      Alert.alert(
        'Phone Number Recommended',
        'You have not added a contact phone number to your profile. Community responders will not be able to call you directly to verify your status or coordinate.'
      );
    }

    const currentReq = createCommunitySosRequest(
      { uid: victimUid, name: victimName, phone: victimPhone },
      { lat: loc.lat, lng: loc.lng },
      category,
      `${fallbackWarningNote}${description}`
    );

    setActiveCommunitySos(currentReq);

    // DEV SIMULATION ONLY: Never fabricate responders in production!
    if (isCommunitySimulationEnabled()) {
      setStatusBanner(`[DEV SIMULATION] Community SOS active (ID: ${currentReq.id}) with simulated responders.`);

      const candidates = getAvailableCommunityCandidates(currentLocation.lat, currentLocation.lng, true);
      if (candidates.length > 0) {
        // Wave 1: First responder accepts at ~2.5s
        const t1 = setTimeout(() => {
          setActiveCommunitySos((prev) => {
            if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
            const res = acceptCommunitySosResponse(prev, candidates[0]);
            return res.ok ? res.request : prev;
          });
        }, 2500);
        communityTimeoutsRef.current.push(t1);

        // Wave 1: Second responder accepts at ~5.0s
        if (candidates.length > 1) {
          const t2 = setTimeout(() => {
            setActiveCommunitySos((prev) => {
              if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
              const res = acceptCommunitySosResponse(prev, candidates[1]);
              return res.ok ? res.request : prev;
            });
          }, 5000);
          communityTimeoutsRef.current.push(t2);
        }

        // Wave expansion at ~7s (Wave 2: 1000m)
        const tWave = setTimeout(() => {
          setActiveCommunitySos((prev) => {
            if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
            return expandProximityWave(prev);
          });
        }, 7000);
        communityTimeoutsRef.current.push(tWave);

        // Wave 2: Third responder accepts at ~8.5s
        if (candidates.length > 2) {
          const t3 = setTimeout(() => {
            setActiveCommunitySos((prev) => {
              if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
              const res = acceptCommunitySosResponse(prev, candidates[2]);
              return res.ok ? res.request : prev;
            });
          }, 8500);
          communityTimeoutsRef.current.push(t3);
        }

        // Travel simulation at ~12s
        const t4 = setTimeout(() => {
          setActiveCommunitySos((prev) => {
            if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
            return setResponderOnTheWay(prev, candidates[0].id);
          });
        }, 12000);
        communityTimeoutsRef.current.push(t4);
      }
    } else {
      // Production mode: Real broadcast to community network, no fake auto-accept bots
      if (loc.source === 'fallback_demo') {
        setStatusBanner(`⚠️ Community SOS active with UNVERIFIED coordinates (GPS offline). Alerting nearby network...`);
      } else {
        setStatusBanner(`Community SOS broadcast active (ID: ${currentReq.id}). Broadcasting to nearby verified members...`);
      }
    }
  };

  const cancelCommunitySos = async (reason = "I'm safe now.") => {
    clearCommunityTimeouts();
    setActiveCommunitySos((prev) => {
      if (!prev) return null;
      return cancelCommunitySosByVictim(prev, reason);
    });
    setStatusBanner('Community SOS cancelled. Responders stood down.');
  };

  const resolveCommunitySosRequest = async () => {
    clearCommunityTimeouts();
    setActiveCommunitySos((prev) => {
      if (!prev) return null;
      return resolveCommunitySos(prev);
    });
    setStatusBanner('Community emergency marked safely resolved.');
  };

  const reportCommunityResponder = async (responderId: string, concernDetails: string) => {
    setActiveCommunitySos((prev) => {
      if (!prev) return null;
      const updated = reportSuspiciousResponder(prev, responderId, concernDetails);

      // Rule: If one responder cancels, notify the next eligible nearby user to maintain 3 if possible
      const activeResponders = updated.responders.filter((r) => r.status !== 'cancelled');
      if (activeResponders.length < 3) {
        const candidates = getAvailableCommunityCandidates(currentLocation.lat, currentLocation.lng);
        const nextCandidate = candidates.find((c) => !updated.responders.some((r) => r.id === c.id));
        if (nextCandidate) {
          const timeout = setTimeout(() => {
            setActiveCommunitySos((curr) => {
              if (!curr || curr.isCancelled || curr.status === 'cancelled') return curr;
              const res = acceptCommunitySosResponse(curr, nextCandidate);
              return res.ok ? res.request : curr;
            });
          }, 3000);
          communityTimeoutsRef.current.push(timeout);
        }
      }
      return updated;
    });
    setStatusBanner('Security concern logged. Responder disengaged.');
  };

  const simulateIncomingRescueAlert = () => {
    if (!isCommunitySimulationEnabled()) {
      Alert.alert(
        'Simulation Disabled',
        'Incoming community rescue simulation is only available in development test mode.'
      );
      return;
    }

    const mockRequest = createCommunitySosRequest(
      { uid: 'usr-victim-ananya', name: 'Ananya Roy', phone: '+91 98765 43210' },
      { lat: currentLocation.lat + 0.0032, lng: currentLocation.lng - 0.0025 },
      'personal_safety',
      'Followed by an unknown individual along dark alley near Metro Exit 2. Need physical presence.'
    );

    const responderProfile: CommunityResponder = {
      id: user.uid || 'usr-current-hero',
      name: user.displayName || 'You',
      phone: user.phone || '+91 99999 00000',
      avatarColor: '#0066cc',
      isVerified: true,
      verificationBadge: 'Verified SafeWalk Community Hero',
      rating: 4.95,
      acceptedHelpsCount: 8,
      distanceMeters: 450,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
      status: 'notified',
      etaMinutes: 4,
    };

    setIncomingRescueAlert({
      request: mockRequest,
      responder: responderProfile,
    });
  };

  const acceptRescueRequest = () => {
    if (!incomingRescueAlert) return;
    const { request, responder } = incomingRescueAlert;
    const res = acceptCommunitySosResponse(request, responder);
    setIncomingRescueAlert(null);
    if (res.ok) {
      const activeResp = res.request.responders.find((r) => r.id === responder.id) || responder;
      setActiveResponderSession({
        request: res.request,
        responder: activeResp,
      });
      setStatusBanner('Emergency response accepted. Navigation route unlocked.');
    }
  };

  const declineRescueRequest = () => {
    setIncomingRescueAlert(null);
    setStatusBanner('Rescue alert declined.');
  };

  const startResponderTravel = () => {
    if (!activeResponderSession) return;
    const { request, responder } = activeResponderSession;
    const updatedReq = setResponderOnTheWay(request, responder.id);
    const updatedResp = updatedReq.responders.find((r) => r.id === responder.id) || {
      ...responder,
      status: 'on_the_way' as const,
    };
    setActiveResponderSession({
      request: updatedReq,
      responder: updatedResp,
    });
  };

  const markResponderArrived = () => {
    if (!activeResponderSession) return;
    const { request, responder } = activeResponderSession;
    const updatedReq = setResponderArrived(request, responder.id);
    const updatedResp = updatedReq.responders.find((r) => r.id === responder.id) || {
      ...responder,
      status: 'arrived' as const,
    };
    setActiveResponderSession({
      request: updatedReq,
      responder: updatedResp,
    });
    setStatusBanner('Arrival logged. Please verify identity calmly.');
  };

  const cancelResponderHelp = (reason = 'Responder had to disengage.') => {
    if (!activeResponderSession) return;
    const { request, responder } = activeResponderSession;
    cancelResponderAssistance(request, responder.id, reason);
    setActiveResponderSession(null);
    setStatusBanner('You disengaged from response. Next community member alerted.');
  };

  const dismissResponderSession = () => {
    setActiveResponderSession(null);
  };

  const toggleCircleSharing = (circleId: string) => {
    setSafeCircles((prev) =>
      prev.map((c) => (c.id === circleId ? { ...c, sharingEnabled: !c.sharingEnabled } : c))
    );
  };

  const inviteCircleMember = (circleId: string, name: string, phone: string) => {
    if (!name.trim()) return;
    setSafeCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? {
              ...c,
              members: [
                ...c.members,
                {
                  id: `mem-${Date.now()}`,
                  circleId,
                  circleOwnerUid: user.uid,
                  displayName: name.trim(),
                  phone: phone.trim(),
                  role: 'invited',
                  consentToShareLocation: false,
                  inviteStatus: 'pending',
                  lastSharedArea: 'Invite pending acceptance',
                },
              ],
            }
          : c
      )
    );
    if (user.isAuthenticated) {
      const target = safeCircles.find((c) => c.id === circleId);
      if (target) {
        createSafeCircleDoc(target).catch(() => {});
      }
    }
  };

  const toggleMemberConsent = (circleId: string, memberId: string) => {
    setSafeCircles((prev) =>
      prev.map((c) =>
        c.id === circleId
          ? {
              ...c,
              members: c.members.map((m) =>
                m.id === memberId
                  ? {
                      ...m,
                      consentToShareLocation: !m.consentToShareLocation,
                      inviteStatus: 'accepted',
                    }
                  : m
              ),
            }
          : c
      )
    );
  };

  const createCommunityPost: SafeWalkContextValue['createCommunityPost'] = async (input) => {
    const cooldown = canSubmitWithSpamCooldown(lastPostTimestampRef.current, Date.now(), 10_000);
    if (!cooldown.allowed) {
      return { ok: false, error: `Please wait ${cooldown.waitSeconds}s before posting again.` };
    }
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      authorUid: user.uid,
      authorDisplay: user.displayName || 'Community Member',
      coarseArea: input.coarseArea.trim(),
      topic: input.topic,
      body: input.body.trim(),
      helpfulCount: 0,
      abuseFlags: 0,
      createdAt: new Date().toISOString(),
      comments: [],
    };
    setCommunityPosts((prev) => [post, ...prev]);
    lastPostTimestampRef.current = Date.now();
    if (user.isAuthenticated) {
      try {
        await createCommunityPostDoc(post);
      } catch {}
    }
    return { ok: true };
  };

  const addCommunityPostComment = (postId: string, body: string) => {
    const trimmed = body.trim();
    if (trimmed.length < 2) return;
    setCommunityPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: `pc-${Date.now()}`,
                  authorDisplay: user.displayName || 'Member',
                  body: trimmed,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : p
      )
    );
  };

  const markPostHelpful = (postId: string) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, helpfulCount: p.helpfulCount + 1 } : p))
    );
  };

  const flagOrBlockCommunityPost = (postId: string, authorUid: string, blockAuthor: boolean) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, abuseFlags: p.abuseFlags + 1 } : p))
    );
    if (blockAuthor) {
      setBlockedAuthorUids((prev) => [...new Set([...prev, authorUid])]);
      setStatusBanner('Author blocked from your Safety Community feed.');
    } else {
      setStatusBanner('Post flagged for community moderation review.');
    }
  };

  const toggleWearableConnection = (deviceId: string) => {
    setWearables((prev) =>
      prev.map((w) =>
        w.id === deviceId
          ? {
              ...w,
              connectionStatus: w.connectionStatus === 'prototype_paired' ? 'standby' : 'prototype_paired',
              lastHeartbeatAt: 'Simulated BLE state updated just now',
            }
          : w
      )
    );
  };

  const triggerWearableSosTest = (deviceName: string) => {
    setStatusBanner(`${deviceName} simulated discreet trigger -> Opening SOS confirmation.`);
    setActiveTab('sos');
    beginSosCountdown();
  };

  return (
    <SafeWalkContext.Provider
      value={{
        activeTab,
        setActiveTab,
        connectSubTab,
        setConnectSubTab,
        language,
        setLanguage,
        themeMode,
        toggleTheme,
        theme,
        isSafeHeroesOpen,
        setIsSafeHeroesOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        user,
        firebaseStatus,
        authBusy,
        statusBanner,
        clearStatusBanner,
        signInGoogle,
        signOut,
        saveProfile,
        deleteAccount,
        timeHour,
        setTimeHour,
        zones,
        selectedZone,
        setSelectedZone,
        reports,
        categoryFilter,
        setCategoryFilter,
        submitSafetyReport,
        corroborateReport,
        flagReport,
        addReportComment,
        currentLocation,
        refreshLocation,
        routes,
        selectedRoute,
        setSelectedRoute,
        searchRoutes,
        journey,
        deviationAlertVisible,
        startJourney,
        pauseOrResumeJourney,
        endJourney,
        toggleJourneyShare,
        simulateRouteDeviation,
        simulateGpsLoss,
        respondToDeviation,
        contacts,
        addOrUpdateContact,
        removeContact,
        verifyContact,
        sosCountdownRemaining,
        activeSosAlert,
        beginSosCountdown,
        cancelSosCountdown,
        triggerSosImmediately,
        resolveSosAlert,
        activeCommunitySos,
        incomingRescueAlert,
        activeResponderSession,
        triggerCommunitySos,
        cancelCommunitySos,
        resolveCommunitySosRequest,
        reportCommunityResponder,
        simulateIncomingRescueAlert,
        acceptRescueRequest,
        declineRescueRequest,
        startResponderTravel,
        markResponderArrived,
        cancelResponderHelp,
        dismissResponderSession,
        safeCircles,
        toggleCircleSharing,
        inviteCircleMember,
        toggleMemberConsent,
        safeHavens,
        communityPosts,
        blockedAuthorUids,
        createCommunityPost,
        addCommunityPostComment,
        markPostHelpful,
        flagOrBlockCommunityPost,
        safeHeroes: SAFE_HEROES_DIRECTORY,
        wearables,
        toggleWearableConnection,
        triggerWearableSosTest,
      }}
    >
      {children}
    </SafeWalkContext.Provider>
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
