import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  CommunityResponder,
  CommunitySosRequest,
  EmergencyContact,
  SafeCircleGroup,
  SafeHeroOrganization,
  SosAlertRecord,
  WearableDeviceState,
} from '../types/safety';
import {
  INITIAL_EMERGENCY_CONTACTS,
  INITIAL_SAFE_CIRCLES,
  INITIAL_WEARABLES,
  SAFE_HEROES_DIRECTORY,
} from '../data/mockSafetyData';
import { alertService, sendNativeEmergencySms } from '../services/alertService';
import { locationService } from '../services/locationAdapter';
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
  createSafeCircleDoc,
  deleteEmergencyContactDoc,
  loadUserPrivateAndContacts,
  saveEmergencyAlertDoc,
  saveEmergencyContactDoc,
} from '../services/firebaseClient';
import { useAuth } from './AuthContext';
import { useJourney } from './JourneyContext';

export interface SOSContextType {
  contacts: EmergencyContact[];
  setContacts: React.Dispatch<React.SetStateAction<EmergencyContact[]>>;
  addOrUpdateContact: (contact: Omit<EmergencyContact, 'ownerUid'>) => Promise<{ ok: boolean; error?: string }>;
  removeContact: (contactId: string) => Promise<void>;
  verifyContact: (contactId: string) => Promise<void>;
  sosCountdownRemaining: number | null;
  setSosCountdownRemaining: React.Dispatch<React.SetStateAction<number | null>>;
  activeSosAlert: SosAlertRecord | null;
  setActiveSosAlert: React.Dispatch<React.SetStateAction<SosAlertRecord | null>>;
  beginSosCountdown: () => void;
  cancelSosCountdown: () => void;
  triggerSosImmediately: (forceFallback?: boolean) => Promise<void>;
  resolveSosAlert: () => Promise<void>;
  safeCircles: SafeCircleGroup[];
  toggleCircleSharing: (circleId: string) => void;
  inviteCircleMember: (circleId: string, name: string, phone: string) => void;
  toggleMemberConsent: (circleId: string, memberId: string) => void;
  safeHeroes: SafeHeroOrganization[];
  isSafeHeroesOpen: boolean;
  setIsSafeHeroesOpen: (open: boolean) => void;
  wearables: WearableDeviceState[];
  toggleWearableConnection: (deviceId: string) => void;
  triggerWearableSosTest: (deviceName: string) => void;
  // Community SOS
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
  // Legacy helpers
  emergencyContacts: EmergencyContact[];
  activeAlert: SosAlertRecord | null;
  isConfirmationVisible: boolean;
  isSOSActive: boolean;
  countdownSeconds: number;
  openSOSConfirmation: () => void;
  cancelSOSConfirmation: () => void;
  activateSOSImmediate: () => Promise<void>;
  resolveSOS: () => Promise<void>;
  callEmergencyServices: () => Promise<void>;
  retrySMSDispatch: () => Promise<void>;
  startSosCountdown: () => void;
  cancelCountdown: () => void;
  triggerInstantSos: () => Promise<void>;
  resolveAlert: () => Promise<void>;
  addEmergencyContact: (c: Omit<EmergencyContact, 'ownerUid'>) => Promise<{ ok: boolean; error?: string }>;
  removeEmergencyContact: (contactId: string) => Promise<void>;
}

export const SOSContext = createContext<SOSContextType | null>(null);

