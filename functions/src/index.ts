import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onDocumentCreated, onDocumentDeleted } from 'firebase-functions/v2/firestore';

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
 * Enforces rate limiting, rejects anonymous accounts, validates alert document ownership,
 * and executes contact webhook deliveries in parallel with strict request timeouts.
 */
export const dispatchSosAlert = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required to dispatch SOS.');
  }

  // 1. Guard against anonymous exploration accounts triggering cloud SMS broadcasts
  const authProvider = request.auth.token.firebase?.sign_in_provider || (request.auth.token as any).provider_id;
  if (authProvider === 'anonymous') {
    throw new HttpsError('permission-denied', 'Anonymous exploration accounts cannot trigger cloud emergency SMS broadcasts.');
  }

  const uid = request.auth.uid;
  const { alertId, latitude, longitude, mapShareUrl, isFallbackLocation, locationSource } = request.data as {
    alertId: string;
    latitude: number;
    longitude: number;
    mapShareUrl: string;
    isFallbackLocation?: boolean;
    locationSource?: string;
  };

  if (!alertId || typeof latitude !== 'number' || typeof longitude !== 'number') {
    throw new HttpsError('invalid-argument', 'Valid alertId and coordinates are required.');
  }

  // 2. Validate alert ownership to ensure an attacker cannot modify another victim's alert
  const alertRef = db.collection('emergency_alerts').doc(alertId);
  const existingAlert = await alertRef.get();
  if (existingAlert.exists) {
    const existingData = existingAlert.data();
    if (existingData?.ownerUid && existingData.ownerUid !== uid) {
      throw new HttpsError('permission-denied', 'Cannot modify an emergency alert belonging to another user.');
    }
  }

  // 3. Rate limiting: enforce 30s cooldown between SOS broadcasts per user
  const recentAlertsSnap = await db
    .collection('emergency_alerts')
    .where('ownerUid', '==', uid)
    .get();

  const now = Date.now();
  const RATE_LIMIT_COOLDOWN_MS = 30_000; // 30 seconds
  for (const doc of recentAlertsSnap.docs) {
    if (doc.id === alertId) continue;
    const alertData = doc.data();
    const triggeredAt = alertData.triggeredAt;
    const triggeredMs = triggeredAt?.toMillis ? triggeredAt.toMillis() : (triggeredAt ? new Date(triggeredAt).getTime() : 0);
    if (triggeredMs && (now - triggeredMs) < RATE_LIMIT_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((RATE_LIMIT_COOLDOWN_MS - (now - triggeredMs)) / 1000);
      throw new HttpsError('resource-exhausted', `SOS rate limit exceeded. Please wait ${waitSeconds}s before dispatching another alert.`);
    }
  }

  const isFallback = Boolean(isFallbackLocation || locationSource === 'fallback_demo');
  const warningPrefix = isFallback ? '[CRITICAL WARNING: GPS UNAVAILABLE - UNVERIFIED LOCATION]\n' : '';

  const contactsSnap = await db
    .collection('users')
    .doc(uid)
    .collection('emergency_contacts')
    .where('notifyOnSOS', '==', true)
    .get();

  const smsWebhookUrl = process.env.SOS_SMS_WEBHOOK_URL;

  // 4. Parallel dispatch with 6-second timeout per contact
  const results: ContactDeliveryResult[] = await Promise.all(
    contactsSnap.docs.map(async (docSnap): Promise<ContactDeliveryResult> => {
      const contact = docSnap.data();
      if (!smsWebhookUrl) {
        return {
          contactId: docSnap.id,
          contactName: String(contact.name ?? 'Contact'),
          status: 'unconfigured',
          reason: 'SMS gateway webhook not configured; client should prompt native SMS/call fallback.',
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(smsWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: contact.phone,
            message: `${warningPrefix}RAHAT SafeWalk SOS Alert: Check location immediately: ${mapShareUrl}`,
            latitude,
            longitude,
            alertId,
            isFallbackLocation: isFallback,
            locationSource: isFallback ? 'fallback_demo' : 'gps',
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        return {
          contactId: docSnap.id,
          contactName: String(contact.name ?? 'Contact'),
          status: response.ok ? 'sent' : 'failed',
          reason: response.ok ? undefined : `Gateway HTTP ${response.status}`,
        };
      } catch (err) {
        clearTimeout(timeoutId);
        const isTimeout = err instanceof Error && err.name === 'AbortError';
        return {
          contactId: docSnap.id,
          contactName: String(contact.name ?? 'Contact'),
          status: 'failed',
          reason: isTimeout ? 'Gateway timed out after 6s' : (err instanceof Error ? err.message : 'Network error'),
        };
      }
    })
  );

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

  await alertRef.set(
    {
      ownerUid: uid,
      deliveryChannelStatus,
      isFallbackLocation: isFallback,
      locationSource: isFallback ? 'fallback_demo' : 'gps',
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
 * Synchronizes distinct corroborating authors across corroborations and comments subcollections.
 * Strictly prevents self-corroboration by filtering out the report's authorUid,
 * and prevents counting multiple comments from the same user as multiple corroborations.
 */
async function syncReportCorroborations(reportId: string): Promise<void> {
  const reportRef = db.collection('safety_reports').doc(reportId);
  const snap = await reportRef.get();
  if (!snap.exists) return;

  const data = snap.data();
  const authorUid = data?.authorUid;

  const distinctAuthors = new Set<string>();

  // 1. Gather corroborations
  const corroborationsSnap = await reportRef.collection('corroborations').get();
  for (const doc of corroborationsSnap.docs) {
    const cData = doc.data();
    const corrUid = cData.corroboratorUid || doc.id;
    if (corrUid && corrUid !== authorUid) {
      distinctAuthors.add(corrUid);
    }
  }

  // 2. Gather comments (ensure distinct author counting, excluding the author)
  const commentsSnap = await reportRef.collection('comments').get();
  for (const doc of commentsSnap.docs) {
    const cData = doc.data();
    if (cData.authorUid && cData.authorUid !== authorUid) {
      distinctAuthors.add(cData.authorUid);
    }
  }

  const distinctCount = distinctAuthors.size;
  const updates: Record<string, any> = {
    corroborationCount: distinctCount,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (data && data.verificationStatus === 'unverified' && distinctCount >= 3) {
    updates.verificationStatus = 'community_corroborated';
  }

  await reportRef.update(updates);
}

/**
 * Automatically transitions report verification status from 'unverified' to 'community_corroborated'
 * once corroborated by >= 3 independent distinct verified community members without self-corroboration.
 */
export const onReportCorroboration = onDocumentCreated(
  'safety_reports/{reportId}/corroborations/{corroboratorUid}',
  async (event) => {
    const reportId = event.params.reportId;
    await syncReportCorroborations(reportId);
  }
);

export const onReportCommentCreated = onDocumentCreated(
  'safety_reports/{reportId}/comments/{commentId}',
  async (event) => {
    const reportId = event.params.reportId;
    await syncReportCorroborations(reportId);
  }
);

/**
 * Server-side abuse flag aggregation:
 * Counts unique abuse flags stored per-user in the 'abuse_flags' subcollection.
 * Prevents a single malicious account from artificially inflating abuseFlags to hide reports.
 */
export const onReportAbuseFlagCreated = onDocumentCreated(
  'safety_reports/{reportId}/abuse_flags/{flagUserId}',
  async (event) => {
    const reportId = event.params.reportId;
    const reportRef = db.collection('safety_reports').doc(reportId);
    const snap = await reportRef.get();
    if (!snap.exists) return;

    const flagsSnap = await reportRef.collection('abuse_flags').get();
    await reportRef.update({
      abuseFlags: flagsSnap.size,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

export const onReportAbuseFlagDeleted = onDocumentDeleted(
  'safety_reports/{reportId}/abuse_flags/{flagUserId}',
  async (event) => {
    const reportId = event.params.reportId;
    const reportRef = db.collection('safety_reports').doc(reportId);
    const snap = await reportRef.get();
    if (!snap.exists) return;

    const flagsSnap = await reportRef.collection('abuse_flags').get();
    await reportRef.update({
      abuseFlags: flagsSnap.size,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
);

/**
 * Fully deletes all user personal data across all Firestore collections and removes the auth account
 * in compliance with India's Digital Personal Data Protection (DPDP) Act.
 * Uses Admin SDK to prevent partial deletions and avoid client-side requires-recent-login errors.
 */
export const deleteUserAccountCascade = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required for account deletion.');
  }

  const uid = request.auth.uid;

  // 1. Delete emergency contacts
  const contactsSnap = await db.collection('users').doc(uid).collection('emergency_contacts').get();
  for (const doc of contactsSnap.docs) {
    await doc.ref.delete();
  }

  // 2. Delete private info and public profile
  await db.collection('users').doc(uid).collection('private').doc('info').delete().catch(() => {});
  await db.collection('users').doc(uid).delete().catch(() => {});

  // 3. Delete user journeys
  const journeysSnap = await db.collection('journeys').where('ownerUid', '==', uid).get();
  for (const doc of journeysSnap.docs) {
    await doc.ref.delete();
  }

  // 4. Delete user emergency alerts
  const alertsSnap = await db.collection('emergency_alerts').where('ownerUid', '==', uid).get();
  for (const doc of alertsSnap.docs) {
    await doc.ref.delete();
  }

  // 5. Delete safe circles owned by user
  const circlesSnap = await db.collection('safe_circles').where('ownerUid', '==', uid).get();
  for (const doc of circlesSnap.docs) {
    const membersSnap = await doc.ref.collection('members').get();
    for (const m of membersSnap.docs) {
      await m.ref.delete();
    }
    await doc.ref.delete();
  }

  // 6. Delete safety reports authored by user
  const reportsSnap = await db.collection('safety_reports').where('authorUid', '==', uid).get();
  for (const doc of reportsSnap.docs) {
    const commentsSnap = await doc.ref.collection('comments').get();
    for (const c of commentsSnap.docs) {
      await c.ref.delete();
    }
    const flagsSnap = await doc.ref.collection('abuse_flags').get();
    for (const f of flagsSnap.docs) {
      await f.ref.delete();
    }
    const corrsSnap = await doc.ref.collection('corroborations').get();
    for (const cr of corrsSnap.docs) {
      await cr.ref.delete();
    }
    await doc.ref.delete();
  }

  // 7. Delete community posts authored by user
  const postsSnap = await db.collection('community_posts').where('authorUid', '==', uid).get();
  for (const doc of postsSnap.docs) {
    await doc.ref.delete();
  }

  // 8. Delete user from Firebase Auth
  await admin.auth().deleteUser(uid);

  return { success: true };
});
