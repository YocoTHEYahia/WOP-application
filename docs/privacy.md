# Privacy and data safety draft

WOP is designed to keep trip state, saved destinations, settings, and trip history on the device by default. The first prototype does not require an account or a remote backend.

## Data minimization

- Request location only while the user is using an active trip or explicitly enables monitoring.
- Do not collect or transmit precise location by default.
- Store only the active trip needed for recovery and the history the user chooses to retain.
- Provide clear controls to stop a trip and clear local history.
- Keep API keys out of source control and restrict Google credentials by package and signing certificate.

## Before publishing

Confirm actual SDK behavior and Play Console data-safety answers after dependency selection. Add a user-facing privacy policy covering location, notifications, crash diagnostics, maps/Places requests, retention, deletion, and support contact. Do not present this draft as legal advice.
