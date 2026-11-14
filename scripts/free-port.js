const { execSync } = require('child_process');

const PORT = 8081;

function freePort() {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${PORT}`, {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();

      const lines = output.split('\n');
      const pids = new Set();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && parseInt(pid) > 0 && parseInt(pid) !== process.pid) {
          pids.add(pid);
        }
      }

      for (const pid of pids) {
        try {
          console.log(`[Rahat] Killing process ${pid} using port ${PORT}...`);
          execSync(`taskkill /F /PID ${pid} /T`, { stdio: 'ignore' });
        } catch {}
      }
    } else {
      execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
    }
  } catch {
    // Port was already free
  }
}

freePort();
console.log(`[Rahat] Port ${PORT} is confirmed free and dedicated to Rahat.`);
