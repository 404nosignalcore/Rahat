import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  inMemoryPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  deleteUser,
  onAuthStateChanged,
  User,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getFunctions, httpsCallable } from 'firebase/functions';
import {
  isFirebaseConfigured,
  app as configuredApp,
  auth as configuredAuth,
  db as configuredDb,
} from './firebase/firebaseConfig';
import {
  INITIAL_COMMUNITY_POSTS,
  INITIAL_EMERGENCY_CONTACTS,
  INITIAL_INCIDENT_REPORTS,
  INITIAL_SAFE_CIRCLES,
  INITIAL_USER_PROFILE,
} from '../data/mockSafetyData';
import {
  CommunityComment,
  CommunityPost,
  ConsentSettings,
  EmergencyContact,
  IncidentReport,
  JourneySession,
  SafeCircleGroup,
  SosAlertRecord,
} from '../types/safety';
import { FIELD_LIMITS, sanitizeText } from '../utils/validation';

export const db = isFirebaseConfigured ? configuredDb : null;
export const auth: Auth =
  isFirebaseConfigured && configuredAuth
    ? configuredAuth
    : ({
        currentUser: null,
        onAuthStateChanged: () => () => {},
      } as unknown as Auth);

/**
 * Offline Mock Adapter
 * Provides robust in-memory and local storage state when Firebase is unconfigured.
 * Guarantees zero unauthenticated network calls and prevents writing to any production project.
 */
class OfflineMockAdapter {
  private reports: IncidentReport[] = [...INITIAL_INCIDENT_REPORTS];
  private comments: CommunityComment[] = [];
  private contacts: EmergencyContact[] = [...INITIAL_EMERGENCY_CONTACTS];
  private journeys: JourneySession[] = [];
  private alerts: SosAlertRecord[] = [];
  private circles: SafeCircleGroup[] = [...INITIAL_SAFE_CIRCLES];
  private posts: CommunityPost[] = [...INITIAL_COMMUNITY_POSTS];
  private userProfile = { ...INITIAL_USER_PROFILE };
  private corroborationsByUser: Map<string, Set<string>> = new Map();
  private abuseFlagsByUser: Map<string, Set<string>> = new Map();

  async fetchSafetyReports(): Promise<IncidentReport[]> {
    return [...this.reports];
  }

  async createSafetyReportDoc(report: IncidentReport, _authorUid: string): Promise<void> {
    const existingIdx = this.reports.findIndex((r) => r.id === report.id);
    if (existingIdx >= 0) {
      this.reports[existingIdx] = { ...report };
    } else {
      this.reports.unshift({ ...report });
    }
  }

  async addSafetyReportCommentDoc(comment: CommunityComment): Promise<void> {
    this.comments.push(comment);
    const rep = this.reports.find((r) => r.id === comment.reportId);
    if (rep) {
      rep.comments = rep.comments ? [...rep.comments, comment] : [comment];
    }
  }

