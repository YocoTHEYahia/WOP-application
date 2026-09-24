# WOP

WOP is an Android destination-alarm app for travelers who want a reliable alert before or at a stop. It supports destination-radius alarms and distance-from-start alarms, with a local-first history and settings experience.

## Status

**Prototype scaffold initialized — 2026-09-12**

Implemented in this first slice:

- React Native + Expo development-build project configuration for Android.
- Dark, accessible mobile UI with Home, Map, Trips, and Settings surfaces.
- Destination map pin selection and trip trigger mode selection.
- Typed trip state machine for arrival and distance triggers.
- Haversine distance, GPS accuracy filtering, implausible-jump rejection, and distance formatting utilities.
- Local persistence adapters for active trip, history, destinations, and settings.
- Alarm screen flow with looping audio attempt, notification, vibration settings, and explicit stop control.
- Unit-test coverage for geospatial calculations and core trip transitions.
- `.env.example` for Google Maps / Places keys; no secrets committed.

Not yet validated:

- Expo/Android build: dependency download was blocked by the sandbox network (`ENOTFOUND registry.npmjs.org`).
- React Native runtime and Google Maps rendering on a physical Android device.
- True background execution while screen-off. The current UI slice uses `watchPositionAsync`; a native foreground-service or established background-geolocation SDK must replace this before release.

## Product decisions

- Android only; application ID defaults to `com.wop.app`.
- Use Expo development builds, not Expo Go, because background location and full-screen alarm behavior need native configuration.
- Start with placeholders for Google credentials and isolate provider-specific code.
- Ask for foreground location when the user starts a trip. Add a separate background-location education flow before enabling minimized/screen-off monitoring.
- Keep trip evaluation deterministic and local. Reject stale or implausible samples, account for GPS accuracy, and prevent duplicate alarms through persisted trip state.
- Do not claim manufacturer task killers can be defeated; provide battery guidance and test across OEMs.

## Setup

```bash
cp .env.example .env
npm install
npx expo prebuild --clean
npx expo run:android
```

Configure `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` and `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` before a real map/search build. Never commit `.env`, API keys, signing keys, or paid SDK license keys.

## Tests

```bash
npm run test:domain
npm run typecheck
```

The domain test command is runnable without a React Native device. Full dependency install and Android build remain blocked until npm access is available.

## Repository structure

- `App.tsx` — app shell and initial user flow.
- `src/domain/geo.ts` — geospatial calculations and sample filtering.
- `src/domain/trip.ts` — typed trip state machine.
- `src/domain/settings.ts` — persisted defaults.
- `src/storage/tripStore.ts` — AsyncStorage persistence boundary.
- `tests/domain.test.mjs` — core logic tests.
- `docs/` — architecture, permissions, privacy, research, and release notes.

## Next implementation steps

1. Install dependencies when network access is available and run the full typecheck.
2. Replace map search placeholder with Google Places autocomplete and API-key restrictions.
3. Add a native Android foreground service / vetted background-geolocation implementation with recovery after process recreation.
4. Add full-screen intent and lock-screen alarm behavior subject to current Android and Play policy.
5. Add saved destinations and recent-trip list UI.
6. Exercise the permission flow and alarm reliability on Pixel, Samsung, and Xiaomi devices.
7. Prepare privacy policy, data-safety answers, internal-test APK/AAB, and release checklist.

## Change log

- 2026-09-12 — Initialized offline Expo/TypeScript scaffold, core trip engine, persistence boundary, initial UI, generated alarm/icon assets, focused docs, and domain tests.
- 2026-09-12 — Corrected GPS plausibility test fixtures; all 7 domain tests pass. Full npm/Android validation is pending network access.
# WOP-application
