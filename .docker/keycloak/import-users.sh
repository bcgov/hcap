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

function importRoleMappings() {
    curl --fail \
        -H "Authorization: bearer ${accessToken}" \
        -H "Content-Type: application/json" \
        -d "${2}" \
        "${KEYCLOAK_AUTH_URL}/admin/realms/${KEYCLOAK_REALM}/users/${1}/role-mappings/clients/${KEYCLOAK_FE_ID}"
}

jq -c '.[]' .docker/keycloak/users.json | while read i; do
    importUser "$(echo $i | jq -c '.user')"
    importRoleMappings $(echo $i | jq -r '.user | .id') "$(echo $i | jq -c '.mappings')"
done

