import _ from 'lodash';
import querystring from 'querystring';
import KeyCloakConnect from 'keycloak-connect';
import axios from 'axios';
import { collections, dbClient } from './db';
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

export interface HcapUserInfo {
  /** Full name of user (e.g. "Tabitha Test") */
  name?: string;
  /** Username (e.g. "user@bceid") */
  username?: string;
  /** local id */
  id?: number;
  /** Unique identifier string for the user */
  keycloakId?: string;
  sites?: number[];
  /** Roles of the user (such as `region_interior` or `health_authority`) */
  roles?: string[];
  /** Regions the user is assigned to (such as `Interior`) */
  regions?: string[];
  /** True if the user is an employer */
  isEmployer?: boolean;
  /** True if the user is a health authority user */
  isHA?: boolean;
  /** True if the user is a superuser */
  isSuperUser?: boolean;
  /** True if the user is an MoH user */
  isMoH?: boolean;
}

class Keycloak {
  realm: string;
  authUrl: string;
  apiUrl: string;
  clientNameFrontend: string;
  clientNameBackend: string;
  clientSecretBackend: string;
  serviceAccountUsername: string;
  serviceAccountPassword: string;
  keycloakConnect: KeyCloakConnect.Keycloak;
  retryCount: number;
  // eslint-disable-next-line camelcase
  access_token?: string;
  clientIdMap; // These should be given stronger typing
  roleIdMap;
  static instance: Keycloak;

