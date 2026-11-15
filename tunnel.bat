@echo off
echo ==============================================================
echo   Starting Rahat with Real-Time Port Forwarding Tunnel
echo ==============================================================
set EXPO_NO_TELEMETRY=1
node scripts/free-port.js
node scripts/patch-expo-modules.js
npx.cmd expo start --port 8081 --tunnel ngrok
pause
