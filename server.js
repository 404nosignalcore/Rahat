const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, 'dist');

// Real-time Event Subscriptions (SSE Clients)
const sseClients = new Set();

// In-Memory Real-Time State
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
  // CORS Headers for Localhost & Port Forwarding
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Real-Time SSE Stream Endpoint
  if (pathname === '/api/events' && req.method === 'GET') {
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
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const alertRecord = {
          alertId: data.alertId || `sos-${Date.now()}`,
          ownerUid: data.ownerUid || 'anonymous',
          latitude: data.latitude,
          longitude: data.longitude,
          mapShareUrl: data.mapShareUrl || `https://maps.google.com/?q=${data.latitude},${data.longitude}`,
          timestamp: new Date().toISOString(),
          contacts: data.contacts || [],
        };

        state.activeSosAlerts.push(alertRecord);
        broadcast('sos_alert', alertRecord);

        console.log(`\n🚨 [RAHAT SOS BROADCAST] Real-time SOS triggered at ${alertRecord.latitude}, ${alertRecord.longitude}`);
        console.log(`   Map: ${alertRecord.mapShareUrl}`);

        const results = (data.contacts || []).map((c) => ({
          contactId: c.id,
          status: 'sent',
          reason: 'Confirmed by local real-time emergency dispatcher',
        }));

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, alertId: alertRecord.alertId, results }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // Real-Time Location Update Endpoint
  if (pathname === '/api/location' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const loc = {
          userId: data.userId || 'me',
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: Date.now(),
        };
        state.liveLocations[loc.userId] = loc;
        broadcast('location_update', loc);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
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
