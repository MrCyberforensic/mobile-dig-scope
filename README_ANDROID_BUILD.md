# 🤖 Building the Android Mobile App

## Prerequisites

Before building the Android app, ensure you have:

1. **Node.js & npm** installed (v18 or higher)
2. **Android Studio** installed ([Download here](https://developer.android.com/studio))
3. **Java JDK 17** installed
4. **Git** installed

---

## 📱 Build Instructions

### Step 1: Clone and Setup

```bash
# Clone the repository from GitHub
git clone <your-github-repo-url>
cd mobile-dig-scope

# Install dependencies
npm install
```

### Step 2: Build Web Assets

```bash
# Build the React web app
npm run build
```

### Step 3: Add Android Platform (First Time Only)

```bash
# Add Android platform
npx cap add android
```

### Step 4: Sync Capacitor

```bash
# Sync web assets to Android
npx cap sync android
```

### Step 5: Open in Android Studio

```bash
# Open the Android project in Android Studio
npx cap open android
```

This will launch Android Studio with your project.

### Step 6: Build APK in Android Studio

1. In Android Studio, go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
2. Wait for the build to complete
3. APK will be located at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🚀 Run on Device/Emulator

### Option A: Run from Command Line

```bash
# Run on connected device or emulator
npx cap run android
```

### Option B: Run from Android Studio

1. Connect your Android device via USB (with USB debugging enabled)
   - OR start an Android emulator
2. Click the **Run** button (▶️) in Android Studio
3. Select your target device

---

## 🔧 Development Workflow

After making changes to your React code:

```bash
# 1. Build web assets
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Run the app
npx cap run android
```

For live reload during development, the app uses the hot-reload server URL configured in `capacitor.config.ts`.

---

## 📦 GitHub Actions Auto-Build

The project includes a GitHub Actions workflow (`.github/workflows/build-apk.yml`) that automatically builds the APK without requiring local Android Studio.

### To use it:

1. Push your code to GitHub
2. Go to **Actions** tab in your GitHub repository
3. Select **"Auto Build APK"** workflow
4. Click **"Run workflow"**
5. Download the built APK from the artifacts

---

## 🔑 USB OTG Requirements

For the USB OTG forensic features to work:

### On Host Device (where app is installed):
- ✅ Must support **USB Host Mode** (USB OTG)
- ✅ Android 5.0 (API 22) or higher
- ✅ USB OTG cable/adapter

### On Target Device (device being examined):
- ✅ USB debugging enabled in Developer Options
- ✅ ADB authorized (accept "Allow USB debugging" prompt)
- ⚠️ Root access recommended for full data extraction

---

## 🛠️ Troubleshooting

### Build fails with "SDK not found"
- Install Android SDK via Android Studio
- Set `ANDROID_HOME` environment variable

### USB device not detected
- Check USB OTG cable connection
- Verify USB Host feature: `adb shell pm list features | grep usb.host`
- Grant USB permission when prompted

### App crashes on startup
- Check Logcat in Android Studio for errors
- Ensure all permissions are granted in AndroidManifest.xml

---

## 📚 Additional Resources

- [Capacitor Android Documentation](https://capacitorjs.com/docs/android)
- [Android USB Host API](https://developer.android.com/guide/topics/connectivity/usb/host)
- [ADB Protocol Documentation](https://github.com/cstyan/adbDocumentation)

---

## 🎯 Next Steps

Once built, the app provides:
- ✅ USB OTG device scanning
- ✅ ADB connection to target devices
- ✅ Logical data acquisition
- ✅ AES-256 encryption
- ✅ SHA256/MD5 hashing
- ✅ Chain of custody logs
- ✅ Offline PDF/HTML reports

Happy forensic investigating! 🔍
