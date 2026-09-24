# WOP — Privacy Policy

**Effective Date:** 2026-09-22
**Version:** 1.0
**Contact:** privacy@wop.app (placeholder — replace with real contact)

---

## 1. Overview

WOP ("Wake On Point") is a destination-alarm application for Android. This policy explains what data we collect, how it is used, and your rights. **WOP is local-first: no personal data, location history, or usage analytics leave your device unless you explicitly choose to share them.**

---

## 2. Data We Process

| Data Category | Source | Purpose | Retention | Shared? |
|---------------|--------|---------|-----------|---------|
| **Precise location (GPS)** | Device sensors (foreground + background while trip active) | Determine arrival at destination or distance traveled | Only during active trip; discarded when trip ends | **No** |
| **Trip configuration** (destination, radius, mode, sound/vibration settings) | User input | Run the trip state machine | Persisted locally until deleted | **No** |
| **Trip history** (start/end time, mode, distance, outcome) | Generated locally | Show recent trips in History screen | Max 50 entries, user-deletable | **No** |
| **Saved destinations** (label, address, coordinates) | User input | Quick re-use in future trips | Max 50 entries, user-deletable | **No** |
| **App settings** (units, defaults, battery guidance dismissed) | User input | Persist preferences | Until app uninstall or user reset | **No** |
| **Alarm audio playback** | Local asset (`alarm.wav`) | Wake user at trigger point | Transient, in-memory only | **No** |

**No account creation, no cloud sync, no analytics, no advertising identifiers, no crash reporting (unless you opt in to a future Sentry integration).**

---

## 3. Permissions & Why We Need Them

| Permission | Android Protection Level | Why WOP Needs It |
|------------|-------------------------|------------------|
| `ACCESS_FINE_LOCATION` | Dangerous | High-accuracy GPS for arrival-radius and distance triggers |
| `ACCESS_COARSE_LOCATION` | Dangerous | Fallback when fine location unavailable |
| `ACCESS_BACKGROUND_LOCATION` | Dangerous | Track trips while screen is off / app minimized |
| `FOREGROUND_SERVICE` | Normal | Run location updates in a foreground service with persistent notification |
| `FOREGROUND_SERVICE_LOCATION` | Normal | Declare foreground service type = location (Android 14+) |
| `POST_NOTIFICATIONS` | Dangerous (Android 13+) | Show alarm notification + persistent tracking notification |
| `VIBRATE` | Normal | Vibrate with alarm |
| `WAKE_LOCK` | Normal | Keep CPU awake for alarm audio + location updates |
| `RECEIVE_BOOT_COMPLETED` | Normal | Resume active trip after device reboot |

**We never request:** Contacts, Camera, Microphone, Storage (Scoped Storage), Phone, SMS, Calendar, Biometrics.

---

## 4. Location Data Handling

- **Foreground tracking:** Active only when you press "Start Trip" and the trip is in `arming` or `tracking` state.
- **Background tracking:** Only after you grant `ACCESS_BACKGROUND_LOCATION` explicitly (separate prompt after first trip start). A persistent notification remains visible while tracking.
- **Accuracy filtering:** Samples with accuracy > 1.5× radius (min 100 m) are discarded.
- **Implausible-jump rejection:** Samples implying > 80 m/s (288 km/h) motion are discarded.
- **No upload:** Location coordinates never leave the device. No map tiles are cached beyond the active session.

---

## 5. Local Storage

All data is stored using **React Native AsyncStorage** (encrypted-at-rest on Android 10+ via filesystem encryption):

- `@wop/active-trip` — current trip state (cleared on completion/stop)
- `@wop/trip-history` — last 50 completed/stopped trips
- `@wop/destinations` — last 50 saved destinations
- `@wop/settings` — user preferences

**You can clear all data** via Android Settings > Apps > WOP > Storage > Clear Storage, or by uninstalling the app.

---

## 6. Children's Privacy

WOP is not directed to children under 13 (or the applicable age in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided data, contact us and we will delete it.

---

## 7. Security

- No network requests except Google Maps/Places APIs (map tiles, place autocomplete) — **only when you interact with the map or search**.
- API keys are restricted to your Android package name (`com.wop.app`) and SHA-1 certificate fingerprint in Google Cloud Console.
- No third-party SDKs that collect personal data (no Firebase Analytics, no Adjust, no AppsFlyer).

---

## 8. Your Rights (GDPR / CCPA / LGPD / etc.)

Since **no personal data leaves your device**, most regulatory rights are satisfied by design:

- **Access / Portability:** All your data is visible in-app (History, Destinations, Settings).
- **Deletion:** Clear Storage in Android Settings, or uninstall.
- **Rectification:** Edit/delete destinations and history in-app.
- **Restriction / Objection:** Revoke location permissions in Android Settings at any time.
- **No automated decision-making / profiling.**

---

## 9. Third-Party Services

| Service | Purpose | Data Sent | Policy |
|---------|---------|-----------|--------|
| Google Maps SDK | Render map, show current location | Map tile requests (IP, coarse location for tile selection) | [Google Maps Platform Terms](https://cloud.google.com/maps-platform/terms) |
| Google Places API | Address/place autocomplete | Search query text, session token | [Google Places API Terms](https://developers.google.com/maps/terms) |

**No other third-party services are integrated.**

---

## 10. Changes to This Policy

We may update this policy for new Android requirements or feature changes. The `Effective Date` at the top will be updated. Material changes will be communicated via in-app notice.

---

## 11. Contact

Questions or requests: **privacy@wop.app** (replace with real contact before release).

---

*This policy covers the WOP Android app only. If a website or backend is added later, a separate policy will apply.*