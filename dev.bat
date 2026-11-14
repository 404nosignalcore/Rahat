@echo off
set EXPO_NO_TELEMETRY=1
node scripts/free-port.js
npx.cmd expo start --port 8081 --lan
