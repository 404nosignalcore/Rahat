import { IAuthService } from './interfaces/IAuthService';
import { IDatabaseService } from './interfaces/IDatabaseService';
import { ILocationService } from './interfaces/ILocationService';
import { IEmergencyService } from './interfaces/IEmergencyService';

import { isFirebaseConfigured } from './firebase/firebaseConfig';
import { FirebaseAuthService } from './firebase/FirebaseAuthService';
import { FirestoreDatabaseService } from './firebase/FirestoreDatabaseService';

import {
  MockAuthService,
  MockDatabaseService,
  MockLocationService,
  MockEmergencyService,
} from './mock/MockServices';
import { ExpoLocationService } from './location/ExpoLocationService';
import { NativeEmergencyService } from './emergency/NativeEmergencyService';

class ServiceFactory {
  private static authInstance: IAuthService;
  private static dbInstance: IDatabaseService;
  private static locationInstance: ILocationService;
  private static emergencyInstance: IEmergencyService;

  public static getAuthService(): IAuthService {
    if (!this.authInstance) {
      this.authInstance = isFirebaseConfigured
        ? new FirebaseAuthService()
        : new MockAuthService();
    }
    return this.authInstance;
  }

  public static getDatabaseService(): IDatabaseService {
    if (!this.dbInstance) {
      this.dbInstance = isFirebaseConfigured
        ? new FirestoreDatabaseService()
        : new MockDatabaseService();
    }
    return this.dbInstance;
  }

  public static getLocationService(): ILocationService {
    if (!this.locationInstance) {
      // Use real Expo location, Mock fallback on non-native or test
      this.locationInstance = new ExpoLocationService();
    }
    return this.locationInstance;
  }

  public static getEmergencyService(): IEmergencyService {
    if (!this.emergencyInstance) {
      this.emergencyInstance = new NativeEmergencyService();
    }
    return this.emergencyInstance;
  }
}

export const authService = ServiceFactory.getAuthService();
export const dbService = ServiceFactory.getDatabaseService();
export const locationService = ServiceFactory.getLocationService();
export const emergencyService = ServiceFactory.getEmergencyService();

