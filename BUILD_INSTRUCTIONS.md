# SafeWalk — Android Development & Build Guide 📱

This guide outlines how to build and run SafeWalk on Android physical devices, Android emulators, and generate release APK/AAB packages.

---

## 1. Quick Testing with Expo Go (Fastest)

1. Install **Expo Go** from Google Play Store on your Android phone.
2. Ensure your computer and Android device are on the same Wi-Fi network.
3. In this project folder, run:
   ```bash
   npx expo start
   ```
4. Scan the displayed QR code with the Expo Go app (or camera) on Android.

---

## 2. Local Android Emulator Setup

1. Open **Android Studio** and launch an Android Virtual Device (AVD with Android 11+ / API 30+ recommended).
2. Start the development server targeting Android:
   ```bash
   npm run android
   ```
3. Expo will automatically detect the running emulator, install Expo Go, and stream the application with live Fast Refresh.

---

## 3. Building Standalone Android APK (Production Build)

To build a standalone APK without requiring Expo Go:

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Configure EAS Build
```bash
eas build:configure
```

Create or verify `eas.json`:
```json
{
  "cli": {
    "version": ">= 12.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Step 3: Trigger Android Build
```bash
# Build standalone APK for direct installation on any Android phone:
eas build --platform android --profile preview

# Build production Android App Bundle (AAB) for Google Play Store:
eas build --platform android --profile production
```

---

## 4. Key Android Permissions Declared

The following permissions are configured in `app.json` and `AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION`: Required for high-accuracy GPS tracking during journeys.
- `ACCESS_COARSE_LOCATION`: Required for initial cell/Wi-Fi area locating.
- `ACCESS_BACKGROUND_LOCATION`: Required for active journey monitoring and route deviation alerts when the screen is locked.
- `FOREGROUND_SERVICE` & `FOREGROUND_SERVICE_LOCATION`: Displays an active ongoing notification ("SafeWalk Journey Active") during live trips.
- `VIBRATE`: Provides haptic feedback during SOS countdown and deviation alarms.
- `POST_NOTIFICATIONS`: Delivers local emergency updates and SafeCircle alerts.

