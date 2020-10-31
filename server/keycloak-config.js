const Keycloak = require('keycloak-connect');
const logger = require('./logger.js');

let keycloak;

const keycloakConfig = {
  clientId: 'hcap-app',
  bearerOnly: true,
  serverUrl: 'http://localhost:5000/auth',
  realm: 'HCAP',
  realmPublicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAplUcuNR+Zk4Fs4gzgSxWX4uDwasRulvhCRq6FeMPjAqNHly4kwvI+g8JIwIatWsOdlvrC/YYGURSodnUjfPmjAKMRC36NMI0Fxapd0cbXJvbwUuG0orES4JoOEcYVN+AO87sqDv9tuZGXhfOFfbjVBJTugxKmF3AlZnHIEBlqK74hGxTiwMJlEJ7JBIfzhYwjSyqh0CLkwF9PUkyXo2vc7rzZIyJ7OH46t0sNmu6uGMKhNVkda5e4YAJSr/VBXpfgNyaAfJOGck9UOaHZwTPv1ongDez424SmsVWXZOkeJnD9txse5L5fWZednjCw8XeSvez9FrqRefQB3XcpTPJ/wIDAQAB',
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
