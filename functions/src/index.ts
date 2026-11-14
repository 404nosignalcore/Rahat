import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

admin.initializeApp();

const db = admin.firestore();

interface ContactDeliveryResult {
  contactId: string;
  contactName: string;
  status: 'sent' | 'failed' | 'unconfigured';
  reason?: string;
}

/**
 * Dispatches an emergency alert to verified contacts via configured messaging provider
 * (FCM / SMS webhook). Never fabricates delivery success when gateway secrets are missing.
 */
export const dispatchSosAlert = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required to dispatch SOS.');
  }

  const uid = request.auth.uid;
  const { alertId, latitude, longitude, mapShareUrl } = request.data as {
    alertId: string;
    latitude: number;
    longitude: number;
    mapShareUrl: string;
  };

  if (!alertId || typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new HttpsError('invalid-argument', 'Valid alertId and coordinates are required.');
  }

  const contactsSnap = await db
    .collection('users')
    .doc(uid)
    .collection('emergency_contacts')
    .where('notifyOnSOS', '==', true)
    .get();

  const smsWebhookUrl = process.env.SOS_SMS_WEBHOOK_URL;
  const results: ContactDeliveryResult[] = [];

  for (const docSnap of contactsSnap.docs) {
    const contact = docSnap.data();
    if (!smsWebhookUrl) {
      results.push({
        contactId: docSnap.id,
        contactName: String(contact.name ?? 'Contact'),
        status: 'unconfigured',
        reason: 'SMS gateway webhook not configured; client should prompt native SMS/call fallback.',
      });
      continue;
    }

    try {
      const response = await fetch(smsWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: contact.phone,
          message: `RAHAT SafeWalk SOS Alert: Check location immediately: ${mapShareUrl}`,
          latitude,
          longitude,
          alertId,
        }),
      });

      results.push({
        contactId: docSnap.id,
        contactName: String(contact.name ?? 'Contact'),
        status: response.ok ? 'sent' : 'failed',
        reason: response.ok ? undefined : `Gateway HTTP ${response.status}`,
      });
    } catch (err) {
      results.push({
        contactId: docSnap.id,
        contactName: String(contact.name ?? 'Contact'),
        status: 'failed',
        reason: err instanceof Error ? err.message : 'Network error',
      });
    }
  }

  const anySent = results.some((r) => r.status === 'sent');
  const anyFailed = results.some((r) => r.status === 'failed');
  const allUnconfigured = results.length > 0 && results.every((r) => r.status === 'unconfigured');

  const deliveryChannelStatus = allUnconfigured
    ? 'offline_fallback'
    : anySent && anyFailed
    ? 'partial_failure'
    : anySent
    ? 'sent'
    : 'failed';

  await db.collection('emergency_alerts').doc(alertId).set(
    {
      deliveryChannelStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return {
    alertId,
    deliveryChannelStatus,
    results,
  };
});

/**
 * Automatically transitions report verification status from 'unverified' to 'community_corroborated'
 * once corroborated by >= 3 independent reports without flagging as authorized.
 */
export const onReportCorroboration = onDocumentCreated(
  'safety_reports/{reportId}/comments/{commentId}',
  async (event) => {
    const reportId = event.params.reportId;
    const reportRef = db.collection('safety_reports').doc(reportId);
    const snap = await reportRef.get();
    if (!snap.exists) return;

    const data = snap.data();
    if (data && data.verificationStatus === 'unverified' && Number(data.corroborationCount ?? 0) >= 3) {
      await reportRef.update({
        verificationStatus: 'community_corroborated',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  }
);
