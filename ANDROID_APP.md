# Android App Build

MX Venture Lab is configured in two Android-friendly ways:

1. Installable PWA from the live website.
2. Native Android APK wrapper using Capacitor.

## Generated APK

A debug APK has been generated locally at:

`C:\Users\Pathao\Documents\GitHub\RC-Site\dist\MXVL-debug.apk`

This APK is for testing and sideloading. It is not Play Store release-signed.

## Capacitor Android wrapper

The Android project lives in:

`android/`

The wrapper uses the live production site URL:

`https://rc-site-xi.vercel.app`

This keeps Supabase auth, database, and existing web functionality intact inside the Android app.

## Rebuild commands

From the repo root:

```powershell
npm install
npx cap sync android
```

Then build the APK:

```powershell
cd android
.\gradlew.bat assembleDebug
```

Debug APK output:

`android\app\build\outputs\apk\debug\app-debug.apk`

## PWA install support

The web app also includes:

- `public/manifest.webmanifest`
- `public/sw.js`
- Android icons in `public/android/`
- Global service worker registration in `components/layout/ServiceWorkerRegister.tsx`

Android users can install the website from Chrome using `Install app` / `Add to Home screen`.

## Production release note

For Play Store publishing, create a release-signed APK/AAB with a secure keystore and store credentials outside Git.
