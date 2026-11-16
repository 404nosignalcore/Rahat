import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const envObj = typeof process !== 'undefined' ? process.env : undefined;

let isWebRuntime = true;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const rn = require('react-native');
  if (rn?.Platform?.OS && rn.Platform.OS !== 'web') {
    isWebRuntime = false;
  }
} catch {
  isWebRuntime = typeof navigator === 'undefined' || (navigator as any).product !== 'ReactNative';
}

export const firebaseConfig = {
  apiKey: envObj ? envObj['EXPO_PUBLIC_FIREBASE_API_KEY'] : undefined,
  authDomain: envObj ? envObj['EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'] : undefined,
  projectId: envObj ? envObj['EXPO_PUBLIC_FIREBASE_PROJECT_ID'] : undefined,
  storageBucket: envObj ? envObj['EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'] : undefined,
  messagingSenderId: envObj ? envObj['EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'] : undefined,
  appId: envObj ? envObj['EXPO_PUBLIC_FIREBASE_APP_ID'] : undefined,
  firestoreDatabaseId: envObj ? envObj['EXPO_PUBLIC_FIREBASE_DATABASE_ID'] : undefined,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  typeof firebaseConfig.apiKey === 'string' &&
  firebaseConfig.apiKey.trim() !== '' &&
  typeof firebaseConfig.projectId === 'string' &&
  firebaseConfig.projectId.trim() !== '' &&
  firebaseConfig.apiKey !== 'your_firebase_api_key_here' &&
  firebaseConfig.projectId !== 'your_project_id'
);

let app: any = null;
let auth: any = null;
let db: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    if (isWebRuntime) {
      auth = getAuth(app);
    } else {
      try {
        auth = initializeAuth(app, {
          persistence: inMemoryPersistence,
        });
      } catch {
        auth = getAuth(app);
      }
    }
    db = firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  } catch (error) {
    console.warn('[SafeWalk] Failed to initialize Firebase:', error);
  }
}

export { app, auth, db };

