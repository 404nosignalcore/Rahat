const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');
const SERVER_API_TOKEN = process.env.RAHAT_API_TOKEN || '';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const MAX_ACTIVE_ALERTS = 50;
const MAX_LIVE_LOCATIONS = 100;
const MAX_SSE_CLIENTS = 100;
const MAX_BODY_BYTES = 64 * 1024; // 64 KB limit to prevent OOM/DoS

// Real-time Event Subscriptions (SSE Clients)
const sseClients = new Set();

// In-Memory Real-Time State (Bounded buffers to prevent unbounded memory growth)
const state = {
  activeSosAlerts: [],
  liveLocations: {},
  communityReports: [],
};

function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();

function isOriginAllowed(origin) {
  if (!origin) return true; // non-browser clients (native mobile apps, curl)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const u = new URL(origin);
    if (u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === localIp) {
      return true;
    }
  } catch {}
  return false;
}

function isAuthorized(req, parsedUrl) {
  const authHeader = req.headers['authorization'] || '';
  const tokenParam = parsedUrl ? parsedUrl.searchParams.get('token') : null;
  let token = '';
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (tokenParam) {
    token = tokenParam.trim();
  }

  if (SERVER_API_TOKEN) {
    return token === SERVER_API_TOKEN;
  }
  // When no dedicated server token is configured in env, require a valid non-empty bearer token (min 8 chars)
  return Boolean(token && token.length >= 8);
}

