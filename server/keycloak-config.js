const Keycloak = require('keycloak-connect');
const logger = require('./logger.js');

let keycloak;

const keycloakConfig = {
  realm: 'HCAP',
  'auth-server-url': 'http://localhost:5000/auth/realms/HCAP/account/',
  'ssl-required': 'external',
  resource: 'hcap-app',
  'public-client': true,
  'confidential-port': 0,
  'verify-token-audience': true,
  credentials: {
    secret: '65e27a28-4db2-4ac3-86ac-09a29cbce24f',
  },
  'policy-enforcer': {},
};

const initKeycloak = () => {
  if (keycloak) {
    return keycloak;
  }

  keycloak = new Keycloak({}, keycloakConfig);
  return keycloak;
};

const getKeycloak = () => {
  if (!keycloak) {
    logger.error('Keycloak has not been initialized. Please call initKeycloak() first.');
  }
  return keycloak;
};

module.exports = {
  initKeycloak,
  getKeycloak,
};
