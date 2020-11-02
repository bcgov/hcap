import Keycloak from 'keycloak-js';

// const keycloak = new Keycloak({
//   realm: process.env.KEYCLOAK_REALM,
//   url: process.env.BASE_KEYCLOAK_URL,
//   clientId: process.env.KEYCLOAK_CLIENTID
// });

const keycloak = new Keycloak({
  realm: 'HCAP',
  url: 'http://localhost:5000/auth/',
  clientId: '65e27a28-4db2-4ac3-86ac-09a29cbce24f',
});

export default keycloak;