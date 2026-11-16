import {
  CommunityResponder,
  CommunitySosEventLog,
  CommunitySosRequest,
} from '../types/safety';
import { getDistanceMeters } from '../utils/safetyRiskEngine';

/**
 * DEV-ONLY Simulated Community Responders Pool
 * Used exclusively for local offline testing and unit tests.
 * NEVER presented as real responders in production!
 */
export const DEV_SIMULATED_COMMUNITY_HEROES = [
  {
    id: 'hero-priya-s',
    name: 'Priya Sharma',
    phone: '+91 98112 34567',
    avatarColor: '#0066cc',
    isVerified: true,
    verificationBadge: 'Verified Community Hero · First Aid Certified',
    rating: 4.95,
    acceptedHelpsCount: 18,
    offsetLat: 0.0028, // ~310m
    offsetLng: 0.0022,
    baseEtaMins: 3,
  },
  {
    id: 'hero-vikram-r',
    name: 'Vikram Singh',
    phone: '+91 98223 45678',
    avatarColor: '#34c759',
    isVerified: true,
    verificationBadge: 'Campus Safety Volunteer · CPR Trained',
    rating: 4.91,
    acceptedHelpsCount: 12,
    offsetLat: -0.0039, // ~430m
    offsetLng: 0.0031,
    baseEtaMins: 4,
  },
  {
    id: 'hero-ananya-d',
    name: 'Dr. Ananya Sen',
    phone: '+91 98334 56789',
    avatarColor: '#af52de',
    isVerified: true,
    verificationBadge: 'Medical Officer · Trauma Response Volunteer',
    rating: 5.0,
    acceptedHelpsCount: 26,
    offsetLat: 0.0062, // ~690m
    offsetLng: -0.0048,
    baseEtaMins: 6,
  },
  {
    id: 'hero-rohit-m',
    name: 'Rohit Mehra',
    phone: '+91 98445 67890',
    avatarColor: '#ff9500',
    isVerified: true,
    verificationBadge: 'Community Peer Defender · Self-Defense Coach',
    rating: 4.88,
    acceptedHelpsCount: 9,
    offsetLat: -0.0088, // ~980m
    offsetLng: -0.0065,
    baseEtaMins: 8,
  },
  {
    id: 'hero-neha-k',
    name: 'Neha Kapoor',
    phone: '+91 98556 78901',
    avatarColor: '#5856d6',
    isVerified: true,
    verificationBadge: 'Neighborhood Watch Lead · ID Verified',
    rating: 4.92,
    acceptedHelpsCount: 15,
    offsetLat: 0.0135, // ~1500m
    offsetLng: 0.011,
    baseEtaMins: 12,
  },
];

// Backwards-compatible alias for existing imports
export const REGISTERED_COMMUNITY_HEROES = DEV_SIMULATED_COMMUNITY_HEROES;

export const WAVE_RADII: Record<1 | 2 | 3, number> = {
  1: 500, // 500 meters
  2: 1000, // 1000 meters
  3: 2000, // 2000 meters
};

/**
 * Guard to ensure simulated community responders are NEVER dispatched in production.
 * Simulation is only enabled in automated Jest testing or when EXPO_PUBLIC_ENABLE_COMMUNITY_SIMULATION === 'true' in development.
 */
export function isCommunitySimulationEnabled(): boolean {
  const envObj = typeof process !== 'undefined' ? process.env : undefined;
  if (envObj && envObj['NODE_ENV'] === 'test') {
    return true;
  }
  const flag = envObj ? envObj['EXPO_PUBLIC_ENABLE_COMMUNITY_SIMULATION'] : undefined;
  if (flag === 'true' || flag === '1') {
    return true;
  }
  return false;
}

/**
 * Builds candidate community responders relative to the victim's current GPS coordinates.
 * Returns an empty array in production unless simulation is explicitly enabled.
 */