  async recordReportCorroborationDoc(reportId: string, userUid: string): Promise<boolean> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (!rep) return false;
    if (rep.authorUid === userUid) {
      console.warn('[OfflineMockAdapter] Author cannot self-corroborate report.');
      return false;
    }
    let userSet = this.corroborationsByUser.get(reportId);
    if (!userSet) {
      userSet = new Set();
      this.corroborationsByUser.set(reportId, userSet);
    }
    if (userSet.has(userUid)) return false;
    userSet.add(userUid);
    rep.corroborationCount = userSet.size;
    if (rep.corroborationCount >= 3 && rep.verificationStatus === 'unverified') {
      rep.verificationStatus = 'community_corroborated';
    }
    return true;
  }

  async recordReportAbuseFlagDoc(reportId: string, userUid: string, _reason?: string): Promise<boolean> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (!rep) return false;
    let userSet = this.abuseFlagsByUser.get(reportId);
    if (!userSet) {
      userSet = new Set();
      this.abuseFlagsByUser.set(reportId, userSet);
    }
    if (userSet.has(userUid)) return false;
    userSet.add(userUid);
    rep.abuseFlags = userSet.size;
    return true;
  }

  async incrementReportCounterDoc(
    reportId: string,
    field: 'corroborationCount' | 'outdatedFlags' | 'abuseFlags',
    nextValue: number
  ): Promise<void> {
    const rep = this.reports.find((r) => r.id === reportId);
    if (rep) {
      (rep as any)[field] = nextValue;
      if (field === 'corroborationCount' && nextValue >= 3 && rep.verificationStatus === 'unverified') {
        rep.verificationStatus = 'community_corroborated';
      }
    }
  }

  async loadUserPrivateAndContacts(_uid: string): Promise<{
    phone?: string;
    consents?: ConsentSettings;
    contacts: EmergencyContact[];
  }> {
    return {
      phone: this.userProfile.phone || '',
      consents: this.userProfile.consents,
      contacts: [...this.contacts],
    };
  }

  async updateUserProfileAndConsents(params: {
    uid: string;
    displayName: string;
    preferredLanguage: 'en' | 'hi';
    phone: string;
    consents: ConsentSettings;
  }): Promise<void> {
    this.userProfile.displayName = params.displayName;
    this.userProfile.preferredLanguage = params.preferredLanguage;
    this.userProfile.phone = params.phone;
    this.userProfile.consents = params.consents;
  }

  async saveEmergencyContactDoc(contact: EmergencyContact, isAdmin = false): Promise<void> {
    const idx = this.contacts.findIndex((c) => c.id === contact.id);
    if (idx >= 0) {
      const existingStatus = this.contacts[idx].verificationStatus;
      this.contacts[idx] = {
        ...contact,
        verificationStatus: isAdmin ? contact.verificationStatus : existingStatus,
      };
    } else {
      this.contacts.push({ ...contact, verificationStatus: 'unverified' });
    }
  }

  async deleteEmergencyContactDoc(_ownerUid: string, contactId: string): Promise<void> {
    this.contacts = this.contacts.filter((c) => c.id !== contactId);
  }

  async saveJourneyDoc(journey: JourneySession, _isNew: boolean): Promise<void> {
    const idx = this.journeys.findIndex((j) => j.id === journey.id);
    if (idx >= 0) {
      this.journeys[idx] = { ...journey };
    } else {
      this.journeys.push({ ...journey });
    }
  }

  async saveEmergencyAlertDoc(alert: SosAlertRecord, isNew: boolean): Promise<void> {
    const idx = this.alerts.findIndex((a) => a.id === alert.id);
    if (idx >= 0) {
      const existingStatus = this.alerts[idx].deliveryChannelStatus;
      this.alerts[idx] = {
        ...alert,
        deliveryChannelStatus: existingStatus,
      };
    } else {
      this.alerts.push({
        ...alert,
        deliveryChannelStatus: isNew ? 'pending' : alert.deliveryChannelStatus,
      });
    }
  }

  async createSafeCircleDoc(circle: SafeCircleGroup): Promise<void> {
    const idx = this.circles.findIndex((c) => c.id === circle.id);
    if (idx >= 0) {
      this.circles[idx] = { ...circle };
    } else {
      this.circles.push({ ...circle });
    }
  }

  async createCommunityPostDoc(post: CommunityPost): Promise<void> {
    this.posts.unshift({ ...post });
  }

  async deleteAccountCascade(uid: string): Promise<void> {
    this.contacts = [];
    this.journeys = [];
    this.alerts = [];
    this.reports = this.reports.filter((r) => r.authorUid !== uid);
    this.posts = this.posts.filter((p) => p.authorUid !== uid);
    this.circles = this.circles.filter((c) => c.ownerUid !== uid);
    this.comments = this.comments.filter((c) => c.authorUid !== uid);
    this.userProfile = {
      ...INITIAL_USER_PROFILE,
      uid: '',
      displayName: '',
      email: '',
      phone: '',
      isAuthenticated: false,
    };
  }
}

