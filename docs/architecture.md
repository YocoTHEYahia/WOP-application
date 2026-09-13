# WOP architecture

## Shape

WOP is split into four boundaries:

- **UI** (`App.tsx`) — deliberately thin screens, permission education, and accessible controls.
- **Domain** (`src/domain`) — deterministic geospatial calculations and a trip state machine independent of React Native.
- **Storage** (`src/storage`) — AsyncStorage adapter for active-trip recovery, history, destinations, and settings.
- **Native integrations** — location, notifications, audio, maps, and (next) an Android foreground service.

## Trip state machine

`arming → tracking → alarming → completed` is the normal path. A user can stop from tracking or alarming. Permission and unrecoverable runtime failures move to `error`. Active state is persisted after every location event so process recreation can recover as far as Android allows.

## Reliability safeguards

- Haversine distance in meters; conversions happen at the edges.
- Reported GPS accuracy is considered before entering an arrival radius.
- Implausible location jumps are rejected using elapsed time, accuracy, and a conservative speed ceiling.
- Alarm transitions are persisted and idempotent; repeated samples cannot re-trigger an active alarm.
- Location provider, background execution, alarm delivery, and UI are replaceable boundaries.

## Native background work still required

The current slice uses `expo-location` foreground watching so the core flow can be developed first. Before release, add a native foreground service or a vetted background-geolocation SDK, persistent notification, process-recreation recovery, and device/OEM battery guidance. This should be tested on real Android devices rather than inferred from an emulator.