function readJsonBody(req, res, callback) {
  let body = '';
  let length = 0;
  let aborted = false;

  req.on('data', (chunk) => {
    if (aborted) return;
    length += chunk.length;
    if (length > MAX_BODY_BYTES) {
      aborted = true;
      res.writeHead(413, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Payload Too Large (Max 64KB)' }));
      req.destroy();
      return;
    }
    body += chunk;
  });

  req.on('end', () => {
    if (aborted) return;
    try {
      const data = JSON.parse(body || '{}');
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  });

  req.on('error', (err) => {
    if (!aborted) callback(err);
  });
}

function pruneLiveLocations() {
  const now = Date.now();
  const cutoff = now - 30 * 60 * 1000; // 30 minutes
  const keys = Object.keys(state.liveLocations);
  for (const k of keys) {
    if (state.liveLocations[k].timestamp < cutoff) {
      delete state.liveLocations[k];
    }
  }
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  const origin = req.headers['origin'];
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Real-Time SSE Stream Endpoint (Authenticated & Privacy-Preserving)
  if (pathname === '/api/events' && req.method === 'GET') {
    if (!isAuthorized(req, parsedUrl)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: Valid token required to subscribe to events' }));
      return;
    }

    if (sseClients.size >= MAX_SSE_CLIENTS) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Service Unavailable: Max SSE subscribers reached' }));
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // Real-Time SOS Dispatch Webhook Endpoint
  if (pathname === '/api/sos' && req.method === 'POST') {
    if (!isAuthorized(req, parsedUrl)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: Authentication required to dispatch SOS' }));
      return;
    }

    readJsonBody(req, res, async (err, data) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
        return;
      }

      // Input Validation
      if (
        typeof data.latitude !== 'number' ||
        isNaN(data.latitude) ||
        data.latitude < -90 ||
        data.latitude > 90 ||
        typeof data.longitude !== 'number' ||
        isNaN(data.longitude) ||
        data.longitude < -180 ||
        data.longitude > 180
      ) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid coordinates: latitude [-90,90], longitude [-180,180] required' }));
        return;
      }

      const rawContacts = Array.isArray(data.contacts) ? data.contacts.slice(0, 20) : [];
      const sanitizedContacts = rawContacts.map((c) => ({
        id: String(c.id || '').slice(0, 64),
        name: String(c.name || '').slice(0, 100),
        phone: String(c.phone || '').slice(0, 30),
      }));

      const isFallbackLocation = Boolean(data.isFallbackLocation || data.locationSource === 'fallback_demo');
      const locationSource = isFallbackLocation ? 'fallback_demo' : 'gps';

      const alertRecord = {
        alertId: String(data.alertId || `sos-${Date.now()}`).slice(0, 128),
        ownerUid: String(data.ownerUid || 'anonymous').slice(0, 128),
        latitude: data.latitude,
        longitude: data.longitude,
        locationSource,
        isFallbackLocation,
        mapShareUrl: String(data.mapShareUrl || `https://maps.google.com/?q=${data.latitude},${data.longitude}`).slice(0, 256),
        timestamp: new Date().toISOString(),
      };

      // Bounded buffer for in-memory active alerts
      if (state.activeSosAlerts.length >= MAX_ACTIVE_ALERTS) {
        state.activeSosAlerts.shift();
      }
      state.activeSosAlerts.push(alertRecord);

      // PRIVACY PROTECTION: Broadcast only public safety event details.
      // NEVER leak victim's emergency contact names or phone numbers to SSE listeners!
      broadcast('sos_alert', {
        alertId: alertRecord.alertId,
        latitude: alertRecord.latitude,
        longitude: alertRecord.longitude,
        locationSource: alertRecord.locationSource,
        isFallbackLocation: alertRecord.isFallbackLocation,
        mapShareUrl: alertRecord.mapShareUrl,
        timestamp: alertRecord.timestamp,
        contactCount: sanitizedContacts.length,
      });

      console.log(`\n🚨 [RAHAT SOS BROADCAST] Real-time SOS triggered at ${alertRecord.latitude}, ${alertRecord.longitude} (Fallback: ${alertRecord.isFallbackLocation})`);
      console.log(`   Map: ${alertRecord.mapShareUrl}`);

      const smsWebhookUrl = process.env.SOS_SMS_WEBHOOK_URL;
      let results = [];

      if (!smsWebhookUrl) {
        results = sanitizedContacts.map((c) => ({
          contactId: c.id,
          status: 'unconfigured',
          reason: 'SMS gateway webhook not configured; client should prompt native SMS/call fallback.',
        }));
      } else {
        results = await Promise.all(
          sanitizedContacts.map(async (c) => {
            try {
              const response = await fetch(smsWebhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: c.phone,
                  message: alertRecord.isFallbackLocation
                    ? `[WARNING: GPS UNAVAILABLE / UNVERIFIED LOCATION] RAHAT SafeWalk SOS Alert: Check location link: ${alertRecord.mapShareUrl}`
                    : `RAHAT SafeWalk SOS Alert: Check location immediately: ${alertRecord.mapShareUrl}`,
                  latitude: alertRecord.latitude,
                  longitude: alertRecord.longitude,
                  alertId: alertRecord.alertId,
                }),
              });
              return {
                contactId: c.id,
                status: response.ok ? 'sent' : 'failed',
                reason: response.ok ? 'Delivered via SMS gateway' : `Gateway HTTP ${response.status}`,
              };
            } catch (err) {
              return {
                contactId: c.id,
                status: 'failed',
                reason: err instanceof Error ? err.message : 'Network error dispatching SMS',
              };
            }
          })
        );
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, alertId: alertRecord.alertId, results }));
    });
    return;
  }

  // Real-Time Location Update Endpoint
  if (pathname === '/api/location' && req.method === 'POST') {
    if (!isAuthorized(req, parsedUrl)) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Unauthorized: Authentication required for location updates' }));
      return;
    }

    readJsonBody(req, res, (err, data) => {
      if (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Malformed JSON payload' }));
        return;
      }

      if (
        typeof data.latitude !== 'number' ||
        isNaN(data.latitude) ||
        data.latitude < -90 ||
        data.latitude > 90 ||
        typeof data.longitude !== 'number' ||
        isNaN(data.longitude) ||
        data.longitude < -180 ||
        data.longitude > 180 ||
        !data.userId ||
        typeof data.userId !== 'string'
      ) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid location payload: valid userId, latitude, longitude required' }));
        return;
      }

      pruneLiveLocations();
      const loc = {
        userId: String(data.userId).slice(0, 128),
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: Date.now(),
      };

      if (Object.keys(state.liveLocations).length >= MAX_LIVE_LOCATIONS) {
        const oldestKey = Object.keys(state.liveLocations)[0];
        delete state.liveLocations[oldestKey];
      }
      state.liveLocations[loc.userId] = loc;
      broadcast('location_update', loc);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
    return;
  }

  // Health Check Endpoint
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', app: 'Rahat', realTimeClients: sseClients.size }));
    return;
  }

  // Static File Serving from dist/
  let reqPath = decodeURI(pathname);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  let filePath = path.join(DIST_DIR, reqPath);

  // Fallback to index.html for SPA routing
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found (run: npm run build:web to generate dist)');
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
      });
      res.end(content, 'utf-8');
    }
  });
});

const localIp = getLocalIpAddress();

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n==================================================');
  console.log('  🛡️ RAHAT (राहत) Real-Time Server is LIVE!');
  console.log('==================================================');
  console.log(`> Localhost:       http://localhost:${PORT}`);
  console.log(`> Network Phone:   http://${localIp}:${PORT}`);
  console.log(`> Real-Time SOS:   http://localhost:${PORT}/api/sos`);
  console.log(`> Live Events:     http://localhost:${PORT}/api/events`);
  console.log('==================================================\n');
});
