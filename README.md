# SafeWalk 🛡️
### AI-Powered Women's Personal Safety & Community Mobile Application

> *"Your safety companion, before, during, and after every journey."*

SafeWalk is a production-oriented, privacy-conscious mobile application built with **React Native**, **Expo**, **TypeScript**, and **Firebase**. It provides preventive awareness, explainable safety zones, intelligent route monitoring, automatic route deviation detection, multi-contact SOS emergency dispatch with offline SMS fallback, and community-powered safety intelligence.

---

## 🌟 Key Capabilities & Architectural Highlights

### 1. Exactly Five Bottom Navigation Tabs + SafeHeroes Entry Point
- **Tab 1: SafeZone** — Home area dashboard with interactive vector map, Green/Yellow/Red zone scoring with explainable indicators (lighting, crowd density, police presence, CCTV coverage), community reporting with verification stages (`unverified`, `under_review`, `corroborated`, `verified_official`), and corroboration comments.
- **Tab 2: Route** — Multi-route comparison engine evaluating distance, duration, and safety score (lighting % and CCTV coverage). Real-time GPS journey tracking with mathematical cross-track deviation detection.
- **Tab 3: SOS (Elevated Center Action)** — A visually enlarged 64dp emergency button. Tapping opens a 5-second countdown with sensory feedback, instant cancel option for accidental taps, multi-contact dispatch, direct 112/911 emergency dialer, and an offline cellular SMS fallback.
- **Tab 4: Connect** — 3 segmented safety networks:
  - **SafeCircle**: Consensual live location sharing with trusted family/friends.
  - **Nearby Help**: Direct directory of police stations, hospitals, pink booths, and 24/7 pharmacies with distance, one-tap calling, and directions.
  - **Safety Community**: Experience sharing and advice without exposing precise private coordinates.
- **Tab 5: Profile & Security** — Emergency contacts CRUD, granular location permission toggles, background tracking consent, route deviation corridor slider (50m–150m), countdown adjuster, privacy policy, and one-tap account deletion.
- **SafeHeroes (Top-Right Action)** — Fast-access modal providing verified national emergency helplines (112, 1091, 181, 1930) and verified women's crisis centers.

---

## 📐 Route Deviation Detection Algorithm

SafeWalk employs a **Cross-Track Distance Algorithm** based on spherical vector geodesics (Haversine cross-track):
1. **Perpendicular Distance**: Computes exact distance in meters from the user's current GPS location to the active route polyline segments.
2. **Buffer Corridor**: Configurable buffer (default 75m) to eliminate false alarms caused by GPS drift or urban canyons.
3. **Temporal Filtering**: Requires at least 2 consecutive out-of-corridor GPS readings spanning $\ge 20$ seconds before displaying the prompt:
   > *"Your location appears to be different from your planned route. Are you okay?"*
4. **Four Distinct Resolution Actions**:
   - **I'm Safe**: Suppresses warnings for 5 minutes and continues journey.
   - **Recalculate Route**: Dynamically routes a new safe path from the current position.
   - **Share My Location**: Pushes real-time coordinates to SafeCircle.
   - **Activate SOS**: Triggers immediate emergency alert.

*Safety Policy: SafeWalk NEVER automatically triggers an emergency SOS alert solely due to GPS deviation.*

---

## 🚨 Emergency SOS & Tiered Offline Fallback

1. **Configurable Countdown**: 5-second default countdown with large visual counter and haptic feedback.
2. **Delivery Guarantee**:
   - **Tier 1 (Online)**: Broadcasts real-time coordinates to Cloud Firestore and triggers push notifications to SafeCircle.
   - **Tier 2 (Offline Fallback)**: If network connectivity is unavailable, automatically composes and launches native SMS dispatch with a Google Maps coordinate link to all selected contacts and opens the native dialer with `112`.
3. **Truth in Delivery**: The UI shows honest delivery receipts (`sent_sms`, `delivered_cloud`, `pending`). It **never** fabricates a claim that police have been dispatched without official API confirmation.

---

## 🗄️ Database Architecture & Security Rules

Designed with strict least-privilege Firestore rules:
- `users/{userId}`: Only the authenticated user can read or write their personal data.
- `safety_reports`: Public read; authenticated create; all community reports begin as `unverified` to prevent misinformation.
- `journeys`: Private to the user; automatically archived upon completion.
- `safe_circles`: Only circle owners and designated members can view active locations.

---

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node v26)
- Expo CLI

### Installation
```bash
# Clone the repository
cd rahat1

# Install dependencies
npm install --legacy-peer-deps
```

### Running the App
```bash
# Start Expo development server
npm start

# Run on Android emulator / connected device
npm run android

# Run in Web browser preview
npm run web
```

### Running Tests
```bash
# Run TypeScript compilation check
npm run typecheck

# Run Jest unit test suite
npm test
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_DEFAULT_EMERGENCY_NUMBER=112
```

> **Note**: When Firebase keys are omitted or set to placeholder values, SafeWalk automatically activates its built-in **Offline Mock & Local Adapter**, allowing full feature testing with realistic seed data immediately.

