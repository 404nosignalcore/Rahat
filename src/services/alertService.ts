import { ContactDeliveryStatus, EmergencyContact, SosAlertRecord } from '../types/safety';
import { INotificationService } from './contracts';

export function buildMapShareUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function buildEmergencySmsText(lat: number, lng: number, timestampIso: string): string {
  const url = buildMapShareUrl(lat, lng);
  return `RAHAT SOS Emergency Alert at ${timestampIso}. My last known live location: ${url}`;
}

export const alertService: INotificationService = {
  async dispatchEmergencyAlert({ ownerUid, latitude, longitude, contacts }): Promise<SosAlertRecord> {
    const alertId = `sos-${Date.now()}`;
    const triggeredAt = new Date().toISOString();
    const mapShareUrl = buildMapShareUrl(latitude, longitude);
    const activeContacts = contacts.filter((c) => c.notifyOnSOS);

    const functionEndpoint =
      (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_SOS_FUNCTION_URL) ||
      (typeof import.meta !== 'undefined' &&
        (import.meta as unknown as { env?: Record<string, string> }).env?.EXPO_PUBLIC_SOS_FUNCTION_URL) ||
      '';

    // Honest delivery tracking: only mark 'sent' if a real backend gateway confirms HTTP 200.
    if (functionEndpoint) {
      try {
        const res = await fetch(functionEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            alertId,
            ownerUid,
            latitude,
            longitude,
            mapShareUrl,
            contacts: activeContacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone })),
          }),
        });

        if (res.ok) {
          const payload = (await res.json()) as {
            results?: { contactId: string; status: 'sent' | 'failed'; reason?: string }[];
          };
          const deliveries: ContactDeliveryStatus[] = activeContacts.map((c) => {
            const match = payload.results?.find((r) => r.contactId === c.id);
            const status = match?.status === 'sent' ? 'sent' : 'failed';
            return {
              contactId: c.id,
              contactName: c.name,
              phone: c.phone,
              status,
              detail: match?.reason || (status === 'sent' ? 'Confirmed by gateway' : 'Gateway did not confirm'),
            };
          });

          const sentCount = deliveries.filter((d) => d.status === 'sent').length;
          return {
            id: alertId,
            ownerUid,
            status: 'active',
            deliveryChannelStatus:
              sentCount === deliveries.length && deliveries.length > 0
                ? 'sent'
                : sentCount > 0
                ? 'partial_failure'
                : 'failed',
            latitude,
            longitude,
            mapShareUrl,
            triggeredAt,
            contactDeliveries: deliveries,
          };
        }
      } catch {
        // Fall through to honest offline/unconfigured fallback
      }
    }

    // No external SMS/push gateway configured or network offline -> NEVER fake delivery!
    const fallbackDeliveries: ContactDeliveryStatus[] = activeContacts.map((c: EmergencyContact) => ({
      contactId: c.id,
      contactName: c.name,
      phone: c.phone,
      status: 'offline_fallback',
      detail: 'SMS gateway unconfigured — use direct SMS or Call button below.',
    }));

    return {
      id: alertId,
      ownerUid,
      status: 'active',
      deliveryChannelStatus: 'offline_fallback',
      latitude,
      longitude,
      mapShareUrl,
      triggeredAt,
      contactDeliveries: fallbackDeliveries,
    };
  },
};
