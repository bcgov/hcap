#!/bin/bash

accessToken=$(
    curl -s --fail \
        -d "username=${KEYCLOAK_SA_USERNAME}" \
        -d "password=${KEYCLOAK_SA_PASSWORD}" \
        -d "client_id=admin-cli" \
        -d "grant_type=password" \
        "${KEYCLOAK_AUTH_URL}/realms/master/protocol/openid-connect/token" \
        | jq -r '.access_token'
)

# This variable is the UUID of the local fe client, needed for exporting role
# mappings
localID=$(curl --silent \
    -H "Authorization: bearer ${accessToken}" \
    -H "Content-Type: application/json" \
    "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/clients" | jq -c '.[] | select(.clientId | contains("hcap-fe-local"))' | jq -r '.id')

function exportUsers() {
    curl  --silent \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users"
}

function exportUserRoleMappings() {

    curl --silent \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users/${1}/role-mappings/clients/$localID"
}



exportUsers > .docker/keycloak/users.json

users="[]"

jq -c '.[]' -r .docker/keycloak/users.json | while read i; do
    userId=$(echo $i | jq -r '.id')
    users=$(echo $users | jq ". + [{ \"user\": $i, \"roles\": $(exportUserRoleMappings $userId) }]")
    echo $users | jq . > .docker/keycloak/users.json
done
