# Rozgar Setu MSR — Android APK Build & Installation Guide

- **App Name:** `Rozgar Setu MSR`
- **Package ID:** `com.rozgarsetu.msr`
- **Founder & Owner:** Manish Singh Rajpoot
- **Preserved Features:** Firebase Authentication, Cloud Firestore (Real-Time Database), Hindi (`hi`) & English (`en`) Language Switch, Candidate/Company/Admin Dashboards, and Job Posting Plans (`₹99`, `₹199`, `₹499`).

---

## Method 1: Generate & Download APK Automatically via GitHub Actions (No Android Studio Needed)

Because cloud browser sandboxes do not include the Android SDK/JDK, this repository includes a ready-to-run workflow at `.github/workflows/android-apk.yml`.

1. Push this project to a GitHub repository (`main` or `master` branch).
2. Open your GitHub repository -> click **Actions** -> select **Build Rozgar Setu MSR Android APK & AAB**.
3. Click **Run workflow** (or wait for the automatic push build to complete).
4. Once green, scroll to the **Artifacts** section on the workflow run summary page:
   - Click **`RozgarSetuMSR-debug-apk`** to download **`app-debug.apk`** (for direct phone installation).
   - Click **`RozgarSetuMSR-release-aab`** to download **`app-release.aab`** (for Google Play Console).
5. Transfer `app-debug.apk` to your Android phone, tap it, and allow **Install unknown apps** when prompted.

---

## Method 2: Build APK / AAB Locally with Android Studio or Gradle CLI

### Prerequisites
- Node.js 20+
- JDK 21 (Temurin / OpenJDK)
- Android Studio (with Android SDK Platform 35 & Build-Tools installed)

### Option A — Android Studio (GUI)
1. Install dependencies & sync the web bundle into `/android`:
   ```bash
   npm install
   npm run android:sync
   ```
2. Open the Android project:
   ```bash
   npx cap open android
   ```
3. Wait for Gradle Sync to finish in Android Studio.
4. For a testable APK:
   - Menu: **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**
   - Output file: `android/app/build/outputs/apk/debug/app-debug.apk`
5. For a Play Store / signed release APK or AAB:
   - Menu: **Build -> Generate Signed Bundle / APK -> Android App Bundle (AAB)** or **APK**
   - Create or select your `.jks` keystore and choose **release**.

### Option B — Command Line (Gradle)
```bash
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug bundleRelease
```
- **Debug APK Output:** `android/app/build/outputs/apk/debug/app-debug.apk`
- **Play Store AAB Output:** `android/app/build/outputs/bundle/release/app-release.aab`

---

## Method 3: Instant Install on Android Phone (PWA — Zero Build Required)

Rozgar Setu MSR is also configured as an installable Progressive Web App (`vite-plugin-pwa`) with offline asset caching:
1. Open the deployed web app URL in **Google Chrome** on Android.
2. Tap **Install Android App** on the home hero banner (or tap Chrome's **⋮** menu -> **Install app** / **Add to Home screen**).
3. It installs on your Android home screen with the Rozgar Setu MSR icon and opens full-screen without a browser URL bar.

---

## Firebase Auth & Security Notes for Android WebView (`com.rozgarsetu.msr`)
- Capacitor serves the bundled app over `https://localhost` (`server.androidScheme: 'https'` in `capacitor.config.ts`) with `cleartext: false` and `allowMixedContent: false`.
- `localhost` is authorized by default in Firebase Authentication, so **Email/Password Sign-In** and **Cloud Firestore** real-time listeners work immediately inside the APK.
- If you enable Google Sign-In popup/redirect inside the APK, ensure `localhost` remains in **Firebase Console -> Authentication -> Settings -> Authorized domains**.
