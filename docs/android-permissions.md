# Android permissions and battery guidance

WOP should explain the benefit before each permission prompt.

## Required permission flow

1. Request foreground location when the user taps **Start trip**.
2. Explain that minimized/screen-off tracking requires background location, then request it only when the user enables a trip-monitoring mode that needs it.
3. Request notifications on Android 13+ so the persistent tracking notification and alarm notification are visible.
4. Use a foreground service with a location service type for reliable active-trip tracking.
5. Request exact-alarm or full-screen capabilities only if the final alarm design genuinely needs them and current Android/Play rules permit the use case.

## Battery behavior

- Provide a plain-language battery-optimization guide in Settings.
- Tell users that Samsung/Xiaomi-style task management may still interrupt apps.
- Record the device model, Android version, permission state, provider enabled state, and last location age in diagnostics without collecting unnecessary location history.
- Test normal, screen-off, Doze, reboot/process recreation, low battery, denied permission, GPS disabled, and degraded accuracy states.

## Release caution

Android and Google Play requirements change. Verify foreground-service declarations, background-location declarations, full-screen intent eligibility, exact-alarm behavior, and data-safety answers against current official documentation before submission.
