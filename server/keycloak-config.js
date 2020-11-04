const Keycloak = require('keycloak-connect');
const logger = require('./logger.js');

let keycloak;

const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM,
  'auth-server-url': process.env.BASE_KEYCLOAK_URL,
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENTID,
  'confidential-port': 0,
  'verify-token-audience': true,
  'use-resource-role-mappings': true,
  credentials: {
    secret: process.env.KEYCLOAK_SECRET,
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
