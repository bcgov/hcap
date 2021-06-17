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

function importUser() {
    curl --fail \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        -d "${1}" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users"
}

function setPassword() {
    curl --fail \
        -X PUT \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        -d '{"type":"password","value":"password","temporary":false}' \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users/${1}/reset-password"
}

function importRoleMappings() {
    curl --fail \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        -d "${2}" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users/${1}/role-mappings/clients/${KEYCLOAK_FE_ID}"
}

function deleteRoleMappings() {
    curl --fail \
        -X DELETE \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users/${1}/role-mappings/clients/${KEYCLOAK_FE_ID}"
}

function exportUsers() {
    curl --fail --silent \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users"
}

jq -c '.[]' .docker/keycloak/users.json | while read i; do
    importUser "$(echo $i | jq -c '.user')"
done

# everytime we import users KC will generate new ids for them, therefore we need to export again
# to catch up those new ids
exportUsers | jq . > .docker/keycloak/users-only-tmp.json

jq -c '.[]' .docker/keycloak/users.json | while read i; do
    userName=$(echo $i | jq -r '.user | .username')
    id=$(jq ".[] | select(.username==\"$userName\")" .docker/keycloak/users-only-tmp.json | jq -r .id)
    deleteRoleMappings $id
    setPassword $id
    importRoleMappings $id "$(echo $i | jq -c '.roles')"
done

rm .docker/keycloak/users-only-tmp.json
