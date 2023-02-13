import querystring from 'querystring';
import KeyCloakConnect from 'keycloak-connect';
import axios from 'axios';
import logger from './logger';
import { getUser } from './services/user';

const MAX_RETRY = 5;

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

// NOTE: This type is not actually used in this file yet due to some JSDoc limitations.
// It is currently just here to be used by external files (such as phase-allocation.js).
// However, it can be used once we switch to TS.
/**
 * @typedef {Object} hcapUserInfo
 * @property {string=} name           Full name of user (e.g. "Tabitha Test")
 * @property {string=} username       Username (e.g. "user@bceid")
 * @property {string=} id             Unique identifier string for the user
 * @property {any[]=} sites TODO: annotate element type
 * @property {string[]=} roles        Roles of the user (such as `region_interior` or `health_authority`)
 * @property {string[]=} regions      Regions the user is assigned to (such as `Interior`)
 * @property {boolean=} isEmployer    True if the user is an employer
 * @property {boolean=} isHA          True if the user is a health authority user
 * @property {boolean=} isSuperUser   True if the user is a superuser
 * @property {boolean=} isMoH         True if the user is an MoH user
 */

class Keycloak {
  // Wrapper class around keycloak-connect
  constructor() {
    const isLocal = process.env.KEYCLOAK_AUTH_URL.includes('local');
    this.realm = process.env.KEYCLOAK_REALM;
    this.authUrl = process.env.KEYCLOAK_AUTH_URL;
    this.clientNameFrontend = process.env.KEYCLOAK_FE_CLIENTID;
    this.clientNameBackend = process.env.KEYCLOAK_API_CLIENTID;
    this.clientSecretBackend = isLocal
      ? process.env.KEYCLOAK_LOCAL_SECRET
      : process.env.KEYCLOAK_API_SECRET;
    this.serviceAccountUsername = isLocal
      ? process.env.KEYCLOAK_LOCAL_USERNAME
      : process.env.KEYCLOAK_SA_USERNAME;
    this.serviceAccountPassword = isLocal
      ? process.env.KEYCLOAK_LOCAL_PASSWORD
      : process.env.KEYCLOAK_SA_PASSWORD;
    const config = {
      ...defaults,
      realm: this.realm,
      'auth-server-url': this.authUrl,
      resource: this.clientNameFrontend,
    };
    this.keycloakConnect = new KeyCloakConnect({}, config);
    this.retryCount = 0;
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
        logger.error('getUserInfoMiddleware Failed', {
          context: 'kc-getUserInfoMiddleware',
          error,
        });
        next(error);
      }
    };
  }

  setupUserMiddleware(strict = false) {
    return (req, resp, next) => {
      try {
        const { content } = req.kauth?.grant?.access_token;
        if (strict && !content) {
          resp.status(401).send('Unauthorized user');
        }
        const roles = content?.resource_access[this.clientNameFrontend]?.roles || [];
        if (content) req.user = { ...content, roles };
        next();
      } catch (error) {
        next();
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
    try {
      const response = await axios.post(url, data, config);
      this.access_token = response.data.access_token;
    } catch (excp) {
      logger.error('KC Auth Failed', {
        context: 'kc-auth',
        retry: this.retryCount,
        error: excp,
      });

      if (MAX_RETRY > this.retryCount) {
        logger.info(`kc-auth: Will try connection ${MAX_RETRY - this.retryCount}`);
        this.retryCount += 1;
        await this.authenticateServiceAccount();
      } else {
        logger.error('kc-auth: Unable to restore service account connection');
        throw new Error('Unable to authenticate service account');
      }
    }
  }

  async authenticateIfNeeded() {
    // Race condition if token expires between this call and the desired authenticated call
    const config = {
      headers: {
        Authorization: `Bearer ${this.access_token}`,
      },
    };
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
    await this.authenticateIfNeeded();
    // Creates maps of Keycloak role and client names to IDs
    // See Keycloak docs https://www.keycloak.org/docs-api/5.0/rest-api/index.html#_clients_resource
    try {
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
    } catch (excp) {
      logger.error('kc-buildInternalIdMap Failed', {
        context: 'kc-buildInternalIdMap',
        error: excp,
      });
      throw excp;
    }
  }

  async getUsers(ignorePending) {
    try {
      await this.authenticateIfNeeded();
      const config = {
        headers: {
          Authorization: `Bearer ${this.access_token}`,
        },
      };

      const getData = async (url) => {
        const response = await axios.get(url, config);
        return response.data.filter((user) => user.username !== 'service-account');
      };

      if (!ignorePending) {
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
    } catch (error) {
      logger.error('KC getUsers Failed', {
        context: 'kc-getUsers',
        error,
      });
      throw error;
    }
  }

  async getUser(userName) {
    try {
      await this.authenticateIfNeeded();
      const config = {
        headers: {
          Authorization: `Bearer ${this.access_token}`,
        },
      };
      const url = `${this.authUrl}/admin/realms/${this.realm}/users?briefRepresentation=true&username=${userName}&exact=true`;
      const response = await axios.get(url, config);
      return response.data[0];
    } catch (error) {
      logger.error('KC getUser Failed', {
        context: 'kc-getUses',
        error,
      });
      throw error;
    }
  }

  getUserUrl(userId = '') {
    if (!userId) throw new Error('keycloak: User ID is required');
    return `${this.authUrl}/admin/realms/${this.realm}/users/${userId}`;
  }

  async setUserRoles(userId, role, regions) {
    try {
      if (!Object.keys(this.roleIdMap).includes(role)) throw Error(`Invalid role: ${role}`);
      const regionToRole = (region) => {
        const roleName = Object.keys(regionMap).find((k) => regionMap[k] === region);
        if (!roleName || !this.roleIdMap[roleName]) return null;
        return { name: roleName, id: this.roleIdMap[roleName] };
      };
      await this.authenticateIfNeeded();
      const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
      const url = `${this.getUserUrl(userId)}/role-mappings/clients/${
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
    } catch (error) {
      logger.error('KC setUserRoles Failed', {
        context: 'kc-setUserRoles',
        error,
      });
      throw error;
    }
  }

  async getUserRoles(userId) {
    try {
      await this.authenticateIfNeeded();
      const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
      const url = `${this.getUserUrl(userId)}/role-mappings`;
      const response = await axios.get(url, config);
      return response.data.clientMappings[this.clientNameFrontend].mappings.map(
        (item) => item.name
      );
    } catch (error) {
      logger.error('KC getUserRoles Failed', {
        context: 'kc-getUserRoles',
        error,
      });
      throw error;
    }
  }

  async getPendingUsers() {
    try {
      await this.authenticateIfNeeded();
      const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
      const url = `${this.authUrl}/admin/realms/${this.realm}/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }/roles/pending/users`;
      const response = await axios.get(url, config);
      return response.data;
    } catch (error) {
      logger.error('KC getUserRoles Failed', {
        context: 'kc-getUserRoles',
        error,
      });
      throw error;
    }
  }
}
export default Keycloak.instance = new Keycloak();