  // Wrapper class around keycloak-connect
  constructor() {
    const isLocal = process.env.KEYCLOAK_AUTH_URL.includes('local');
    this.realm = process.env.KEYCLOAK_REALM;
    this.apiUrl = isLocal
      ? `${process.env.KEYCLOAK_AUTH_URL}/admin/realms/${this.realm}`
      : process.env.KEYCLOAK_UMS_API_URL;
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

  allowRolesMiddleware(...roles: string[]) {
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
        let roles = content?.resource_access[this.clientNameFrontend]?.roles || [];

        const keycloakId = content.sub;
        const { preferred_username: username, email } = content;

        if (roles.length === 0 || (roles.length === 1 && roles.includes('pending'))) {
          const cachedRoles = await this.migrateUser(keycloakId, email, username);
          if (cachedRoles) {
            roles = cachedRoles;
          }
        }

        const user = await getUser(keycloakId);

        req.hcapUserInfo = {
          name: content.name,
          username,
          keycloakId: content.sub,
          id: user?.id,
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
      grant_type: 'client_credentials',
      client_id: this.clientNameBackend,
      client_secret: this.clientSecretBackend,
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
        const url = `${this.apiUrl}/clients`;
        const response = await axios.get(url, config);
        this.clientIdMap = response.data
          .filter((client) => clientNames.includes(client.clientId))
          .reduce((a, client) => ({ ...a, [client.clientId]: client.id }), {});
      }
      {
        // Map containing all roles a user can assume and their associated Keycloak IDs
        const url = `${this.apiUrl}/clients/${this.clientIdMap[this.clientNameFrontend]}/roles`;
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

  async getUsers(ignorePending?: boolean) {
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
        return getData(`${this.apiUrl}/users?briefRepresentation=true&max=1000000`);
      }

      const results = await Promise.all(
        ['ministry_of_health', 'employer', 'health_authority'].map(async (role) =>
          getData(
            `${this.apiUrl}/clients/${
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

  async getUser(userName: string) {
    try {
      await this.authenticateIfNeeded();
      const config = {
        headers: {
          Authorization: `Bearer ${this.access_token}`,
        },
      };
      const url = `${this.apiUrl}/users?briefRepresentation=true&username=${userName}&exact=true`;
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
    return `${this.apiUrl}/users/${userId}`;
  }

  async deleteUserRoles(userId: string) {
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
  }

  async setUserRoles(userId: string, roles: string[]) {
    await this.authenticateIfNeeded();

    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
    const url = `${this.getUserUrl(userId)}/role-mappings/clients/${
      this.clientIdMap[this.clientNameFrontend]
    }`;

    const data = roles
      .filter((r) => this.roleIdMap[r])
      .map((role) => ({ name: role, id: this.roleIdMap[role] }));

    await axios.post(url, data, config);
  }

  async setUserRoleWithRegions(userId: string, role: string, regions: string[]) {
    try {
      if (!Object.keys(this.roleIdMap).includes(role)) throw Error(`Invalid role: ${role}`);

      await this.authenticateIfNeeded();
      await this.deleteUserRoles(userId);

      const regionalRoles = regions
        .map((region) => _.findKey(regionMap, (v) => v === region))
        .filter((v) => v);

      await this.setUserRoles(userId, [role, ...regionalRoles]);
    } catch (error) {
      logger.error('KC setUserRoles Failed', {
        context: 'kc-setUserRoles',
        error,
      });
      throw error;
    }
  }

  async getUserRoles(userId: string) {
    try {
      await this.authenticateIfNeeded();

      const config = { headers: { Authorization: `Bearer ${this.access_token}` } };
      const url = `${this.getUserUrl(userId)}/role-mappings/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }`;

      const response = await axios.get(url, config);

      return response.data.map((item: { name: string }) => item.name);
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
      const url = `${this.apiUrl}/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }/roles/pending/users?briefRepresentation=true&max=1000000`;
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

  /**
   * Migrate user's old keycloak id to new keycloak id and update roles
   *
   * @param keycloakId
   * @param email
   * @param username
   */
  async migrateUser(keycloakId: string, email: string, username: string): Promise<string[] | null> {
    const meta = { context: 'kc-user-migration' };
    const usernameCondition = username.includes('@bceid')
      ? `${username.split('@')[0]}@bceid%`
      : username;

    let migrationStatus = await dbClient.db[collections.USER_MIGRATION].findOne({
      'email ilike': email,
      'username ilike': usernameCondition,
    });

    if (!migrationStatus) {
      migrationStatus = await dbClient.db[collections.USER_MIGRATION].findOne({
        'username ilike': usernameCondition,
      });
      if (migrationStatus) {
        const message = `user migration record with same username but different email found for ${keycloakId}`;
        migrationStatus.message = message;
        logger.error(message, meta);
        await dbClient.db[collections.USER_MIGRATION].save(migrationStatus);
      }
      return null;
    }

    if (migrationStatus.status !== 'pending') {
      return null;
    }

    const undefinedRoles = migrationStatus.roles.filter((role) => !this.roleIdMap[role]);

    if (undefinedRoles.length > 0) {
      const msg = `${undefinedRoles.join(', ')} not defined`;
      logger.error(msg, meta);
      throw Error(msg);
    }

    try {
      await this.setUserRoles(keycloakId, migrationStatus.roles);
    } catch (e) {
      logger.error(`failed to update user(${keycloakId})'s role`, meta);
      throw e;
    }

    const [user] = await dbClient.db[collections.USERS].findDoc({
      'userInfo.username ilike': username.includes('@bceid')
        ? `${username.split('@')[0]}@bceid%`
        : username,
      'userInfo.email ilike': email,
    });
    if (user) {
      user.userInfo.username = username;
      user.userInfo.id = keycloakId;
      await dbClient.db[collections.USERS].updateDoc(user.id, {
        sites: user.sites || [],
        userInfo: user.userInfo,
        keycloakId,
      });
    } else {
      const message = `no user record found for ${keycloakId}`;
      migrationStatus.message = message;
      logger.error(message, meta);
    }

    migrationStatus.username = username;
    migrationStatus.status = 'complete';
    migrationStatus.migrated_at = new Date();

    await dbClient.db[collections.USER_MIGRATION].save(migrationStatus);
    logger.info(`keycloak user migrated: ${migrationStatus.id} -> ${keycloakId}`, meta);

    return migrationStatus.roles;
  }
}
Keycloak.instance = new Keycloak();

export default Keycloak.instance;
