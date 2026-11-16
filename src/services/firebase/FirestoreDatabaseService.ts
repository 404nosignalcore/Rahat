import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebaseConfig';
import { IDatabaseService } from '../interfaces/IDatabaseService';
import {
  SafetyZone,
  SafetyReport,
  CommunityComment,
  NearbyHelpItem,
  SafeHeroResource,
  SafeCircle,
  EmergencyContact,
  Journey,
  SOSAlert,
  LatLng,
} from '../../types';
import {
  MOCK_SAFETY_ZONES,
  MOCK_NEARBY_HELP,
  MOCK_SAFE_HEROES,
} from '../mock/mockData';

export class FirestoreDatabaseService implements IDatabaseService {
  async getSafetyZones(_nearbyLocation?: LatLng): Promise<SafetyZone[]> {
    if (!isFirebaseConfigured || !db) return [...MOCK_SAFETY_ZONES];
    try {
      const q = query(collection(db, 'safety_zones'), limit(25));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [...MOCK_SAFETY_ZONES];
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (error) {
      console.warn('[Firestore] Error fetching safety zones, using fallback:', error);
      return [...MOCK_SAFETY_ZONES];
    }
  }

  async getSafetyReports(categoryFilter?: string): Promise<SafetyReport[]> {
    if (!isFirebaseConfigured || !db) return [];
    try {
      let q = query(collection(db, 'safety_reports'), orderBy('createdAt', 'desc'), limit(50));
      if (categoryFilter && categoryFilter !== 'all') {
        q = query(
          collection(db, 'safety_reports'),
          where('category', '==', categoryFilter),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    } catch (error) {
      console.warn('[Firestore] Error fetching reports:', error);
      return [];
    }
  }

  async getComments(reportId: string): Promise<CommunityComment[]> {
    if (!isFirebaseConfigured || !db) return [];
    const q = query(
      collection(db, 'safety_reports', reportId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  async addComment(
    reportId: string,
    content: string,
    userId: string,
    userName: string
  ): Promise<CommunityComment> {
    if (!isFirebaseConfigured || !db) throw new Error('Firestore not configured.');
    const ref = doc(collection(db, 'safety_reports', reportId, 'comments'));
    const comment: CommunityComment = {
      id: ref.id,
      reportId,
      userId,
      userName,
      content,
      createdAt: Date.now(),
      flagged: false,
    };
    await setDoc(ref, comment);
    return comment;
  }

  async getNearbyHelp(_location: LatLng): Promise<NearbyHelpItem[]> {
    return [...MOCK_NEARBY_HELP];
  }

  async getSafeHeroes(): Promise<SafeHeroResource[]> {
    return [...MOCK_SAFE_HEROES];
  }

  async getEmergencyContacts(userId: string): Promise<EmergencyContact[]> {
    if (!isFirebaseConfigured || !db) return [];
    const q = collection(db, 'users', userId, 'emergency_contacts');
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  }

  async addEmergencyContact(
    userId: string,
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<EmergencyContact> {
    if (!isFirebaseConfigured || !db) throw new Error('Firestore not configured.');
    const ref = doc(collection(db, 'users', userId, 'emergency_contacts'));
    const item: EmergencyContact = { ...contact, id: ref.id };
    await setDoc(ref, item);
    return item;
  }

  async updateEmergencyContact(
    userId: string,
    contact: EmergencyContact
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, 'users', userId, 'emergency_contacts', contact.id);
    await updateDoc(ref, { ...contact });
  }

  async deleteEmergencyContact(userId: string, contactId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, 'users', userId, 'emergency_contacts', contactId);
    await deleteDoc(ref);
  }

  async getSafeCircle(userId: string): Promise<SafeCircle | null> {
    if (!isFirebaseConfigured || !db) return null;
    const ref = doc(db, 'safe_circles', userId);
    const snap = await getDocs(query(collection(db, 'safe_circles'), where('ownerId', '==', userId)));
    if (snap.empty) return null;
    return snap.docs[0].data() as SafeCircle;
  }

  async updateLocationSharing(
    userId: string,
    isSharing: boolean,
    location?: LatLng
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, 'users', userId);
    await updateDoc(ref, {
      isSharingLocation: isSharing,
      lastLocation: location || null,
      lastLocationTime: Date.now(),
    });
  }

  async saveJourney(journey: Journey): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, 'journeys', journey.id);
    await setDoc(ref, journey);
  }

  async updateJourneyStatus(
    journeyId: string,
    status: Journey['status']
  ): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, 'journeys', journeyId);
    await updateDoc(ref, {
      status,
      endedAt: status === 'completed' ? Date.now() : null,
    });
  }

  async createSOSAlert(alertData: Omit<SOSAlert, 'id'>): Promise<SOSAlert> {
    if (!isFirebaseConfigured || !db) throw new Error('Firestore not configured.');
    const ref = doc(collection(db, 'emergency_alerts'));
    const alert: SOSAlert = { ...alertData, id: ref.id };
    await setDoc(ref, alert);
    return alert;
  }

  async resolveSOSAlert(alertId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;
    const ref = doc(db, 'emergency_alerts', alertId);
    await updateDoc(ref, { status: 'resolved', resolvedAt: Date.now() });
  }
}