export const SOSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, setStatusBanner } = useAuth();
  const { currentLocation, setCurrentLocation, refreshLocation } = useJourney();

  const [contacts, setContacts] = useState<EmergencyContact[]>(INITIAL_EMERGENCY_CONTACTS);
  const [sosCountdownRemaining, setSosCountdownRemaining] = useState<number | null>(null);
  const [activeSosAlert, setActiveSosAlert] = useState<SosAlertRecord | null>(null);

  const [safeCircles, setSafeCircles] = useState<SafeCircleGroup[]>(INITIAL_SAFE_CIRCLES);
  const [safeHeroes] = useState<SafeHeroOrganization[]>(SAFE_HEROES_DIRECTORY);
  const [isSafeHeroesOpen, setIsSafeHeroesOpen] = useState(false);
  const [wearables, setWearables] = useState<WearableDeviceState[]>(INITIAL_WEARABLES);

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

  useEffect(() => {
    if (user.uid && user.isAuthenticated) {
      loadUserPrivateAndContacts(user.uid)
        .then((bundle) => {
          if (bundle.contacts.length > 0) {
            setContacts(bundle.contacts);
          }
        })
        .catch((err) => console.warn('[SOSContext] loadUserPrivateAndContacts error:', err));
    }
  }, [user.uid, user.isAuthenticated]);

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

  const addOrUpdateContact: SOSContextType['addOrUpdateContact'] = async (contactInput) => {
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
    if (user.role !== 'admin') {
      Alert.alert(
        'Admin Verification Required',
        'Emergency contact phone numbers can only be verified via official SMS OTP verification or administrative dispatch review.'
      );
      return;
    }
    const target = contacts.find((c) => c.id === contactId);
    if (!target) return;
    const updatedContact: EmergencyContact = { ...target, verificationStatus: 'verified' };

    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? updatedContact : c))
    );

    if (user.isAuthenticated) {
      try {
        await saveEmergencyContactDoc(updatedContact, true);
      } catch (err) {
        console.warn('Contact verification write failed:', err);
      }
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

    if (
      alertRecord.deliveryChannelStatus === 'offline_fallback' ||
      alertRecord.deliveryChannelStatus === 'failed'
    ) {
      try {
        await sendNativeEmergencySms(contacts, loc.lat, loc.lng, loc.source);
      } catch (smsErr) {
        console.warn('[SOSContext] Automatic native SMS fallback failed:', smsErr);
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

  const triggerCommunitySos: SOSContextType['triggerCommunitySos'] = async (
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

    if (isCommunitySimulationEnabled()) {
      setStatusBanner(`[DEV SIMULATION] Community SOS active (ID: ${currentReq.id}) with simulated responders.`);

      const candidates = getAvailableCommunityCandidates(currentLocation.lat, currentLocation.lng, true);
      if (candidates.length > 0) {
        const t1 = setTimeout(() => {
          setActiveCommunitySos((prev) => {
            if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
            const res = acceptCommunitySosResponse(prev, candidates[0]);
            return res.ok ? res.request : prev;
          });
        }, 2500);
        communityTimeoutsRef.current.push(t1);

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

        const tWave = setTimeout(() => {
          setActiveCommunitySos((prev) => {
            if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
            return expandProximityWave(prev);
          });
        }, 7000);
        communityTimeoutsRef.current.push(tWave);

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

        const t4 = setTimeout(() => {
          setActiveCommunitySos((prev) => {
            if (!prev || prev.isCancelled || prev.status === 'cancelled' || prev.status === 'resolved') return prev;
            return setResponderOnTheWay(prev, candidates[0].id);
          });
        }, 12000);
        communityTimeoutsRef.current.push(t4);
      }
    } else {
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
    beginSosCountdown();
  };

  return (
    <SOSContext.Provider
      value={{
        contacts,
        setContacts,
        addOrUpdateContact,
        removeContact,
        verifyContact,
        sosCountdownRemaining,
        setSosCountdownRemaining,
        activeSosAlert,
        setActiveSosAlert,
        beginSosCountdown,
        cancelSosCountdown,
        triggerSosImmediately,
        resolveSosAlert,
        safeCircles,
        toggleCircleSharing,
        inviteCircleMember,
        toggleMemberConsent,
        safeHeroes,
        isSafeHeroesOpen,
        setIsSafeHeroesOpen,
        wearables,
        toggleWearableConnection,
        triggerWearableSosTest,
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
        emergencyContacts: contacts,
        activeAlert: activeSosAlert,
        isConfirmationVisible: sosCountdownRemaining !== null,
        isSOSActive: activeSosAlert !== null,
        countdownSeconds: sosCountdownRemaining ?? 0,
        openSOSConfirmation: beginSosCountdown,
        cancelSOSConfirmation: cancelSosCountdown,
        activateSOSImmediate: () => triggerSosImmediately(true),
        resolveSOS: resolveSosAlert,
        callEmergencyServices: async () => {},
        retrySMSDispatch: async () => {
          await triggerSosImmediately(true);
        },
        startSosCountdown: beginSosCountdown,
        cancelCountdown: cancelSosCountdown,
        triggerInstantSos: () => triggerSosImmediately(true),
        resolveAlert: resolveSosAlert,
        addEmergencyContact: addOrUpdateContact,
        removeEmergencyContact: removeContact,
      }}
    >
      {children}
    </SOSContext.Provider>
  );
};

export function useSOS(): SOSContextType {
  const ctx = useContext(SOSContext);
  if (!ctx) throw new Error('useSOS must be used inside SOSProvider');
  return ctx;
}

export const useSos = useSOS;
export const SosProvider = SOSProvider;
export const SosContext = SOSContext;
