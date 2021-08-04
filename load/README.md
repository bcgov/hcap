# Load Testing

## Quick Start
1. Ensure valid environment variables exist for keycloak:
   - `DURATION` (Length of load test)
   - `RATE` (Function calls per second)
   - `LOAD_KC_AUTH_USERNAME` (Username for KC participant account)
   - `LOAD_KC_AUTH_PASSWORD` (Password for KC participant account)
   - `LOAD_KC_AUTH_CLIENTID`
   - `OS_NAMESPACE_SUFFIX` (dev/test)
   - `KEYCLOAK_REALM`
2. Run `make loadtest script=participantLogin.js rate=75 duration=45` 