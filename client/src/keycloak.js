import Keycloak from 'keycloak-js';

// const keycloak = new Keycloak({
//   realm: process.env.KEYCLOAK_REALM,
//   url: process.env.KEYCLOAK_AUTH_URL,
//   clientId: process.env.KEYCLOAK_FE_CLIENTID
// });

const keycloak = new Keycloak({
  realm: '4qjrpzzl',
  url: 'https://dev.oidc.gov.bc.ca/auth/',
  clientId: 'hcap-fe',
});

export default keycloak;