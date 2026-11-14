import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  deleteUser,
  onAuthStateChanged,
  User,
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
import firebaseConfig from '../../firebase-applet-config.json';
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

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Mandatory boot connectivity check required by Firebase Integration guidelines.
 */
export async function testFirestoreConnection(): Promise<'online' | 'offline'> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return 'online';
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client offline).');
      return 'offline';
    }
    return 'online';
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signInWithGooglePopup(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const cred = await signInWithPopup(auth, provider);
  await ensureUserDocuments(cred.user);
  return cred.user;
}

export async function signOutFirebase(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function ensureUserDocuments(user: User, preferredLanguage: 'en' | 'hi' = 'en') {
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
      await setDoc(privateRef, {
        uid,
        email: (user.email || 'member@safewalk.org').slice(0, 160),
        phone: (user.phoneNumber || '').slice(0, 32),
        locationConsent: true,
        backgroundTrackingConsent: false,
        notificationConsent: true,
        sosCountdownSeconds: 5,
        updatedAt: serverTimestamp(),
      });
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

export async function saveEmergencyContactDoc(contact: EmergencyContact): Promise<void> {
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
      await updateDoc(ref, {
        name: sanitizeText(contact.name, FIELD_LIMITS.contactName.max),
        relationship: sanitizeText(contact.relationship, 40),
        phone: sanitizeText(contact.phone, FIELD_LIMITS.contactPhone.max),
        notifyOnSOS: contact.notifyOnSOS,
        verificationStatus: contact.verificationStatus,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function deleteEmergencyContactDoc(ownerUid: string, contactId: string): Promise<void> {
  const path = `users/${ownerUid}/emergency_contacts/${contactId}`;
  try {
    await deleteDoc(doc(db, 'users', ownerUid, 'emergency_contacts', contactId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

export async function createSafetyReportDoc(report: IncidentReport, authorUid: string): Promise<void> {
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

export async function saveEmergencyAlertDoc(alert: SosAlertRecord, isNew: boolean): Promise<void> {
  const path = `emergency_alerts/${alert.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, 'emergency_alerts', alert.id), {
        id: alert.id,
        ownerUid: alert.ownerUid,
        status: alert.status,
        deliveryChannelStatus: alert.deliveryChannelStatus,
        latitude: alert.latitude,
        longitude: alert.longitude,
        mapShareUrl: alert.mapShareUrl.slice(0, 300),
        triggeredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'emergency_alerts', alert.id), {
        status: alert.status,
        deliveryChannelStatus: alert.deliveryChannelStatus,
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
  try {
    const contactsSnap = await getDocs(
      query(collection(db, 'users', uid, 'emergency_contacts'), where('ownerUid', '==', uid))
    );
    for (const c of contactsSnap.docs) {
      await deleteDoc(c.ref);
    }
    await deleteDoc(doc(db, 'users', uid, 'private', 'info'));
    await deleteDoc(doc(db, 'users', uid));

    if (auth.currentUser && auth.currentUser.uid === uid) {
      await deleteUser(auth.currentUser);
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
  }
}
