# 📱 TMS — Build Android APK Guide

Complete step-by-step guide to convert TMS into an Android APK using Capacitor.

---

## 🧰 PREREQUISITES — Install These First

| Tool | Download | Notes |
|------|----------|-------|
| **Node.js** (v18+) | https://nodejs.org | Required for Capacitor |
| **Android Studio** | https://developer.android.com/studio | Required to build APK |
| **JDK 17** | Bundled with Android Studio | Do not install separately |
| **Python 3.11+** | Already in your project | For running the backend |

---

## STEP 1 — Set Up Android Studio

1. Download and install **Android Studio**
2. Open Android Studio → **More Actions → SDK Manager**
3. Under **SDK Platforms** tab: install **Android 14 (API 34)**
4. Under **SDK Tools** tab: make sure these are checked:
   - ✅ Android SDK Build-Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
5. Click **Apply → OK**

### Set Environment Variables (Windows)
```
ANDROID_HOME = C:\Users\<YOU>\AppData\Local\Android\Sdk
Add to PATH:  %ANDROID_HOME%\tools
              %ANDROID_HOME%\platform-tools
```

### Set Environment Variables (Mac/Linux)
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk        # Mac
export ANDROID_HOME=$HOME/Android/Sdk                # Linux
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

---

## STEP 2 — Start the FastAPI Backend

The app needs the backend running on your PC. Open a terminal:

```bash
cd pdd/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend should be running at: http://localhost:8000
✅ API docs at: http://localhost:8000/docs

> **Keep this terminal open** while using the app.

---

## STEP 3 — Build the Android Project

Open a **new terminal** in the `tms-mobile/` folder:

```bash
# 1. Install Capacitor dependencies
npm install

# 2. Add Android platform (creates the android/ folder)
npx cap add android

# 3. Copy network security config into Android project
cp network_security_config.xml android/app/src/main/res/xml/network_security_config.xml

# 4. Sync web files into Android project
npx cap sync android
```

---

## STEP 4 — Configure Android Manifest

Open `android/app/src/main/AndroidManifest.xml` and make sure it has:

```xml
<application
    android:usesCleartextTraffic="true"
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

Also ensure these **permissions** are present inside `<manifest>`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

---

## STEP 5 — Build the APK

### Option A: Using Android Studio (Recommended)

```bash
# Open the project in Android Studio
npx cap open android
```

Then in Android Studio:
1. Wait for **Gradle sync** to finish (bottom progress bar)
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for build to complete
4. Click **"locate"** in the popup — your APK is there!

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option B: Command Line

```bash
cd android
./gradlew assembleDebug          # Mac/Linux
gradlew.bat assembleDebug        # Windows
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## STEP 6 — Install the APK

### On Android Emulator
```bash
# Start emulator from Android Studio first, then:
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### On Physical Android Device
1. Enable **Developer Options**: Settings → About Phone → tap "Build Number" 7 times
2. Enable **USB Debugging**: Settings → Developer Options → USB Debugging ✅
3. Connect phone via USB
4. Run: `adb install android/app/build/outputs/apk/debug/app-debug.apk`

Or simply **copy the APK file** to your phone and open it (allow "Install from unknown sources" when prompted).

---

## 📱 Using a Physical Device (Not Emulator)

The app is pre-configured for the Android **emulator** (uses `10.0.2.2`).

For a **physical phone on the same WiFi**:

1. Find your PC's local IP:
   - Windows: `ipconfig` → look for IPv4 Address (e.g. `192.168.1.105`)
   - Mac/Linux: `ifconfig` → look for `inet` on `en0`/`eth0`

2. Edit `frontend/js/api.js` — change these two lines:
   ```js
   const BASE_URL = 'http://192.168.1.105:8000/api';  // ← your PC's IP
   const WS_URL   = 'ws://192.168.1.105:8000';        // ← your PC's IP
   ```

3. Also update `network_security_config.xml` with your PC's IP

4. Re-sync: `npx cap sync android`

5. Rebuild the APK

---

## 🔧 TROUBLESHOOTING

### "CLEARTEXT communication not permitted"
→ Make sure `android:usesCleartextTraffic="true"` is in AndroidManifest.xml
→ Make sure `network_security_config.xml` is copied to `android/app/src/main/res/xml/`

### "ERR_CONNECTION_REFUSED" in app
→ Make sure FastAPI backend is running (`uvicorn app.main:app --host 0.0.0.0 --port 8000`)
→ Check you're using `10.0.2.2` (emulator) not `localhost`

### Gradle sync fails
→ Make sure Android SDK is installed and `ANDROID_HOME` env var is set
→ Try: File → Invalidate Caches → Restart in Android Studio

### Bluetooth not working
→ Web Bluetooth API only works in Chrome-based browsers
→ In the APK (Capacitor WebView), it may have limited support
→ Bluetooth vitals work best in Chrome browser on Android

### Camera/Video not working
→ Accept permissions when the app asks
→ WebRTC requires camera and microphone permissions — grant both

---

## 📂 Final Project Structure

```
tms-mobile/
├── frontend/              ← Your web app (copied here)
│   ├── index.html
│   ├── css/
│   └── js/
│       └── api.js         ← Updated for mobile (10.0.2.2)
├── android/               ← Generated by Capacitor (after step 3)
│   └── app/build/outputs/apk/debug/
│       └── app-debug.apk  ← YOUR FINAL APK 🎉
├── capacitor.config.json
├── package.json
├── network_security_config.xml
└── BUILD_APK.md           ← This file
```

---

## 🔑 Test Accounts (from seed data)

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@tms.com | password123 |
| Doctor | doctor@tms.com | password123 |
| Admin | admin@tms.com | password123 |

---

## ✅ Quick Summary

```bash
# Terminal 1 — Run backend
cd pdd/backend && uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2 — Build APK
cd tms-mobile
npm install
npx cap add android
cp network_security_config.xml android/app/src/main/res/xml/
npx cap sync android
npx cap open android
# → In Android Studio: Build → Build APK(s)
```