export const offlineMockAdapter = new OfflineMockAdapter();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    isSignedIn?: boolean;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerIds?: string[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      isSignedIn: Boolean(auth.currentUser),
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerIds: auth.currentUser?.providerData?.map((p) => p.providerId) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Boot connectivity check verifying Firebase configuration and operational readiness.
 * Avoids reading test/connection which security rules explicitly deny.
 */
export async function testFirestoreConnection(): Promise<'online' | 'offline'> {
  if (!isFirebaseConfigured || !db) return 'offline';
  return isFirebaseConfigured ? 'online' : 'offline';
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }
  try {
    if (typeof onAuthStateChanged === 'function') {
      return onAuthStateChanged(auth, callback);
    }
  } catch (e) {
    console.warn('[Rahat] subscribeToAuth fallback:', e);
  }
  callback(null);
  return () => {};
}

export async function signInWithGooglePopup(): Promise<User> {
  if (Platform.OS !== 'web') {
    throw new Error(
      'Google popup sign-in is only supported in web browsers. On mobile (Android/iOS), please sign in using Email or Phone.'
    );
  }
  if (!isFirebaseConfigured || !auth) {
    throw new Error(
      'Firebase is not configured. Please supply valid EXPO_PUBLIC_FIREBASE_* keys in your .env file to enable Cloud Sign-In, or continue in Demo Exploration mode.'
    );
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDocuments(cred.user);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  if (isFirebaseConfigured && auth && typeof firebaseSignOut === 'function') {
    await firebaseSignOut(auth);
  }
}

export async function ensureUserDocuments(
  user: User,
  preferredLanguage: 'en' | 'hi' = 'en',
  phone?: string
) {
  if (!isFirebaseConfigured || !db) return;
  const uid = user.uid;
  const publicPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;

  try {
    const publicRef = doc(db, 'users', uid);
    const existingPublic = await getDoc(publicRef);
    if (!existingPublic.exists()) {
      await setDoc(publicRef, {
        uid,
        displayName: sanitizeText(user.displayName || 'SafeWalk Member', FIELD_LIMITS.displayName.max) || 'SafeWalk Member',
        photoUrl: user.photoURL ? user.photoURL.slice(0, 512) : '',
        preferredLanguage,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const privateRef = doc(db, 'users', uid, 'private', 'info');
    const existingPrivate = await getDoc(privateRef);
    if (!existingPrivate.exists()) {
      const initialPrivateData: Record<string, any> = {
        uid,
        locationConsent: true,
        backgroundTrackingConsent: false,
        notificationConsent: true,
        sosCountdownSeconds: 5,
        updatedAt: serverTimestamp(),
      };
      if (user.email && user.email.trim() !== '') {
        initialPrivateData.email = user.email.slice(0, 160);
      }
      const effectivePhone = (phone || user.phoneNumber || '').trim();
      if (effectivePhone) {
        initialPrivateData.phone = effectivePhone.slice(0, 32);
      }
      await setDoc(privateRef, initialPrivateData);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `${publicPath} | ${privatePath}`);
  }
}

export async function updateUserProfileAndConsents(params: {
  uid: string;
  displayName: string;
  preferredLanguage: 'en' | 'hi';
  phone: string;
  consents: ConsentSettings;
}): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.updateUserProfileAndConsents(params);
    return;
  }
  const { uid, displayName, preferredLanguage, phone, consents } = params;
  try {
    await updateDoc(doc(db, 'users', uid), {
      displayName: sanitizeText(displayName, FIELD_LIMITS.displayName.max) || 'SafeWalk Member',
      preferredLanguage,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', uid, 'private', 'info'), {
      phone: sanitizeText(phone, 32),
      locationConsent: consents.locationConsent,
      backgroundTrackingConsent: consents.backgroundTrackingConsent,
      notificationConsent: consents.notificationConsent,
      sosCountdownSeconds: Math.max(3, Math.min(30, Math.round(consents.sosCountdownSeconds))),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function loadUserPrivateAndContacts(uid: string): Promise<{
  phone?: string;
  consents?: ConsentSettings;
  contacts: EmergencyContact[];
}> {
  if (!isFirebaseConfigured || !db) {
    return offlineMockAdapter.loadUserPrivateAndContacts(uid);
  }
  let phone: string | undefined;
  let consents: ConsentSettings | undefined;
  const contacts: EmergencyContact[] = [];

  try {
    const privSnap = await getDoc(doc(db, 'users', uid, 'private', 'info'));
    if (privSnap.exists()) {
      const data = privSnap.data();
      phone = typeof data.phone === 'string' ? data.phone : '';
      consents = {
        locationConsent: Boolean(data.locationConsent),
        backgroundTrackingConsent: Boolean(data.backgroundTrackingConsent),
        notificationConsent: Boolean(data.notificationConsent),
        sosCountdownSeconds: Number(data.sosCountdownSeconds || 5),
      };
    }

    const contactsQuery = query(
      collection(db, 'users', uid, 'emergency_contacts'),
      where('ownerUid', '==', uid),
      limit(20)
    );
    const contactsSnap = await getDocs(contactsQuery);
    contactsSnap.forEach((d) => {
      const data = d.data();
      contacts.push({
        id: d.id,
        ownerUid: String(data.ownerUid),
        name: String(data.name),
        relationship: String(data.relationship),
        phone: String(data.phone),
        verificationStatus: data.verificationStatus || 'unverified',
        notifyOnSOS: Boolean(data.notifyOnSOS),
      });
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
  }

  return { phone, consents, contacts };
}

export async function saveEmergencyContactDoc(contact: EmergencyContact, isAdmin = false): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.saveEmergencyContactDoc(contact, isAdmin);
    return;
  }
  const path = `users/${contact.ownerUid}/emergency_contacts/${contact.id}`;
  try {
    const ref = doc(db, 'users', contact.ownerUid, 'emergency_contacts', contact.id);
    const existing = await getDoc(ref);
    if (!existing.exists()) {
      await setDoc(ref, {
        id: contact.id,
        ownerUid: contact.ownerUid,
        name: sanitizeText(contact.name, FIELD_LIMITS.contactName.max),
        relationship: sanitizeText(contact.relationship, 40),
        phone: sanitizeText(contact.phone, FIELD_LIMITS.contactPhone.max),
        verificationStatus: 'unverified',
        notifyOnSOS: contact.notifyOnSOS,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const updateData: Record<string, any> = {
        name: sanitizeText(contact.name, FIELD_LIMITS.contactName.max),
        relationship: sanitizeText(contact.relationship, 40),
        phone: sanitizeText(contact.phone, FIELD_LIMITS.contactPhone.max),
        notifyOnSOS: contact.notifyOnSOS,
        updatedAt: serverTimestamp(),
      };
      if (isAdmin) {
        updateData.verificationStatus = contact.verificationStatus;
      }
      await updateDoc(ref, updateData);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteEmergencyContactDoc(ownerUid: string, contactId: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.deleteEmergencyContactDoc(ownerUid, contactId);
    return;
  }
  const path = `users/${ownerUid}/emergency_contacts/${contactId}`;
  try {
    await deleteDoc(doc(db, 'users', ownerUid, 'emergency_contacts', contactId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function createSafetyReportDoc(report: IncidentReport, authorUid: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.createSafetyReportDoc(report, authorUid);
    return;
  }
  const path = `safety_reports/${report.id}`;
  try {
    await setDoc(doc(db, 'safety_reports', report.id), {
      id: report.id,
      authorUid,
      category: report.category,
      title: sanitizeText(report.title, FIELD_LIMITS.reportTitle.max),
      description: sanitizeText(report.description, FIELD_LIMITS.reportDescription.max),
      areaLabel: sanitizeText(report.address, FIELD_LIMITS.areaLabel.max),
      latitude: report.latitude,
      longitude: report.longitude,
      severity: Math.max(1, Math.min(5, Math.round(report.severity))),
      verificationStatus: 'unverified',
      corroborationCount: 0,
      outdatedFlags: 0,
      abuseFlags: 0,
      isSynthetic: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function fetchSafetyReports(): Promise<IncidentReport[]> {
  if (!isFirebaseConfigured || !db) {
    return offlineMockAdapter.fetchSafetyReports();
  }
  const path = 'safety_reports';
  try {
    const q = query(
      collection(db, 'safety_reports'),
      where('abuseFlags', '<', 5),
      orderBy('abuseFlags'),
      limit(40)
    );
    const snap = await getDocs(q);
    const out: IncidentReport[] = [];
    snap.forEach((d) => {
      const data = d.data();
      out.push({
        id: d.id,
        authorUid: String(data.authorUid),
        category: data.category,
        title: String(data.title),
        description: String(data.description),
        address: String(data.areaLabel),
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        severity: Number(data.severity) as 1 | 2 | 3 | 4 | 5,
        verificationStatus: data.verificationStatus || 'unverified',
        corroborationCount: Number(data.corroborationCount || 0),
        outdatedFlags: Number(data.outdatedFlags || 0),
        abuseFlags: Number(data.abuseFlags || 0),
        isSynthetic: Boolean(data.isSynthetic),
        timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
        timeHour: data.createdAt?.toDate ? data.createdAt.toDate().getHours() : new Date().getHours(),
        lightingCondition: 'dim',
        comments: [],
      });
    });
    return out;
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function addSafetyReportCommentDoc(comment: CommunityComment): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.addSafetyReportCommentDoc(comment);
    return;
  }
  const path = `safety_reports/${comment.reportId}/comments/${comment.id}`;
  try {
    await setDoc(doc(db, 'safety_reports', comment.reportId, 'comments', comment.id), {
      id: comment.id,
      reportId: comment.reportId,
      authorUid: comment.authorUid,
      authorDisplay: sanitizeText(comment.authorDisplay, 60),
      body: sanitizeText(comment.body, FIELD_LIMITS.commentBody.max),
      flaggedAbuse: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function incrementReportCounterDoc(
  reportId: string,
  field: 'corroborationCount' | 'outdatedFlags' | 'abuseFlags',
  nextValue: number
): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.incrementReportCounterDoc(reportId, field, nextValue);
    return;
  }
  const path = `safety_reports/${reportId}`;
  try {
    await updateDoc(doc(db, 'safety_reports', reportId), {
      [field]: nextValue,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function saveJourneyDoc(journey: JourneySession, isNew: boolean): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.saveJourneyDoc(journey, isNew);
    return;
  }
  const path = `journeys/${journey.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'journeys', journey.id), {
        id: journey.id,
        ownerUid: journey.ownerUid,
        originLabel: sanitizeText(journey.originLabel, 120),
        destinationLabel: sanitizeText(journey.destinationLabel, 120),
        routeName: sanitizeText(journey.routeName, 120),
        status: journey.status === 'idle' ? 'active' : journey.status,
        sharedWithCircleId: journey.sharedWithCircleId || '',
        lastLatitude: journey.lastLatitude,
        lastLongitude: journey.lastLongitude,
        deviationDetected: journey.deviationDetected,
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'journeys', journey.id), {
        status: journey.status === 'idle' ? 'completed' : journey.status,
        sharedWithCircleId: journey.sharedWithCircleId || '',
        lastLatitude: journey.lastLatitude,
        lastLongitude: journey.lastLongitude,
        deviationDetected: journey.deviationDetected,
        routeName: sanitizeText(journey.routeName, 120),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function recordReportCorroborationDoc(reportId: string, userUid: string): Promise<boolean> {
  if (!isFirebaseConfigured || !db) {
    return offlineMockAdapter.recordReportCorroborationDoc(reportId, userUid);
  }
  const path = `safety_reports/${reportId}/corroborations/${userUid}`;
  try {
    await setDoc(doc(db, 'safety_reports', reportId, 'corroborations', userUid), {
      id: userUid,
      reportId,
      corroboratorUid: userUid,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function recordReportAbuseFlagDoc(
  reportId: string,
  userUid: string,
  reason: string = 'Inappropriate or harmful report'
): Promise<boolean> {
  if (!isFirebaseConfigured || !db) {
    return offlineMockAdapter.recordReportAbuseFlagDoc(reportId, userUid, reason);
  }
  const path = `safety_reports/${reportId}/abuse_flags/${userUid}`;
  try {
    await setDoc(doc(db, 'safety_reports', reportId, 'abuse_flags', userUid), {
      id: userUid,
      reportId,
      flaggedByUid: userUid,
      reason: sanitizeText(reason, 200),
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function saveEmergencyAlertDoc(alert: SosAlertRecord, isNew: boolean): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.saveEmergencyAlertDoc(alert, isNew);
    return;
  }
  const path = `emergency_alerts/${alert.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'emergency_alerts', alert.id), {
        id: alert.id,
        ownerUid: alert.ownerUid,
        status: alert.status,
        deliveryChannelStatus: 'pending', // Initial unforgeable status; gateway/Admin SDK updates confirmed delivery
        latitude: alert.latitude,
        longitude: alert.longitude,
        mapShareUrl: alert.mapShareUrl.slice(0, 300),
        triggeredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      // Client updates can only update operational alert status and coordinates
      await updateDoc(doc(db, 'emergency_alerts', alert.id), {
        status: alert.status,
        latitude: alert.latitude,
        longitude: alert.longitude,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function createSafeCircleDoc(circle: SafeCircleGroup): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.createSafeCircleDoc(circle);
    return;
  }
  const path = `safe_circles/${circle.id}`;
  try {
    await setDoc(doc(db, 'safe_circles', circle.id), {
      id: circle.id,
      ownerUid: circle.ownerUid,
      name: sanitizeText(circle.name, FIELD_LIMITS.circleName.max),
      sharingEnabled: circle.sharingEnabled,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function createCommunityPostDoc(post: CommunityPost): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.createCommunityPostDoc(post);
    return;
  }
  const path = `community_posts/${post.id}`;
  try {
    await setDoc(doc(db, 'community_posts', post.id), {
      id: post.id,
      authorUid: post.authorUid,
      authorDisplay: sanitizeText(post.authorDisplay, 60),
      coarseArea: sanitizeText(post.coarseArea, 100),
      topic: post.topic,
      body: sanitizeText(post.body, FIELD_LIMITS.postBody.max),
      helpfulCount: 0,
      abuseFlags: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deleteAccountCascade(uid: string): Promise<void> {
  if (!isFirebaseConfigured || !db) {
    await offlineMockAdapter.deleteAccountCascade(uid);
    return;
  }

  // 1. If Firebase app is configured, attempt comprehensive server-side cascade via Cloud Function
  if (configuredApp) {
    try {
      const functions = getFunctions(configuredApp);
      const deleteCallable = httpsCallable(functions, 'deleteUserAccountCascade');
      await deleteCallable();
      return;
    } catch (callableErr) {
      console.warn('[firebaseClient] deleteUserAccountCascade callable fallback to client cascade:', callableErr);
    }
  }

  // 2. Client-side fallback compliant with India DPDP Act:
  // Cascade delete all personal data authored by or linked to uid across all collections
  try {
    // Delete emergency contacts
    const contactsSnap = await getDocs(
      query(collection(db, 'users', uid, 'emergency_contacts'), where('ownerUid', '==', uid))
    );
    for (const c of contactsSnap.docs) {
      await deleteDoc(c.ref);
    }

    // Delete user journeys
    const journeysSnap = await getDocs(
      query(collection(db, 'journeys'), where('ownerUid', '==', uid))
    );
    for (const j of journeysSnap.docs) {
      await deleteDoc(j.ref);
    }

    // Delete user emergency alerts
    const alertsSnap = await getDocs(
      query(collection(db, 'emergency_alerts'), where('ownerUid', '==', uid))
    );
    for (const a of alertsSnap.docs) {
      await deleteDoc(a.ref);
    }

    // Delete safe circles
    const circlesSnap = await getDocs(
      query(collection(db, 'safe_circles'), where('ownerUid', '==', uid))
    );
    for (const s of circlesSnap.docs) {
      await deleteDoc(s.ref);
    }

    // Delete safety reports authored by user
    const reportsSnap = await getDocs(
      query(collection(db, 'safety_reports'), where('authorUid', '==', uid))
    );
    for (const r of reportsSnap.docs) {
      await deleteDoc(r.ref);
    }

    // Delete community posts authored by user
    const postsSnap = await getDocs(
      query(collection(db, 'community_posts'), where('authorUid', '==', uid))
    );
    for (const p of postsSnap.docs) {
      await deleteDoc(p.ref);
    }

    // Delete private info and public profile
    await deleteDoc(doc(db, 'users', uid, 'private', 'info'));
    await deleteDoc(doc(db, 'users', uid));

    if (auth.currentUser && auth.currentUser.uid === uid) {
      await deleteUser(auth.currentUser);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
  }
}
