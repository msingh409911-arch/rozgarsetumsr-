# Rozgar Setu MSR (रोजगार सेतु MSR)

**Founder & Owner:** Manish Singh Rajpoot  
**Android Package ID:** `com.rozgarsetu.msr`

Pan-India bilingual (**Hindi & English**) job portal powered by **React + Vite + Tailwind CSS**, **Firebase Authentication**, **Cloud Firestore**, **PWA (`vite-plugin-pwa`)**, and **Capacitor Android (`android/`)**.

## Features
- Candidate registration, login, profile management, and **100% free** job applications.
- Company registration, login, job posting, applicant review, and job posting plans (**Basic ₹99**, **Featured ₹199**, **Monthly Company Plan ₹499**).
- Admin Dashboard (`msingh409911@gmail.com`) to approve, edit, and delete jobs, manage users/plans, and upload the official Founder photo.
- Full Hindi (`hi`) & English (`en`) switching, Pan-India city/category/salary/job-type filters, and mobile-friendly PWA + Android Capacitor build.

## Getting Started (Local Development)
```bash
npm install
npm run dev
```

## Production Build & Firebase Hosting Deploy
```bash
npm run build
npx firebase login
npx firebase deploy --only hosting,firestore:rules
```

## Android APK Build
See `ANDROID_APK_GUIDE.md` or run:
```bash
npm run android:sync
cd android && ./gradlew assembleDebug
```
Or trigger `.github/workflows/android-apk.yml` in GitHub Actions to download `app-debug.apk`.
