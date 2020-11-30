const querystring = require('querystring');
const KeyCloakConnect = require('keycloak-connect');
const axios = require('axios');

const regionMap = {
  region_fraser: 'Fraser',
  region_interior: 'Interior',
  region_northern: 'Northern',
  region_vancouver_coastal: 'Vancouver Coastal',
  region_vancouver_island: 'Vancouver Island',
};

const defaults = {
  'ssl-required': 'external',
  'confidential-port': 0,
  'verify-token-audience': true,
  'use-resource-role-mappings': true,
  'policy-enforcer': {},
};

class Keycloak { // Wrapper class around keycloak-connect
  constructor() {
    this.realm = process.env.KEYCLOAK_REALM;
    this.authUrl = process.env.KEYCLOAK_AUTH_URL;
    this.clientNameFrontend = process.env.KEYCLOAK_FE_CLIENTID;
    this.clientNameBackend = process.env.KEYCLOAK_API_CLIENTID;
    this.clientSecretBackend = process.env.KEYCLOAK_API_SECRET;
    this.serviceAccountUsername = process.env.KEYCLOAK_SA_USERNAME;
    this.serviceAccountPassword = process.env.KEYCLOAK_SA_PASSWORD;
    const config = {
      ...defaults,
      realm: this.realm,
      'auth-server-url': this.authUrl,
      resource: this.clientNameBackend,
    };
    this.keycloakConnect = new KeyCloakConnect({}, config);
  }

  RealmInfoFrontend() {
    return {
      realm: this.realm,
      url: this.authUrl,
      clientId: this.clientNameFrontend,
    };
  }

  expressMiddleware(...args) { // Default connect middleware for Keycloak connect library
    return this.keycloakConnect.middleware(...args);
  }

  allowRolesMiddleware(...roles) { // Connect middleware for limiting roles
    const allowRoles = () => (token) => {
      if (roles.length === 0) return true; // Allows any role
      if (token.hasRole('superuser')) return true;
      if (!roles.some((role) => token.hasRole(role))) return false;
      if (token.isExpired()) return false;
      return true;
    };
    return this.keycloakConnect.protect(allowRoles);
  }

  getUserInfoMiddleware() { // Connect middleware for adding HCAP user info to request object
    return (req, res, next) => {
      // Optional chaining would be great here once ESLint supports it *sigh*
      const { content } = req.kauth.grant.access_token;
      const { roles } = content.resource_access[this.clientNameBackend] || { roles: [] };
      req.hcapUserInfo = {
        name: content.name,
        roles,
        regions: roles.map((role) => regionMap[role]).filter((region) => region),
        isSuperUser: roles.includes('superuser'),
        isMoH: roles.includes('ministry_of_health'),
      };
      next();
    };
  }

  async authenticateServiceAccount() {
    const data = querystring.stringify({
      grant_type: 'password',
      client_id: this.clientNameBackend,
      client_secret: this.clientSecretBackend,
      username: this.serviceAccountUsername,
      password: this.serviceAccountPassword,
    });
    const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    const response = await axios.post(`${this.authUrl}/realms/${this.realm}/protocol/openid-connect/token`, data, config);
    this.access_token = response.data.access_token;
  }

  async authenticateIfNeeded() {
    // Race condition if token expires between this call and the desired authenticated call
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    try {
      await axios.get(`${this.authUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`, config);
    } catch (error) {
      await this.authenticateServiceAccount();
    }
  }

  async getClientIdentifier() {
    // This maps ID of client to client ID
    // See Keycloak docs https://www.keycloak.org/docs-api/5.0/rest-api/index.html#_clients_resource
    await this.authenticateIfNeeded();
    const config = {
      params: { clientId: this.clientNameBackend },
      headers: { Authorization: `Bearer ${this.access_token}` },
    };
    const response = await axios.get(`${this.authUrl}/admin/realms/${this.realm}/clients`, config);
    this.clientIdBackend = response.data[0].id;
  }

  async getPendingUsers() {
    await this.authenticateIfNeeded();
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    const response = await axios.get(`${this.authUrl}/admin/realms/${this.realm}/clients/${this.clientIdBackend}/roles/pending/users`, config);
    return response.data;
  }
}
Keycloak.instance = new Keycloak();

module.exports = Keycloak.instance;
