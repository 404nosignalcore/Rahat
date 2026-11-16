import { ContactDeliveryStatus, EmergencyContact, SosAlertRecord } from '../types/safety';
import { INotificationService } from './contracts';

export function buildMapShareUrl(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

export function buildEmergencySmsText(
  lat: number,
  lng: number,
  timestampIso: string,
  locationSource: 'gps' | 'fallback_demo' = 'gps'
): string {
  const url = buildMapShareUrl(lat, lng);
  if (locationSource === 'fallback_demo') {
    return `[CRITICAL WARNING: GPS UNAVAILABLE - UNVERIFIED LOCATION]\nRAHAT SOS Alert triggered at ${timestampIso}. Device GPS was offline; last simulated demo location: ${url}. Confirm victim's true location via direct phone call.`;
  }
  return `RAHAT SOS Emergency Alert at ${timestampIso}. My last known live location: ${url}`;
}

export const alertService: INotificationService = {
  async dispatchEmergencyAlert({
    ownerUid,
    latitude,
    longitude,
    contacts,
    locationSource = 'gps',
    isFallbackLocation,
  }): Promise<SosAlertRecord> {
    const alertId = `sos-${Date.now()}`;
    const triggeredAt = new Date().toISOString();
    const mapShareUrl = buildMapShareUrl(latitude, longitude);
    const activeContacts = contacts.filter((c) => c.notifyOnSOS);
    const effectiveIsFallback =
      isFallbackLocation !== undefined
        ? isFallbackLocation
        : locationSource === 'fallback_demo';
    const effectiveSource: 'gps' | 'fallback_demo' = effectiveIsFallback
      ? 'fallback_demo'
      : 'gps';

    const envObj = typeof process !== 'undefined' ? process.env : undefined;
    const functionEndpoint =
      (envObj ? envObj['EXPO_PUBLIC_SOS_FUNCTION_URL'] : undefined) ||
      (typeof import.meta !== 'undefined' &&
        (import.meta as unknown as { env?: Record<string, string> }).env?.EXPO_PUBLIC_SOS_FUNCTION_URL) ||
      '';

    const apiToken =
      (envObj ? envObj['EXPO_PUBLIC_RAHAT_API_TOKEN'] : undefined) ||
      (envObj ? envObj['RAHAT_API_TOKEN'] : undefined) ||
      'rahat-secure-client-token';

    // Honest delivery tracking: only mark 'sent' if a real backend gateway confirms HTTP 200.
    if (functionEndpoint) {
      try {
        const res = await fetch(functionEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            alertId,
            ownerUid,
            latitude,
            longitude,
            mapShareUrl,
            locationSource: effectiveSource,
            isFallbackLocation: effectiveIsFallback,
            contacts: activeContacts.map((c) => ({ id: c.id, name: c.name, phone: c.phone })),
          }),
        });

        if (res.ok) {
          const payload = (await res.json()) as {
            results?: { contactId: string; status: 'sent' | 'failed' | 'unconfigured'; reason?: string }[];
          };
          const deliveries: ContactDeliveryStatus[] = activeContacts.map((c) => {
            const match = payload.results?.find((r) => r.contactId === c.id);
            if (match?.status === 'sent') {
              return {
                contactId: c.id,
                contactName: c.name,
                phone: c.phone,
                status: 'sent',
                detail: match.reason || 'Confirmed by gateway',
              };
            }
            if (match?.status === 'unconfigured') {
              return {
                contactId: c.id,
                contactName: c.name,
                phone: c.phone,
                status: 'offline_fallback',
                detail: match.reason || 'SMS gateway unconfigured — use direct SMS or Call button below.',
              };
            }
            return {
              contactId: c.id,
              contactName: c.name,
              phone: c.phone,
              status: 'failed',
              detail: match?.reason || 'Gateway did not confirm',
            };
          });

          const sentCount = deliveries.filter((d) => d.status === 'sent').length;
          const allOfflineFallback =
            deliveries.length > 0 && deliveries.every((d) => d.status === 'offline_fallback');

          return {
            id: alertId,
            ownerUid,
            status: 'active',
            deliveryChannelStatus: allOfflineFallback
              ? 'offline_fallback'
              : sentCount === deliveries.length && deliveries.length > 0
              ? 'sent'
              : sentCount > 0
              ? 'partial_failure'
              : 'failed',
            latitude,
            longitude,
            mapShareUrl,
            triggeredAt,
            contactDeliveries: deliveries,
            locationSource: effectiveSource,
            isFallbackLocation: effectiveIsFallback,
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
      locationSource: effectiveSource,
      isFallbackLocation: effectiveIsFallback,
    };
  },
};
