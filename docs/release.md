# Release readiness checklist

- [ ] Configure restricted Google Maps and Places keys.
- [ ] Add and test a native Android foreground service or vetted background-geolocation SDK.
- [ ] Verify Android permissions and foreground-service declarations on the target SDK.
- [ ] Test Pixel, Samsung, and Xiaomi-style battery management paths.
- [ ] Test reboot/process recreation and screen-off tracking.
- [ ] Validate alarm audio, vibration, wake/lock-screen behavior, and stop control.
- [ ] Add privacy policy, data-safety answers, background-location rationale, and support contact.
- [ ] Configure versioning, signing, internal-test AAB/APK, crash monitoring, and rollback plan.
- [ ] Never commit API keys, signing keys, credentials, or paid SDK licenses.