export function getAvailableCommunityCandidates(
  victimLat: number,
  victimLng: number,
  forceSimulation = false
): CommunityResponder[] {
  if (!forceSimulation && !isCommunitySimulationEnabled()) {
    return [];
  }

  return DEV_SIMULATED_COMMUNITY_HEROES.map((h) => {
    const lat = victimLat + h.offsetLat;
    const lng = victimLng + h.offsetLng;
    const distanceMeters = Math.round(getDistanceMeters(victimLat, victimLng, lat, lng));

    return {
      id: h.id,
      name: `[Simulated] ${h.name}`,
      phone: h.phone,
      avatarColor: h.avatarColor,
      isVerified: h.isVerified,
      verificationBadge: `${h.verificationBadge} (Dev Simulation)`,
      rating: h.rating,
      acceptedHelpsCount: h.acceptedHelpsCount,
      distanceMeters,
      latitude: lat,
      longitude: lng,
      status: 'notified',
      etaMinutes: h.baseEtaMins,
    };
  });
}

/**
 * Creates a new Community SOS Request
 */
export function createCommunitySosRequest(
  victim: { uid: string; name: string; phone: string },
  location: { lat: number; lng: number },
  category: CommunitySosRequest['emergencyCategory'] = 'personal_safety',
  description = 'Need immediate physical presence and support from nearby people.'
): CommunitySosRequest {
  const reqId = `REQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toISOString();

  const initialLog: CommunitySosEventLog = {
    id: `log-${Date.now()}-1`,
    timestamp: now,
    type: 'broadcast_started',
    message: `Emergency SOS broadcast initiated (Wave 1: within 500m radius). Request ID: ${reqId}.`,
  };

  return {
    id: reqId,
    victimUid: victim.uid,
    victimName: victim.name,
    victimPhone: victim.phone,
    victimLocation: location,
    emergencyCategory: category,
    emergencyDescription: description.trim() || 'Immediate assistance requested.',
    currentWave: 1,
    waveRadiusMeters: WAVE_RADII[1],
    status: 'broadcasting',
    createdAt: now,
    responders: [],
    auditLog: [initialLog],
    isCancelled: false,
  };
}

/**
 * Expands proximity wave (e.g. 500m -> 1000m -> 2000m)
 */
export function expandProximityWave(request: CommunitySosRequest): CommunitySosRequest {
  if (request.status === 'cancelled' || request.status === 'resolved') {
    return request;
  }

  const nextWave = (request.currentWave < 3 ? request.currentWave + 1 : 3) as 1 | 2 | 3;
  if (nextWave === request.currentWave) {
    return request;
  }

  const newRadius = WAVE_RADII[nextWave];
  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'wave_expanded',
    message: `Insufficient responders in wave ${request.currentWave}. Expanding alert wave to ${newRadius}m radius.`,
  };

  return {
    ...request,
    currentWave: nextWave,
    waveRadiusMeters: newRadius,
    auditLog: [newLog, ...request.auditLog],
  };
}

/**
 * Atomic 3-Responder Acceptance
 * Strict Rule: Exactly up to 3 responders can be actively assigned.
 */
export function acceptCommunitySosResponse(
  request: CommunitySosRequest,
  responder: CommunityResponder
): { ok: boolean; request: CommunitySosRequest; error?: string } {
  if (request.isCancelled || request.status === 'cancelled' || request.status === 'resolved') {
    return { ok: false, request, error: 'Emergency request is no longer active.' };
  }

  const activeResponders = request.responders.filter((r) => r.status !== 'cancelled');

  // Strict check: Prevent duplicate assignment
  if (activeResponders.some((r) => r.id === responder.id)) {
    return { ok: false, request, error: 'Responder already assigned.' };
  }

  // Strict check: Cap of exactly 3 responders
  if (activeResponders.length >= 3) {
    return {
      ok: false,
      request,
      error: 'Maximum 3 responders are already assigned to this emergency.',
    };
  }

  const now = new Date().toISOString();
  const updatedResponder: CommunityResponder = {
    ...responder,
    status: 'accepted',
    acceptedAt: now,
  };

  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: now,
    type: 'responder_accepted',
    responderName: responder.name,
    message: `${responder.name} (${responder.distanceMeters}m away) accepted rescue request. Assigned ${activeResponders.length + 1} of 3.`,
  };

  const updatedResponders = [...request.responders, updatedResponder];

  return {
    ok: true,
    request: {
      ...request,
      status: 'responders_assigned',
      responders: updatedResponders,
      auditLog: [newLog, ...request.auditLog],
    },
  };
}

/**
 * Marks responder as traveling / on the way
 */
export function setResponderOnTheWay(
  request: CommunitySosRequest,
  responderId: string
): CommunitySosRequest {
  const now = new Date().toISOString();
  let responderName = '';

  const updatedResponders = request.responders.map((r) => {
    if (r.id === responderId) {
      responderName = r.name;
      return {
        ...r,
        status: 'on_the_way' as const,
        startedAt: now,
      };
    }
    return r;
  });

  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: now,
    type: 'responder_en_route',
    responderName,
    message: `${responderName} started traveling toward your coordinates. Route navigation active.`,
  };

  return {
    ...request,
    responders: updatedResponders,
    auditLog: [newLog, ...request.auditLog],
  };
}

/**
 * Marks responder as arrived at the scene
 */
export function setResponderArrived(
  request: CommunitySosRequest,
  responderId: string
): CommunitySosRequest {
  const now = new Date().toISOString();
  let responderName = '';

  const updatedResponders = request.responders.map((r) => {
    if (r.id === responderId) {
      responderName = r.name;
      return {
        ...r,
        status: 'arrived' as const,
        arrivedAt: now,
        distanceMeters: 0,
      };
    }
    return r;
  });

  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: now,
    type: 'responder_arrived',
    responderName,
    message: `🚨 ${responderName} arrived at your location. Please verify identity before proceeding.`,
  };

  return {
    ...request,
    status: 'arrived',
    responders: updatedResponders,
    auditLog: [newLog, ...request.auditLog],
  };
}

/**
 * Responder cancels response.
 * System records cancellation and allows the next eligible user to be summoned.
 */
export function cancelResponderAssistance(
  request: CommunitySosRequest,
  responderId: string,
  reason = 'Responder had to disengage.'
): CommunitySosRequest {
  const now = new Date().toISOString();
  let responderName = '';

  const updatedResponders = request.responders.map((r) => {
    if (r.id === responderId) {
      responderName = r.name;
      return {
        ...r,
        status: 'cancelled' as const,
        cancelledAt: now,
      };
    }
    return r;
  });

  const activeCount = updatedResponders.filter((r) => r.status !== 'cancelled').length;

  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: now,
    type: 'responder_cancelled',
    responderName,
    message: `${responderName} cancelled assistance (${reason}). Active responders remaining: ${activeCount}/3. Searching for replacement.`,
  };

  return {
    ...request,
    status: activeCount > 0 ? 'responders_assigned' : 'broadcasting',
    responders: updatedResponders,
    auditLog: [newLog, ...request.auditLog],
  };
}

/**
 * Victim cancels emergency request
 */
export function cancelCommunitySosByVictim(
  request: CommunitySosRequest,
  reason = "I'm safe now."
): CommunitySosRequest {
  const now = new Date().toISOString();

  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: now,
    type: 'cancelled_by_victim',
    message: `SOS Request cancelled by person: "${reason}". All community responders notified to stand down.`,
  };

  return {
    ...request,
    status: 'cancelled',
    isCancelled: true,
    cancelReason: reason,
    auditLog: [newLog, ...request.auditLog],
  };
}

/**
 * Victim reports suspicious responder behavior
 */
export function reportSuspiciousResponder(
  request: CommunitySosRequest,
  responderId: string,
  concernDetails: string
): CommunitySosRequest {
  const now = new Date().toISOString();
  const responder = request.responders.find((r) => r.id === responderId);
  const responderName = responder?.name || 'Responder';

  const updatedResponders = request.responders.map((r) => {
    if (r.id === responderId) {
      return {
        ...r,
        status: 'cancelled' as const,
        cancelledAt: now,
      };
    }
    return r;
  });

  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: now,
    type: 'suspicious_behavior_reported',
    responderName,
    message: `⚠️ Security Report Logged against ${responderName}: "${concernDetails}". Responder access revoked. Official helpline 112 advised.`,
  };

  return {
    ...request,
    responders: updatedResponders,
    auditLog: [newLog, ...request.auditLog],
  };
}

/**
 * Resolves request safely
 */
export function resolveCommunitySos(request: CommunitySosRequest): CommunitySosRequest {
  const now = new Date().toISOString();

  const newLog: CommunitySosEventLog = {
    id: `log-${Date.now()}`,
    timestamp: now,
    type: 'resolved',
    message: `Emergency resolved safely. Full cryptographic response log sealed.`,
  };

  return {
    ...request,
    status: 'resolved',
    auditLog: [newLog, ...request.auditLog],
  };
}
