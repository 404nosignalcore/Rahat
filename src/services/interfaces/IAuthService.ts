import { UserProfile } from '../../types';

export interface IAuthService {
  getCurrentUser(): UserProfile | null;
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void;
  signInWithEmail(email: string, pass: string): Promise<UserProfile>;
  signUpWithEmail(email: string, pass: string, name: string, phone: string): Promise<UserProfile>;
  signInAnonymously(): Promise<UserProfile>;
  signOut(): Promise<void>;
  updateProfile(updates: Partial<UserProfile>): Promise<void>;
}

