import querystring from 'querystring';
import KeyCloakConnect from 'keycloak-connect';
import axios, { AxiosInstance } from 'axios';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { Role, UserRoles } from './constants';
import { collections, dbClient } from './db';
import logger from './logger';
import { getUser, getUserMigration } from './services/user';
import { FEATURE_KEYCLOAK_MIGRATION } from './services/feature-flags';

const MAX_RETRY = 5;
const options = ['bceid', 'bceid_business', 'idir'];

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
  clientIdMap; // These should be given stronger typing
  roleIdMap;

  axiosInstance: AxiosInstance;
  expiresAt: number;
  // eslint-disable-next-line camelcase
  access_token?: string;

  static instance = new Keycloak();

  // Wrapper class around keycloak-connect
  private constructor() {
    this.initialize();
    this.setAxiosInstance();
  }

  initialize() {
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

  setAxiosInstance() {
    this.axiosInstance = axios.create({ baseURL: this.apiUrl });

    this.axiosInstance.interceptors.request.use(async (config) => {
      // refresh token if it expires in 30 seconds
      if (!this.access_token || !this.expiresAt || this.expiresAt < Date.now() / 1000 + 30) {
        await this.authenticateServiceAccount();
      }
      const headers = { Authorization: `Bearer ${this.access_token}` };
      return { ...config, headers };
    });
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
      if (token.hasRole(Role.Superuser)) return true;
      return roles.some((role) => token.hasRole(role));
    };
    return this.keycloakConnect.protect(allowRoles);
  }

  getUserInfoMiddleware() {
    // Connect middleware for adding HCAP user info to request object
    return async (req, res, next) => {
      let roles: string[] = [Role.Pending];

      try {
        const { content } = req.kauth.grant.access_token;
        const keycloakId = content.sub;
        const { preferred_username: username, email } = content;

        // if no email, user should not be in user_migration table
        const existingUser = await getUserMigration(username, email);

        const type = username.split('@')[1];
        const shouldSetRoles = !content?.resource_access && !existingUser && options.includes(type);

        if (shouldSetRoles) {
          await this.setUserRoles(keycloakId, roles);
        } else {
          roles = content?.resource_access?.[this.clientNameFrontend]?.roles || [];
        }

        if (FEATURE_KEYCLOAK_MIGRATION) {
          // if no email, don't migrate user
          if (
            email &&
            (roles.length === 0 || (roles.length === 1 && roles.includes(Role.Pending)))
          ) {
            const cachedRoles = await this.migrateUser(keycloakId, email, username);
            if (cachedRoles) {
              roles = cachedRoles;
            }
          }
        }

        const user = await getUser(keycloakId);

        req.hcapUserInfo = {
          name: content.name,
          username,
          keycloakId,
          id: user?.id,
          sites: user?.sites || [],
          roles,
          regions: roles.map((role) => regionMap[role]).filter((region) => region),
          isEmployer: roles.includes(Role.Employer),
          isHA: roles.includes(Role.HealthAuthority),
          isSuperUser: roles.includes(Role.Superuser),
          isMoH: roles.includes(Role.MinistryOfHealth),
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
      // do not use axiosInstance because authUrl and apiUrl could be different, and it causes recursive call
      const response = await axios.post(url, data, config);
      this.access_token = response.data.access_token;
      this.expiresAt = (jwt.decode(this.access_token) as JwtPayload).exp;
    } catch (error) {
      logger.error('KC Auth Failed', {
        context: 'kc-auth',
        retry: this.retryCount,
        error,
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

  async checkHealth() {
    try {
      await this.axiosInstance.get(`/realms/${this.realm}/protocol/openid-connect/userinfo`);
    } catch (error) {
      await this.authenticateServiceAccount();
    }
  }

  async buildInternalIdMap() {
    // Creates maps of Keycloak role and client names to IDs
    // See Keycloak docs https://www.keycloak.org/docs-api/5.0/rest-api/index.html#_clients_resource
    try {
      logger.info('Building internal keycloak id map');
      {
        // Map of clients to their internal Keycloak ID
        const clientNames = [this.clientNameBackend, this.clientNameFrontend];
        const url = `/clients`;
        const response = await this.axiosInstance.get(url);
        this.clientIdMap = response.data
          .filter((client) => clientNames.includes(client.clientId))
          .reduce((a, client) => ({ ...a, [client.clientId]: client.id }), {});
      }
      {
        // Map containing all roles a user can assume and their associated Keycloak IDs
        const url = `/clients/${this.clientIdMap[this.clientNameFrontend]}/roles`;
        const response = await this.axiosInstance.get(url);
        this.roleIdMap = response.data.reduce((a, role) => ({ ...a, [role.name]: role.id }), {});
      }
    } catch (error) {
      logger.error('kc-buildInternalIdMap Failed', {
        context: 'kc-buildInternalIdMap',
        error,
      });
      throw error;
    }
  }

  async getUsers(roles = UserRoles) {
    try {
      const results = await Promise.all(
        roles.map(async (role) => {
          const url = `${this.apiUrl}/clients/${
            this.clientIdMap[this.clientNameFrontend]
          }/roles/${role}/users?briefRepresentation=true&max=1000000`;
          const response = await this.axiosInstance.get(url);
          return response.data.filter((user) => user.username !== 'service-account');
        })
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
      const url = `/users?briefRepresentation=true&username=${userName}&exact=true`;
      const response = await this.axiosInstance.get(url);
      return response.data[0];
    } catch (error) {
      logger.error('KC getUser Failed', {
        context: 'kc-getUses',
        error,
      });
      throw error;
    }
  }

  async deleteUserRoles(userId: string) {
    const config = { headers: { Authorization: `Bearer ${this.access_token}` } };

    const url = `/users/${userId}/role-mappings/clients/${
      this.clientIdMap[this.clientNameFrontend]
    }`;
    const data = (await this.getUserRoles(userId)).map((item) => ({
      name: item,
      id: this.roleIdMap[item],
    }));
    if (data.length) {
      await this.axiosInstance.delete(url, { ...config, data });
    }
  }

  async setUserRoles(userId: string, roles: string[]) {
    try {
      const url = `/users/${userId}/role-mappings/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }`;

      const data = roles
        .filter((r) => this.roleIdMap[r])
        .map((role) => ({ name: role, id: this.roleIdMap[role] }));

      await this.axiosInstance.post(url, data);
    } catch (e) {
      logger.error(`failed to update user(${userId})'s role`);
      throw e;
    }
  }

  async setUserRoleWithRegions(userId: string, role: string, regions: string[]) {
    try {
      if (!Object.keys(this.roleIdMap).includes(role)) throw Error(`Invalid role: ${role}`);
      const regionToRole = (region) => {
        const roleName = Object.keys(regionMap).find((k) => regionMap[k] === region);
        if (!roleName || !this.roleIdMap[roleName]) return null;
        return { name: roleName, id: this.roleIdMap[roleName] };
      };

      const url = `/users/${userId}/role-mappings/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }`;

      await this.deleteUserRoles(userId);

      const data = [
        ...regions.map(regionToRole).filter((x) => x),
        { name: role, id: this.roleIdMap[role] },
      ];
      await this.axiosInstance.post(url, data);
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
      const url = `/users/${userId}/role-mappings/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }`;

      const response = await this.axiosInstance.get(url);

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
      const url = `/clients/${
        this.clientIdMap[this.clientNameFrontend]
      }/roles/pending/users?briefRepresentation=true&max=1000000`;
      const response = await this.axiosInstance.get(url);
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

    let message = '';
    let migrationStatus = await getUserMigration(username, email);

    if (!migrationStatus) {
      migrationStatus = await dbClient.db[collections.USER_MIGRATION].findOne({
        'username ilike': usernameCondition,
      });
      if (migrationStatus) {
        message = `user migration record with same username but different email found for ${keycloakId}`;
      } else {
        migrationStatus = await dbClient.db[collections.USER_MIGRATION].findOne({
          'email ilike': email,
        });
        if (migrationStatus) {
          message = `user migration record with same email but different username found for ${keycloakId}`;
        }
      }
      if (message && migrationStatus) {
        migrationStatus.message = message;
        logger.error(message, meta);
        await dbClient.db[collections.USER_MIGRATION].save(migrationStatus);
      }
      return null;
    }

    if (migrationStatus.status !== Role.Pending) {
      return null;
    }

    const undefinedRoles = migrationStatus.roles.filter((role) => !this.roleIdMap[role]);

    if (undefinedRoles.length > 0) {
      const msg = `${undefinedRoles.join(', ')} not defined`;
      logger.error(msg, meta);
      throw Error(msg);
    }

    await this.deleteUserRoles(keycloakId);
    await this.setUserRoles(keycloakId, migrationStatus.roles);

    const [user] = await dbClient.db[collections.USERS].findDoc({
      'userInfo.username ilike': usernameCondition,
      'userInfo.email ilike': email,
    });

    if (user) {
      user.userInfo.username = username;
      user.userInfo.id = keycloakId;
      await dbClient.db[collections.USERS].updateDoc(user.id, {
        sites: user.sites,
        userInfo: user.userInfo,
        keycloakId,
      });
    }

    migrationStatus.username = username;
    migrationStatus.status = 'complete';
    migrationStatus.migrated_at = new Date();

    await dbClient.db[collections.USER_MIGRATION].save(migrationStatus);
    logger.info(`keycloak user migrated: ${migrationStatus.id} -> ${keycloakId}`, meta);

    return migrationStatus.roles;
  }
}

export default Keycloak.instance;
