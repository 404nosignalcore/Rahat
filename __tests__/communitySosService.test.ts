import {
  acceptCommunitySosResponse,
  cancelCommunitySosByVictim,
  cancelResponderAssistance,
  createCommunitySosRequest,
  expandProximityWave,
  getAvailableCommunityCandidates,
  reportSuspiciousResponder,
  resolveCommunitySos,
  setResponderArrived,
  setResponderOnTheWay,
  WAVE_RADII,
} from '../src/services/communitySosService';
import { CommunityResponder } from '../src/types/safety';

describe('Community SOS Rescue Network Service', () => {
  const dummyVictim = {
    uid: 'victim-123',
    name: 'Ananya Roy',
    phone: '+91 98765 43210',
  };
  const dummyLocation = { lat: 28.6275, lng: 77.2185 };

  test('creates a valid community SOS request with unique ID and initial audit log', () => {
    const req = createCommunitySosRequest(
      dummyVictim,
      dummyLocation,
      'personal_safety',
      'Need help near metro station'
    );

    expect(req.id).toMatch(/^REQ-\d{4}-\d{4}$/);
    expect(req.victimUid).toBe('victim-123');
    expect(req.victimName).toBe('Ananya Roy');
    expect(req.emergencyCategory).toBe('personal_safety');
    expect(req.status).toBe('broadcasting');
    expect(req.currentWave).toBe(1);
    expect(req.waveRadiusMeters).toBe(WAVE_RADII[1]);
    expect(req.auditLog.length).toBeGreaterThan(0);
    expect(req.responders.length).toBe(0);
  });

  test('expands proximity wave correctly up to wave 3 (2000m)', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    expect(req.currentWave).toBe(1);

    req = expandProximityWave(req);
    expect(req.currentWave).toBe(2);
    expect(req.waveRadiusMeters).toBe(1000);

    req = expandProximityWave(req);
    expect(req.currentWave).toBe(3);
    expect(req.waveRadiusMeters).toBe(2000);

    // Should not expand beyond 3
    req = expandProximityWave(req);
    expect(req.currentWave).toBe(3);
  });

  test('enforces atomic cap of exactly 3 responders', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    const candidates = getAvailableCommunityCandidates(dummyLocation.lat, dummyLocation.lng);

    expect(candidates.length).toBeGreaterThanOrEqual(3);

    // Responder 1 accepts
    const res1 = acceptCommunitySosResponse(req, candidates[0]);
    expect(res1.ok).toBe(true);
    req = res1.request;
    expect(req.responders.length).toBe(1);

    // Responder 2 accepts
    const res2 = acceptCommunitySosResponse(req, candidates[1]);
    expect(res2.ok).toBe(true);
    req = res2.request;
    expect(req.responders.length).toBe(2);

    // Responder 3 accepts
    const res3 = acceptCommunitySosResponse(req, candidates[2]);
    expect(res3.ok).toBe(true);
    req = res3.request;
    expect(req.responders.length).toBe(3);

    // Responder 4 attempts to accept -> MUST BE BLOCKED
    if (candidates[3]) {
      const res4 = acceptCommunitySosResponse(req, candidates[3]);
      expect(res4.ok).toBe(false);
      expect(res4.error).toMatch(/Maximum 3 responders are already assigned/);
      expect(req.responders.length).toBe(3);
    }
  });

  test('prevents duplicate assignment of the same responder', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    const candidates = getAvailableCommunityCandidates(dummyLocation.lat, dummyLocation.lng);

    const res1 = acceptCommunitySosResponse(req, candidates[0]);
    expect(res1.ok).toBe(true);
    req = res1.request;

    // Duplicate attempt
    const resDuplicate = acceptCommunitySosResponse(req, candidates[0]);
    expect(resDuplicate.ok).toBe(false);
    expect(resDuplicate.error).toMatch(/already assigned/);
  });

  test('tracks responder travel and arrival states with audit logs', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    const candidates = getAvailableCommunityCandidates(dummyLocation.lat, dummyLocation.lng);
    const res = acceptCommunitySosResponse(req, candidates[0]);
    req = res.request;

    // On the way
    req = setResponderOnTheWay(req, candidates[0].id);
    const enRoute = req.responders.find((r) => r.id === candidates[0].id);
    expect(enRoute?.status).toBe('on_the_way');
    expect(enRoute?.startedAt).toBeDefined();

    // Arrived
    req = setResponderArrived(req, candidates[0].id);
    const arrived = req.responders.find((r) => r.id === candidates[0].id);
    expect(arrived?.status).toBe('arrived');
    expect(arrived?.arrivedAt).toBeDefined();
    expect(arrived?.distanceMeters).toBe(0);
    expect(req.status).toBe('arrived');
  });

  test('responder disengagement allows replacement and records cancellation', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    const candidates = getAvailableCommunityCandidates(dummyLocation.lat, dummyLocation.lng);

    // Assign 3 responders
    req = acceptCommunitySosResponse(req, candidates[0]).request;
    req = acceptCommunitySosResponse(req, candidates[1]).request;
    req = acceptCommunitySosResponse(req, candidates[2]).request;

    // One responder cancels
    req = cancelResponderAssistance(req, candidates[1].id, 'Emergency call conflict');
    const cancelled = req.responders.find((r) => r.id === candidates[1].id);
    expect(cancelled?.status).toBe('cancelled');

    const activeResponders = req.responders.filter((r) => r.status !== 'cancelled');
    expect(activeResponders.length).toBe(2);

    // Now another candidate (candidate 3) can accept because slot freed up!
    if (candidates[3]) {
      const resReplacement = acceptCommunitySosResponse(req, candidates[3]);
      expect(resReplacement.ok).toBe(true);
      expect(resReplacement.request.responders.filter((r) => r.status !== 'cancelled').length).toBe(3);
    }
  });

  test('victim cancellation stops response and seals audit log', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    req = cancelCommunitySosByVictim(req, "Found my friends, I'm safe now.");
    expect(req.status).toBe('cancelled');
    expect(req.isCancelled).toBe(true);
    expect(req.cancelReason).toBe("Found my friends, I'm safe now.");

    // No further acceptances allowed
    const candidates = getAvailableCommunityCandidates(dummyLocation.lat, dummyLocation.lng);
    const attempt = acceptCommunitySosResponse(req, candidates[0]);
    expect(attempt.ok).toBe(false);
  });

  test('suspicious responder report disengages responder and logs security event', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    const candidates = getAvailableCommunityCandidates(dummyLocation.lat, dummyLocation.lng);
    req = acceptCommunitySosResponse(req, candidates[0]).request;

    req = reportSuspiciousResponder(req, candidates[0].id, 'Inappropriate verbal comments');
    const reported = req.responders.find((r) => r.id === candidates[0].id);
    expect(reported?.status).toBe('cancelled');

    const suspiciousLog = req.auditLog.find((l) => l.type === 'suspicious_behavior_reported');
    expect(suspiciousLog).toBeDefined();
    expect(suspiciousLog?.message).toContain('Inappropriate verbal comments');
  });

  test('resolving emergency seals request safely', () => {
    let req = createCommunitySosRequest(dummyVictim, dummyLocation);
    req = resolveCommunitySos(req);
    expect(req.status).toBe('resolved');
    expect(req.auditLog.some((l) => l.type === 'resolved')).toBe(true);
  });
});
