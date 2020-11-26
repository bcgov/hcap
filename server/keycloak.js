const KeyCloakConnect = require('keycloak-connect');

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
    this.clientIdFrontend = process.env.KEYCLOAK_FE_CLIENTID;
    this.clientIdBackend = process.env.KEYCLOAK_API_CLIENTID;
    this.clientSecretBackend = process.env.KEYCLOAK_API_SECRET;
    const config = {
      ...defaults,
      realm: this.realm,
      'auth-server-url': this.authUrl,
      resource: this.clientIdBackend,
      credentials: {
        secret: this.clientSecretBackend,
      },
    };
    this.keycloakConnect = new KeyCloakConnect({}, config);
  }

  RealmInfoFrontend() {
    return {
      realm: this.realm,
      url: this.authUrl,
      clientId: this.clientIdFrontend,
    };
  }

  middleware(...args) {
    return this.keycloakConnect.middleware(...args);
  }

  allowRoles(...roles) { // Connect middleware for limiting roles
    const allowRoles = () => (token) => {
      if (roles.length === 0) return true; // Allows any role
      if (token.hasRole('superuser')) return true;
      if (!roles.some((role) => token.hasRole(role))) return false;
      if (token.isExpired()) return false;
      return true;
    };
    return this.keycloakConnect.protect(allowRoles);
  }

  getUserInfo() { // Connect middleware for adding HCAP user info to request object
    return (req, res, next) => {
      const { roles } = req.kauth.grant.access_token.content.resource_access[this.clientIdBackend];
      req.hcapUserInfo = {
        name: req.kauth.grant.access_token.content.name,
        roles,
        regions: roles.map((role) => regionMap[role]).filter((region) => region),
        isSuperUser: roles.includes('superuser'),
        isMoH: roles.includes('ministry_of_health'),
      };
      next();
    };
  }

  fetchUsers(role) {
    // TODO
    return this.realm ? role : null;
  }
}

module.exports = Keycloak;
