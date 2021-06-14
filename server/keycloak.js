const querystring = require('querystring');
const KeyCloakConnect = require('keycloak-connect');
const axios = require('axios');
const logger = require('./logger.js');
const { getUser } = require('./services/user');

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
  'use-resource-role-mappings': true,
  'public-client': true,
};

class Keycloak {
  // Wrapper class around keycloak-connect
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
      resource: this.clientNameFrontend,
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

  expressMiddleware(...args) {
    // Default connect middleware for Keycloak connect library
    return this.keycloakConnect.middleware(...args);
  }

  allowRolesMiddleware(...roles) {
    // Connect middleware for limiting roles
    const allowRoles = (token) => {
      if (token.isExpired()) return false;
      if (roles.length === 1 && roles[0] === '*') return true; // Allows any role
      if (token.hasRole('superuser')) return true;
      return roles.some((role) => token.hasRole(role));
    };
    return this.keycloakConnect.protect(allowRoles);
  }

  getUserInfoMiddleware() {
    // Connect middleware for adding HCAP user info to request object
    return async (req, res, next) => {
      try {
        const { content } = req.kauth.grant.access_token;
        const roles = content?.resource_access[this.clientNameFrontend]?.roles || [];
        const user = await getUser(content.sub);
        console.log(user);
        req.hcapUserInfo = {
          name: content.name,
          username: content.preferred_username,
          id: content.sub,
          sites: user?.sites || [],
          roles,
          regions: roles.map((role) => regionMap[role]).filter((region) => region),
          isEmployer: roles.includes('employer'),
          isHA: roles.includes('health_authority'),
          isSuperUser: roles.includes('superuser'),
          isMoH: roles.includes('ministry_of_health'),
        };
        next();
      } catch (error) {
        next(error);
      }
    };
  }

  async authenticateServiceAccount() {
    logger.info('Authenticating Keycloak service account');
    const data = querystring.stringify({
      grant_type: 'password',
      client_id: this.clientNameBackend,
      client_secret: this.clientSecretBackend,
      username: this.serviceAccountUsername,
      password: this.serviceAccountPassword,
    });
    const url = `${this.authUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    const response = await axios.post(url, data, config);
    this.access_token = response.data.access_token;
  }

  async authenticateIfNeeded() {
    // Race condition if token expires between this call and the desired authenticated call
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    try {
      await axios.get(
        `${this.authUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`,
        config
      );
    } catch (error) {
      await this.authenticateServiceAccount();
    }
  }

  async buildInternalIdMap() {
    // Creates maps of Keycloak role and client names to IDs
    // See Keycloak docs https://www.keycloak.org/docs-api/5.0/rest-api/index.html#_clients_resource
    logger.info('Building internal keycloak id map');
    await this.authenticateIfNeeded();
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    {
      // Map of clients to their internal Keycloak ID
      const clientNames = [this.clientNameBackend, this.clientNameFrontend];
      const url = `${this.authUrl}/admin/realms/${this.realm}/clients`;
      const response = await axios.get(url, config);
      this.clientIdMap = response.data
        .filter((client) => clientNames.includes(client.clientId))
        .reduce((a, client) => ({ ...a, [client.clientId]: client.id }), {});
    }
    {
      // Map containing all roles a user can assume and their associated Keycloak IDs
      const url = `${this.authUrl}/admin/realms/${this.realm}/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }/roles`;
      const response = await axios.get(url, config);
      this.roleIdMap = response.data.reduce((a, role) => ({ ...a, [role.name]: role.id }), {});
    }
  }

  async getUsers(ignorePendings) {
    await this.authenticateIfNeeded();
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };

    const getData = async (url) => {
      const response = await axios.get(url, config);
      return response.data.filter((user) => user.username !== 'service-account');
    };

    if (!ignorePendings) {
      return getData(
        `${this.authUrl}/admin/realms/${this.realm}/users?briefRepresentation=true&max=1000000`
      );
    }

    const results = await Promise.all(
      ['ministry_of_health', 'employer', 'health_authority'].map(async (role) =>
        getData(
          `${this.authUrl}/admin/realms/${this.realm}/clients/${
            this.clientIdMap[this.clientNameFrontend]
          }/roles/${role}/users?briefRepresentation=true&max=1000000`
        )
      )
    );
    return results.flat();
  }

  async setUserRoles(userId, role, regions) {
    if (!Object.keys(this.roleIdMap).includes(role)) throw Error(`Invalid role: ${role}`);
    const regionToRole = (region) => {
      const roleName = Object.keys(regionMap).find((k) => regionMap[k] === region);
      if (!roleName || !this.roleIdMap[roleName]) return null;
      return { name: roleName, id: this.roleIdMap[roleName] };
    };
    await this.authenticateIfNeeded();
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    const url = `${this.authUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings/clients/${
      this.clientIdMap[this.clientNameFrontend]
    }`;
    {
      const data = (await this.getUserRoles(userId)).map((item) => ({
        name: item,
        id: this.roleIdMap[item],
      }));
      await axios.delete(url, { ...config, data });
    }
    {
      const data = [
        ...regions.map(regionToRole).filter((x) => x),
        { name: role, id: this.roleIdMap[role] },
      ];
      await axios.post(url, data, config);
    }
  }

  async getUserRoles(userId) {
    await this.authenticateIfNeeded();
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    const url = `${this.authUrl}/admin/realms/${this.realm}/users/${userId}/role-mappings`;
    const response = await axios.get(url, config);
    return response.data.clientMappings[this.clientNameFrontend].mappings.map((item) => item.name);
  }

  async getPendingUsers() {
    await this.authenticateIfNeeded();
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    const url = `${this.authUrl}/admin/realms/${this.realm}/clients/${
      this.clientIdMap[this.clientNameFrontend]
    }/roles/pending/users`;
    const response = await axios.get(url, config);
    return response.data;
  }
}
Keycloak.instance = new Keycloak();

module.exports = Keycloak.instance;
