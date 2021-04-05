#!/bin/sh
accessToken=$(
    curl -s --fail \
        -d "username=${KEYCLOAK_SA_USERNAME}" \
        -d "password=${KEYCLOAK_SA_PASSWORD}" \
        -d "client_id=admin-cli" \
        -d "grant_type=password" \
        "${KEYCLOAK_AUTH_URL}/realms/master/protocol/openid-connect/token" \
        | jq -r '.access_token'
)

function exportUsers() {
    curl --fail --silent \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users"
}

function exportUserRoleMappings() {
    curl --fail --silent \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users/${1}/role-mappings/clients/${KEYCLOAK_FE_ID}"
}

exportUsers > .docker/keycloak/users.json

users="[]"

jq -c '.[]' -r .docker/keycloak/users.json | while read i; do
    userId=$(echo $i | jq -r '.id')
    users=$(echo $users | jq ". + [{ \"user\": $i, \"roles\": $(exportUserRoleMappings $userId) }]")
    echo $users | jq . > .docker/keycloak/users.json
done
