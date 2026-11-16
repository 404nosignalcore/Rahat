import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './firebaseConfig';
import { IAuthService } from '../interfaces/IAuthService';
import { UserProfile } from '../../types';
import { ensureUserDocuments } from '../firebaseClient';

export class FirebaseAuthService implements IAuthService {
  private currentUser: UserProfile | null = null;

  constructor() {
    if (isFirebaseConfigured && auth) {
      this.currentUser = this.mapFirebaseUser(auth.currentUser);
    }
  }

  getCurrentUser(): UserProfile | null {
    if (!isFirebaseConfigured || !auth) return null;
    return this.mapFirebaseUser(auth.currentUser);
  }

  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    if (!isFirebaseConfigured || !auth) {
      callback(null);
      return () => {};
    }
    return firebaseOnAuthStateChanged(auth, (user: User | null) => {
      this.currentUser = this.mapFirebaseUser(user);
      callback(this.currentUser);
    });
  }

  async signInWithEmail(email: string, pass: string): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not configured. Please supply environment variables.');
    }
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const profile = this.mapFirebaseUser(cred.user);
    if (!profile) throw new Error('Failed to retrieve user profile after login.');
    return profile;
  }

  async signUpWithEmail(
    email: string,
    pass: string,
    name: string,
    phone: string
  ): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not configured.');
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await firebaseUpdateProfile(cred.user, { displayName: name });
    try {
      await ensureUserDocuments(cred.user, 'en', phone);
    } catch (e) {
      console.warn('[FirebaseAuthService] ensureUserDocuments error:', e);
    }
    const profile = this.mapFirebaseUser(cred.user);
    if (!profile) throw new Error('Failed to create user profile.');
    profile.phone = phone;
    return profile;
  }

  async signInAnonymously(): Promise<UserProfile> {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Auth is not configured.');
    }
    const cred = await firebaseSignInAnonymously(auth);
    const profile = this.mapFirebaseUser(cred.user);
    if (!profile) throw new Error('Failed to create guest user.');
    return profile;
  }

  async signOut(): Promise<void> {
    if (!isFirebaseConfigured || !auth) return;
    await firebaseSignOut(auth);
    this.currentUser = null;
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!isFirebaseConfigured || !auth || !auth.currentUser) return;
    if (updates.name || updates.photoURL) {
      await firebaseUpdateProfile(auth.currentUser, {
        displayName: updates.name,
        photoURL: updates.photoURL,
      });
    }
  }

  private mapFirebaseUser(user: User | null): UserProfile | null {
    if (!user) return null;
    return {
      uid: user.uid,
      name: user.displayName || 'SafeWalk User',
      email: user.email || '',
      phone: user.phoneNumber || '',
      photoURL: user.photoURL || undefined,
      isAnonymous: user.isAnonymous,
      createdAt: user.metadata.creationTime
        ? new Date(user.metadata.creationTime).getTime()
        : Date.now(),
      updatedAt: Date.now(),
    };
  }
}

