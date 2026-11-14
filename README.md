# Rahat (राहत) 🛡️
### AI-Powered Women's Personal Safety & Community Mobile Application

> *"A step towards freedom. A movement towards safety."*  
> *"आज़ादी की ओर एक कदम। सुरक्षा की ओर एक आंदोलन।"*

**Rahat** is a production-grade, privacy-conscious mobile application built with **React Native**, **Expo SDK 58**, **TypeScript**, and **Firebase**. It provides preventive awareness, explainable safety zones, intelligent route monitoring, anti-false-alarm route deviation detection, multi-contact SOS emergency dispatch with offline SMS fallback, bilingual English & Hindi support, and community-powered safety intelligence.

---

## 🌟 Key Features & Architecture

### 1. Bilingual Support (English & हिन्दी)
- One-tap language toggle on the top navigation bar (`EN` ⇄ `हिं`).
- All tabs, category labels, risk levels, emergency disclosures, and deviation alerts are fully translated into fluent Hindi and English.

### 2. Five Core Bottom Navigation Tabs
- **Tab 1: SafeZone (सेफज़ोन)**:
  - Real-world Delhi NCR geographic safety zones (Connaught Place, Janpath, Mandi House, Hauz Khas Village, Saket District Centre, Cyber City Gurgaon, etc.).
  - **Dynamic Time-of-Day Risk Modifier**: Interactive hour slider simulating risk scores across day, evening, night, and late-night conditions.
  - Transparent verification tiers: `unverified`, `under_review`, `community_corroborated`, and `authorized_verified`.
  - Corroboration ("I was here / Confirm"), abuse flagging, and community comment threads.
- **Tab 2: Route (मार्ग)**:
  - Multi-route comparison: **Safest Route** (max lighting & CCTV), **Quickest Route**, and **Well-Lit Alternative**.
  - Real-time GPS journey tracking with mathematical cross-track deviation detection.
  - GPS loss simulation and recovery testing.
  - SafeCircle live journey sharing.
- **Tab 3: Emergency SOS (आपातकालीन)**:
  - Raised, high-contrast emergency trigger with configurable countdown.
  - Direct Indian emergency dialers: **112** (National Emergency), **1091** (Women Helpline), **100** (Police), **102** (Ambulance).
  - One-tap WhatsApp & SMS alert dispatch containing the exact live Google Maps coordinate link.
  - Loud sensory audio alarm / siren toggle.
- **Tab 4: Connect (कनेक्ट)**:
  - **SafeCircle**: Live consensual location sharing with family, roommates, or college friends with granular member consent switches.
  - **Nearby Help / Safe Havens**: 24/7 pharmacies, pink police booths, hospital ERs, and metro help desks with direct calling.
  - **Safety Community**: Coarse-area safety tips and lighting alerts without exposing private coordinates.
- **Tab 5: Profile & Security (प्रोफ़ाइल)**:
  - Profile identity and emergency contacts CRUD.
  - Granular privacy consents (location consent, background tracking, notification dispatch).
  - **Rahat Wearables Ecosystem**: Simulated companion state for open-hardware Smartwatches and Safety Rings (battery, firmware, discreet BLE trigger simulation).
  - Privacy-compliant account data deletion (GDPR right to be forgotten).

### 3. SafeHeroes Directory (Top-Right Action)
- Verified directory of statutory support helplines (NCW 7827170170, Delhi Police Special Cell for Women, Cyber Crime 1930, One Stop Crisis Centers).

---

## 📐 Anti-False-Alarm Route Deviation Engine

Rahat employs a **Spherical Cross-Track Distance Algorithm**:
1. **Perpendicular Distance**: Computes exact geodesic distance from user's current GPS location to planned path segments.
2. **Urban Buffer Corridor**: Default 75m buffer to eliminate false alarms from tall buildings or GPS drift.
3. **Temporal Filtering**: Requires consecutive off-route readings before prompting the user.
4. **User-Controlled Resolutions**:
   - **I'm Safe**: Acknowledges deviation and applies a 120-second cooldown.
   - **Recalculate Route**: Dynamically routes a new safe path.
   - **Share Location**: Pushes coordinates to SafeCircle.
   - **Activate SOS**: Triggers immediate emergency alert.
*Safety Policy: Rahat NEVER automatically triggers an emergency SOS alert solely due to GPS deviation.*

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node 20/22)
- PowerShell / Command Prompt on Windows, or Bash on macOS/Linux
- **Expo Go** app on your iPhone or Android phone (SDK 58 compatible)

### Running the App
```bash
# Start development server on port 8081
npm run dev
```

> **Automatic Port Management**: The project includes `scripts/free-port.js` which automatically terminates any stale process occupying port 8081 before starting the server.

### Running Tests
```bash
# Run Jest unit test suites
npm test

# Run TypeScript type check
npm run typecheck
```

---

## 🔒 Security & Privacy Commitments
- **No Silent Tracking**: Location is only captured during active user consent or when actively following a route.
- **Truth in Emergency Dispatch**: The app transparently reflects delivery status and provides instant offline SMS / native dialer fallbacks.
- **No Crime Profiling**: Safety scores reflect lighting, crowd density, CCTV, verified safe havens, and community corroborations—never socio-demographic biases.

---
© 2026 Rahat (राहत). Open Source Initiative for Women's Safety.
