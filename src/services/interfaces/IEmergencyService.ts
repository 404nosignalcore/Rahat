import { EmergencyContact, LatLng, SOSAlert } from '../../types';

export interface IEmergencyService {
  triggerSOS(
    user: { uid: string; name: string },
    location: LatLng,
    contacts: EmergencyContact[],
    emergencyNumber?: string
  ): Promise<SOSAlert>;

  sendEmergencySMS(
    contacts: EmergencyContact[],
    location: LatLng,
    userName: string
  ): Promise<boolean>;

  dialEmergencyServices(emergencyNumber?: string): Promise<boolean>;

  resolveSOS(alertId: string): Promise<void>;
}

