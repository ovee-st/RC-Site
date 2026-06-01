# RC Native Android App

Native Android client for the MX Venture Lab recruitment platform. This app is built with Kotlin, Jetpack Compose, MVVM/Clean Architecture, Hilt, Retrofit, Room, DataStore, Firebase Cloud Messaging, Coil, and Material Design 3.

This is **not** a WebView wrapper. It contains native screens, navigation, repositories, offline caching, role-based dashboards, and an API abstraction ready to connect to the existing RC backend.

## Build

```powershell
cd android-native
.\gradlew.bat :app:assembleDebug
```

Debug APK output:

`android-native/app/build/outputs/apk/debug/app-debug.apk`

## Backend configuration

The debug build points to:

`https://rc-site-xi.vercel.app/api/`

For production, change `BASE_URL` in `android-native/app/build.gradle.kts`.

## Firebase Cloud Messaging

The Firebase Messaging service is implemented. Add `google-services.json` and enable the Google Services Gradle plugin before production push notification rollout.

## Architecture

- `core`: network, database, session, design system
- `data`: API models, Room entities, repositories
- `domain`: role/session/job/profile models
- `feature`: splash, auth, home, jobs, candidate, employer, support, admin, messages, notifications
