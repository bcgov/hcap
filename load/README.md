# Load Testing

## Quick Start
1. Ensure valid environment variables exist for keycloak:
   - `LOAD_KC_AUTH_USERNAME` (Username for KC participant account)
   - `LOAD_KC_AUTH_PASSWORD` (Password for KC participant account)
   - `LOAD_KC_AUTH_CLIENTID`
   - `OS_NAMESPACE_SUFFIX` (dev/test)
   - `KEYCLOAK_REALM`
2. Run `make loadtest script=participantLogin.js rate=75 duration=120` 

## Scripts

### Participant Login

This script simulates the calls that would happen upon a successful participant login. Once a participant logs in, a KC token request occurs and then two requests to the API are made.
This endpoint has been successfully tested at 75 rps for 120 seconds which marks a decent baseline for future benchmarking. It's recommended to
(install K6 locally)[https://k6.io/docs/getting-started/installation/] to develop future load testing scripts and then to run in docker for cross-environment convenience.