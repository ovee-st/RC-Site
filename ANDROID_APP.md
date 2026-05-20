# Android App Readiness

MX Venture Lab is now configured as an Android-installable Progressive Web App (PWA).

## What is included

- `public/manifest.webmanifest` for Android install metadata
- `public/sw.js` service worker for app-shell caching
- Android icon set in `public/android/`
- Global service worker registration in `components/layout/ServiceWorkerRegister.tsx`
- App metadata and theme color in `app/layout.tsx`

## How users install it on Android

1. Open the live MX Venture Lab website in Chrome on Android.
2. Tap the browser menu.
3. Tap `Install app` or `Add to Home screen`.
4. MXVL opens like an app with its own launcher icon.

## Play Store packaging

For Google Play Store release, wrap the same production URL using either:

- Trusted Web Activity (recommended for a website-first app)
- Capacitor Android (recommended if native Android features are needed later)

Recommended package id: `com.mxventurelab.app`
Recommended app name: `MX Venture Lab`
